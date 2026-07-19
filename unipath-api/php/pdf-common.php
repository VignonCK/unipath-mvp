<?php

function cleanText($text) {
    if (!$text) return '';
    return iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
}

/** Texte avec accents pour FPDF (ISO-8859-1). */
function pdfText($text) {
    if ($text === null || $text === '') {
        return '';
    }
    $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', (string) $text);
    return $converted !== false ? $converted : (string) $text;
}

function resolveImagePath($pathValue) {
    if (empty($pathValue) || !is_string($pathValue)) {
        return null;
    }

    $pathValue = trim($pathValue);

    if (preg_match('/^https?:\/\//i', $pathValue)) {
        return @getimagesize($pathValue) ? $pathValue : null;
    }

    if (preg_match('/^[A-Za-z]:\\\\|^\//', $pathValue)) {
        return file_exists($pathValue) ? $pathValue : null;
    }

    $relative = __DIR__ . '/../' . ltrim($pathValue, '/\\');
    return file_exists($relative) ? $relative : null;
}

/**
 * Résout un chemin de photo stockée localement (uploads).
 */
function resolvePdfPhotoLocalPath($photoPath) {
    if (empty($photoPath) || !is_string($photoPath)) {
        return null;
    }

    $photoPath = trim(str_replace('\\', '/', $photoPath));
    if (preg_match('/^https?:\/\//i', $photoPath)) {
        return null;
    }

    $candidates = [];
    $clean = ltrim($photoPath, '/');
    $candidates[] = __DIR__ . '/../' . $clean;

    if (strpos($clean, 'uploads/') !== 0) {
        $candidates[] = __DIR__ . '/../uploads/dossiers-candidats/' . $clean;
    }

    if (strpos($clean, 'dossiers-candidats/') !== false) {
        $afterBucket = substr($clean, strpos($clean, 'dossiers-candidats/') + strlen('dossiers-candidats/'));
        $candidates[] = __DIR__ . '/../uploads/dossiers-candidats/' . $afterBucket;
    }

    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            return $candidate;
        }
    }

    return null;
}

/**
 * Convertit une image temporaire en JPEG pour FPDF (PNG/WebP/GIF).
 */
function normalizePhotoFileForFpdf($tempPhoto) {
    $ext = strtolower(pathinfo($tempPhoto, PATHINFO_EXTENSION));
    if (in_array($ext, ['jpg', 'jpeg'], true)) {
        return $tempPhoto;
    }

    if (!function_exists('imagecreatefromstring')) {
        return $tempPhoto;
    }

    $imageData = @file_get_contents($tempPhoto);
    if ($imageData === false || strlen($imageData) === 0) {
        return $tempPhoto;
    }

    $img = @imagecreatefromstring($imageData);
    if ($img === false) {
        return $tempPhoto;
    }

    $width = imagesx($img);
    $height = imagesy($img);
    $canvas = imagecreatetruecolor($width, $height);
    $white = imagecolorallocate($canvas, 255, 255, 255);
    imagefill($canvas, 0, 0, $white);
    imagecopy($canvas, $img, 0, 0, 0, 0, $width, $height);

    $jpgPath = tempnam(sys_get_temp_dir(), 'unipath_') . '.jpg';
    imagejpeg($canvas, $jpgPath, 90);
    imagedestroy($img);
    imagedestroy($canvas);

    $tempDir = str_replace('\\', '/', sys_get_temp_dir());
    $sourcePath = str_replace('\\', '/', $tempPhoto);
    if (strpos($sourcePath, $tempDir) === 0 && file_exists($tempPhoto)) {
        unlink($tempPhoto);
    }

    return $jpgPath;
}

/**
 * Affiche une photo d'identité dans un cadre (base64 et/ou chemin local).
 */
function renderIdentityPhotoZone($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH, $photoStoragePath = null, $placeholderLabel = 'Photo') {
    $pdf->SetDrawColor(120, 120, 120);
    $pdf->Rect($photoX, $photoY, $photoW, $photoH);

    $tempPhoto = null;
    $tempFilesToDelete = [];

    if (!empty($photoBase64)) {
        $imageData = base64_decode($photoBase64, true);
        if ($imageData !== false && strlen($imageData) > 0) {
            $mime = $photoMime ?? 'image/jpeg';
            $extension = 'jpg';
            if ($mime === 'image/png') {
                $extension = 'png';
            } elseif ($mime === 'image/webp') {
                $extension = 'webp';
            } elseif ($mime === 'image/gif') {
                $extension = 'gif';
            }

            $tempPhoto = tempnam(sys_get_temp_dir(), 'unipath_photo_') . '.' . $extension;
            file_put_contents($tempPhoto, $imageData);
            $tempFilesToDelete[] = $tempPhoto;
        }
    }

    if ($tempPhoto === null && !empty($photoStoragePath)) {
        $localPath = resolvePdfPhotoLocalPath($photoStoragePath);
        if ($localPath !== null) {
            $tempPhoto = $localPath;
        }
    }

    if ($tempPhoto === null) {
        $pdf->SetXY($photoX, $photoY + ($photoH / 2) - 3);
        $pdf->SetFont('Times', 'I', 8);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell($photoW, 6, pdfText($placeholderLabel), 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);
        return;
    }

    $renderPhoto = normalizePhotoFileForFpdf($tempPhoto);
    if ($renderPhoto !== $tempPhoto) {
        $tempFilesToDelete[] = $renderPhoto;
    }

    try {
        $pdf->Image($renderPhoto, $photoX + 1, $photoY + 1, $photoW - 2, $photoH - 2);
    } catch (Exception $e) {
        $pdf->SetXY($photoX, $photoY + ($photoH / 2) - 3);
        $pdf->SetFont('Times', 'I', 8);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell($photoW, 6, pdfText($placeholderLabel), 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);
    }

    foreach ($tempFilesToDelete as $file) {
        if ($file && file_exists($file)) {
            @unlink($file);
        }
    }
}

/**
 * Chemin + ratio de l'en-tête officiel (custom DEC ou MESRS par défaut).
 * @return array{path:?string,aspect:float}
 */
function resolveOfficialHeaderImage() {
    $metaPath = __DIR__ . '/../uploads/parametres/en-tete-pdf.meta.json';
    if (file_exists($metaPath)) {
        $raw = @file_get_contents($metaPath);
        $meta = $raw ? json_decode($raw, true) : null;
        if (is_array($meta) && !empty($meta['fichierRelatif'])) {
            $rel = ltrim(str_replace('\\', '/', $meta['fichierRelatif']), '/');
            $abs = __DIR__ . '/../' . $rel;
            if (file_exists($abs)) {
                $aspect = isset($meta['aspectRatio']) ? (float) $meta['aspectRatio'] : null;
                if (!$aspect && !empty($meta['largeur']) && !empty($meta['hauteur'])) {
                    $aspect = ((float) $meta['hauteur']) / ((float) $meta['largeur']);
                }
                if (!$aspect) {
                    $aspect = 151 / 1024;
                }
                return ['path' => $abs, 'aspect' => $aspect];
            }
        }
    }

    foreach (['.jpg', '.jpeg', '.png'] as $ext) {
        $actif = __DIR__ . '/../uploads/parametres/en-tete-pdf-actif' . $ext;
        if (file_exists($actif)) {
            return ['path' => $actif, 'aspect' => 151 / 1024];
        }
    }

    $candidates = [
        __DIR__ . '/../assets/en-tete-mesrs.jpg',
        __DIR__ . '/../assets/en-tete-mesrs.png',
        __DIR__ . '/../src/assets/en-tete-mesrs.jpg',
        __DIR__ . '/../src/assets/en-tete-mesrs.png',
    ];
    foreach ($candidates as $path) {
        if (file_exists($path)) {
            return ['path' => $path, 'aspect' => 151 / 1024];
        }
    }
    return ['path' => null, 'aspect' => 151 / 1024];
}

/**
 * Chemin de l'en-tête officiel (compatibilité).
 */
function getMesrsHeaderImagePath() {
    $resolved = resolveOfficialHeaderImage();
    return $resolved['path'];
}

/**
 * En-tête officiel : bandeau + titre du document.
 * Retourne la hauteur approximative utilisée (mm) pour info.
 */
function renderOfficialHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $documentTitle, $subtitle = null) {
    $pageWidth = 210;
    $yStart = 10;
    $resolved = resolveOfficialHeaderImage();
    $headerPath = $resolved['path'];
    $aspect = !empty($resolved['aspect']) ? (float) $resolved['aspect'] : (151 / 1024);

    if ($headerPath) {
        $imgW = $contentWidth;
        $imgH = $imgW * $aspect;
        $pdf->Image($headerPath, $leftMargin, $yStart, $imgW, $imgH);
        $pdf->SetY($yStart + $imgH + 5);
    } else {
        // Repli texte si l'image est absente
        $drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
        $logo = __DIR__ . '/../src/assets/logo_mesrs.png';

        if (file_exists($drapeau)) {
            $pdf->Image($drapeau, $leftMargin, 15, 30, 22);
        }
        if (file_exists($logo)) {
            $pdf->Image($logo, $pageWidth - $rightMargin - 30, 15, 30, 22);
        }

        $pdf->SetY(20);
        $pdf->SetFont('Times', 'B', 12);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(0, 5, 'REPUBLIQUE DU BENIN', 0, 1, 'C');
        $pdf->SetFont('Times', '', 12);
        $pdf->Cell(0, 4, cleanText('Ministere de l\'Enseignement Superieur'), 0, 1, 'C');
        $pdf->Cell(0, 4, cleanText('et de la Recherche Scientifique'), 0, 1, 'C');
        $pdf->Ln(3);
    }

    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect($leftMargin + 20, $pdf->GetY(), $contentWidth - 40, 11);

    $pdf->SetFont('Times', 'B', 13);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(0, 11, strtoupper(pdfText($documentTitle)), 0, 1, 'C');
    $pdf->Ln(2);

    if ($subtitle) {
        $pdf->SetFont('Times', '', 11);
        $pdf->Cell(0, 6, pdfText($subtitle), 0, 1, 'C');
        $pdf->Ln(2);
    }
}

function renderSectionHeader($pdf, $leftMargin, $contentWidth, $title, $theme = 'blue') {
    if ($theme === 'red') {
        $fill = [253, 243, 243];
        $draw = [233, 198, 198];
        $text = [128, 30, 30];
    } elseif ($theme === 'green') {
        $fill = [242, 251, 245];
        $draw = [190, 222, 198];
        $text = [21, 103, 58];
    } else {
        $fill = [245, 248, 255];
        $draw = [196, 210, 237];
        $text = [20, 52, 116];
    }

    $pdf->SetFillColor($fill[0], $fill[1], $fill[2]);
    $pdf->SetDrawColor($draw[0], $draw[1], $draw[2]);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 8, 'FD');
    $pdf->SetFont('Times', 'B', 12);
    $pdf->SetTextColor($text[0], $text[1], $text[2]);
    $pdf->SetX($leftMargin + 2);
    // pdfText conserve les accents (évite "D'ETAILS" via ASCII//TRANSLIT)
    $pdf->Cell($contentWidth - 4, 8, strtoupper(pdfText($title)), 0, 1, 'L');
    $pdf->SetTextColor(0, 0, 0);
}

function renderSignatureBlock($pdf, $label = 'Le Directeur General de l Enseignement Superieur') {
    $pdf->Ln(4);
    $pdf->SetFont('Times', '', 12);
    $pdf->Cell(0, 5, cleanText('Fait a Abomey-Calavi, le ') . date('d/m/Y'), 0, 1, 'R');
    $pdf->SetFont('Times', 'B', 12);
    $pdf->Cell(0, 5, cleanText($label), 0, 1, 'R');
}

function renderDocumentFooter($pdf, $mention = null) {
    $text = $mention ?: 'Document genere automatiquement par UniPath - ' . date('d/m/Y H:i');
    $pdf->SetY(-20);
    $pdf->SetFont('Times', '', 12);
    $pdf->SetTextColor(128, 128, 128);
    $pdf->Cell(0, 4, cleanText($text), 0, 1, 'C');
    $pdf->SetTextColor(0, 0, 0);
}
