<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

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

function ensureSpaceConvocation($pdf, $minYNeeded, $leftMargin, $rightMargin, $contentWidth) {
    if ($pdf->GetY() + $minYNeeded > 270) {
        $pdf->AddPage();
        renderOfficialHeader(
            $pdf,
            $leftMargin,
            $rightMargin,
            $contentWidth,
            'Convocation officielle',
            'Concours d\'entree a l\'universite'
        );
    }
}

// Vérifier les champs obligatoires du candidat
$requiredFields = ['matricule', 'nom', 'prenom', 'email'];
foreach ($requiredFields as $field) {
    if (!isset($candidat[$field]) || empty($candidat[$field])) {
        die("Erreur: Le champ 'candidat.$field' est obligatoire.\n");
    }
}

// ── CRÉATION DU PDF ───────────────────────────────────────────
try {
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->SetMargins(20, 15, 20);
    $pdf->SetAutoPageBreak(true, 18);
    $pdf->AddPage();
    
    // Marges
    $leftMargin = 20;
    $rightMargin = 20;
    $pageWidth = 210;
    $contentWidth = $pageWidth - $leftMargin - $rightMargin;

    renderOfficialHeader(
        $pdf,
        $leftMargin,
        $rightMargin,
        $contentWidth,
        'Convocation officielle',
        'Concours d\'entree a l\'universite'
    );

    $numeroConvocation = strtoupper(cleanText($concours['id'] ?? 'N/A')) . '-' . strtoupper(cleanText($candidat['matricule']));
    $pdf->SetFillColor(245, 247, 250);
    $pdf->SetDrawColor(200, 210, 220);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 9, 'FD');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 9, cleanText('Numero convocation : ') . $numeroConvocation, 0, 1, 'L');
    $pdf->Ln(3);

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Identification du candidat', 'blue');
    $photoPath = resolveImagePath($candidat['photoPath'] ?? ($candidat['photo'] ?? ''));
    $rowStartY = $pdf->GetY();

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Nom et prenom :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(cleanText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Matricule :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(cleanText($candidat['matricule'] ?? 'N/A')), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Email :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(95, 6, cleanText($candidat['email'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Telephone :', 0, 0, 'L');
    $pdf->Cell(95, 6, cleanText($candidat['telephone'] ?? 'Non renseigne'), 0, 1, 'L');

    $photoX = $leftMargin + $contentWidth - 35;
    $photoY = $rowStartY + 1;
    if ($photoPath) {
        $pdf->Image($photoPath, $photoX, $photoY, 28, 34);
    } else {
        $pdf->SetXY($photoX, $photoY);
        $pdf->SetDrawColor(120, 120, 120);
        $pdf->Rect($photoX, $photoY, 28, 34);
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->SetXY($photoX, $photoY + 14);
        $pdf->Cell(28, 6, 'PHOTO', 0, 0, 'C');
    }

    $pdf->Ln(3);
    ensureSpaceConvocation($pdf, 55, $leftMargin, $rightMargin, $contentWidth);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Details du concours', 'blue');
    $dateDebut = !empty($concours['dateDebut']) ? date('d/m/Y', strtotime($concours['dateDebut'])) : 'N/A';
    $dateFin = !empty($concours['dateFin']) ? date('d/m/Y', strtotime($concours['dateFin'])) : 'N/A';
    $dateComposition = !empty($concours['dateComposition']) ? date('d/m/Y', strtotime($concours['dateComposition'])) : 'A definir';
    $heureComposition = !empty($concours['heureComposition']) ? cleanText($concours['heureComposition']) : 'A definir';
    $lieuComposition = !empty($concours['lieuComposition']) ? cleanText($concours['lieuComposition']) : 'Centre de composition a confirmer';

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->MultiCell($contentWidth - 4, 6, strtoupper(cleanText($concours['libelle'] ?? 'Concours non renseigne')), 0, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, 6, 'Periode officielle :', 0, 0, 'L');
    $pdf->Cell(0, 6, cleanText('Du ') . $dateDebut . cleanText(' au ') . $dateFin, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, 6, 'Date de composition :', 0, 0, 'L');
    $pdf->Cell(0, 6, $dateComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, 6, 'Heure de convocation :', 0, 0, 'L');
    $pdf->Cell(0, 6, $heureComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, 6, 'Centre / Salle :', 0, 0, 'L');
    $pdf->MultiCell($contentWidth - 54, 6, strtoupper($lieuComposition), 0, 'L');

    $pdf->Ln(2);
    ensureSpaceConvocation($pdf, 28, $leftMargin, $rightMargin, $contentWidth);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Matieres / epreuves', 'green');
    $matieres = [];
    if (isset($concours['matieres']) && is_array($concours['matieres'])) {
        $matieres = $concours['matieres'];
    }
    if (empty($matieres)) {
        $matieres = ['Culture generale', 'Discipline principale du concours'];
    }

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetFillColor(239, 239, 239);
    $pdf->SetX($leftMargin);
    $pdf->Cell(12, 7, 'N', 1, 0, 'C', true);
    $pdf->Cell($contentWidth - 12, 7, cleanText('Epreuve'), 1, 1, 'L', true);
    $pdf->SetFont('Helvetica', '', 12);
    foreach ($matieres as $idx => $matiere) {
        if ($pdf->GetY() + 8 > 270) {
            $pdf->AddPage();
            renderOfficialHeader(
                $pdf,
                $leftMargin,
                $rightMargin,
                $contentWidth,
                'Convocation officielle',
                'Concours d\'entree a l\'universite'
            );
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Matieres / epreuves', 'green');
            $pdf->SetFont('Helvetica', 'B', 12);
            $pdf->SetFillColor(239, 239, 239);
            $pdf->SetX($leftMargin);
            $pdf->Cell(12, 7, 'N', 1, 0, 'C', true);
            $pdf->Cell($contentWidth - 12, 7, cleanText('Epreuve'), 1, 1, 'L', true);
            $pdf->SetFont('Helvetica', '', 12);
        }
        $pdf->SetX($leftMargin);
        $pdf->Cell(12, 7, strval($idx + 1), 1, 0, 'C');
        $pdf->Cell($contentWidth - 12, 7, cleanText($matiere), 1, 1, 'L');
    }

    $pdf->Ln(2);
    ensureSpaceConvocation($pdf, 42, $leftMargin, $rightMargin, $contentWidth);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Consignes obligatoires', 'red');
    $consignes = [
        'Se presenter au moins 60 minutes avant le debut de la premiere epreuve.',
        'Apporter cette convocation imprimee et une piece d identite valide.',
        'Utiliser uniquement le materiel autorise par le jury.',
        'Les telephones et appareils connectes sont strictement interdits en salle.',
        'Tout retard majeur ou fraude entraine l annulation de la participation.',
    ];
    $pdf->SetFont('Helvetica', '', 12);
    foreach ($consignes as $consigne) {
        if ($pdf->GetY() + 8 > 270) {
            $pdf->AddPage();
            renderOfficialHeader(
                $pdf,
                $leftMargin,
                $rightMargin,
                $contentWidth,
                'Convocation officielle',
                'Concours d\'entree a l\'universite'
            );
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Consignes obligatoires', 'red');
            $pdf->SetFont('Helvetica', '', 12);
        }
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 5, cleanText('- ') . cleanText($consigne), 0, 'L');
    }

    ensureSpaceConvocation($pdf, 20, $leftMargin, $rightMargin, $contentWidth);
    renderSignatureBlock($pdf, 'Le Directeur General de l Enseignement Superieur');
    
    // ── PIED DE PAGE ──────────────────────────────────────────
    renderDocumentFooter($pdf);

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