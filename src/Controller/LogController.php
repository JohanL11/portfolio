<?php

namespace App\Controller;

use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Target;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class LogController extends AbstractController
{
    private const VALID_CMDS = [
        'help', 'whoami', 'skills', 'xp', 'experience', 'contact',
        'cv', 'resume', 'social', 'github', 'lol', 'lang', 'locale',
        'theme', 'clear', 'cls', 'sudo', 'rm', 'exit', 'quit', 'ls',
    ];

    public function __construct(
        #[Target('analyticsLogger')]
        private readonly LoggerInterface $logger,
    ) {}

    #[Route('/api/log', name: 'app_log', methods: ['POST'])]
    public function log(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return new JsonResponse(null, 204);
        }

        if (($data['type'] ?? '') === 'terminal_cmd') {
            $raw  = strtolower(trim((string) ($data['cmd'] ?? '')));
            $cmd  = explode(' ', $raw)[0];
            $full = substr($raw, 0, 80);

            if ($cmd !== '' && in_array($cmd, self::VALID_CMDS, true)) {
                $this->logger->info(sprintf('[TERMINAL] cmd=%s', $full));
            }
        }

        return new JsonResponse(null, 204);
    }
}
