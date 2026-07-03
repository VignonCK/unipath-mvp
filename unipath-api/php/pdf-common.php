<?php

function cleanText($text) {
    if (!$text) return '';
    return iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
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

function renderOfficialHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $documentTitle, $subtitle = null, $compact = false) {
    $pageWidth = 210;
    $drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
    $logo = __DIR__ . '/../src/assets/logo_mesrs.png';

    $flagY = $compact ? 10 : 15;
    $flagW = $compact ? 22 : 30;
    $flagH = $compact ? 16 : 22;
    $textY = $compact ? 12 : 20;

    if (file_exists($drapeau)) {
        $pdf->Image($drapeau, $leftMargin, $flagY, $flagW, $flagH);
    }

    if (file_exists($logo)) {
        $pdf->Image($logo, $pageWidth - $rightMargin - $flagW, $flagY, $flagW, $flagH);
    }

    $pdf->SetY($textY);
    $pdf->SetFont('Helvetica', 'B', $compact ? 9 : 12);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(0, $compact ? 3.5 : 5, 'REPUBLIQUE DU BENIN', 0, 1, 'C');
    $pdf->SetFont('Helvetica', '', $compact ? 8 : 12);
    $pdf->Cell(0, $compact ? 3 : 4, cleanText('Ministere de l\'Enseignement Superieur'), 0, 1, 'C');
    $pdf->Cell(0, $compact ? 3 : 4, cleanText('et de la Recherche Scientifique'), 0, 1, 'C');
    $pdf->SetFont('Helvetica', 'B', $compact ? 9 : 12);
    $pdf->Cell(0, $compact ? 3.5 : 5, cleanText('Universite d\'Abomey-Calavi'), 0, 1, 'C');

    $pdf->Ln($compact ? 2 : 5);

    $titleBoxH = $compact ? 9 : 12;
    $titleFontSize = $compact ? 11 : 14;

    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect($leftMargin + ($compact ? 24 : 30), $pdf->GetY(), $contentWidth - ($compact ? 48 : 60), $titleBoxH);

    $pdf->SetFont('Helvetica', 'B', $titleFontSize);
    $pdf->Cell(0, $titleBoxH, strtoupper(cleanText($documentTitle)), 0, 1, 'C');
    $pdf->Ln($compact ? 1 : 3);

    if ($subtitle) {
        $pdf->SetFont('Helvetica', '', $compact ? 9 : 12);
        if ($compact) {
            $pdf->Cell(0, 4, cleanText($subtitle), 0, 1, 'C');
        } else {
            $pdf->Cell(0, 6, cleanText($subtitle), 0, 1, 'C');
            $pdf->Ln(3);
        }
    }
}

function renderSectionHeader($pdf, $leftMargin, $contentWidth, $title, $theme = 'blue', $compact = false) {
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

    $headerH = $compact ? 6 : 8;
    $fontSize = $compact ? 9 : 12;

    $pdf->SetFillColor($fill[0], $fill[1], $fill[2]);
    $pdf->SetDrawColor($draw[0], $draw[1], $draw[2]);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, $headerH, 'FD');
    $pdf->SetFont('Helvetica', 'B', $fontSize);
    $pdf->SetTextColor($text[0], $text[1], $text[2]);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, $headerH, strtoupper(cleanText($title)), 0, 1, 'L');
    $pdf->SetTextColor(0, 0, 0);
}

function renderSignatureBlock($pdf, $label = 'Le Directeur General de l Enseignement Superieur', $compact = false) {
    $pdf->Ln($compact ? 2 : 4);
    $pdf->SetFont('Helvetica', '', $compact ? 9 : 12);
    $pdf->Cell(0, $compact ? 4 : 5, cleanText('Fait a Abomey-Calavi, le ') . date('d/m/Y'), 0, 1, 'R');
    $pdf->SetFont('Helvetica', 'B', $compact ? 9 : 12);
    $pdf->Cell(0, $compact ? 4 : 5, cleanText($label), 0, 1, 'R');
}

function renderDocumentFooter($pdf, $mention = null, $compact = false) {
    $text = $mention ?: 'Document genere automatiquement par UniPath - ' . date('d/m/Y H:i');
    $pdf->SetY($compact ? -12 : -20);
    $pdf->SetFont('Helvetica', '', $compact ? 7 : 12);
    $pdf->SetTextColor(128, 128, 128);
    $pdf->Cell(0, $compact ? 3 : 4, cleanText($text), 0, 1, 'C');
    $pdf->SetTextColor(0, 0, 0);
}

