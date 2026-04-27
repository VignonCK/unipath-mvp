<?php
require(__DIR__ . '/fpdf.php');

// ── VALIDATION DES ARGUMENTS ──────────────────────────────────
if ($argc < 3) {
    die("Erreur: Usage - php convocation.php <input_file> <output_file>\n");
}

$inputFile = $argv[1];
$outputFile = $argv[2];

// ── VALIDATION DU FICHIER D'ENTRÉE ───────────────────────────
if (!file_exists($inputFile)) {
    die("Erreur: Le fichier d'entrée '$inputFile' n'existe pas.\n");
}

// ── LECTURE ET VALIDATION DU JSON ─────────────────────────────
$input = file_get_contents($inputFile);
if ($input === false) {
    die("Erreur: Impossible de lire le fichier '$inputFile'.\n");
}

$data = json_decode($input, true);
if ($data === null) {
    die("Erreur: Le fichier JSON n'est pas valide.\n");
}

// ── VALIDATION DES CLÉS REQUISES ─────────────────────────────
if (!isset($data['candidat']) || !isset($data['concours'])) {
    die("Erreur: Les clés 'candidat' et 'concours' sont obligatoires.\n");
}

$candidat = $data['candidat'];
$concours = $data['concours'];

// Vérifier les champs obligatoires du candidat
$requiredFields = ['matricule', 'nom', 'prenom', 'email'];
foreach ($requiredFields as $field) {
    if (!isset($candidat[$field]) || empty($candidat[$field])) {
        die("Erreur: Le champ 'candidat.$field' est obligatoire.\n");
    }
}

// Fonction pour convertir les caractères accentués
function cleanText($text) {
    if (!$text) return '';
    $search = ['é','è','ê','ë','à','â','ä','î','ï','ô','ö','ù','û','ü','ç','É','È','Ê','À','Â','Î','Ô','Ù','Û','Ç','œ','æ','Œ','Æ'];
    $replace = ['e','e','e','e','a','a','a','i','i','o','o','u','u','u','c','E','E','E','A','A','I','O','U','U','C','oe','ae','OE','AE'];
    return str_replace($search, $replace, $text);
}

// ── CRÉATION DU PDF ───────────────────────────────────────────
try {
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->AddPage();

    // ── BANDEAU VERT ──────────────────────────────────────────
    $pdf->SetFillColor(0, 135, 81);
    $pdf->Rect(0, 0, 210, 8, 'F');

    // ── EN-TETE ───────────────────────────────────────────────
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetY(12);
    $pdf->Cell(0, 5, 'REPUBLIQUE DU BENIN', 0, 1, 'C');
    $pdf->Cell(0, 5, cleanText('Ministere de l\'Enseignement Superieur et de la Recherche Scientifique'), 0, 1, 'C');
    $pdf->Cell(0, 5, cleanText('Universite d\'Abomey-Calavi - EPAC'), 0, 1, 'C');

    // ── IMAGES EN-TETE ────────────────────────────────────────
    $drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
    $logo = __DIR__ . '/../src/assets/logo_mesrs.png';

    if (file_exists($drapeau)) {
        $pdf->Image($drapeau, 15, 10, 25, 18);
    }
    if (file_exists($logo)) {
        $pdf->Image($logo, 170, 10, 25, 18);
    }

    // ── LIGNE TRICOLORE ───────────────────────────────────────
    $pdf->SetFillColor(0, 135, 81);
    $pdf->Rect(15, 32, 60, 3, 'F');
    $pdf->SetFillColor(252, 209, 22);
    $pdf->Rect(75, 32, 60, 3, 'F');
    $pdf->SetFillColor(232, 17, 45);
    $pdf->Rect(135, 32, 60, 3, 'F');

    // ── TITRE ─────────────────────────────────────────────────
    $pdf->SetFillColor(0, 135, 81);
    $pdf->Rect(15, 40, 180, 14, 'F');
    $pdf->SetFont('Helvetica', 'B', 18);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetY(43);
    $pdf->Cell(0, 8, 'CONVOCATION', 0, 1, 'C');

    $pdf->SetFillColor(252, 209, 22);
    $pdf->Rect(15, 54, 180, 8, 'F');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetY(56);
    $pdf->Cell(0, 5, cleanText('Concours d\'entree a l\'universite - Annee 2025-2026'), 0, 1, 'C');

    // ── SECTION CANDIDAT ──────────────────────────────────────
    $pdf->SetFillColor(0, 135, 81);
    $pdf->Rect(15, 68, 180, 8, 'F');
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetY(70);
    $pdf->SetX(15);
    $pdf->Cell(180, 5, 'INFORMATIONS DU CANDIDAT', 0, 1, 'L');

    $infos = [
        ['Matricule', cleanText($candidat['matricule'])],
        ['Nom et Prenom', cleanText($candidat['nom'] . ' ' . $candidat['prenom'])],
        ['Email', $candidat['email']],
        ['Telephone', isset($candidat['telephone']) && $candidat['telephone'] ? cleanText($candidat['telephone']) : 'Non renseigne'],
    ];

    $y = 80;
    foreach ($infos as $i => $info) {
        if ($i % 2 == 0) {
            $pdf->SetFillColor(240, 255, 244);
            $pdf->Rect(15, $y, 180, 8, 'F');
        }
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetTextColor(0, 135, 81);
        $pdf->SetXY(18, $y + 1);
        $pdf->Cell(55, 6, cleanText($info[0] . ' :'), 0, 0, 'L');
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(120, 6, cleanText($info[1]), 0, 1, 'L');
        $y += 9;
    }
    // ── SECTION CONCOURS ──────────────────────────────────────
    $y += 5;
    $pdf->SetFillColor(232, 17, 45);
    $pdf->Rect(15, $y, 180, 8, 'F');
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetTextColor(255, 255, 255);
    $pdf->SetXY(15, $y + 1);
    $pdf->Cell(180, 6, 'INFORMATIONS DU CONCOURS', 0, 1, 'L');

    $dateDebut = date('d/m/Y', strtotime($concours['dateDebut']));
    $dateFin = date('d/m/Y', strtotime($concours['dateFin']));

    $infoConcours = [
        ['Concours', cleanText($concours['libelle'])],
        ['Date debut', $dateDebut],
        ['Date fin', $dateFin],
        ['Description', isset($concours['description']) && $concours['description'] ? cleanText($concours['description']) : 'Non renseignee'],
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
        $pdf->Cell(55, 6, cleanText($info[0] . ' :'), 0, 0, 'L');
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetTextColor(0, 0, 0);
        $pdf->Cell(120, 6, cleanText($info[1]), 0, 1, 'L');
        $y += 9;
    }

    // ── AVERTISSEMENT ─────────────────────────────────────────
    $y += 10;
    $pdf->SetFillColor(252, 209, 22);
    $pdf->Rect(15, $y, 180, 20, 'F');
    $pdf->SetFillColor(255, 253, 231);
    $pdf->Rect(17, $y + 2, 176, 16, 'F');
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->SetTextColor(232, 17, 45);
    $pdf->SetXY(20, $y + 3);
    $pdf->Cell(0, 5, 'IMPORTANT :', 0, 1, 'L');
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetXY(20, $y + 9);
    $pdf->MultiCell(170, 4, 'Le candidat est prie de se presenter muni de cette convocation et d\'une piece d\'identite valide. Tout retard ou absence non justifiee entraine l\'annulation de l\'inscription.', 0, 'L');

    // ── SIGNATURE ─────────────────────────────────────────────
    $y += 40;
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->SetY($y);
    $pdf->Cell(0, 6, 'Fait a Abomey-Calavi, le ' . date('d/m/Y'), 0, 1, 'R');
    $pdf->Cell(0, 6, 'Le Directeur General de l\'Enseignement Superieur', 0, 1, 'R');

    // ── BANDEAU BAS TRICOLORE ─────────────────────────────────
    $pdf->SetFillColor(0, 135, 81);
    $pdf->Rect(0, 282, 70, 8, 'F');
    $pdf->SetFillColor(252, 209, 22);
    $pdf->Rect(70, 282, 70, 8, 'F');
    $pdf->SetFillColor(232, 17, 45);
    $pdf->Rect(140, 282, 70, 8, 'F');

    // ── PIED DE PAGE ──────────────────────────────────────────
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetTextColor(136, 136, 136);
    $pdf->SetY(275);
    $pdf->Cell(0, 4, 'Document genere automatiquement par UniPath (PHP) - ' . date('Y-m-d H:i:s'), 0, 1, 'C');

    // ── SAUVEGARDE DU PDF ─────────────────────────────────────
    $pdf->Output('F', $outputFile);
    
    if (!file_exists($outputFile)) {
        die("Erreur: Le PDF n'a pas été créé correctement.\n");
    }
    
    echo "Succès: PDF créé avec succès: $outputFile\n";

} catch (Exception $e) {
    die("Erreur lors de la création du PDF: " . $e->getMessage() . "\n");
}
?>