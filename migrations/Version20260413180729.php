<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260413180729 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE project ADD COLUMN title_en VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE project ADD COLUMN short_description_en VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE project ADD COLUMN description_en CLOB DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TEMPORARY TABLE __temp__project AS SELECT id, title, short_description, description, image_url, tags, github_url, live_url, featured, color, metrics, created_at FROM project');
        $this->addSql('DROP TABLE project');
        $this->addSql('CREATE TABLE project (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, title VARCHAR(255) NOT NULL, short_description VARCHAR(500) NOT NULL, description CLOB NOT NULL, image_url VARCHAR(255) DEFAULT NULL, tags CLOB NOT NULL, github_url VARCHAR(255) DEFAULT NULL, live_url VARCHAR(255) DEFAULT NULL, featured BOOLEAN NOT NULL, color VARCHAR(50) DEFAULT NULL, metrics CLOB DEFAULT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('INSERT INTO project (id, title, short_description, description, image_url, tags, github_url, live_url, featured, color, metrics, created_at) SELECT id, title, short_description, description, image_url, tags, github_url, live_url, featured, color, metrics, created_at FROM __temp__project');
        $this->addSql('DROP TABLE __temp__project');
    }
}
