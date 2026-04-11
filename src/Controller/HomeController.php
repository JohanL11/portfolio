<?php

namespace App\Controller;

use App\Repository\ProjectRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur de la page d'accueil.
 *
 * Affiche les projets mis en avant (featured) et les informations générales du portfolio.
 */
class HomeController extends AbstractController
{
    /**
     * Page d'accueil — affiche les 3 projets mis en avant, triés par ID croissant.
     */
    #[Route('/', name: 'app_home')]
    public function index(ProjectRepository $projectRepository): Response
    {
        $featuredProjects = $projectRepository->findBy(['featured' => true], ['id' => 'ASC'], 3);

        return $this->render('home/index.html.twig', [
            'featuredProjects' => $featuredProjects,
        ]);
    }
}
