<?php
/**
 * Génère les images Open Graph (1200x630) pour chaque page du portfolio.
 * Usage : php generate-og-images.php
 * Les fichiers sont créés dans public/img/
 */

$outputDir = __DIR__ . '/public/img';
if (!is_dir($outputDir)) {
    mkdir($outputDir, 0755, true);
}

$fontRegular = 'C:/Windows/Fonts/segoeui.ttf';
$fontBold    = 'C:/Windows/Fonts/segoeuib.ttf';
$logoPath    = __DIR__ . '/public/files/JL_Logo.png';

$W = 1200;
$H = 630;

// ─── Couleurs ────────────────────────────────────────────────────────────────
function hex2rgb(string $hex): array {
    $hex = ltrim($hex, '#');
    return [hexdec(substr($hex, 0, 2)), hexdec(substr($hex, 2, 2)), hexdec(substr($hex, 4, 2))];
}

// ─── Fonction principale ──────────────────────────────────────────────────────
function generateOgImage(string $outputPath, string $title, string $subtitle, string $tag, array $opts = []): void {
    global $W, $H, $fontRegular, $fontBold, $logoPath;

    $img = imagecreatetruecolor($W, $H);
    imagealphablending($img, true);
    imagesavealpha($img, true);

    // Fond dégradé vertical (bg dark)
    for ($y = 0; $y < $H; $y++) {
        $ratio = $y / $H;
        $r = (int)(13  + (19  - 13)  * $ratio);
        $g = (int)(17  + (22  - 17)  * $ratio);
        $b = (int)(23  + (42  - 23)  * $ratio);
        $c = imagecolorallocate($img, $r, $g, $b);
        imagefilledrectangle($img, 0, $y, $W, $y, $c);
    }

    // Barre accent gauche
    $accentColor = imagecolorallocate($img, 124, 58, 237);
    imagefilledrectangle($img, 0, 0, 5, $H, $accentColor);

    // Dégradé accent subtil en haut à droite
    for ($x = $W - 400; $x < $W; $x++) {
        $ratio = ($x - ($W - 400)) / 400;
        $alpha = (int)(110 - $ratio * 110);
        $c = imagecolorallocatealpha($img, 99, 102, 241, $alpha);
        imageline($img, $x, 0, $x, 180, $c);
    }

    // Logo JL
    if (file_exists($logoPath)) {
        $logo = imagecreatefrompng($logoPath);
        if ($logo) {
            $lw = imagesx($logo);
            $lh = imagesy($logo);
            $targetSize = 100;
            $ratio = $targetSize / max($lw, $lh);
            $newW = (int)($lw * $ratio);
            $newH = (int)($lh * $ratio);
            $logoResized = imagecreatetruecolor($newW, $newH);
            imagealphablending($logoResized, false);
            imagesavealpha($logoResized, true);
            $transparent = imagecolorallocatealpha($logoResized, 0, 0, 0, 127);
            imagefilledrectangle($logoResized, 0, 0, $newW, $newH, $transparent);
            imagecopyresampled($logoResized, $logo, 0, 0, 0, 0, $newW, $newH, $lw, $lh);
            imagecopy($img, $logoResized, 72, 72, 0, 0, $newW, $newH);
            imagedestroy($logo);
            imagedestroy($logoResized);
        }
    }

    // Tag (ex: "Services", "Projets")
    $tagColor = imagecolorallocate($img, 139, 92, 246);
    if (!empty($tag)) {
        imagettftext($img, 14, 0, 72, 230, $tagColor, $fontBold, strtoupper($tag));
    }

    // Titre principal
    $white = imagecolorallocate($img, 248, 250, 252);
    $titleSize = strlen($title) > 24 ? 44 : 52;
    imagettftext($img, $titleSize, 0, 72, 310, $white, $fontBold, $title);

    // Sous-titre
    $muted = imagecolorallocate($img, 148, 163, 184);
    $lines = explode("\n", wordwrap($subtitle, 62, "\n", false));
    $y = 370;
    foreach ($lines as $line) {
        imagettftext($img, 19, 0, 72, $y, $muted, $fontRegular, trim($line));
        $y += 32;
    }

    // Séparateur
    $border = imagecolorallocate($img, 51, 65, 85);
    imagefilledrectangle($img, 72, $H - 100, $W - 72, $H - 99, $border);

    // URL
    $accent = imagecolorallocate($img, 129, 140, 248);
    imagettftext($img, 16, 0, 72, $H - 62, $accent, $fontRegular, 'johan-louap.fr');

    // "Johan Louap" à droite dans le footer
    imagettftext($img, 16, 0, $W - 250, $H - 62, $muted, $fontRegular, 'Johan Louap');

    imagepng($img, $outputPath, 9);
    imagedestroy($img);

    echo "✓ Généré : " . basename($outputPath) . "\n";
}

// ─── Pages ───────────────────────────────────────────────────────────────────
$pages = [
    'og-default.png'  => [
        'title'    => 'Johan Louap',
        'subtitle' => 'Développeur Full Stack Web & Mobile — PHP, React Native, Symfony, Linux.',
        'tag'      => 'Portfolio',
    ],
    'og-services.png' => [
        'title'    => 'Services',
        'subtitle' => 'Boutique e-commerce, site vitrine, application web ou mobile — des solutions sur-mesure.',
        'tag'      => 'Prestations freelance',
    ],
    'og-projects.png' => [
        'title'    => 'Projets',
        'subtitle' => 'Mes réalisations en développement web et mobile — e-commerce, apps, outils métier.',
        'tag'      => 'Réalisations',
    ],
    'og-contact.png'  => [
        'title'    => 'Un projet en tête ?',
        'subtitle' => 'Parlons-en — je réponds sous 24h avec une première estimation.',
        'tag'      => 'Contact',
    ],
    'og-lol.png'      => [
        'title'    => 'Stats League of Legends',
        'subtitle' => 'Consultez vos statistiques LoL en temps réel via l\'API Riot Games.',
        'tag'      => 'League of Legends',
    ],
];

foreach ($pages as $filename => $data) {
    generateOgImage(
        $outputDir . '/' . $filename,
        $data['title'],
        $data['subtitle'],
        $data['tag']
    );
}

echo "\nDone — images dans public/img/\n";
