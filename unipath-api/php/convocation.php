<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

/**
 * Conversion UTF-8 → ISO-8859-1 pour FPDF standard (accents français).
 */
function convocationCleanText($text) {
    if (empty($text)) {
        return '';
    }

    // Table de remplacement explicite pour les caractères problématiques
    $search = [
        'É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Î', 'Ï', 'Ô', 'Û', 'Ù', 'Ü', 'Ç', 'Œ', 'Æ',
        'é', 'è', 'ê', 'ë', 'à', 'â', 'î', 'ï', 'ô', 'û', 'ù', 'ü', 'ç', 'œ', 'æ',
        "\u{2019}", "\u{2018}", "\u{201C}", "\u{201D}", "\u{2013}", "\u{2014}",
    ];
    $replace = [
        'E', 'E', 'E', 'E', 'A', 'A', 'I', 'I', 'O', 'U', 'U', 'U', 'C', 'OE', 'AE',
        'e', 'e', 'e', 'e', 'a', 'a', 'i', 'i', 'o', 'u', 'u', 'u', 'c', 'oe', 'ae',
        "'", "'", '"', '"', '-', '-',
    ];

    $text = str_replace($search, $replace, (string) $text);

    // Fallback iconv pour les caractères restants
    if (mb_detect_encoding($text, 'UTF-8', true)) {
        $text = iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', $text);
    }

    return $text !== false ? $text : (string) $text;
}

function buildNumeroConvocation($data, $concours) {
    if (!empty($data['numeroConvocation'])) {
        return strtoupper(convocationCleanText($data['numeroConvocation']));
    }

    $libelle = $data['libelleConcours'] ?? $concours['libelle'] ?? '';
    $libelleTrimmed = preg_replace('/^concours\s*/i', '', trim($libelle));
    $firstWord = explode(' ', $libelleTrimmed)[0] ?? 'CONV';
    $sigle = strtoupper(substr(preg_replace('/[^A-Z0-9]/', '', strtoupper($firstWord)), 0, 6));
    if ($sigle === '') {
        $sigle = 'CONV';
    }

    $sequence = '000001';
    $numeroInscription = $data['numeroInscription'] ?? ($data['inscription']['numeroInscription'] ?? null);
    if (!empty($numeroInscription)) {
        $parts = explode('-', $numeroInscription);
        $lastPart = end($parts);
        $sequence = $lastPart !== false && $lastPart !== '' ? $lastPart : '000001';
    }

    return "CONV-{$sigle}-2026-{$sequence}";
}

function renderConvocationPhotoFromBase64($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH) {
    $pdf->SetDrawColor(120, 120, 120);
    $pdf->Rect($photoX, $photoY, $photoW, $photoH);

    if (empty($photoBase64)) {
        $pdf->SetXY($photoX, $photoY + ($photoH / 2) - 3);
        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell($photoW, 6, convocationCleanText('Photo'), 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);
        return;
    }

    $imageData = base64_decode($photoBase64, true);
    if ($imageData === false || strlen($imageData) === 0) {
        $pdf->SetXY($photoX, $photoY + ($photoH / 2) - 3);
        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell($photoW, 6, convocationCleanText('Photo'), 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);
        return;
    }

    $mime = $photoMime ?? 'image/jpeg';
    $extension = 'jpg';
    if ($mime === 'image/png') {
        $extension = 'png';
    } elseif ($mime === 'image/webp') {
        $extension = 'webp';
    }

    $tempPhoto = tempnam(sys_get_temp_dir(), 'unipath_conv_') . '.' . $extension;
    file_put_contents($tempPhoto, $imageData);

    if ($mime === 'image/webp' && function_exists('imagecreatefromwebp')) {
        $webpImage = @imagecreatefromwebp($tempPhoto);
        if ($webpImage !== false) {
            $jpgPath = tempnam(sys_get_temp_dir(), 'unipath_conv_') . '.jpg';
            imagejpeg($webpImage, $jpgPath, 90);
            imagedestroy($webpImage);
            unlink($tempPhoto);
            $tempPhoto = $jpgPath;
        }
    }

    try {
        $pdf->Image($tempPhoto, $photoX + 1, $photoY + 1, $photoW - 2, $photoH - 2);
    } catch (Exception $e) {
        $pdf->SetXY($photoX, $photoY + ($photoH / 2) - 3);
        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell($photoW, 6, convocationCleanText('Photo'), 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);
    }

    if (file_exists($tempPhoto)) {
        unlink($tempPhoto);
    }
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
$subtitleHeader = convocationCleanText($libelleConcours);
$photoBase64 = $data['photoBase64'] ?? null;
$photoMime = $data['photoMime'] ?? null;

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

    $numeroConvocation = buildNumeroConvocation($data, $concours);

    $pdf->SetFillColor(245, 247, 250);
    $pdf->SetDrawColor(200, 210, 220);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 9, 'FD');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 9, convocationCleanText('Numéro convocation : ') . $numeroConvocation, 0, 1, 'L');
    $pdf->Ln(3);

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Identification du candidat', 'blue');
    $rowStartY = $pdf->GetY();

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationCleanText('Nom et prénom :'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(convocationCleanText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationCleanText('Matricule :'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->Cell(95, 6, strtoupper(convocationCleanText($candidat['matricule'] ?? 'N/A')), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationCleanText('Email :'), 0, 0, 'L');
    $pdf->Cell(95, 6, convocationCleanText($candidat['email'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, convocationCleanText('Téléphone :'), 0, 0, 'L');
    $pdf->Cell(95, 6, convocationCleanText($candidat['telephone'] ?? 'Non renseigné'), 0, 1, 'L');

    $photoW = 28;
    $photoH = 34;
    $photoX = $leftMargin + $contentWidth - 35;
    $photoY = $rowStartY + 1;
    renderConvocationPhotoFromBase64($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH);

    // Après le bloc photo, forcer le curseur Y sous la zone photo
    $finPhoto = $photoY + $photoH + 5;
    if ($pdf->GetY() < $finPhoto) {
        $pdf->SetY($finPhoto);
    }

    $pdf->Ln(3);
    ensureSpaceConvocation($pdf, 55, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'DETAILS DU CONCOURS', 'blue');

    $dateDebutComposition = !empty($data['dateDebutComposition'])
        ? date('d/m/Y', strtotime($data['dateDebutComposition']))
        : (!empty($concours['dateDebutComposition']) ? date('d/m/Y', strtotime($concours['dateDebutComposition'])) : 'N/A');
    $dateFinComposition = !empty($data['dateFinComposition'])
        ? date('d/m/Y', strtotime($data['dateFinComposition']))
        : (!empty($concours['dateFinComposition']) ? date('d/m/Y', strtotime($concours['dateFinComposition'])) : 'N/A');
    $dateComposition = !empty($concours['dateComposition']) ? date('d/m/Y', strtotime($concours['dateComposition'])) : convocationCleanText('À définir');
    $heureComposition = !empty($concours['heureComposition']) ? convocationCleanText($concours['heureComposition']) : convocationCleanText('À définir');

    $centreAffiche = 'CENTRE DE COMPOSITION A CONFIRMER';
    if (!empty($data['centreCompositionChoisi']['nom'])) {
        $choisi = $data['centreCompositionChoisi'];
        $parts = [$choisi['nom'] ?? ''];
        if (!empty($choisi['ville'])) {
            $parts[] = $choisi['ville'];
        }
        if (!empty($choisi['adresse'])) {
            $parts[] = $choisi['adresse'];
        }
        $centreAffiche = convocationCleanText(implode(' — ', array_filter($parts)));
    } elseif (!empty($data['centresComposition']['centres']) && is_array($data['centresComposition']['centres'])) {
        $villes = array_map(function ($c) {
            return $c['ville'] ?? '';
        }, $data['centresComposition']['centres']);
        $villes = array_filter($villes);
        if (!empty($villes)) {
            $centreAffiche = convocationCleanText(implode(', ', $villes));
        }
    } elseif (!empty($concours['centresComposition']['centres']) && is_array($concours['centresComposition']['centres'])) {
        $villes = array_map(function ($c) {
            return $c['ville'] ?? '';
        }, $concours['centresComposition']['centres']);
        $villes = array_filter($villes);
        if (!empty($villes)) {
            $centreAffiche = convocationCleanText(implode(', ', $villes));
        }
    } elseif (!empty($concours['lieuComposition'])) {
        $centreAffiche = convocationCleanText($concours['lieuComposition']);
    }

    $pdf->SetFont('Helvetica', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->MultiCell($contentWidth - 4, 6, strtoupper(convocationCleanText($libelleConcours)), 0, 'L');

    $pdf->SetFont('Helvetica', '', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationCleanText('Période de composition :'), 0, 0, 'L');
    $pdf->Cell(0, 6, convocationCleanText('Du ') . $dateDebutComposition . convocationCleanText(' au ') . $dateFinComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationCleanText('Date de composition :'), 0, 0, 'L');
    $pdf->Cell(0, 6, $dateComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationCleanText('Heure de convocation :'), 0, 0, 'L');
    $pdf->Cell(0, 6, $heureComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(55, 6, convocationCleanText('Centre / Salle :'), 0, 0, 'L');
    $pdf->MultiCell($contentWidth - 59, 6, strtoupper($centreAffiche), 0, 'L');

    $pdf->Ln(2);
    ensureSpaceConvocation($pdf, 28, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);

    $pdf->SetFillColor(232, 240, 254);
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetX($leftMargin);
    $pdf->Cell($contentWidth, 8, convocationCleanText('MATIÈRES / ÉPREUVES'), 1, 1, 'L', true);

    $matieres = [];
    if (isset($data['matieres']) && is_array($data['matieres'])) {
        $matieres = $data['matieres'];
    } elseif (isset($concours['matieres']) && is_array($concours['matieres'])) {
        $matieres = $concours['matieres'];
    }

    if (empty($matieres)) {
        $pdf->SetFont('Helvetica', 'I', 10);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell(0, 6, convocationCleanText('Les matières seront communiquées ultérieurement.'), 0, 1);
        $pdf->SetTextColor(0, 0, 0);
    } else {
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetFillColor(200, 210, 240);
        $pdf->SetX($leftMargin);
        $pdf->Cell(15, 7, 'N', 1, 0, 'C', true);
        $pdf->Cell($contentWidth - 15, 7, convocationCleanText('Épreuve'), 1, 1, 'L', true);

        $pdf->SetFont('Helvetica', '', 10);
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
                $pdf->SetFont('Helvetica', 'B', 11);
                $pdf->SetX($leftMargin);
                $pdf->Cell($contentWidth, 8, convocationCleanText('MATIÈRES / ÉPREUVES'), 1, 1, 'L', true);
                $pdf->SetFont('Helvetica', 'B', 10);
                $pdf->SetFillColor(200, 210, 240);
                $pdf->SetX($leftMargin);
                $pdf->Cell(15, 7, 'N', 1, 0, 'C', true);
                $pdf->Cell($contentWidth - 15, 7, convocationCleanText('Épreuve'), 1, 1, 'L', true);
                $pdf->SetFont('Helvetica', '', 10);
            }
            $fill = ($index % 2 === 0);
            $pdf->SetFillColor(245, 247, 255);
            $pdf->SetX($leftMargin);
            $pdf->Cell(15, 6, strval($index + 1), 1, 0, 'C', $fill);
            $pdf->Cell($contentWidth - 15, 6, convocationCleanText($matiere), 1, 1, 'L', $fill);
        }
    }

    $pdf->Ln(4);
    ensureSpaceConvocation($pdf, 35, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    $pdf->SetFillColor(232, 240, 254);
    $pdf->SetFont('Helvetica', 'B', 11);
    $pdf->SetX($leftMargin);
    $pdf->Cell($contentWidth, 8, convocationCleanText('PIÈCES À APPORTER LE JOUR DES ÉPREUVES'), 1, 1, 'L', true);

    $pdf->Ln(2);
    $pdf->SetFont('Helvetica', '', 10);

    $piecesAApporter = [
        'La présente convocation (imprimée obligatoirement)',
        "Une pièce d'identité en cours de validité (CNI ou passeport)",
        "La quittance de paiement des frais d'inscription",
    ];

    foreach ($piecesAApporter as $piece) {
        $pdf->SetX($leftMargin + 2);
        $pdf->Cell(8, 6, convocationCleanText('-'), 0, 0);
        $pdf->Cell(0, 6, convocationCleanText($piece), 0, 1);
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
                $subtitleHeader
            );
            renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Consignes obligatoires', 'red');
            $pdf->SetFont('Helvetica', '', 12);
        }
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 5, convocationCleanText('- ') . convocationCleanText($consigne), 0, 'L');
    }

    ensureSpaceConvocation($pdf, 20, $leftMargin, $rightMargin, $contentWidth, $subtitleHeader);
    renderSignatureBlock($pdf, 'Le Directeur General de l\'Enseignement Superieur');

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
