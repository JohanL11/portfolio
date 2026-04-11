<?php

namespace App\Repository;

use App\Entity\Project;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * Dépôt Doctrine pour l'entité Project.
 *
 * Fournit les méthodes de requête sur la table des projets.
 * Les méthodes héritées (find, findBy, findAll, findOneBy) couvrent les besoins actuels.
 *
 * @extends ServiceEntityRepository<Project>
 */
class ProjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Project::class);
    }
}
