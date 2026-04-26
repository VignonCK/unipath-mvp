<?php
require(__DIR__ . '/fpdf.php');

// Lire les données depuis le fichier passé en argument
$inputFile = $argv[1];
$outputFile = $argv[2];

// Lire et nettoyer le BOM UTF-8 éventuel
$raw = file_get_contents($inputFile);
$raw = ltrim($raw, "\xEF\xBB\xBF"); // Supprimer le BOM UTF-8
$data = json_decode($raw, true);

if (!$data) {
    die("Erreur: JSON invalide\n");
}

$candidat    = $data['candidat']    ?? [];
$concours    = $data['concours']    ?? [];
$inscription = $data['inscription'] ?? [];

// Fonction pour nettoyer les caractères accentués
function cleanText($text) {
    $search = ['é','è','ê','ë','à','â','ä','î','ï','ô','ö','ù','û','ü','ç','É','È','Ê','À','Â','Î','Ô','Ù','Û','Ç','œ','æ'];
    $replace = ['e','e','e','e','a','a','a','i','i','o','o','u','u','u','c','E','E','E','A','A','I','O','U','U','C','oe','ae'];
    return str_replace($search, $replace, $text);
}

// Créer le document PDF
$pdf = new FPDF('P', 'mm', 'A4');
$pdf->AddPage();

// ── BANDEAU VERT ──────────────────────────────────────────────
$pdf->SetFillColor(0, 135, 81);
$pdf->Rect(0, 0, 210, 8, 'F');

// ── EN-TETE ───────────────────────────────────────────────────
$drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
$logo = __DIR__ . '/../src/assets/logo_mesrs.png';

if (file_exists($drapeau)) {
    $pdf->Image($drapeau, 15, 10, 25, 18);
}
if (file_exists($logo)) {
    $pdf->Image($logo, 170, 10, 25, 18);
}

$pdf->SetFont('Helvetica', '', 9);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetY(12);
$pdf->Cell(0, 5, 'REPUBLIQUE DU BENIN', 0, 1, 'C');
$pdf->Cell(0, 5, cleanText('Ministere de l\'Enseignement Superieur et de la Recherche Scientifique'), 0, 1, 'C');
$pdf->Cell(0, 5, cleanText('Universite d\'Abomey-Calavi - EPAC'), 0, 1, 'C');

// ── LIGNE TRICOLORE ───────────────────────────────────────────
$pdf->SetFillColor(0, 135, 81);
$pdf->Rect(15, 32, 60, 3, 'F');
$pdf->SetFillColor(252, 209, 22);
$pdf->Rect(75, 32, 60, 3, 'F');
$pdf->SetFillColor(232, 17, 45);
$pdf->Rect(135, 32, 60, 3, 'F');

// ── TITRE ─────────────────────────────────────────────────────
$pdf->SetFillColor(0, 135, 81);
$pdf->Rect(15, 40, 180, 14, 'F');
$pdf->SetFont('Helvetica', 'B', 16);
$pdf->SetTextColor(255, 255, 255);
$pdf->SetY(43);
$pdf->Cell(0, 8, cleanText('FICHE DE PRE-INSCRIPTION'), 0, 1, 'C');

$pdf->SetFillColor(252, 209, 22);
$pdf->Rect(15, 54, 180, 8, 'F');
$pdf->SetFont('Helvetica', '', 10);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetY(56);
$pdf->Cell(0, 5, cleanText('Concours d\'entree a l\'universite - Annee 2025-2026'), 0, 1, 'C');

// ── NUMERO DE DOSSIER ─────────────────────────────────────────
$pdf->SetY(68);
$pdf->SetFillColor(240, 240, 240);
$pdf->Rect(15, 68, 180, 10, 'F');
$pdf->SetFont('Helvetica', 'B', 11);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetY(70);
$pdf->Cell(0, 6, cleanText('N° de dossier : ' . strtoupper(substr($inscription['id'] ?? 'XXXXXXXX', 0, 8))), 0, 1, 'C');

// ── SECTION CANDIDAT ──────────────────────────────────────────
$pdf->SetY(83);
$pdf->SetFillColor(0, 135, 81);
$pdf->Rect(15, 83, 180, 8, 'F');
$pdf->SetFont('Helvetica', 'B', 11);
$pdf->SetTextColor(255, 255, 255);
$pdf->SetY(85);
$pdf->SetX(15);
$pdf->Cell(180, 5, 'INFORMATIONS DU CANDIDAT', 0, 1, 'L');

$infos = [
    ['Matricule',    cleanText($candidat['matricule'] ?? 'N/A')],
    ['Nom et Prenom',cleanText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))],
    ['Email',        $candidat['email'] ?? 'N/A'],
    ['Telephone',    !empty($candidat['telephone']) ? cleanText($candidat['telephone']) : 'Non renseigne'],
];

$y = 95;
foreach ($infos as $i => $info) {
    if ($i % 2 == 0) {
        $pdf->SetFillColor(240, 255, 244);
        $pdf->Rect(15, $y, 180, 8, 'F');
    }
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetTextColor(0, 135, 81);
    $pdf->SetXY(18, $y + 1);
    $pdf->Cell(55, 6, $info[0] . ' :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(120, 6, $info[1], 0, 1, 'L');
    $y += 9;
}

// ── SECTION CONCOURS ──────────────────────────────────────────
$y += 5;
$pdf->SetFillColor(232, 17, 45);
$pdf->Rect(15, $y, 180, 8, 'F');
$pdf->SetFont('Helvetica', 'B', 11);
$pdf->SetTextColor(255, 255, 255);
$pdf->SetXY(15, $y + 1);
$pdf->Cell(180, 6, 'INFORMATIONS DU CONCOURS', 0, 1, 'L');

$dateDebut = !empty($concours['dateDebut']) ? date('d/m/Y', strtotime($concours['dateDebut'])) : 'N/A';
$dateFin   = !empty($concours['dateFin'])   ? date('d/m/Y', strtotime($concours['dateFin']))   : 'N/A';

$infoConcours = [
    ['Concours',    cleanText($concours['libelle']     ?? 'N/A')],
    ['Date debut',  $dateDebut],
    ['Date fin',    $dateFin],
    ['Description', !empty($concours['description']) ? cleanText($concours['description']) : 'Non renseignee'],
];

$y += 10;
foreach ($infoConcours as $i => $info) {
    if ($i % 2 == 0) {
        $pdf->SetFillColor(255, 248, 225);
        $pdf->Rect(15, $y, 180, 8, 'F');
    }
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetTextColor(232, 17, 45);
    $pdf->SetXY(18, $y + 1);
    $pdf->Cell(55, 6, $info[0] . ' :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(120, 6, $info[1], 0, 1, 'L');
    $y += 9;
}

// ── STATUT ────────────────────────────────────────────────────
$y += 10;
$pdf->SetFillColor(252, 209, 22);
$pdf->Rect(15, $y, 180, 20, 'F');
$pdf->SetFillColor(255, 253, 231);
$pdf->Rect(17, $y + 2, 176, 16, 'F');
$pdf->SetFont('Helvetica', 'B', 10);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetXY(20, $y + 4);
$pdf->Cell(0, 5, cleanText('Statut : EN ATTENTE DE TRAITEMENT PAR LA COMMISSION'), 0, 1, 'L');
$pdf->SetFont('Helvetica', '', 9);
$pdf->SetXY(20, $y + 11);
$pdf->Cell(0, 5, cleanText('Vous recevrez un email de notification apres examen de votre dossier.'), 0, 1, 'L');

// ── DATE D'INSCRIPTION ────────────────────────────────────────
$y += 35;
$pdf->SetFont('Helvetica', '', 10);
$pdf->SetTextColor(0, 0, 0);
$pdf->SetY($y);
$pdf->Cell(0, 6, cleanText('Date d\'inscription : ' . date('d/m/Y H:i')), 0, 1, 'R');
$pdf->Cell(0, 6, cleanText('Le Directeur General de l\'Enseignement Superieur'), 0, 1, 'R');

// ── BANDEAU BAS TRICOLORE ─────────────────────────────────────
$pdf->SetFillColor(0, 135, 81);
$pdf->Rect(0, 282, 70, 8, 'F');
$pdf->SetFillColor(252, 209, 22);
$pdf->Rect(70, 282, 70, 8, 'F');
$pdf->SetFillColor(232, 17, 45);
$pdf->Rect(140, 282, 70, 8, 'F');

// ── PIED DE PAGE ──────────────────────────────────────────────
$pdf->SetFont('Helvetica', '', 7);
$pdf->SetTextColor(136, 136, 136);
$pdf->SetY(275);
$pdf->Cell(0, 4, cleanText('Document genere automatiquement par UniPath (PHP) - ' . date('Y-m-d H:i:s')), 0, 1, 'C');

$pdf->Output('F', $outputFile);
?>