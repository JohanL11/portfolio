<?php

namespace App\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;

/**
 * Formulaire de contact.
 *
 * Collecte le nom, l'adresse e-mail, le sujet et le message de l'expéditeur.
 * Chaque champ est validé côté serveur via des contraintes Symfony.
 */
class ContactType extends AbstractType
{
    /**
     * Définit les champs du formulaire et leurs contraintes de validation.
     */
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            // Nom complet de l'expéditeur (2 à 100 caractères)
            ->add('name', TextType::class, [
                'label' => 'Nom complet',
                'attr' => ['placeholder' => 'Jean Dupont'],
                'constraints' => [
                    new NotBlank(['message' => 'Veuillez entrer votre nom.']),
                    new Length(['min' => 2, 'max' => 100]),
                ],
            ])
            // Adresse e-mail utilisée pour le Reply-To de l'e-mail envoyé
            ->add('email', EmailType::class, [
                'label' => 'Adresse e-mail',
                'attr' => ['placeholder' => 'jean@exemple.fr'],
                'constraints' => [
                    new NotBlank(['message' => 'Veuillez entrer votre e-mail.']),
                    new Email(['message' => 'Adresse e-mail invalide.']),
                ],
            ])
            // Sujet utilisé comme objet de l'e-mail (préfixé par [Portfolio])
            ->add('subject', TextType::class, [
                'label' => 'Sujet',
                'attr' => ['placeholder' => 'Proposition de mission, collaboration...'],
                'constraints' => [
                    new NotBlank(['message' => 'Veuillez entrer un sujet.']),
                    new Length(['min' => 3, 'max' => 200]),
                ],
            ])
            // Corps du message (10 à 2000 caractères)
            ->add('message', TextareaType::class, [
                'label' => 'Message',
                'attr' => ['placeholder' => 'Décrivez votre projet ou votre demande...', 'rows' => 6],
                'constraints' => [
                    new NotBlank(['message' => 'Veuillez entrer votre message.']),
                    new Length(['min' => 10, 'max' => 2000, 'minMessage' => 'Votre message doit contenir au moins {{ limit }} caractères.']),
                ],
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([]);
    }
}
