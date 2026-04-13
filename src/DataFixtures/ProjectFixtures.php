<?php

namespace App\DataFixtures;

use App\Entity\Project;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class ProjectFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $projects = [
            [
                'title'              => 'Plateforme web de gestion d\'hébergement collectif',
                'titleEn'            => 'Social Housing Management Platform',
                'shortDescription'   => 'Solution métier couvrant la gestion complète de résidences sociales et étudiantes — de l\'admission au départ.',
                'shortDescriptionEn' => 'Business solution covering the full management of social and student residences — from admission to departure.',
                'description'        => 'Développement et évolution continue d\'une plateforme web métier couvrant la gestion de résidences sociales et étudiantes : admissions, suivi des séjours, facturation, courrier, partenaires institutionnels (SIAO, IDEAL). Back-end PHP/Zend avec architecture MVC, front-end PHTML/CSS/JS/jQuery. Pilotage technique de bout en bout : architecture, estimation des charges, suivi planning et livraison. Relation client directe : démonstrations produit, formations, réunions de projet. Déployée chez 250 clients répartis sur plus de 700 résidences à travers la France.',
                'descriptionEn'      => 'Continuous development of a business web platform covering the management of social and student residences: admissions, stay tracking, invoicing, mail, institutional partners (SIAO, IDEAL). PHP/Zend back-end with MVC architecture, PHTML/CSS/JS/jQuery front-end. End-to-end technical ownership: architecture, effort estimation, planning and delivery tracking. Direct client relations: product demos, training, project meetings. Deployed at 250 clients across more than 700 residences throughout France.',
                'imageUrl'           => null,
                'tags'               => ['PHP 7/8', 'Zend Framework', 'jQuery', 'Bootstrap', 'MySQL', 'MVC'],
                'githubUrl'          => null,
                'liveUrl'            => null,
                'featured'           => true,
                'color'              => 'indigo',
                'metrics'            => [
                    ['value' => '250',   'label' => 'clients',      'labelEn' => 'clients'],
                    ['value' => '700+',  'label' => 'résidences',   'labelEn' => 'residences'],
                    ['value' => '2 000', 'label' => 'utilisateurs', 'labelEn' => 'users'],
                ],
                'date' => '2018-09-01',
            ],
            [
                'title'              => 'Suite mobile React Native',
                'titleEn'            => 'React Native Mobile Suite',
                'shortDescription'   => '3 applications Android connectées à une API REST — gestion terrain, domiciliation postale, borne courrier.',
                'shortDescriptionEn' => '3 Android apps connected to a REST API — field management, postal address service, mail terminal.',
                'description'        => 'Conception et développement de trois applications mobiles Android en React Native, toutes connectées à une API REST interne. L\'application phare est destinée aux gestionnaires de résidence : réalisation d\'états des lieux et gestion des interventions techniques (demandes créées par le résident, depuis le back-office ou directement par le technicien sur le terrain). Elle intègre un mode hors ligne permettant de travailler sans connexion — états des lieux, interventions — puis de synchroniser manuellement les données une fois la connexion retrouvée. Les deux autres applications sont dédiées à la gestion du courrier pour les domiciliés. L\'application de domiciliation postale permet chaque matin de réceptionner les courriers entrants par scan du code-barres imprimé sur l\'enveloppe — chaque code-barres est propre à un domicilié, généré et imprimé en interne (sur enveloppe ou sur carte plastifiée via imprimante à cartes). L\'agent indique le nombre de courriers reçus, puis distribue les courriers au fur et à mesure des passages. La borne kiosque, sur tablette en accès libre, permet au domicilié de scanner sa carte pour savoir instantanément s\'il a du courrier en attente. L\'ensemble est synchronisé en temps réel avec la plateforme web. Distribution interne via APK avec notification de mise à jour à l\'ouverture.',
                'descriptionEn'      => 'Design and development of three Android mobile apps in React Native, all connected to an internal REST API. The flagship app is for residence managers: conducting inventory inspections and managing maintenance requests (raised by residents, from the back-office or directly by the technician on-site). It includes an offline mode for working without connectivity — inspections and interventions — then manual data sync once reconnected. The other two apps handle mail management for registered addressees. The postal address app lets staff receive incoming mail each morning by scanning the barcode printed on the envelope — each barcode is specific to a registered addressee, generated and printed in-house (on envelopes or laminated cards via a card printer). The agent records the number of letters received, then distributes them as people collect them. The kiosk terminal, on a freely accessible tablet, lets addressees scan their card to instantly see if they have mail waiting. The whole system syncs in real time with the web platform. Internal distribution via APK with an update notification on launch.',
                'imageUrl'           => null,
                'tags'               => ['React Native', 'JavaScript', 'API REST', 'Android', 'Mode hors ligne'],
                'githubUrl'          => null,
                'liveUrl'            => null,
                'featured'           => true,
                'color'              => 'violet',
                'metrics'            => [
                    ['value' => '3',         'label' => 'applications', 'labelEn' => 'apps'],
                    ['value' => 'Android',   'label' => 'plateforme',   'labelEn' => 'platform'],
                    ['value' => 'hors ligne','label' => 'mode terrain', 'labelEn' => 'offline mode'],
                ],
                'date' => '2020-03-01',
            ],
            [
                'title'              => 'Infrastructure Linux — Production',
                'titleEn'            => 'Linux Infrastructure — Production',
                'shortDescription'   => 'Administration et maintien d\'une infrastructure serveur Linux en production depuis 2018.',
                'shortDescriptionEn' => 'Administration and maintenance of a Linux server infrastructure in production since 2018.',
                'description'        => 'Maintenance et administration de serveurs Linux en production. Chaque client choisit son mode d\'hébergement — chez nous ou chez lui (infrastructure interne ou prestataire) — plusieurs clients peuvent être hébergés sur un même serveur selon les performances disponibles. Interventions : installations de nouveaux environnements, déploiements, configuration Apache, gestion du serveur mail Postfix, automatisation Bash (sauvegardes, rotation de logs, tâches planifiées Cron), supervision SSH. Migration de CentOS vers AlmaLinux conduite sans interruption de service.',
                'descriptionEn'      => 'Maintenance and administration of Linux servers in production. Each client chooses their hosting model — with us or on their own (internal infrastructure or third-party provider) — several clients can share a server depending on available performance. Scope: new environment setups, deployments, Apache configuration, Postfix mail server management, Bash automation (backups, log rotation, scheduled Cron tasks), SSH supervision. Migration from CentOS to AlmaLinux conducted with zero downtime.',
                'imageUrl'           => null,
                'tags'               => ['Linux', 'CentOS', 'AlmaLinux', 'Apache', 'Bash', 'Postfix', 'Cron'],
                'githubUrl'          => null,
                'liveUrl'            => null,
                'featured'           => true,
                'color'              => 'green',
                'metrics'            => [
                    ['value' => '0', 'label' => 'coupure migration', 'labelEn' => 'zero downtime'],
                ],
                'date' => '2018-09-01',
            ],
            [
                'title'              => 'API REST — Back-end mobile',
                'titleEn'            => 'REST API — Mobile Back-end',
                'shortDescription'   => 'API REST PHP unifiée servant l\'ensemble des applications mobiles React Native.',
                'shortDescriptionEn' => 'Unified PHP REST API serving all React Native mobile applications.',
                'description'        => 'Développement d\'une API REST PHP unifiée servant les trois applications mobiles React Native. Gestion des endpoints de consultation et modification des données d\'hébergement, authentification par token, gestion des courriers et des accès logements. Intégration partenaires pour l\'attribution numérique d\'accès. Cache et stratégie de versioning pour assurer la rétrocompatibilité lors des mises à jour applicatives.',
                'descriptionEn'      => 'Development of a unified PHP REST API serving the three React Native mobile apps. Manages endpoints for reading and updating housing data, token-based authentication, mail and housing access management. Partner integration for digital access assignment. Cache and versioning strategy to ensure backwards compatibility across app updates.',
                'imageUrl'           => null,
                'tags'               => ['PHP 7/8', 'API REST', 'MySQL', 'JSON', 'MVC'],
                'githubUrl'          => null,
                'liveUrl'            => null,
                'featured'           => false,
                'color'              => 'teal',
                'metrics'            => [
                    ['value' => '3', 'label' => 'apps connectées', 'labelEn' => 'connected apps'],
                ],
                'date' => '2019-06-01',
            ],
            [
                'title'              => 'Portfolio — johan-louap.fr',
                'titleEn'            => 'Portfolio — johan-louap.fr',
                'shortDescription'   => 'Ce portfolio — Symfony 7, Twig, animations CSS/JS, API Riot Games, Lighthouse 98/100.',
                'shortDescriptionEn' => 'This portfolio — Symfony 7, Twig, CSS/JS animations, Riot Games API, Lighthouse 98/100.',
                'description'        => 'Conception et développement de ce portfolio de A à Z en Symfony 7 / Twig. Animations JavaScript custom (effet de tir Lucian, terminal typewriter, compteurs animés, suivi lumineux du curseur), intégration de l\'API Riot Games avec cache TTL, page League of Legends avec graphe Chart.js. Score Lighthouse 98 en Performance desktop, 100 en Accessibility, Best Practices et SEO. Code source disponible sur GitHub.',
                'descriptionEn'      => 'Design and development of this portfolio from scratch in Symfony 7 / Twig. Custom JavaScript animations (Lucian shooting effect, terminal typewriter, animated counters, cursor light trail), Riot Games API integration with TTL cache, League of Legends page with Chart.js graph. Lighthouse score of 98 in Desktop Performance, 100 in Accessibility, Best Practices and SEO. Source code available on GitHub.',
                'imageUrl'           => null,
                'tags'               => ['Symfony 7', 'PHP 8', 'Twig', 'JavaScript', 'Chart.js', 'API REST'],
                'githubUrl'          => 'https://github.com/JLouap/portfolio',
                'liveUrl'            => 'https://johan-louap.fr',
                'featured'           => false,
                'color'              => 'amber',
                'metrics'            => [
                    ['value' => '98',  'label' => 'Perf. Lighthouse', 'labelEn' => 'Lighthouse Score'],
                    ['value' => '100', 'label' => 'Accessibilité',    'labelEn' => 'Accessibility'],
                ],
                'date' => '2024-01-01',
            ],
        ];

        foreach ($projects as $data) {
            $project = new Project();
            $project->setTitle($data['title']);
            $project->setTitleEn($data['titleEn'] ?? null);
            $project->setShortDescription($data['shortDescription']);
            $project->setShortDescriptionEn($data['shortDescriptionEn'] ?? null);
            $project->setDescription($data['description']);
            $project->setDescriptionEn($data['descriptionEn'] ?? null);
            $project->setImageUrl($data['imageUrl']);
            $project->setTags($data['tags']);
            $project->setGithubUrl($data['githubUrl']);
            $project->setLiveUrl($data['liveUrl']);
            $project->setFeatured($data['featured']);
            $project->setColor($data['color'] ?? null);
            $project->setMetrics($data['metrics'] ?? null);
            $project->setCreatedAt(new \DateTimeImmutable($data['date']));
            $manager->persist($project);
        }

        $manager->flush();
    }
}
