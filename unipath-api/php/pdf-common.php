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

function renderOfficialHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $documentTitle, $subtitle = null) {
    $pageWidth = 210;
    $drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
    $logo = __DIR__ . '/../src/assets/logo_mesrs.png';

    if (file_exists($drapeau)) {
        $pdf->Image($drapeau, $leftMargin, 15, 30, 22);
    }

    if (file_exists($logo)) {
        $pdf->Image($logo, $pageWidth - $rightMargin - 30, 15, 30, 22);
    }

    $pdf->SetY(20);
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(0, 5, 'REPUBLIQUE DU BENIN', 0, 1, 'C');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 4, cleanText('Ministere de l\'Enseignement Superieur'), 0, 1, 'C');
    $pdf->Cell(0, 4, cleanText('et de la Recherche Scientifique'), 0, 1, 'C');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(0, 5, cleanText('Universite d\'Abomey-Calavi'), 0, 1, 'C');

    $pdf->Ln(5);

    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect($leftMargin + 30, $pdf->GetY(), $contentWidth - 60, 12);

    $pdf->SetFont('Helvetica', 'B', 14);
    $pdf->Cell(0, 12, strtoupper(cleanText($documentTitle)), 0, 1, 'C');
    $pdf->Ln(3);

    if ($subtitle) {
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->Cell(0, 6, cleanText($subtitle), 0, 1, 'C');
        $pdf->Ln(3);
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
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor($text[0], $text[1], $text[2]);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 8, strtoupper(cleanText($title)), 0, 1, 'L');
    $pdf->SetTextColor(0, 0, 0);
}

function renderSignatureBlock($pdf, $label = 'Le Directeur General de l Enseignement Superieur') {
    $pdf->Ln(4);
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 5, cleanText('Fait a Abomey-Calavi, le ') . date('d/m/Y'), 0, 1, 'R');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(0, 5, cleanText($label), 0, 1, 'R');
}

function renderDocumentFooter($pdf, $mention = null) {
    $text = $mention ?: 'Document genere automatiquement par UniPath - ' . date('d/m/Y H:i');
    $pdf->SetY(-20);
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetTextColor(128, 128, 128);
    $pdf->Cell(0, 4, cleanText($text), 0, 1, 'C');
    $pdf->SetTextColor(0, 0, 0);
}

