<?php

namespace App\Controller;

use App\Form\ContactType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Contrôleur de la page de contact.
 *
 * Gère l'affichage et la soumission du formulaire de contact.
 * Les e-mails sont envoyés via Resend (SMTP) configuré dans .env.local.
 */
class ContactController extends AbstractController
{
    /**
     * Affiche le formulaire de contact et traite son envoi.
     *
     * En cas de succès, redirige avec un flash de confirmation.
     * En cas d'erreur SMTP, affiche un message d'erreur sans exposer les détails techniques.
     */
    #[Route('/contact', name: 'app_contact')]
    public function index(Request $request, MailerInterface $mailer): Response
    {
        $form = $this->createForm(ContactType::class);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $data = $form->getData();

            try {
                $email = (new Email())
                    ->from($_ENV['MAILER_FROM'] ?? 'noreply@portfolio.local')
                    ->to($_ENV['MAILER_TO']   ?? 'noreply@portfolio.local')
                    ->replyTo($data['email'])           // Permet de répondre directement à l'expéditeur
                    ->subject('[Portfolio] ' . $data['subject'])
                    ->text(
                        "Nom : {$data['name']}\n" .
                        "Email : {$data['email']}\n\n" .
                        $data['message']
                    )
                    ->html(
                        "<p><strong>Nom :</strong> {$data['name']}</p>" .
                        "<p><strong>Email :</strong> {$data['email']}</p>" .
                        "<hr>" .
                        "<p>" . nl2br(htmlspecialchars($data['message'])) . "</p>"
                    );

                $mailer->send($email);
                $this->addFlash('success', 'Votre message a bien été envoyé. Je vous répondrai dans les plus brefs délais !');
            } catch (\Throwable $e) {
                $this->addFlash('error', 'Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
            }

            // Redirection POST/Redirect/GET pour éviter le double envoi au rechargement
            return $this->redirectToRoute('app_contact');
        }

        return $this->render('contact/index.html.twig', [
            'form' => $form,
        ]);
    }
}
