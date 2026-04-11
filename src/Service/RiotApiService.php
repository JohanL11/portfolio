<?php

namespace App\Service;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Service d'accès à l'API Riot Games.
 *
 * Centralise tous les appels à l'API Riot (compte, classements, masteries,
 * historique de parties, partie en cours) et met en cache les résultats
 * pour éviter de dépasser les limites de taux (rate limits).
 *
 * Durées de cache :
 *   - Données de page principale   : 5 minutes
 *   - Partie en cours              : 1 minute
 *   - Rotation gratuite            : 24 heures
 *   - Détail d'une partie          : 30 jours (données immuables)
 *   - PUUID / version DataDragon   : 30 jours / 24 heures
 */
class RiotApiService
{
    /** Plateforme régionale pour les endpoints summoner/league/mastery (EUW). */
    private const REGION_PLATFORM = 'euw1';

    /** Cluster régional pour les endpoints account/match (agrège plusieurs plateformes). */
    private const REGION_CLUSTER  = 'europe';

    /** Nom du compte Riot (partie avant le #). */
    private const GAME_NAME       = 'LE11KO';

    /** Tag du compte Riot (partie après le #). */
    private const TAG_LINE        = '9211';

    /** Correspondance entre l'identifiant de file d'attente et son nom lisible. */
    private const QUEUE_NAMES = [
        420 => 'Solo/Duo', 440 => 'Flex', 450 => 'ARAM',
        400 => 'Normal',   430 => 'Normal', 700 => 'Clash',
        900 => 'URF',      1020 => 'ARURF', 0 => 'Custom',
    ];

    /** Correspondance entre la clé de position API et son label affiché. */
    private const ROLE_LABELS = [
        'TOP'     => 'Top',
        'JUNGLE'  => 'Jungle',
        'MIDDLE'  => 'Mid',
        'BOTTOM'  => 'ADC',
        'UTILITY' => 'Support',
    ];

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $apiKey,
        private readonly CacheInterface $cache,
        private readonly CacheItemPoolInterface $cachePool,
    ) {}

    // =========================================================================
    // MÉTHODES PUBLIQUES
    // =========================================================================

    /**
     * Retourne toutes les données nécessaires à la page League of Legends.
     * Résultat mis en cache 5 minutes pour limiter les appels API.
     */
    public function getSummonerData(): array
    {
        return $this->cache->get('lol_page_data', function (ItemInterface $item) {
            $item->expiresAfter(1800); // 30 minutes
            return $this->fetchAll();
        });
    }

    /**
     * Retourne les informations de la partie en cours, ou null si le joueur n'est pas en jeu.
     * Mis en cache 1 minute pour permettre un polling côté client sans surcharger l'API.
     */
    public function getLiveGame(): ?array
    {
        return $this->cache->get('lol_live_game', function (ItemInterface $item) {
            $item->expiresAfter(60);

            $puuid = $this->getPuuid();
            try {
                $response   = $this->httpClient->request('GET',
                    "https://" . self::REGION_PLATFORM . ".api.riotgames.com/lol/spectator/v5/active-games/by-summoner/{$puuid}",
                    ['headers' => ['X-Riot-Token' => $this->apiKey]]
                );
                $statusCode = $response->getStatusCode();

                // 404 = joueur hors-jeu, pas une erreur
                if ($statusCode === 404) return null;

                $game        = $response->toArray();
                $ddVersion   = $this->getDdVersion();
                $championMap = $this->getChampionMap($ddVersion);
                $queueId     = $game['gameQueueConfigId'] ?? 0;

                // Identifier le champion joué par notre invocateur parmi les participants
                $myChampionId = null;
                foreach ($game['participants'] as $p) {
                    if (($p['puuid'] ?? '') === $puuid) {
                        $myChampionId = $p['championId'];
                        break;
                    }
                }
                $championName = $myChampionId ? ($championMap[$myChampionId] ?? 'Unknown') : 'Unknown';

                return [
                    'championName' => $championName,
                    'imageUrl'     => "https://ddragon.leagueoflegends.com/cdn/{$ddVersion}/img/champion/{$championName}.png",
                    'queueName'    => self::QUEUE_NAMES[$queueId] ?? 'Partie',
                    'startTime'    => $game['gameStartTime'] ?? 0,
                ];
            } catch (\Throwable) {
                return null;
            }
        });
    }

    // =========================================================================
    // MÉTHODES PRIVÉES — AGRÉGATION DES DONNÉES
    // =========================================================================

    /**
     * Récupère et agrège toutes les données du profil depuis l'API Riot.
     * Les appels HTTP indépendants sont lancés en parallèle pour minimiser la latence.
     */
    private function fetchAll(): array
    {
        // ── Phase 1 : appels sans dépendance (parallèles) ───────────────────
        $reqAccount   = $this->riotAsync(
            "https://" . self::REGION_CLUSTER . ".api.riotgames.com/riot/account/v1/accounts/by-riot-id/"
            . self::GAME_NAME . "/" . self::TAG_LINE
        );
        $ddVersion   = $this->getDdVersion();   // mis en cache 24h, rapide
        $championMap = $this->getChampionMap($ddVersion); // mis en cache 30j, rapide

        $account = $reqAccount->toArray();
        $puuid   = $account['puuid'];

        // Mise en cache séparée du PUUID pour getLiveGame
        $this->cache->get('lol_puuid', function (ItemInterface $item) use ($puuid) {
            $item->expiresAfter(86400 * 30);
            return $puuid;
        });

        // ── Phase 2 : appels dépendants du PUUID (parallèles) ───────────────
        $reqSummoner     = $this->riotAsync("https://" . self::REGION_PLATFORM . ".api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{$puuid}");
        $reqEntries      = $this->riotAsync("https://" . self::REGION_PLATFORM . ".api.riotgames.com/lol/league/v4/entries/by-puuid/{$puuid}");
        $reqMasteries    = $this->riotAsync("https://" . self::REGION_PLATFORM . ".api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{$puuid}/top?count=20");
        $reqMasteryScore = $this->riotAsync("https://" . self::REGION_PLATFORM . ".api.riotgames.com/lol/champion-mastery/v4/scores/by-puuid/{$puuid}");
        $reqMatchIds     = $this->riotAsync("https://" . self::REGION_CLUSTER  . ".api.riotgames.com/lol/match/v5/matches/by-puuid/{$puuid}/ids?start=0&count=20");

        // Collecter toutes les réponses (s'exécutent en parallèle)
        $summoner     = $reqSummoner->toArray();
        $entries      = $reqEntries->toArray();
        $masteries    = $reqMasteries->toArray();
        $totalMastery = (int) $reqMasteryScore->getContent();
        $matchIds     = $reqMatchIds->toArray();

        // ── Rotation gratuite (cache 24h) ────────────────────────────────────
        $rotation = $this->cache->get('lol_rotation', function (ItemInterface $item) use ($championMap, $ddVersion) {
            $item->expiresAfter(86400);
            $raw = $this->riot("https://" . self::REGION_PLATFORM . ".api.riotgames.com/lol/platform/v3/champion-rotations");
            return array_values(array_filter(array_map(function ($id) use ($championMap, $ddVersion) {
                $name = $championMap[$id] ?? null;
                if (!$name) return null;
                return [
                    'championName' => $name,
                    'imageUrl'     => "https://ddragon.leagueoflegends.com/cdn/{$ddVersion}/img/champion/{$name}.png",
                ];
            }, $raw['freeChampionIds'] ?? [])));
        });

        // ── Historique des 20 dernières parties (parallèle via fetchMatches) ─
        $matches = $this->fetchMatches($matchIds);

        // ── Enrichissement des classements ranked ────────────────────────────
        $queueLabels     = ['RANKED_SOLO_5x5' => 'Solo / Duo', 'RANKED_FLEX_SR' => 'Flex 5v5'];
        $enrichedEntries = array_values(array_filter(array_map(
            fn($e) => isset($queueLabels[$e['queueType']]) ? array_merge($e, ['label' => $queueLabels[$e['queueType']]]) : null,
            $entries
        )));

        // Extraction séparée Solo/Duo et Flex pour l'affichage des deux cartes de rang
        $soloEntry = null; $flexEntry = null;
        foreach ($entries as $e) {
            if ($e['queueType'] === 'RANKED_SOLO_5x5') $soloEntry = $e;
            elseif ($e['queueType'] === 'RANKED_FLEX_SR') $flexEntry = $e;
        }

        // ── Enrichissement des parties ───────────────────────────────────────
        $enrichedMatches = array_values(array_filter(array_map(
            fn($m) => $this->enrichMatch($m, $puuid, $ddVersion),
            $matches
        )));

        // ── Série en cours (victoires/défaites consécutives) ─────────────────
        // Valeur positive = série de victoires, négative = série de défaites
        $streak = 0; $streakWin = null;
        foreach ($enrichedMatches as $m) {
            if ($streakWin === null) { $streakWin = $m['win']; $streak = 1; }
            elseif ($m['win'] === $streakWin) { $streak++; }
            else break;
        }
        if ($streakWin === false) $streak = -$streak;

        // ── KDA moyen sur les 20 dernières parties ───────────────────────────
        $k = $d = $a = 0;
        foreach ($enrichedMatches as $m) { $k += $m['kills']; $d += $m['deaths']; $a += $m['assists']; }
        $cnt    = count($enrichedMatches);
        $avgKda = $cnt > 0 ? round(($k + $a) / max(1, $d), 2) : 0;

        // ── Agrégation des stats par champion ────────────────────────────────
        // Toutes les métriques sont accumulées en totaux bruts ;
        // les moyennes (cs/min, dmg moyen, vision) sont calculées côté template.
        $champMap = [];
        foreach ($enrichedMatches as $m) {
            $c = $m['championName'];
            if (!isset($champMap[$c])) {
                $champMap[$c] = ['championName' => $c, 'imageUrl' => $m['imageUrl'],
                    'games' => 0, 'wins' => 0, 'kills' => 0, 'deaths' => 0, 'assists' => 0,
                    'cs' => 0, 'duration' => 0, 'damage' => 0, 'vision' => 0];
            }
            $champMap[$c]['games']++;
            if ($m['win']) $champMap[$c]['wins']++;
            $champMap[$c]['kills']    += $m['kills'];
            $champMap[$c]['deaths']   += $m['deaths'];
            $champMap[$c]['assists']  += $m['assists'];
            $champMap[$c]['cs']       += $m['cs'];
            $champMap[$c]['duration'] += $m['duration'];
            $champMap[$c]['damage']   += $m['damageRaw'];
            $champMap[$c]['vision']   += $m['vision'];
        }
        // Tri par nombre de parties décroissant
        usort($champMap, fn($a, $b) => $b['games'] - $a['games']);

        // ── Enrichissement des masteries avec les stats de l'historique ──────
        // Croise les top masteries (API) avec le champMap (historique de 20 parties)
        // pour afficher KDA, cs/min et vision directement dans la carte de maîtrise.
        $enrichedMasteries = array_map(function (array $m) use ($championMap, $ddVersion, $champMap) {
            $name  = $championMap[$m['championId']] ?? 'Unknown';
            $stats = null;
            foreach ($champMap as $cs) {
                if ($cs['championName'] === $name) { $stats = $cs; break; }
            }
            return array_merge($m, [
                'championName' => $name,
                'imageUrl'     => "https://ddragon.leagueoflegends.com/cdn/{$ddVersion}/img/champion/{$name}.png",
                'splashUrl'    => "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{$name}_0.jpg",
                'matchStats'   => $stats, // null si le champion n'est pas dans les 20 dernières parties
            ]);
        }, $masteries);

        // ── Rôle principal (position la plus jouée) ──────────────────────────
        $roleCount = [];
        foreach ($enrichedMatches as $m) {
            $pos = $m['position'] ?? '';
            if ($pos && isset(self::ROLE_LABELS[$pos])) {
                $roleCount[$pos] = ($roleCount[$pos] ?? 0) + 1;
            }
        }
        arsort($roleCount);
        $mainRole = !empty($roleCount) ? (self::ROLE_LABELS[array_key_first($roleCount)] ?? null) : null;

        // ── Records personnels sur les 20 dernières parties ──────────────────
        $records = ['bestKda' => 0, 'bestKdaChamp' => '', 'bestKdaScore' => '',
                    'mostKills' => 0, 'mostKillsChamp' => '', 'pentaTotal' => 0, 'firstBloods' => 0];
        foreach ($enrichedMatches as $m) {
            $kda = $m['deaths'] > 0 ? round(($m['kills'] + $m['assists']) / $m['deaths'], 2) : ($m['kills'] + $m['assists']);
            if ($kda > $records['bestKda']) {
                $records['bestKda']      = $kda;
                $records['bestKdaChamp'] = $m['championName'];
                $records['bestKdaScore'] = "{$m['kills']}/{$m['deaths']}/{$m['assists']}";
            }
            if ($m['kills'] > $records['mostKills']) {
                $records['mostKills']      = $m['kills'];
                $records['mostKillsChamp'] = $m['championName'];
            }
            $records['pentaTotal'] += $m['pentaKills'] ?? 0;
            if ($m['firstBlood'] ?? false) $records['firstBloods']++;
        }

        // ── Winrate par rôle ─────────────────────────────────────────────────
        $roleStats = [];
        foreach ($enrichedMatches as $m) {
            $pos = $m['position'] ?? '';
            if (!$pos || !isset(self::ROLE_LABELS[$pos])) continue;
            $label = self::ROLE_LABELS[$pos];
            if (!isset($roleStats[$label])) $roleStats[$label] = ['role' => $label, 'games' => 0, 'wins' => 0];
            $roleStats[$label]['games']++;
            if ($m['win']) $roleStats[$label]['wins']++;
        }
        usort($roleStats, fn($a, $b) => $b['games'] - $a['games']);

        // ── Répartition par mode de jeu ──────────────────────────────────────
        $queueDist = [];
        foreach ($enrichedMatches as $m) { $q = $m['queueName']; $queueDist[$q] = ($queueDist[$q] ?? 0) + 1; }
        arsort($queueDist);

        // ── Top duos (joueurs croisés au moins 2 fois) ───────────────────────
        $duoMap = [];
        foreach ($enrichedMatches as $m) {
            foreach ($m['participants'] as $p) {
                if ($p['isMe']) continue;
                $name = $p['name'];
                if (!isset($duoMap[$name])) $duoMap[$name] = ['name' => $name, 'games' => 0, 'wins' => 0, 'imageUrl' => $p['imageUrl']];
                $duoMap[$name]['games']++;
                if ($m['win']) $duoMap[$name]['wins']++;
                $duoMap[$name]['imageUrl'] = $p['imageUrl'];
            }
        }
        uasort($duoMap, fn($a, $b) => $b['games'] - $a['games']);
        $topDuos = array_slice(array_values(array_filter($duoMap, fn($d) => $d['games'] >= 2)), 0, 5);

        // ── Données pour le graphique KDA (ordre chronologique ascendant) ────
        $chartData = array_reverse(array_map(fn($m) => [
            'kda'   => $m['deaths'] > 0 ? round(($m['kills'] + $m['assists']) / $m['deaths'], 2) : ($m['kills'] + $m['assists']),
            'win'   => $m['win'],
            'champ' => $m['championName'],
            'score' => "{$m['kills']}/{$m['deaths']}/{$m['assists']}",
        ], $enrichedMatches));

        return [
            'gameName'      => $account['gameName'],
            'tagLine'       => $account['tagLine'],
            'level'         => $summoner['summonerLevel'],
            'iconUrl'       => "https://ddragon.leagueoflegends.com/cdn/{$ddVersion}/img/profileicon/{$summoner['profileIconId']}.png",
            'opggUrl'       => 'https://op.gg/lol/summoners/euw/' . urlencode(self::GAME_NAME . '-' . self::TAG_LINE),
            'entries'       => $enrichedEntries,
            'soloRank'      => $soloEntry,
            'flexRank'      => $flexEntry,
            'masteries'     => $enrichedMasteries,
            'matches'       => $enrichedMatches,
            'streak'        => $streak,
            'avgKda'        => $avgKda,
            'totalGames'    => $cnt,
            'championStats' => array_slice(array_values($champMap), 0, 8),
            'splashUrl'     => $enrichedMasteries[0]['splashUrl'] ?? null,
            'ddVersion'     => $ddVersion,
            'totalMastery'  => $totalMastery,
            'mainRole'      => $mainRole,
            'chartData'     => $chartData,
            'rotation'      => $rotation,
            'records'       => $records,
            'roleStats'     => array_values($roleStats),
            'queueDist'     => $queueDist,
            'topDuos'       => $topDuos,
            'lastGameTs'    => $enrichedMatches[0]['gameTimestamp'] ?? 0,
        ];
    }

    /**
     * Transforme les données brutes d'une partie en un tableau normalisé.
     *
     * Extrait les stats de notre invocateur (identifié par son PUUID) parmi
     * les 10 participants, et enrichit chaque participant avec ses items et métriques.
     * Retourne null si notre PUUID est introuvable dans la partie (partie corrompue ou test).
     */
    private function enrichMatch(array $match, string $puuid, string $ddVersion): ?array
    {
        // Identifier notre invocateur parmi les 10 participants
        $me = null;
        foreach ($match['info']['participants'] as $p) {
            if ($p['puuid'] === $puuid) { $me = $p; break; }
        }
        if ($me === null) return null;

        $queueId  = $match['info']['queueId'];
        $champion = $me['championName'];
        $ts       = $match['info']['gameEndTimestamp'] ?? ($match['info']['gameCreation'] ?? 0);
        $gameDate = $ts > 0 ? (new \DateTimeImmutable())->setTimestamp((int)($ts / 1000))->format('d/m/Y') : null;

        // Enrichissement de chaque participant (utile pour l'affichage du tableau de partie)
        $participants = array_map(function ($p) use ($puuid, $ddVersion) {
            return [
                'name'         => $p['riotIdGameName'] ?? ($p['summonerName'] ?? 'Invocateur'),
                'championName' => $p['championName'],
                'imageUrl'     => "https://ddragon.leagueoflegends.com/cdn/{$ddVersion}/img/champion/{$p['championName']}.png",
                'kills'        => $p['kills'],
                'deaths'       => $p['deaths'],
                'assists'      => $p['assists'],
                'cs'           => $p['totalMinionsKilled'] + ($p['neutralMinionsKilled'] ?? 0),
                'gold'         => number_format($p['goldEarned']),
                'damage'       => number_format($p['totalDamageDealtToChampions'] ?? 0),
                'vision'       => $p['visionScore'] ?? 0,
                'win'          => $p['win'],
                'teamId'       => $p['teamId'],
                'isMe'         => $p['puuid'] === $puuid,
                // Item 0-5 = objets achetés, item 6 = trinquet (ward)
                'items'        => array_values(array_filter([$p['item0'], $p['item1'], $p['item2'], $p['item3'], $p['item4'], $p['item5']], fn($id) => $id > 0)),
                'trinket'      => $p['item6'] ?? 0,
            ];
        }, $match['info']['participants']);

        return [
            'matchId'       => $match['metadata']['matchId'],
            'championName'  => $champion,
            'imageUrl'      => "https://ddragon.leagueoflegends.com/cdn/{$ddVersion}/img/champion/{$champion}.png",
            'win'           => $me['win'],
            'kills'         => $me['kills'],
            'deaths'        => $me['deaths'],
            'assists'       => $me['assists'],
            'cs'            => $me['totalMinionsKilled'] + ($me['neutralMinionsKilled'] ?? 0),
            'damageRaw'     => $me['totalDamageDealtToChampions'] ?? 0,       // Valeur brute pour les agrégations
            'damage'        => number_format($me['totalDamageDealtToChampions'] ?? 0), // Valeur formatée pour l'affichage
            'vision'        => $me['visionScore'] ?? 0,
            'pentaKills'    => $me['pentaKills'] ?? 0,
            'firstBlood'    => $me['firstBloodKill'] ?? false,
            'position'      => $me['teamPosition'] ?? '',
            'duration'      => $match['info']['gameDuration'],                 // En secondes
            'queueId'       => $queueId,
            'queueName'     => self::QUEUE_NAMES[$queueId] ?? 'Autre',
            'items'         => array_values(array_filter([$me['item0'], $me['item1'], $me['item2'], $me['item3'], $me['item4'], $me['item5']], fn($id) => $id > 0)),
            'gameDate'      => $gameDate,
            'gameDateISO'   => $ts > 0 ? (new \DateTimeImmutable())->setTimestamp((int)($ts / 1000))->format('Y-m-d') : null,
            'gameTimestamp' => $ts > 0 ? (int)($ts / 1000) : 0,
            'participants'  => $participants,
        ];
    }

    /**
     * Récupère les détails de plusieurs parties avec cache individuel 30j.
     *
     * Les requêtes vers l'API Riot sont lancées en parallèle (HttpClient non-bloquant)
     * pour les entrées absentes du cache, réduisant le temps de chargement de ~15s à ~2s.
     */
    private function fetchMatches(array $ids): array
    {
        // Phase 1 : séparer les IDs mis en cache des IDs manquants
        $results = [];
        $missing = []; // [id => cacheKey]

        foreach ($ids as $id) {
            $key  = 'lol_match_' . preg_replace('/[^a-z0-9]/i', '', strtolower($id));
            $item = $this->cachePool->getItem($key);
            if ($item->isHit()) {
                $results[$id] = $item->get();
            } else {
                $missing[$id] = $key;
            }
        }

        if (!empty($missing)) {
            // Phase 2 : démarrer toutes les requêtes manquantes en parallèle (non-bloquant)
            $responses = [];
            foreach (array_keys($missing) as $id) {
                $responses[$id] = $this->httpClient->request('GET',
                    "https://" . self::REGION_CLUSTER . ".api.riotgames.com/lol/match/v5/matches/{$id}",
                    ['headers' => ['X-Riot-Token' => $this->apiKey]]
                );
            }

            // Phase 3 : collecter les réponses et mettre en cache (requêtes en cours en parallèle)
            foreach ($responses as $id => $response) {
                $data = $response->toArray();
                $item = $this->cachePool->getItem($missing[$id]);
                $item->set($data)->expiresAfter(86400 * 30);
                $this->cachePool->save($item);
                $results[$id] = $data;
            }
        }

        // Retourner dans l'ordre original
        return array_map(fn($id) => $results[$id], $ids);
    }

    // =========================================================================
    // MÉTHODES PRIVÉES — HELPERS API / CACHE
    // =========================================================================

    /**
     * Retourne le PUUID du joueur (mis en cache 30 jours).
     * Utilisé par getLiveGame() sans passer par fetchAll().
     */
    private function getPuuid(): string
    {
        return $this->cache->get('lol_puuid', function (ItemInterface $item) {
            $item->expiresAfter(86400 * 30);
            $account = $this->riot(
                "https://" . self::REGION_CLUSTER . ".api.riotgames.com/riot/account/v1/accounts/by-riot-id/"
                . self::GAME_NAME . "/" . self::TAG_LINE
            );
            return $account['puuid'];
        });
    }

    /**
     * Retourne la dernière version de DataDragon (assets champions/items/icônes).
     * Mis en cache 24 heures.
     */
    private function getDdVersion(): string
    {
        return $this->cache->get('lol_ddragon_version', function (ItemInterface $item) {
            $item->expiresAfter(86400);
            return $this->httpClient->request('GET', 'https://ddragon.leagueoflegends.com/api/versions.json')->toArray()[0];
        });
    }

    /**
     * Retourne un tableau [championId => championName] pour une version DataDragon donnée.
     * Mis en cache 30 jours (ne change qu'à chaque patch).
     */
    private function getChampionMap(string $version): array
    {
        return $this->cache->get('lol_champion_map_' . $version, function (ItemInterface $item) use ($version) {
            $item->expiresAfter(86400 * 30);
            $data = $this->httpClient->request('GET', "https://ddragon.leagueoflegends.com/cdn/{$version}/data/fr_FR/champion.json")->toArray();
            $map  = [];
            foreach ($data['data'] as $champion) { $map[(int)$champion['key']] = $champion['id']; }
            return $map;
        });
    }

    /**
     * Effectue un appel GET authentifié vers l'API Riot et retourne le résultat en tableau.
     * Timeout à 8s pour éviter les blocages infinis.
     */
    private function riot(string $url): array
    {
        return $this->httpClient->request('GET', $url, [
            'headers' => ['X-Riot-Token' => $this->apiKey],
            'timeout' => 8,
        ])->toArray();
    }

    /**
     * Démarre une requête Riot non-bloquante (retourne l'objet Response sans attendre).
     */
    private function riotAsync(string $url): \Symfony\Contracts\HttpClient\ResponseInterface
    {
        return $this->httpClient->request('GET', $url, [
            'headers' => ['X-Riot-Token' => $this->apiKey],
            'timeout' => 8,
        ]);
    }
}
