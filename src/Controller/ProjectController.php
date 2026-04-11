<?php

namespace App\Controller;

use App\Repository\ProjectRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur de la page des projets.
 *
 * Affiche l'ensemble des projets du portfolio, triés par ID croissant.
 */
class ProjectController extends AbstractController
{
    /**
     * Liste tous les projets disponibles.
     */
    #[Route('/projects', name: 'app_projects')]
    public function index(ProjectRepository $projectRepository): Response
    {
        $projects = $projectRepository->findBy([], ['id' => 'ASC']);

        return $this->render('project/index.html.twig', [
            'projects' => $projects,
        ]);
    }
}
