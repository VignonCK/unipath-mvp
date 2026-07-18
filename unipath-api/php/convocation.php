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

    $numeroInscription = $data['numeroInscription'] ?? ($data['inscription']['numeroInscription'] ?? null);
    if (!empty($numeroInscription)) {
        return strtoupper(convocationCleanText($numeroInscription));
    }

    // Plus de faux numéro inventé (CONV-…-0001) : le backend doit refuser avant d'appeler PHP.
    fwrite(STDERR, "Erreur: numeroInscription manquant pour la convocation\n");
    exit(1);
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

function renderMatieresCompact($pdf, $leftMargin, $contentWidth, $matieres, $maxBottomY) {
    $pdf->SetFillColor(232, 240, 254);
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->SetX($leftMargin);
    $pdf->Cell($contentWidth, 5, convocationCleanText('MATIÈRES / ÉPREUVES'), 1, 1, 'L', true);

    if (empty($matieres)) {
        $pdf->SetFont('Helvetica', 'I', 8);
        $pdf->SetTextColor(150, 150, 150);
        $pdf->Cell(0, 4, convocationCleanText('Les matières seront communiquées ultérieurement.'), 0, 1);
        $pdf->SetTextColor(0, 0, 0);
        return;
    }

    $count = count($matieres);
    $available = max(20, $maxBottomY - $pdf->GetY() - 5);
    $rowH = min(4.5, max(3.5, floor($available / max(1, $count + 1))));
    $fontSize = $rowH <= 4 ? 7 : 8;

    $pdf->SetFont('Helvetica', 'B', $fontSize);
    $pdf->SetFillColor(200, 210, 240);
    $pdf->SetX($leftMargin);
    $pdf->Cell(12, $rowH, 'N', 1, 0, 'C', true);
    $pdf->Cell($contentWidth - 12, $rowH, convocationCleanText('Épreuve'), 1, 1, 'L', true);

    $pdf->SetFont('Helvetica', '', $fontSize);
    foreach ($matieres as $index => $matiere) {
        if ($pdf->GetY() + $rowH > $maxBottomY) {
            break;
        }
        $fill = ($index % 2 === 0);
        $pdf->SetFillColor(245, 247, 255);
        $pdf->SetX($leftMargin);
        $pdf->Cell(12, $rowH, strval($index + 1), 1, 0, 'C', $fill);
        $label = convocationCleanText($matiere);
        if (strlen($label) > 80) {
            $label = substr($label, 0, 77) . '...';
        }
        $pdf->Cell($contentWidth - 12, $rowH, $label, 1, 1, 'L', $fill);
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
    $pdf->SetMargins(15, 10, 15);
    $pdf->SetAutoPageBreak(false);
    $pdf->AddPage();

    $leftMargin = 15;
    $rightMargin = 15;
    $pageWidth = 210;
    $contentWidth = $pageWidth - $leftMargin - $rightMargin;
    $maxContentY = 258;
    $compact = true;

    renderOfficialHeader(
        $pdf,
        $leftMargin,
        $rightMargin,
        $contentWidth,
        'Convocation officielle',
        $subtitleHeader,
        $compact
    );

    $numeroConvocation = buildNumeroConvocation($data, $concours);

    $pdf->SetFillColor(245, 247, 250);
    $pdf->SetDrawColor(200, 210, 220);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 7, 'FD');
    $pdf->SetFont('Helvetica', 'B', 10);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 7, convocationCleanText('Numéro de table : ') . $numeroConvocation, 0, 1, 'L');
    $pdf->Ln(1);

    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Identification du candidat', 'blue', $compact);
    $rowStartY = $pdf->GetY();
    $rowH = 4.5;

    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(38, $rowH, convocationCleanText('Nom et prénom :'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->Cell(95, $rowH, strtoupper(convocationCleanText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(38, $rowH, convocationCleanText('Matricule :'), 0, 0, 'L');
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->Cell(95, $rowH, strtoupper(convocationCleanText($candidat['matricule'] ?? 'N/A')), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(38, $rowH, convocationCleanText('Email :'), 0, 0, 'L');
    $pdf->Cell(95, $rowH, convocationCleanText($candidat['email'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(38, $rowH, convocationCleanText('Téléphone :'), 0, 0, 'L');
    $pdf->Cell(95, $rowH, convocationCleanText($candidat['telephone'] ?? 'Non renseigné'), 0, 1, 'L');

    $photoW = 24;
    $photoH = 28;
    $photoX = $leftMargin + $contentWidth - 28;
    $photoY = $rowStartY;
    renderConvocationPhotoFromBase64($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH);

    $finPhoto = $photoY + $photoH + 2;
    if ($pdf->GetY() < $finPhoto) {
        $pdf->SetY($finPhoto);
    }

    $pdf->Ln(1);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'DETAILS DU CONCOURS', 'blue', $compact);

    $dateDebutComposition = !empty($data['dateDebutComposition'])
        ? date('d/m/Y', strtotime($data['dateDebutComposition']))
        : (!empty($concours['dateDebutComposition']) ? date('d/m/Y', strtotime($concours['dateDebutComposition'])) : 'N/A');
    $dateFinComposition = !empty($data['dateFinComposition'])
        ? date('d/m/Y', strtotime($data['dateFinComposition']))
        : (!empty($concours['dateFinComposition']) ? date('d/m/Y', strtotime($concours['dateFinComposition'])) : 'N/A');
    $dateComposition = !empty($concours['dateComposition']) ? date('d/m/Y', strtotime($concours['dateComposition'])) : convocationCleanText('À définir');
    $heureComposition = !empty($data['heureComposition'])
        ? convocationCleanText($data['heureComposition'])
        : (!empty($concours['heureComposition'])
            ? convocationCleanText($concours['heureComposition'])
            : convocationCleanText('8h au plus tard'));

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
    } elseif (!empty($concours['lieuComposition'])) {
        $centreAffiche = convocationCleanText($concours['lieuComposition']);
    }

    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->SetX($leftMargin + 2);
    $pdf->MultiCell($contentWidth - 4, 4, strtoupper(convocationCleanText($libelleConcours)), 0, 'L');

    $pdf->SetFont('Helvetica', '', 9);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, $rowH, convocationCleanText('Période de composition :'), 0, 0, 'L');
    $pdf->Cell(0, $rowH, convocationCleanText('Du ') . $dateDebutComposition . convocationCleanText(' au ') . $dateFinComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, $rowH, convocationCleanText('Date de composition :'), 0, 0, 'L');
    $pdf->Cell(0, $rowH, $dateComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, $rowH, convocationCleanText('Heure de convocation :'), 0, 0, 'L');
    $pdf->Cell(0, $rowH, $heureComposition, 0, 1, 'L');
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(50, $rowH, convocationCleanText('Centre / Salle :'), 0, 0, 'L');
    $pdf->MultiCell($contentWidth - 54, 4, strtoupper($centreAffiche), 0, 'L');

    $pdf->Ln(1);

    $matieres = [];
    if (isset($data['matieres']) && is_array($data['matieres'])) {
        $matieres = $data['matieres'];
    } elseif (isset($concours['matieres']) && is_array($concours['matieres'])) {
        $matieres = $concours['matieres'];
    }

    $matieresMaxY = $maxContentY - 52;
    renderMatieresCompact($pdf, $leftMargin, $contentWidth, $matieres, $matieresMaxY);

    $pdf->Ln(1);
    $pdf->SetFillColor(232, 240, 254);
    $pdf->SetFont('Helvetica', 'B', 9);
    $pdf->SetX($leftMargin);
    $pdf->Cell($contentWidth, 5, convocationCleanText('PIÈCES À APPORTER LE JOUR DES ÉPREUVES'), 1, 1, 'L', true);

    $pdf->SetFont('Helvetica', '', 8);
    $piecesAApporter = [
        'La présente convocation (imprimée obligatoirement)',
        "Une pièce d'identité en cours de validité (CNI ou passeport)",
        "La quittance de paiement des frais d'inscription",
    ];

    foreach ($piecesAApporter as $piece) {
        $pdf->SetX($leftMargin + 2);
        $pdf->Cell(4, 3.5, convocationCleanText('-'), 0, 0);
        $pdf->Cell(0, 3.5, convocationCleanText($piece), 0, 1);
    }

    $pdf->Ln(1);
    renderSectionHeader($pdf, $leftMargin, $contentWidth, 'Consignes obligatoires', 'red', $compact);
    $consignes = [
        'Se présenter au moins 60 minutes avant le début de la première épreuve.',
        'Apporter cette convocation imprimée et une pièce d\'identité valide.',
        'Utiliser uniquement le matériel autorisé par le jury.',
        'Les téléphones et appareils connectés sont strictement interdits en salle.',
        'Tout retard majeur ou fraude entraîne l\'annulation de la participation.',
    ];
    $pdf->SetFont('Helvetica', '', 8);
    foreach ($consignes as $consigne) {
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 3.5, convocationCleanText('- ') . convocationCleanText($consigne), 0, 'L');
    }

    renderSignatureBlock($pdf, 'Le Directeur General de l\'Enseignement Superieur', $compact);

    renderDocumentFooter($pdf, null, $compact);

    $pdf->Output('F', $outputFile);

    if (!file_exists($outputFile)) {
        die("Erreur: Le PDF n'a pas été créé correctement.\n");
    }

    echo "Succès: PDF créé avec succès: $outputFile\n";

} catch (Exception $e) {
    die("Erreur lors de la création du PDF: " . $e->getMessage() . "\n");
}
?>
