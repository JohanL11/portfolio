<?php

namespace App\EventSubscriber;

use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class AnalyticsSubscriber implements EventSubscriberInterface
{
    public function __construct(
        #[Target('analyticsLogger')]
        private readonly LoggerInterface $logger,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::RESPONSE => 'onKernelResponse'];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();

        if ($request->getMethod() !== 'GET') {
            return;
        }

        if ($request->isXmlHttpRequest() || $request->headers->has('Turbo-Frame')) {
            return;
        }

        $route = $request->attributes->get('_route', '');

        if (
            str_starts_with($route, '_') ||
            str_contains($route, 'admin') ||
            in_array($route, ['app_log', 'app_locale'], true)
        ) {
            return;
        }

        $ua     = $request->headers->get('User-Agent', '');
        $device = preg_match('/Mobile|Android|iPhone|iPad/i', $ua) ? 'mobile' : 'desktop';

        $this->logger->info(sprintf(
            '[PAGE_VIEW] path=%s locale=%s device=%s',
            $request->getPathInfo(),
            $request->getLocale() ?: 'fr',
            $device,
        ));
    }
}
