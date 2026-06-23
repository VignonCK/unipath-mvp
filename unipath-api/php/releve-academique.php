<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

if ($argc < 3) {
    die("Erreur: Usage - php releve-academique.php <input_file> <output_file>\n");
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

if (!isset($data['candidat']) || !isset($data['releve'])) {
    die("Erreur: Les clés 'candidat' et 'releve' sont obligatoires.\n");
}

$candidat = $data['candidat'];
$releve = $data['releve'];
$moyenneGlobale = $data['moyenneGlobale'] ?? null;
$decisionJury = $data['decisionJury'] ?? 'En cours de deliberation';
$etablissement = $data['etablissement'] ?? [];

function renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement) {
    $pageWidth = 210;
    $drapeau = __DIR__ . '/../src/assets/drapeau_du_benin.png';
    $logoPath = $etablissement['logoPath'] ?? '';
    $logoAbsolute = '';

    if ($logoPath) {
        if (preg_match('/^[A-Za-z]:\\\\|^\//', $logoPath)) {
            $logoAbsolute = $logoPath;
        } else {
            $logoAbsolute = __DIR__ . '/../' . ltrim($logoPath, '/\\');
        }
    }

    if (file_exists($drapeau)) {
        $pdf->Image($drapeau, $leftMargin, 15, 30, 22);
    }

    if ($logoAbsolute && file_exists($logoAbsolute)) {
        $pdf->Image($logoAbsolute, $pageWidth - $rightMargin - 30, 15, 30, 22);
    } else {
        $pdf->SetXY($pageWidth - $rightMargin - 30, 15);
        $pdf->SetFont('Helvetica', 'B', 12);
        $pdf->Cell(30, 22, 'LOGO ETAB', 1, 0, 'C');
    }

    $pdf->SetY(20);
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetTextColor(0, 0, 0);
    $pdf->Cell(0, 5, strtoupper(cleanText($etablissement['nom'] ?? 'Etablissement')), 0, 1, 'C');
    $pdf->SetFont('Helvetica', '', 12);
    if (!empty($etablissement['adresse'])) {
        $pdf->Cell(0, 4, cleanText($etablissement['adresse']), 0, 1, 'C');
    }
    if (!empty($etablissement['ville']) || !empty($etablissement['email'])) {
        $ville = $etablissement['ville'] ?? '';
        $email = $etablissement['email'] ?? '';
        $sep = ($ville && $email) ? ' | ' : '';
        $pdf->Cell(0, 4, cleanText($ville . $sep . $email), 0, 1, 'C');
    }

    $pdf->Ln(5);
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.5);
    $pdf->Rect($leftMargin + 30, $pdf->GetY(), $contentWidth - 60, 12);
    $pdf->SetFont('Helvetica', 'B', 14);
    $pdf->Cell(0, 12, 'RELEVE ACADEMIQUE', 0, 1, 'C');
    $pdf->Ln(3);
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 6, cleanText('Bulletin officiel du parcours universitaire'), 0, 1, 'C');
    $pdf->Ln(3);
}

function calculerMention($moyenne) {
    if (!is_numeric($moyenne)) return 'Non classe';
    if ($moyenne >= 16) return 'Tres bien';
    if ($moyenne >= 14) return 'Bien';
    if ($moyenne >= 12) return 'Assez bien';
    if ($moyenne >= 10) return 'Passable';
    return 'Insuffisant';
}

function renderNotesTableHeader($pdf, $leftMargin) {
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetFillColor(235, 235, 235);
    $pdf->SetX($leftMargin);
    $pdf->Cell(52, 7, 'Matiere', 1, 0, 'L', true);
    $pdf->Cell(20, 7, 'CC', 1, 0, 'C', true);
    $pdf->Cell(20, 7, 'Examen', 1, 0, 'C', true);
    $pdf->Cell(24, 7, 'Moyenne', 1, 0, 'C', true);
    $pdf->Cell(20, 7, 'Credits', 1, 0, 'C', true);
    $pdf->Cell(18, 7, 'Sem', 1, 1, 'C', true);
    $pdf->SetFont('Helvetica', '', 12);
}

function renderRecapTableHeader($pdf, $leftMargin) {
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetFillColor(235, 235, 235);
    $pdf->SetX($leftMargin);
    $pdf->Cell(45, 7, 'Annee', 1, 0, 'C', true);
    $pdf->Cell(55, 7, 'Filiere', 1, 0, 'C', true);
    $pdf->Cell(22, 7, 'Niveau', 1, 0, 'C', true);
    $pdf->Cell(22, 7, 'Credits', 1, 0, 'C', true);
    $pdf->Cell(26, 7, 'Moyenne', 1, 1, 'C', true);
    $pdf->SetFont('Helvetica', '', 12);
}

try {
    $pdf = new FPDF('P', 'mm', 'A4');
    $pdf->SetMargins(20, 15, 20);
    $pdf->SetAutoPageBreak(true, 18);
    $pdf->AddPage();

    $leftMargin = 20;
    $rightMargin = 20;
    $pageWidth = 210;
    $contentWidth = $pageWidth - $leftMargin - $rightMargin;

    renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement);

    $etabNom = $releve[0]['etablissement'] ?? 'Etablissement non renseigne';
    $photoPath = resolveImagePath($candidat['photoPath'] ?? ($candidat['photo'] ?? ''));

    $pdf->SetFillColor(245, 248, 252);
    $pdf->SetDrawColor(195, 205, 220);
    $cardY = $pdf->GetY();
    $cardHeight = 37;
    $pdf->Rect($leftMargin, $cardY, $contentWidth, $cardHeight, 'FD');

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(44, 6, 'ETABLISSEMENT :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 6, cleanText($etabNom), 0, 1, 'L');

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(44, 6, 'NOM ET PRENOM :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 6, strtoupper(cleanText(($candidat['prenom'] ?? '') . ' ' . ($candidat['nom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(44, 6, 'MATRICULE :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 6, strtoupper(cleanText($candidat['matricule'] ?? 'N/A')), 0, 1, 'L');

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(44, 6, 'DATE / LIEU NAISS. :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $dateNaiss = !empty($candidat['dateNaiss']) ? date('d/m/Y', strtotime($candidat['dateNaiss'])) : 'N/A';
    $pdf->Cell(0, 6, $dateNaiss . ' / ' . cleanText($candidat['lieuNaiss'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(44, 6, 'NATIONALITE :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(0, 6, cleanText($candidat['nationalite'] ?? 'N/A'), 0, 1, 'L');

    $photoX = $leftMargin + $contentWidth - 30;
    $photoY = $cardY + 2;
    if ($photoPath) {
        $pdf->Image($photoPath, $photoX, $photoY, 24, 30);
    } else {
        $pdf->Rect($photoX, $photoY, 24, 30);
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->SetXY($photoX, $photoY + 10);
        $pdf->Cell(24, 6, 'PHOTO', 0, 0, 'C');
    }

    $pdf->SetY($cardY + $cardHeight + 3);
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin);
    $pdf->Cell(45, 6, 'MOYENNE GENERALE :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(40, 6, is_numeric($moyenneGlobale) ? number_format($moyenneGlobale, 2, ',', ' ') . '/20' : 'Non disponible', 0, 0, 'L');
    $pdf->SetFont('Helvetica', '', 12);
    $pdf->Cell(22, 6, 'Mention :', 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(0, 6, cleanText(calculerMention($moyenneGlobale)), 0, 1, 'L');

    $pdf->Ln(2);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Detail des resultats', 'blue');

    renderNotesTableHeader($pdf, $leftMargin);
    foreach ($releve as $ligne) {
        $notes = $ligne['notes'] ?? [];
        if (empty($notes)) {
            if ($pdf->GetY() > 265) {
                $pdf->AddPage();
                renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement);
                renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Detail des resultats (suite)', 'blue');
                renderNotesTableHeader($pdf, $leftMargin);
            }
            $pdf->SetX($leftMargin);
            $pdf->Cell(154, 6, cleanText($ligne['filiere'] . ' - ' . $ligne['anneeAcademique'] . ' (Aucune note)'), 1, 1, 'L');
            continue;
        }

        foreach ($notes as $note) {
            if ($pdf->GetY() > 265) {
                $pdf->AddPage();
                renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement);
                renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Detail des resultats (suite)', 'blue');
                renderNotesTableHeader($pdf, $leftMargin);
            }

            $pdf->SetX($leftMargin);
            $pdf->Cell(52, 6, cleanText($note['matiere'] ?? ''), 1, 0, 'L');
            $pdf->Cell(20, 6, isset($note['noteCC']) ? number_format($note['noteCC'], 2, ',', ' ') : '-', 1, 0, 'C');
            $pdf->Cell(20, 6, isset($note['noteExamen']) ? number_format($note['noteExamen'], 2, ',', ' ') : '-', 1, 0, 'C');
            $pdf->Cell(24, 6, isset($note['noteMoyenne']) ? number_format($note['noteMoyenne'], 2, ',', ' ') : '-', 1, 0, 'C');
            $pdf->Cell(20, 6, isset($note['credits']) ? $note['credits'] : '-', 1, 0, 'C');
            $pdf->Cell(18, 6, isset($note['semestre']) ? $note['semestre'] : '-', 1, 1, 'C');
        }
    }

    $pdf->Ln(4);
    if ($pdf->GetY() + 45 > 270) {
        $pdf->AddPage();
        renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement);
    }

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Recapitulatif par annee', 'green');
    renderRecapTableHeader($pdf, $leftMargin);
    foreach ($releve as $ligne) {
        if ($pdf->GetY() + 8 > 270) {
            $pdf->AddPage();
            renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement);
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Recapitulatif par annee (suite)', 'green');
            renderRecapTableHeader($pdf, $leftMargin);
        }
        $pdf->SetX($leftMargin);
        $pdf->Cell(45, 6, cleanText($ligne['anneeAcademique'] ?? '-'), 1, 0, 'L');
        $pdf->Cell(55, 6, cleanText($ligne['filiere'] ?? '-'), 1, 0, 'L');
        $pdf->Cell(22, 6, isset($ligne['niveau']) ? $ligne['niveau'] : '-', 1, 0, 'C');
        $pdf->Cell(22, 6, isset($ligne['totalCredits']) ? $ligne['totalCredits'] : '-', 1, 0, 'C');
        $pdf->Cell(26, 6, isset($ligne['moyenneGenerale']) ? number_format($ligne['moyenneGenerale'], 2, ',', ' ') : '-', 1, 1, 'C');
    }

    $pdf->Ln(3);
    if ($pdf->GetY() + 30 > 270) {
        $pdf->AddPage();
        renderEtablissementHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $etablissement);
    }
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Decision du jury', 'red');
    $pdf->SetDrawColor(0, 0, 0);
    $pdf->SetLineWidth(0.4);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 10);
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(0, 10, cleanText('DECISION DU JURY : ' . $decisionJury), 0, 1, 'C');

    renderSignatureBlock($pdf, 'Le President du Jury');
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
