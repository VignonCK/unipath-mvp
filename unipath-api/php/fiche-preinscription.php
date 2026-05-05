<?php
require(__DIR__ . '/fpdf.php');

// ── VALIDATION DES ARGUMENTS ──────────────────────────────────
if ($argc < 3) {
    die("Erreur: Usage - php fiche-preinscription.php <input_file> <output_file>\n");
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
$numeroDossier = $data['numeroDossier'] ?? 'N/A';

// Fonction pour convertir les caractères accentués
function cleanText($text) {
    if (!$text) return '';
    return iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
}

// ── CRÉATION DU PDF ───────────────────────────────────────────
try {
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->AddPage();
    
    // Marges
    $leftMargin = 20;
    $rightMargin = 20;
    $pageWidth = 210;
    $contentWidth = $pageWidth - $leftMargin - $rightMargin;

    // ── EN-TETE AVEC LOGOS ────────────────────────────────────
    $drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
    $logo = __DIR__ . '/../src/assets/logo_mesrs.png';

    // Logo gauche (Drapeau)
    if (file_exists($drapeau)) {
        $pdf->Image($drapeau, $leftMargin, 15, 30, 22);
    }
    
    // Logo droit (MESRS)
    if (file_exists($logo)) {
        $pdf->Image($logo, $pageWidth - $rightMargin - 30, 15, 30, 22);
    }

    // ── TITRE CENTRÉ ──────────────────────────────────────────
    $pdf->SetY(20);
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(0, 5, 'REPUBLIQUE DU BENIN', 0, 1, 'C');
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->Cell(0, 4, cleanText('Ministere de l\'Enseignement Superieur'), 0, 1, 'C');
    $pdf->Cell(0, 4, cleanText('et de la Recherche Scientifique'), 0, 1, 'C');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 5, cleanText('Universite d\'Abomey-Calavi'), 0, 1, 'C');
    
    $pdf->Ln(5);
    
    // ── CADRE TITRE DOCUMENT ──────────────────────────────────
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect($leftMargin + 30, $pdf->GetY(), $contentWidth - 60, 12);
    
    $pdf->SetFont('Helvetica', 'B', 14);
    $pdf->Cell(0, 12, 'FICHE DE PRE-INSCRIPTION', 0, 1, 'C');
    
    $pdf->Ln(3);
    
    // ── NUMÉRO DE DOSSIER ─────────────────────────────────────
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->Cell(0, 6, 'N' . cleanText('°') . ' DOSSIER : ' . strtoupper(cleanText($numeroDossier)), 0, 1, 'C');

    
    $pdf->Ln(5);
    
    // ── INFORMATIONS CANDIDAT ─────────────────────────────────
    $y = $pdf->GetY();
    
    // Cadre principal
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.3);
    
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetTextColor(0, 0, 0);
    
    // Nom
    $pdf->SetXY($leftMargin, $y);
    $pdf->Cell(40, 7, 'NOM :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 7, strtoupper(cleanText($candidat['nom'])), 0, 1, 'L');
    
    // Prénom
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetX($leftMargin);
    $pdf->Cell(40, 7, cleanText('PRENOM :'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 7, strtoupper(cleanText($candidat['prenom'])), 0, 1, 'L');
    
    // Date de naissance
    if (isset($candidat['dateNaiss']) && $candidat['dateNaiss']) {
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetX($leftMargin);
        $pdf->Cell(40, 7, cleanText('NE(E) LE :'), 0, 0, 'L');
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(0, 7, date('d/m/Y', strtotime($candidat['dateNaiss'])), 0, 1, 'L');
    }
    
    // Lieu de naissance
    if (isset($candidat['lieuNaiss']) && $candidat['lieuNaiss']) {
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetX($leftMargin);
        $pdf->Cell(40, 7, cleanText('A :'), 0, 0, 'L');
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(0, 7, strtoupper(cleanText($candidat['lieuNaiss'])), 0, 1, 'L');
    }
    
    // Email
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetX($leftMargin);
    $pdf->Cell(40, 7, 'EMAIL :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->Cell(0, 7, $candidat['email'], 0, 1, 'L');
    
    // Téléphone
    if (isset($candidat['telephone']) && $candidat['telephone']) {
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetX($leftMargin);
        $pdf->Cell(40, 7, cleanText('TELEPHONE :'), 0, 0, 'L');
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->Cell(0, 7, cleanText($candidat['telephone']), 0, 1, 'L');
    }
    
    // Matricule
    if (isset($candidat['matricule']) && $candidat['matricule']) {
        $pdf->SetFont('Helvetica', '', 10);
        $pdf->SetX($leftMargin);
        $pdf->Cell(40, 7, 'MATRICULE :', 0, 0, 'L');
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->Cell(0, 7, strtoupper(cleanText($candidat['matricule'])), 0, 1, 'L');
    }
    
    $pdf->Ln(5);
    
    // ── CONCOURS ──────────────────────────────────────────────
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetX($leftMargin);
    $pdf->Cell(0, 7, 'CONCOURS :', 0, 1, 'L');
    
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetX($leftMargin);
    $pdf->MultiCell(0, 6, strtoupper(cleanText($concours['libelle'])), 0, 'L');
    
    $pdf->Ln(2);
    
    // Période
    $dateDebut = date('d/m/Y', strtotime($concours['dateDebut']));
    $dateFin = date('d/m/Y', strtotime($concours['dateFin']));
    
    $pdf->SetFont('Helvetica', '', 10);
    $pdf->SetX($leftMargin);
    $pdf->Cell(60, 6, cleanText('Periode d\'inscription :'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->Cell(0, 6, 'Du ' . $dateDebut . ' au ' . $dateFin, 0, 1, 'L');
    
    $pdf->Ln(5);
    
    // ── STATUT ────────────────────────────────────────────────
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 10);
    
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->Cell(0, 10, 'STATUT : EN ATTENTE DE VALIDATION', 0, 1, 'C');
    
    $pdf->Ln(5);
    
    // ── INFORMATIONS IMPORTANTES ──────────────────────────────
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetX($leftMargin);
    $pdf->Cell(0, 6, 'INFORMATIONS IMPORTANTES :', 0, 1, 'L');
    
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX($leftMargin);
    $pdf->MultiCell(0, 5, cleanText('- Completez votre dossier en deposant toutes les pieces justificatives requises'), 0, 'L');
    $pdf->SetX($leftMargin);
    $pdf->MultiCell(0, 5, cleanText('- La commission examinera votre dossier dans les prochains jours'), 0, 'L');
    $pdf->SetX($leftMargin);
    $pdf->MultiCell(0, 5, cleanText('- Vous recevrez un email de notification concernant la decision'), 0, 'L');
    $pdf->SetX($leftMargin);
    $pdf->MultiCell(0, 5, cleanText('- En cas de validation, une convocation vous sera envoyee par email'), 0, 'L');
    
    $pdf->Ln(10);
    
    // ── SIGNATURE ─────────────────────────────────────────────
    $pdf->SetFont('Helvetica', '', 9);
    $pdf->Cell(0, 5, cleanText('Fait a Abomey-Calavi, le ') . date('d/m/Y'), 0, 1, 'R');
    $pdf->Cell(0, 5, cleanText('Le Service des Inscriptions'), 0, 1, 'R');
    
    // ── PIED DE PAGE ──────────────────────────────────────────
    $pdf->SetY(-20);
    $pdf->SetFont('Helvetica', '', 7);
    $pdf->SetTextColor(128, 128, 128);
    $pdf->Cell(0, 4, cleanText('Document genere automatiquement par UniPath - ') . date('d/m/Y H:i'), 0, 1, 'C');

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
