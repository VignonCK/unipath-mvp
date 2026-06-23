<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

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
$inscription = $data['inscription'] ?? [];

function ensureSpacePreinscription($pdf, $minYNeeded, $leftMargin, $rightMargin, $contentWidth) {
    if ($pdf->GetY() + $minYNeeded > 270) {
        $pdf->AddPage();
        renderOfficialHeader(
            $pdf,
            $leftMargin,
            $rightMargin,
            $contentWidth,
            'Fiche de pre-inscription',
            'Plateforme nationale UniPath'
        );
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
        'Fiche de pre-inscription',
        'Plateforme nationale UniPath'
    );

    $numeroDossierFinal = strtoupper(cleanText($numeroDossier ?: ($inscription['numeroInscription'] ?? 'N/A')));
    $pdf->SetFillColor(245, 247, 251);
    $pdf->SetDrawColor(200, 210, 220);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 9, 'FD');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 9, cleanText('Numero de dossier : ') . $numeroDossierFinal, 0, 1, 'L');
    $pdf->Ln(3);

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Informations du candidat', 'blue');
    $photoPath = resolveImagePath($candidat['photoPath'] ?? ($candidat['photo'] ?? ''));
    $photoX = $leftMargin + $contentWidth - 35;
    $photoY = $pdf->GetY() + 1;

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Nom et prenom :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(cleanText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Matricule :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(cleanText($candidat['matricule'] ?? 'EN ATTENTE')), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Date / lieu naiss. :', 0, 0, 'L');
    $dateNaiss = !empty($candidat['dateNaiss']) ? date('d/m/Y', strtotime($candidat['dateNaiss'])) : 'N/A';
    $lieuNaiss = cleanText($candidat['lieuNaiss'] ?? 'N/A');
    $pdf->Cell(95, 6, $dateNaiss . ' / ' . $lieuNaiss, 0, 1, 'L');

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Email :', 0, 0, 'L');
    $pdf->Cell(95, 6, cleanText($candidat['email'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, 'Telephone :', 0, 0, 'L');
    $pdf->Cell(95, 6, cleanText($candidat['telephone'] ?? 'Non renseigne'), 0, 1, 'L');

    if ($photoPath) {
        $pdf->Image($photoPath, $photoX, $photoY, 28, 34);
    } else {
        $pdf->SetXY($photoX, $photoY);
        $pdf->Rect($photoX, $photoY, 28, 34);
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->SetXY($photoX, $photoY + 14);
        $pdf->Cell(28, 6, 'PHOTO', 0, 0, 'C');
    }

    $pdf->Ln(3);
    ensureSpacePreinscription($pdf, 40, $leftMargin, $rightMargin, $contentWidth);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Informations du concours', 'green');
    $dateDebut = !empty($concours['dateDebut']) ? date('d/m/Y', strtotime($concours['dateDebut'])) : 'N/A';
    $dateFin = !empty($concours['dateFin']) ? date('d/m/Y', strtotime($concours['dateFin'])) : 'N/A';

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->MultiCell($contentWidth - 4, 6, strtoupper(cleanText($concours['libelle'] ?? 'Concours non renseigne')), 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, 'Periode d inscription :', 0, 0, 'L');
    $pdf->Cell(0, 6, cleanText('Du ') . $dateDebut . cleanText(' au ') . $dateFin, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, 'Lieu de composition :', 0, 0, 'L');
    $pdf->Cell(0, 6, cleanText($concours['lieuComposition'] ?? 'A communiquer'), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, 'Date de composition :', 0, 0, 'L');
    $pdf->Cell(0, 6, !empty($concours['dateComposition']) ? date('d/m/Y', strtotime($concours['dateComposition'])) : 'A definir', 0, 1, 'L');

    $pdf->Ln(2);
    ensureSpacePreinscription($pdf, 35, $leftMargin, $rightMargin, $contentWidth);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Etat du dossier', 'blue');
    $statut = cleanText($inscription['dossierInscription']['statut'] ?? 'EN_ATTENTE');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(52, 7, 'Statut actuel :', 0, 0, 'L');
    $pdf->Cell(0, 7, strtoupper($statut), 0, 1, 'L');

    $piecesChecklist = [
        'Acte de naissance',
        'Carte d identite',
        'Photo d identite',
        'Releve de notes',
        'Quittance / preuve de paiement',
    ];
    $pdf->SetFont('Helvetica', '', 12);
    foreach ($piecesChecklist as $piece) {
        if ($pdf->GetY() + 7 > 270) {
            $pdf->AddPage();
            renderOfficialHeader(
                $pdf,
                $leftMargin,
                $rightMargin,
                $contentWidth,
                'Fiche de pre-inscription',
                'Plateforme nationale UniPath'
            );
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Etat du dossier', 'blue');
            $pdf->SetFont('Helvetica', '', 12);
        }
        $pdf->SetX($leftMargin + 4);
        $pdf->Cell(4, 5, chr(149), 0, 0, 'C');
        $pdf->Cell($contentWidth - 8, 5, cleanText($piece), 0, 1, 'L');
    }

    $pdf->Ln(2);
    ensureSpacePreinscription($pdf, 32, $leftMargin, $rightMargin, $contentWidth);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Mentions importantes', 'red');
    $mentions = [
        'Completer votre dossier dans les delais fixes par l administration.',
        'Verifier regulierement votre espace UniPath pour suivre la decision de la commission.',
        'En cas de validation, votre convocation officielle sera generee automatiquement.',
    ];
    $pdf->SetFont('Helvetica', '', 12);
    foreach ($mentions as $mention) {
        if ($pdf->GetY() + 8 > 270) {
            $pdf->AddPage();
            renderOfficialHeader(
                $pdf,
                $leftMargin,
                $rightMargin,
                $contentWidth,
                'Fiche de pre-inscription',
                'Plateforme nationale UniPath'
            );
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Mentions importantes', 'red');
            $pdf->SetFont('Helvetica', '', 12);
        }
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 5, cleanText('- ') . cleanText($mention), 0, 'L');
    }

    ensureSpacePreinscription($pdf, 20, $leftMargin, $rightMargin, $contentWidth);
    renderSignatureBlock($pdf, 'Le Service des Inscriptions');
    
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
