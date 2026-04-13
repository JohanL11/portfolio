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
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Formulaire de contact — labels et messages de validation traduits.
 */
class ContactType extends AbstractType
{
    public function __construct(private readonly TranslatorInterface $translator) {}

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $t = fn (string $key) => $this->translator->trans($key);

        $builder
            ->add('name', TextType::class, [
                'label'              => $t('contact.form.name'),
                'translation_domain' => false,
                'attr'               => ['placeholder' => $t('contact.form.name_placeholder')],
                'constraints'        => [
                    new NotBlank(['message' => $t('contact.validation.name_blank')]),
                    new Length(['min' => 2, 'max' => 100]),
                ],
            ])
            ->add('email', EmailType::class, [
                'label'              => $t('contact.form.email'),
                'translation_domain' => false,
                'attr'               => ['placeholder' => $t('contact.form.email_placeholder')],
                'constraints'        => [
                    new NotBlank(['message' => $t('contact.validation.email_blank')]),
                    new Email(['message' => $t('contact.validation.email_invalid')]),
                ],
            ])
            ->add('subject', TextType::class, [
                'label'              => $t('contact.form.subject'),
                'translation_domain' => false,
                'attr'               => ['placeholder' => $t('contact.form.subject_placeholder')],
                'constraints'        => [
                    new NotBlank(['message' => $t('contact.validation.subject_blank')]),
                    new Length(['min' => 3, 'max' => 200]),
                ],
            ])
            ->add('message', TextareaType::class, [
                'label'              => $t('contact.form.message'),
                'translation_domain' => false,
                'attr'               => [
                    'placeholder' => $t('contact.form.message_placeholder'),
                    'rows'        => 6,
                ],
                'constraints'        => [
                    new NotBlank(['message' => $t('contact.validation.message_blank')]),
                    new Length([
                        'min'        => 10,
                        'max'        => 2000,
                        'minMessage' => $t('contact.validation.message_min'),
                    ]),
                ],
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([]);
    }
}
