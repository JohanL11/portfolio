<?php

namespace App\Controller;

use App\Form\ContactType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * Contrôleur de la page de contact.
 *
 * Gère l'affichage et la soumission du formulaire de contact.
 * Les e-mails sont envoyés via Resend (SMTP) configuré dans .env.local.
 *
 * Anti-spam :
 *  - Honeypot (`website`) : si rempli, on simule un succès sans envoyer.
 *  - Timing : soumission < 3s après affichage = comportement de bot, rejet silencieux.
 *  - Rate limit IP : 3 envois/heure max via le limiter `contact`.
 */
class ContactController extends AbstractController
{
    private const MIN_FILL_SECONDS = 3;

    public function __construct(
        private readonly TranslatorInterface $translator,
        private readonly RateLimiterFactory $contactLimiter,
    ) {}

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
            // Honeypot rempli → bot, on simule un succès pour ne pas révéler la protection.
            $honeypot = (string) ($form->get('website')->getData() ?? '');
            $ts       = (int) ($form->get('ts')->getData() ?? 0);
            $elapsed  = time() - $ts;

            if ($honeypot !== '' || $ts <= 0 || $elapsed < self::MIN_FILL_SECONDS) {
                $this->addFlash('success', 'contact.flash.success');
                return $this->redirectToRoute('app_contact');
            }

            // Rate limit par IP. En cas de dépassement → flash dédié, pas d'envoi.
            $limiter = $this->contactLimiter->create($request->getClientIp() ?? 'unknown');
            if (!$limiter->consume(1)->isAccepted()) {
                $this->addFlash('error', 'contact.flash.rate_limited');
                return $this->redirectToRoute('app_contact');
            }

            $data = $form->getData();

            try {
                $name    = htmlspecialchars($data['name'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $emailIn = htmlspecialchars($data['email'], ENT_QUOTES | ENT_HTML5, 'UTF-8');
                $subject = htmlspecialchars($data['subject'], ENT_QUOTES | ENT_HTML5, 'UTF-8');

                $email = (new Email())
                    ->from($_ENV['MAILER_FROM'] ?? 'noreply@portfolio.local')
                    ->to($_ENV['MAILER_TO']   ?? 'noreply@portfolio.local')
                    ->replyTo($data['email'])
                    ->subject('[Portfolio] ' . $data['subject'])
                    ->text(
                        "Nom : {$data['name']}\n" .
                        "Email : {$data['email']}\n\n" .
                        $data['message']
                    )
                    ->html(
                        "<p><strong>Nom :</strong> {$name}</p>" .
                        "<p><strong>Email :</strong> {$emailIn}</p>" .
                        "<p><strong>Sujet :</strong> {$subject}</p>" .
                        "<hr>" .
                        "<p>" . nl2br(htmlspecialchars($data['message'], ENT_QUOTES | ENT_HTML5, 'UTF-8')) . "</p>"
                    );

                $mailer->send($email);
                $this->addFlash('success', 'contact.flash.success');
            } catch (\Throwable $e) {
                $this->addFlash('error', 'contact.flash.error');
            }

            return $this->redirectToRoute('app_contact');
        }

        return $this->render('contact/index.html.twig', [
            'form' => $form,
        ]);
    }
}
