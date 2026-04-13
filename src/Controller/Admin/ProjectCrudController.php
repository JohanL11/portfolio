<?php

namespace App\Controller\Admin;

use App\Entity\Project;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Filters;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextareaField;
use EasyCorp\Bundle\EasyAdminBundle\Filter\BooleanFilter;

class ProjectCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Project::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Réalisation')
            ->setEntityLabelInPlural('Réalisations')
            ->setDefaultSort(['createdAt' => 'DESC'])
            ->setSearchFields(['title', 'shortDescription', 'description']);
    }

    public function configureFields(string $pageName): iterable
    {
        yield TextField::new('title', 'Titre (FR)');
        yield TextField::new('titleEn', 'Title (EN)')
            ->hideOnIndex();
        yield TextareaField::new('shortDescription', 'Description courte (FR)')
            ->hideOnIndex();
        yield TextareaField::new('shortDescriptionEn', 'Short description (EN)')
            ->hideOnIndex();
        yield TextareaField::new('description', 'Description complète (FR)')
            ->setNumOfRows(6)
            ->hideOnIndex();
        yield TextareaField::new('descriptionEn', 'Full description (EN)')
            ->setNumOfRows(6)
            ->hideOnIndex();
        yield ChoiceField::new('color', 'Couleur cover')
            ->setChoices([
                'Indigo' => 'indigo',
                'Teal'   => 'teal',
                'Green'  => 'green',
                'Violet' => 'violet',
                'Amber'  => 'amber',
            ])
            ->allowMultipleChoices(false)
            ->renderAsBadges([
                'indigo' => 'primary',
                'teal'   => 'info',
                'green'  => 'success',
                'violet' => 'warning',
                'amber'  => 'danger',
            ]);
        yield TextareaField::new('tagsJson', 'Technologies (JSON)')
            ->setNumOfRows(3)
            ->hideOnIndex()
            ->setHelp('Ex : ["PHP","Symfony","MySQL"]');
        yield TextareaField::new('metricsJson', 'Métriques (JSON)')
            ->setNumOfRows(3)
            ->hideOnIndex()
            ->setHelp('Ex : [{"value":"250","label":"clients"}]');
        yield TextField::new('githubUrl', 'GitHub')->hideOnIndex();
        yield TextField::new('liveUrl', 'URL live')->hideOnIndex();
        yield BooleanField::new('featured', 'Mis en avant');
        yield DateTimeField::new('createdAt', 'Date')
            ->setFormat('dd/MM/yyyy')
            ->hideOnForm();
    }

    public function configureFilters(Filters $filters): Filters
    {
        return $filters->add(BooleanFilter::new('featured', 'Mis en avant'));
    }
}
