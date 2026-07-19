<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

if ($argc < 3) {
    die("Erreur: Usage - php fiche-inscription-etablissement.php <input_file> <output_file>\n");
}

$inputFile = $argv[1];
$outputFile = $argv[2];

if (!file_exists($inputFile)) {
    die("Erreur: Le fichier d'entree '$inputFile' n'existe pas.\n");
}

$input = file_get_contents($inputFile);
if ($input === false) {
    die("Erreur: Impossible de lire le fichier '$inputFile'.\n");
}

$data = json_decode($input, true);
if ($data === null) {
    die("Erreur: Le fichier JSON n'est pas valide.\n");
}

if (!isset($data['candidat']) || !isset($data['inscription'])) {
    die("Erreur: Les cles 'candidat' et 'inscription' sont obligatoires.\n");
}

$candidat = $data['candidat'];
$pre = $data['inscription'];
$photoBase64 = $data['photoBase64'] ?? null;
$photoMime = $data['photoMime'] ?? null;
$photoStoragePath = $data['photoStoragePath'] ?? ($candidat['photoPath'] ?? null);

try {
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->SetMargins(20, 15, 20);
    $pdf->SetAutoPageBreak(true, 18);
    $pdf->AddPage();

    $leftMargin = 20;
    $rightMargin = 20;
    $contentWidth = 170;
    $photoW = 28;
    $photoH = 34;
    $textWidth = $contentWidth - $photoW - 6;

    renderOfficialHeader(
        $pdf,
        $leftMargin,
        $rightMargin,
        $contentWidth,
        'Fiche d inscription etablissement',
        'Inscription academique validee'
    );

    $numero = strtoupper(cleanText($pre['numeroInscription'] ?? $pre['numeroPreinscription'] ?? 'N/A'));
    $pdf->SetFillColor(245, 247, 251);
    $pdf->SetDrawColor(200, 210, 220);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 10, 'FD');
    $pdf->SetFont('Times', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 10, cleanText('Numero d inscription : ') . $numero, 0, 1, 'L');
    $pdf->Ln(3);

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Informations etudiant', 'blue');

    $sectionStartY = $pdf->GetY();
    $photoX = $leftMargin + $contentWidth - $photoW;
    $photoY = $sectionStartY + 1;

    $pdf->SetFont('Times', '', 12);
    $pdf->SetXY($leftMargin + 2, $sectionStartY + 1);
    $pdf->Cell(58, 8, 'Nom et prenom :', 0, 0, 'L');
    $pdf->Cell($textWidth - 58, 8, strtoupper(cleanText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Matricule :', 0, 0, 'L');
    $pdf->Cell($textWidth - 58, 8, strtoupper(cleanText($candidat['matricule'] ?? 'N/A')), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Email :', 0, 0, 'L');
    $pdf->Cell($textWidth - 58, 8, cleanText($candidat['email'] ?? 'N/A'), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Telephone :', 0, 0, 'L');
    $pdf->Cell($textWidth - 58, 8, cleanText($candidat['telephone'] ?? 'Non renseigne'), 0, 1, 'L');

    $textEndY = $pdf->GetY();
    renderIdentityPhotoZone(
        $pdf,
        $photoBase64,
        $photoMime,
        $photoX,
        $photoY,
        $photoW,
        $photoH,
        $photoStoragePath,
        'Photo'
    );
    $pdf->SetY(max($textEndY, $photoY + $photoH) + 4);

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Informations d inscription', 'green');
    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Etablissement :', 0, 0, 'L');
    $pdf->Cell(0, 8, cleanText($pre['etablissementNom'] ?? 'N/A'), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Filiere :', 0, 0, 'L');
    $pdf->Cell(0, 8, cleanText($pre['filiereNom'] ?? 'N/A'), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Annee academique :', 0, 0, 'L');
    $pdf->Cell(0, 8, cleanText($pre['anneeAcademique'] ?? 'N/A'), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Niveau :', 0, 0, 'L');
    $pdf->Cell(0, 8, cleanText(strval($pre['niveau'] ?? 'N/A')), 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 8, 'Statut :', 0, 0, 'L');
    $pdf->Cell(0, 8, cleanText($pre['statut'] ?? 'EN_COURS'), 0, 1, 'L');

    $pdf->Ln(2);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Mentions importantes', 'red');
    $pdf->SetFont('Times', '', 12);
    $mentions = [
        'Ce document atteste votre inscription academique aupres de l etablissement.',
        'Conservez-le precieusement ; il peut vous etre demande lors des inscriptions administratives.',
        'Toute modification de statut vous sera notifiee par email.',
    ];
    foreach ($mentions as $m) {
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 7, cleanText('- ') . cleanText($m), 0, 'L');
    }

    renderSignatureBlock($pdf, 'Le Service de la Scolarite');
    renderDocumentFooter($pdf);

    $pdf->Output('F', $outputFile);

    if (!file_exists($outputFile)) {
        die("Erreur: Le PDF n'a pas ete cree correctement.\n");
    }

    echo "Succes: PDF cree avec succes: $outputFile\n";
} catch (Exception $e) {
    die("Erreur lors de la creation du PDF: " . $e->getMessage() . "\n");
}
?>
