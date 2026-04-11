<?php

namespace App\Entity;

use App\Repository\ProjectRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/**
 * Entité représentant un projet du portfolio.
 *
 * Stocke les informations d'un projet : titre, descriptions, image,
 * technologies utilisées, liens GitHub / démo et statut "mis en avant".
 */
#[ORM\Entity(repositoryClass: ProjectRepository::class)]
class Project
{
    /** Identifiant auto-incrémenté. */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** Titre court du projet (ex. "Portfolio Symfony"). */
    #[ORM\Column(length: 255)]
    private ?string $title = null;

    /** Description courte affichée sur les cartes (max 500 caractères). */
    #[ORM\Column(length: 500)]
    private ?string $shortDescription = null;

    /** Description complète affichée sur la page détail. */
    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    /** URL de l'image de couverture du projet (optionnelle). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $imageUrl = null;

    /** Liste des technologies / tags associés au projet (ex. ["PHP", "Symfony", "React"]). */
    #[ORM\Column(type: Types::JSON)]
    private array $tags = [];

    /** Lien vers le dépôt GitHub (optionnel). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $githubUrl = null;

    /** Lien vers la démo en ligne (optionnel). */
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $liveUrl = null;

    /** Indique si le projet est mis en avant sur la page d'accueil. */
    #[ORM\Column]
    private bool $featured = false;

    /** Couleur du cover gradient (ex. "indigo", "teal", "green", "violet", "amber"). */
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $color = null;

    /** Métriques clés affichées sur le cover (ex. [{"value":"250","label":"clients"}]). */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $metrics = null;

    /** Date de création de l'entrée en base (initialisée automatiquement). */
    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }

    public function getShortDescription(): ?string { return $this->shortDescription; }
    public function setShortDescription(string $shortDescription): static { $this->shortDescription = $shortDescription; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(string $description): static { $this->description = $description; return $this; }

    public function getImageUrl(): ?string { return $this->imageUrl; }
    public function setImageUrl(?string $imageUrl): static { $this->imageUrl = $imageUrl; return $this; }

    public function getTags(): array { return $this->tags; }
    public function setTags(array $tags): static { $this->tags = $tags; return $this; }

    public function getGithubUrl(): ?string { return $this->githubUrl; }
    public function setGithubUrl(?string $githubUrl): static { $this->githubUrl = $githubUrl; return $this; }

    public function getLiveUrl(): ?string { return $this->liveUrl; }
    public function setLiveUrl(?string $liveUrl): static { $this->liveUrl = $liveUrl; return $this; }

    public function isFeatured(): bool { return $this->featured; }
    public function setFeatured(bool $featured): static { $this->featured = $featured; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }

    public function getColor(): ?string { return $this->color; }
    public function setColor(?string $color): static { $this->color = $color; return $this; }

    public function getMetrics(): ?array { return $this->metrics; }
    public function setMetrics(?array $metrics): static { $this->metrics = $metrics; return $this; }

    /** Accesseurs virtuels pour EasyAdmin (string JSON ↔ array). */
    public function getTagsJson(): string
    {
        return $this->tags ? json_encode($this->tags, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '[]';
    }

    public function setTagsJson(string $json): static
    {
        $this->tags = json_decode($json, true) ?? [];
        return $this;
    }

    public function getMetricsJson(): string
    {
        return $this->metrics ? json_encode($this->metrics, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : '[]';
    }

    public function setMetricsJson(string $json): static
    {
        $this->metrics = json_decode($json, true) ?: null;
        return $this;
    }
}
