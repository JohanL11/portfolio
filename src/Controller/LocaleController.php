<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class LocaleController extends AbstractController
{
    private const SUPPORTED_LOCALES = ['fr', 'en'];

    #[Route('/locale/{locale}', name: 'app_locale', requirements: ['locale' => 'fr|en'])]
    public function switchLocale(Request $request, string $locale): Response
    {
        if (in_array($locale, self::SUPPORTED_LOCALES, true)) {
            $request->getSession()->set('_locale', $locale);
        }

        $referer = $request->headers->get('referer');
        $target  = $this->generateUrl('app_home');

        if ($referer) {
            $refererHost = parse_url($referer, PHP_URL_HOST);
            if ($refererHost !== null && $refererHost === $request->getHost()) {
                $target = $referer;
            }
        }

        return $this->redirect($target);
    }
}
