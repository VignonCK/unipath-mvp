<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

/**
 * Conversion UTF-8 → ISO-8859-1 pour FPDF standard (accents français).
 */
function convocationText($text) {
    if ($text === null || $text === '') {
        return '';
    }
    $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', (string) $text);
    return $converted !== false ? $converted : (string) $text;
}

function ensureSpaceConvocation($pdf, $minYNeeded, $leftMargin, $rightMargin, $contentWidth, $subtitle) {
    if ($pdf->GetY() + $minYNeeded > 270) {
        $pdf->AddPage();
        renderOfficialHeader(
            $pdf,
            $leftMargin,
            $rightMargin,
            $contentWidth,
            'Convocation officielle',
            $subtitle
        );
    }
}

// ── VALIDATION DES ARGUMENTS ──────────────────────────────────
if ($argc < 3) {
    die("Erreur: Usage - php convocation.php <input_file> <output_file>\n");
}

$inputFile = $argv[1];
$outputFile = $argv[2];

if (!file_exists($inputFile)) {
    die("Erreur: Le fichier d'entrée '$inputFile' n'existe pas.\n");
}

$input = file_get_contents($inputFile);
if ($input === false) {
    die("Erreur: Impossible de lire le fichier '$inputFile'.\n");
}

$data = json_decode($input, true);
if ($data === null) {
    die("Erreur: Le fichier JSON n'est pas valide.\n");
}

if (!isset($data['candidat']) || !isset($data['concours'])) {
    die("Erreur: Les clés 'candidat' et 'concours' sont obligatoires.\n");
}

$candidat = $data['candidat'];
$concours = $data['concours'];
$libelleConcours = $data['libelleConcours'] ?? ($concours['libelle'] ?? 'Concours d\'entrée à l\'université');
$subtitleHeader = convocationText($libelleConcours);
$photoBase64 = $data['photoBase64'] ?? null;
$photoMime = $data['photoMime'] ?? null;
$photoStoragePath = $data['photoStoragePath']
    ?? ($candidat['photoPath'] ?? null)
    ?? (($candidat['dossier'] ?? [])['photo'] ?? null)
    ?? ($candidat['photo'] ?? null);

$requiredFields = ['matricule', 'nom', 'prenom', 'email'];
foreach ($requiredFields as $field) {
    if (!isset($candidat[$field]) || empty($candidat[$field])) {
        die("Erreur: Le champ 'candidat.$field' est obligatoire.\n");
    }
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

    renderOfficialHeader(
        $pdf,
        $leftMargin,
        $rightMargin,
        $contentWidth,
        'Convocation officielle',
        $subtitleHeader
    );

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Identification du candidat', 'blue');
    $rowStartY = $pdf->GetY();

    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationText('Nom et prénom :'), 0, 0, 'L');
    $pdf->SetFont('Times', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(convocationText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationText('Matricule :'), 0, 0, 'L');
    $pdf->SetFont('Times', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(convocationText($candidat['matricule'] ?? 'N/A')), 0, 1, 'L');

    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationText('Email :'), 0, 0, 'L');
    $pdf->Cell(95, 6, convocationText($candidat['email'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationText('Téléphone :'), 0, 0, 'L');
    $pdf->Cell(95, 6, convocationText($candidat['telephone'] ?? 'Non renseigné'), 0, 1, 'L');

    $photoW = 28;
    $photoH = 34;
    $photoX = $leftMargin + $contentWidth - 35;
    $photoY = $rowStartY + 1;
    renderIdentityPhotoZone($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH, $photoStoragePath, 'Photo');

    // Descendre sous la photo pour ne pas chevaucher la barre suivante
    $afterPhotoY = $photoY + $photoH + 4;
    if ($pdf->GetY() < $afterPhotoY) {
        $pdf->SetY($afterPhotoY);
    } else {
        $pdf->Ln(3);
    }

    ensureSpaceConvocation($pdf, 55, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Details du concours', 'blue');

    $dateDebutComposition = !empty($data['dateDebutComposition'])
        ? date('d/m/Y', strtotime($data['dateDebutComposition']))
        : (!empty($concours['dateDebutComposition']) ? date('d/m/Y', strtotime($concours['dateDebutComposition'])) : 'N/A');
    $dateFinComposition = !empty($data['dateFinComposition'])
        ? date('d/m/Y', strtotime($data['dateFinComposition']))
        : (!empty($concours['dateFinComposition']) ? date('d/m/Y', strtotime($concours['dateFinComposition'])) : 'N/A');
    $dateComposition = !empty($concours['dateComposition']) ? date('d/m/Y', strtotime($concours['dateComposition'])) : convocationText('À définir');
    $numeroTableRaw = $data['numeroTable']
        ?? ($data['inscription']['numeroTable'] ?? null)
        ?? ($candidat['numeroTable'] ?? null);
    // Tiret ASCII si absent (évite mojibake UTF-8 "—" → â€")
    $numeroTable = (isset($numeroTableRaw) && $numeroTableRaw !== '' && $numeroTableRaw !== null)
        ? convocationText((string) $numeroTableRaw)
        : '-';

    $centreAffiche = convocationText('Centre de composition à confirmer');
    if (!empty($data['centreCompositionChoisi']['nom'])) {
        $parts = [$data['centreCompositionChoisi']['nom']];
        if (!empty($data['centreCompositionChoisi']['ville'])) {
            $parts[] = $data['centreCompositionChoisi']['ville'];
        }
        if (!empty($data['centreCompositionChoisi']['adresse'])) {
            $parts[] = $data['centreCompositionChoisi']['adresse'];
        }
        $centreAffiche = convocationText(implode(' — ', $parts));
    } elseif (!empty($data['centresComposition']['centres']) && is_array($data['centresComposition']['centres'])) {
        $villes = array_map(function ($c) {
            return $c['ville'] ?? '';
        }, $data['centresComposition']['centres']);
        $villes = array_filter($villes);
        if (!empty($villes)) {
            $centreAffiche = convocationText(implode(', ', $villes));
        }
    } elseif (!empty($concours['centresComposition']['centres']) && is_array($concours['centresComposition']['centres'])) {
        $villes = array_map(function ($c) {
            return $c['ville'] ?? '';
        }, $concours['centresComposition']['centres']);
        $villes = array_filter($villes);
        if (!empty($villes)) {
            $centreAffiche = convocationText(implode(', ', $villes));
        }
    } elseif (!empty($concours['lieuComposition'])) {
        $centreAffiche = convocationText($concours['lieuComposition']);
    }

    $pdf->SetFont('Times', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->MultiCell($contentWidth - 4, 6, strtoupper(convocationText($libelleConcours)), 0, 'L');

    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationText('Période de composition :'), 0, 0, 'L');
    $pdf->Cell(0, 6, convocationText('Du ') . $dateDebutComposition . convocationText(' au ') . $dateFinComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationText('Date de composition :'), 0, 0, 'L');
    $pdf->Cell(0, 6, $dateComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationText('Numéro de table :'), 0, 0, 'L');
    $pdf->SetFont('Times', 'B', 13);
    $pdf->Cell(0, 6, $numeroTable, 0, 1, 'L');
    $pdf->SetFont('Times', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationText('Centre / Salle :'), 0, 0, 'L');
    $pdf->MultiCell($contentWidth - 59, 6, strtoupper($centreAffiche), 0, 'L');

    $pdf->Ln(2);
    ensureSpaceConvocation($pdf, 28, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);

    $pdf->SetFillColor(232, 240, 254);
    $pdf->SetFont('Times', 'B', 11);
    $pdf->SetX($leftMargin);
    $pdf->Cell($contentWidth, 8, convocationText('MATIÈRES / ÉPREUVES'), 1, 1, 'L', true);

    $matieres = [];
    if (isset($data['matieres']) && is_array($data['matieres'])) {
        $matieres = $data['matieres'];
    } elseif (isset($concours['matieres']) && is_array($concours['matieres'])) {
        $matieres = $concours['matieres'];
    }

    if (empty($matieres)) {
        $pdf->SetFont('Times', 'I', 10);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell(0, 6, convocationText('Les matières seront communiquées ultérieurement.'), 0, 1);
        $pdf->SetTextColor(0, 0, 0);
    } else {
        $pdf->SetFont('Times', 'B', 10);
        $pdf->SetFillColor(200, 210, 240);
        $pdf->SetX($leftMargin);
        $pdf->Cell(15, 7, 'N', 1, 0, 'C', true);
        $pdf->Cell($contentWidth - 15, 7, convocationText('Épreuve'), 1, 1, 'L', true);

        $pdf->SetFont('Times', '', 10);
        foreach ($matieres as $index => $matiere) {
            if ($pdf->GetY() + 8 > 270) {
                $pdf->AddPage();
                renderOfficialHeader(
                    $pdf,
                    $leftMargin,
                    $rightMargin,
                    $contentWidth,
                    'Convocation officielle',
                    $subtitleHeader
                );
                $pdf->SetFillColor(232, 240, 254);
                $pdf->SetFont('Times', 'B', 11);
                $pdf->SetX($leftMargin);
                $pdf->Cell($contentWidth, 8, convocationText('MATIÈRES / ÉPREUVES'), 1, 1, 'L', true);
                $pdf->SetFont('Times', 'B', 10);
                $pdf->SetFillColor(200, 210, 240);
                $pdf->SetX($leftMargin);
                $pdf->Cell(15, 7, 'N', 1, 0, 'C', true);
                $pdf->Cell($contentWidth - 15, 7, convocationText('Épreuve'), 1, 1, 'L', true);
                $pdf->SetFont('Times', '', 10);
            }
            $fill = ($index % 2 === 0);
            $pdf->SetFillColor(245, 247, 255);
            $pdf->SetX($leftMargin);
            $pdf->Cell(15, 6, strval($index + 1), 1, 0, 'C', $fill);
            $pdf->Cell($contentWidth - 15, 6, convocationText($matiere), 1, 1, 'L', $fill);
        }
    }

    $pdf->Ln(4);
    ensureSpaceConvocation($pdf, 35, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    $pdf->SetFillColor(232, 240, 254);
    $pdf->SetFont('Times', 'B', 11);
    $pdf->SetX($leftMargin);
    $pdf->Cell($contentWidth, 8, convocationText('PIÈCES À APPORTER LE JOUR DES ÉPREUVES'), 1, 1, 'L', true);

    $pdf->Ln(2);
    $pdf->SetFont('Times', '', 10);

    $piecesAApporter = [
        'La présente convocation (imprimée obligatoirement)',
        "Une pièce d'identité en cours de validité (CNI ou passeport)",
        "La quittance de paiement des frais d'inscription",
    ];

    foreach ($piecesAApporter as $piece) {
        $pdf->SetX($leftMargin + 2);
        $pdf->Cell(8, 6, convocationText('-'), 0, 0);
        $pdf->Cell(0, 6, convocationText($piece), 0, 1);
    }

    $pdf->Ln(2);
    ensureSpaceConvocation($pdf, 42, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Consignes obligatoires', 'red');
    $consignes = [
        'Se présenter au moins 60 minutes avant le début de la première épreuve.',
        'Apporter cette convocation imprimée et une pièce d\'identité valide.',
        'Utiliser uniquement le matériel autorisé par le jury.',
        'Les téléphones et appareils connectés sont strictement interdits en salle.',
        'Tout retard majeur ou fraude entraîne l\'annulation de la participation.',
    ];
    $pdf->SetFont('Times', '', 12);
    foreach ($consignes as $consigne) {
        if ($pdf->GetY() + 8 > 270) {
            $pdf->AddPage();
            renderOfficialHeader(
                $pdf,
                $leftMargin,
                $rightMargin,
                $contentWidth,
                'Convocation officielle',
                $subtitleHeader
            );
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Consignes obligatoires', 'red');
            $pdf->SetFont('Times', '', 12);
        }
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 5, convocationText('- ') . convocationText($consigne), 0, 'L');
    }

    ensureSpaceConvocation($pdf, 20, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    renderSignatureBlock($pdf, convocationText('Le Directeur Général de l\'Enseignement Supérieur'));

    renderDocumentFooter($pdf);

    $pdf->Output('F', $outputFile);

    if (!file_exists($outputFile)) {
        die("Erreur: Le PDF n'a pas été créé correctement.\n");
    }

    echo "Succès: PDF créé avec succès: $outputFile\n";

} catch (Exception $e) {
    die("Erreur lors de la création du PDF: " . $e->getMessage() . "\n");
}
?>
