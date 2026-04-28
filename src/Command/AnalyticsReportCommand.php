<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[AsCommand(
    name: 'app:analytics:report',
    description: 'Envoie le rapport analytics de la veille par email',
)]
class AnalyticsReportCommand extends Command
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly string $logsDir,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $yesterday = new \DateTimeImmutable('yesterday');
        $dateStr   = $yesterday->format('Y-m-d');
        $logFile   = $this->logsDir . '/analytics.log';

        if (!file_exists($logFile)) {
            $output->writeln('Aucun fichier analytics.log trouvé.');
            return Command::SUCCESS;
        }

        $stats = $this->parseLog($logFile, $dateStr);

        $subject = sprintf(
            '[Portfolio] Stats du %s — %d visite%s',
            $yesterday->format('d/m/Y'),
            $stats['total'],
            $stats['total'] > 1 ? 's' : '',
        );

        $email = (new Email())
            ->from($_ENV['MAILER_FROM'] ?? 'noreply@portfolio.local')
            ->to($_ENV['MAILER_TO']   ?? 'noreply@portfolio.local')
            ->subject($subject)
            ->text($this->buildText($yesterday, $stats))
            ->html($this->buildHtml($yesterday, $stats));

        $this->mailer->send($email);
        $output->writeln('Rapport envoyé pour le ' . $dateStr . '.');

        return Command::SUCCESS;
    }

    private function parseLog(string $logFile, string $dateStr): array
    {
        $stats = [
            'total'      => 0,
            'pageViews'  => [],
            'devices'    => ['mobile' => 0, 'desktop' => 0],
            'terminal'   => [],
            'contacts'   => 0,
            'langSwitch' => [],
        ];

        $handle = fopen($logFile, 'r');
        if (!$handle) {
            return $stats;
        }

        while (($line = fgets($handle)) !== false) {
            if (!str_contains($line, $dateStr)) {
                continue;
            }

            if (str_contains($line, '[PAGE_VIEW]')) {
                preg_match('/path=(\S+)/', $line, $mp);
                $path = $mp[1] ?? '?';
                $stats['pageViews'][$path] = ($stats['pageViews'][$path] ?? 0) + 1;
                $stats['total']++;
                if (str_contains($line, 'device=mobile')) {
                    $stats['devices']['mobile']++;
                } else {
                    $stats['devices']['desktop']++;
                }
            } elseif (str_contains($line, '[TERMINAL]')) {
                preg_match('/cmd=(\S+)/', $line, $mc);
                $cmd = $mc[1] ?? '?';
                $stats['terminal'][$cmd] = ($stats['terminal'][$cmd] ?? 0) + 1;
            } elseif (str_contains($line, '[CONTACT]')) {
                $stats['contacts']++;
            } elseif (str_contains($line, '[LANG_SWITCH]')) {
                preg_match('/\[LANG_SWITCH\] (\S+)/', $line, $ml);
                $switch = $ml[1] ?? '?';
                $stats['langSwitch'][$switch] = ($stats['langSwitch'][$switch] ?? 0) + 1;
            }
        }

        fclose($handle);
        arsort($stats['pageViews']);
        arsort($stats['terminal']);

        return $stats;
    }

    private function buildText(\DateTimeImmutable $date, array $s): string
    {
        $lines = [
            'Rapport analytics — ' . $date->format('d/m/Y'),
            str_repeat('─', 40),
            '',
            'VISITES',
            '  Total   : ' . $s['total'],
            '  Mobile  : ' . $s['devices']['mobile'],
            '  Desktop : ' . $s['devices']['desktop'],
        ];

        if ($s['pageViews']) {
            $lines[] = '';
            $lines[] = 'PAGES (top 10)';
            foreach (array_slice($s['pageViews'], 0, 10) as $path => $n) {
                $lines[] = '  ' . str_pad($path, 20) . ' ' . $n;
            }
        }

        if ($s['terminal']) {
            $lines[] = '';
            $lines[] = 'TERMINAL (top 5)';
            foreach (array_slice($s['terminal'], 0, 5) as $cmd => $n) {
                $lines[] = '  ' . str_pad($cmd, 20) . ' ' . $n;
            }
        }

        if ($s['contacts'] > 0) {
            $lines[] = '';
            $lines[] = 'CONTACT : ' . $s['contacts'] . ' message(s) reçu(s) ✉';
        }

        if ($s['langSwitch']) {
            $lines[] = '';
            $lines[] = 'LANGUE';
            foreach ($s['langSwitch'] as $sw => $n) {
                $lines[] = '  ' . $sw . ' : ' . $n;
            }
        }

        if ($s['total'] === 0) {
            $lines[] = '';
            $lines[] = '(aucune activité enregistrée)';
        }

        return implode("\n", $lines);
    }

    private function buildHtml(\DateTimeImmutable $date, array $s): string
    {
        $bg   = '#0d1117';
        $fg   = '#c9d1d9';
        $mute = '#8b949e';
        $blue = '#58a6ff';
        $green = '#3fb950';

        $td = fn(string $label, string $val, string $color = '') => sprintf(
            '<tr><td style="padding:5px 12px;color:%s">%s</td><td style="padding:5px 12px;color:%s">%s</td></tr>',
            $mute, htmlspecialchars($label), $color ?: $fg, htmlspecialchars($val)
        );

        $section = fn(string $title) => sprintf(
            '<h3 style="color:%s;margin:24px 0 8px;font-size:14px;letter-spacing:.05em">%s</h3>',
            $blue, $title
        );

        $table = '<table style="border-collapse:collapse;width:100%;max-width:520px;background:#161b22;border-radius:6px">';

        $h  = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>';
        $h .= '<body style="font-family:monospace;background:' . $bg . ';color:' . $fg . ';padding:32px;margin:0">';
        $h .= '<h2 style="color:' . $blue . ';margin:0 0 4px">Portfolio · Stats</h2>';
        $h .= '<p style="color:' . $mute . ';margin:0 0 24px;font-size:13px">' . $date->format('d/m/Y') . '</p>';

        $h .= $section('Visites');
        $h .= $table;
        $h .= $td('Total', (string) $s['total']);
        $h .= $td('Mobile', (string) $s['devices']['mobile']);
        $h .= $td('Desktop', (string) $s['devices']['desktop']);
        if ($s['contacts'] > 0) {
            $h .= $td('Contacts reçus', (string) $s['contacts'], $green);
        }
        $h .= '</table>';

        if ($s['pageViews']) {
            $h .= $section('Pages vues (top 10)');
            $h .= $table;
            foreach (array_slice($s['pageViews'], 0, 10) as $path => $n) {
                $h .= $td($path, (string) $n);
            }
            $h .= '</table>';
        }

        if ($s['terminal']) {
            $h .= $section('Commandes terminal (top 5)');
            $h .= $table;
            foreach (array_slice($s['terminal'], 0, 5) as $cmd => $n) {
                $h .= $td($cmd, (string) $n);
            }
            $h .= '</table>';
        }

        if ($s['langSwitch']) {
            $h .= $section('Changements de langue');
            $h .= $table;
            foreach ($s['langSwitch'] as $sw => $n) {
                $h .= $td($sw, (string) $n);
            }
            $h .= '</table>';
        }

        if ($s['total'] === 0) {
            $h .= '<p style="color:' . $mute . ';font-style:italic;margin-top:24px">Aucune activité enregistrée hier.</p>';
        }

        $h .= '</body></html>';

        return $h;
    }
}
