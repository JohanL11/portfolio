<?php

namespace App\Controller;

use App\Service\RiotApiService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur de la page League of Legends.
 *
 * Expose les statistiques du compte via l'API Riot Games.
 * Les données sont mises en cache dans RiotApiService pour limiter les appels API.
 */
class LeagueController extends AbstractController
{
    /**
     * Page principale — affiche le profil, les classements, les masteries et l'historique de parties.
     * Affiche également la partie en cours si le joueur est en jeu.
     */
    #[Route('/league', name: 'app_league')]
    public function index(RiotApiService $riotApi): Response
    {
        try {
            $data     = $riotApi->getSummonerData();
            $liveGame = $riotApi->getLiveGame();
            $error    = null;
        } catch (\Throwable $e) {
            $data     = null;
            $liveGame = null;
            $error    = $e->getMessage();
        }

        return $this->render('league/index.html.twig', [
            'data'     => $data,
            'liveGame' => $liveGame,
            'error'    => $error,
        ]);
    }

    /**
     * Endpoint JSON — retourne les informations de la partie en cours (polling côté client).
     * Retourne null si aucune partie n'est en cours.
     */
    #[Route('/league/live', name: 'app_league_live')]
    public function live(RiotApiService $riotApi): JsonResponse
    {
        try {
            return $this->json($riotApi->getLiveGame());
        } catch (\Throwable) {
            return $this->json(null);
        }
    }
}
