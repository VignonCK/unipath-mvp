<?php
require(__DIR__ . '/fpdf.php');
require(__DIR__ . '/pdf-common.php');

/**
 * Conversion UTF-8 → ISO-8859-1 pour FPDF standard (accents français).
 */
function ficheText($text) {
    if ($text === null || $text === '') {
        return '';
    }
    $converted = @iconv('UTF-8', 'ISO-8859-1//TRANSLIT//IGNORE', (string) $text);
    return $converted !== false ? $converted : (string) $text;
}

function ensureSpacePreinscription($pdf, $minYNeeded, $leftMargin, $rightMargin, $contentWidth) {
    if ($pdf->GetY() + $minYNeeded > 270) {
        $pdf->AddPage();
        renderFicheOfficialHeader(
            $pdf,
            $leftMargin,
            $rightMargin,
            $contentWidth,
            'Fiche de pré-inscription',
            'Plateforme nationale UniPath'
        );
    }
}

/**
 * Affiche la zone photo (délègue au helper commun).
 */
function renderFichePhotoZoneFromBase64($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH, $photoStoragePath = null) {
    renderIdentityPhotoZone($pdf, $photoBase64, $photoMime, $photoX, $photoY, $photoW, $photoH, $photoStoragePath, 'Photo');
}

function formatStatutFiche($statut) {
    $statutLabels = [
        'EN_ATTENTE' => "En attente d'examen",
        'VALIDE_PAR_COMMISSION' => 'Validé par la commission',
        'REJETE_PAR_COMMISSION' => 'Rejeté par la commission',
        'SOUS_RESERVE_PAR_COMMISSION' => 'Validé sous réserve',
        'VALIDE' => 'Dossier validé',
        'REJETE' => 'Dossier rejeté',
        'SOUS_RESERVE' => 'Validé sous réserve',
    ];
    $key = strtoupper(trim((string) $statut));
    return $statutLabels[$key] ?? $statut;
}

function renderFicheOfficialHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $documentTitle, $subtitle = null) {
    // En-tête officiel partagé (bandeau MESRS)
    renderOfficialHeader($pdf, $leftMargin, $rightMargin, $contentWidth, $documentTitle, $subtitle);
}

function renderFicheSectionHeader($pdf, $leftMargin, $contentWidth, $title, $theme = 'blue') {
    if ($theme === 'red') {
        $fill = [253, 243, 243];
        $draw = [233, 198, 198];
        $text = [128, 30, 30];
    } elseif ($theme === 'green') {
        $fill = [242, 251, 245];
        $draw = [190, 222, 198];
        $text = [21, 103, 58];
    } else {
        $fill = [245, 248, 255];
        $draw = [196, 210, 237];
        $text = [20, 52, 116];
    }

    $pdf->SetFillColor($fill[0], $fill[1], $fill[2]);
    $pdf->SetDrawColor($draw[0], $draw[1], $draw[2]);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 8, 'FD');
    $pdf->SetFont('Times', 'B', 11);
    $pdf->SetTextColor($text[0], $text[1], $text[2]);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 8, strtoupper(ficheText($title)), 0, 1, 'L');
    $pdf->SetTextColor(0, 0, 0);
}

function renderFicheSignatureBlock($pdf, $label = 'Le Service des Inscriptions') {
    $pdf->Ln(4);
    $pdf->SetFont('Times', '', 11);
    $pdf->Cell(0, 5, ficheText('Fait à Abomey-Calavi, le ') . date('d/m/Y'), 0, 1, 'R');
    $pdf->SetFont('Times', 'B', 11);
    $pdf->Cell(0, 5, ficheText($label), 0, 1, 'R');
}

function renderFicheDocumentFooter($pdf) {
    $text = ficheText('Document généré automatiquement par UniPath - ') . date('d/m/Y H:i');
    $pdf->SetY(-20);
    $pdf->SetFont('Times', '', 9);
    $pdf->SetTextColor(128, 128, 128);
    $pdf->Cell(0, 4, $text, 0, 1, 'C');
    $pdf->SetTextColor(0, 0, 0);
}

// ── VALIDATION DES ARGUMENTS ──────────────────────────────────
if ($argc < 3) {
    die("Erreur: Usage - php fiche-preinscription.php <input_file> <output_file>\n");
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
$numeroDossier = $data['numeroDossier'] ?? 'N/A';
$inscription = $data['inscription'] ?? [];
$statutRaw = $data['statut'] ?? ($inscription['dossierInscription']['statut'] ?? 'EN_ATTENTE');
$serieBac = $data['serie'] ?? ($candidat['serie'] ?? null);
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
    $pageWidth = 210;
    $contentWidth = $pageWidth - $leftMargin - $rightMargin;
    $photoW = 28;
    $photoH = 34;
    $textWidth = $contentWidth - $photoW - 6;

    renderFicheOfficialHeader(
        $pdf,
        $leftMargin,
        $rightMargin,
        $contentWidth,
        'Fiche de pré-inscription',
        'Plateforme nationale UniPath'
    );

    $numeroDossierFinal = strtoupper(ficheText($numeroDossier ?: ($inscription['numeroInscription'] ?? 'N/A')));
    $pdf->SetFillColor(245, 247, 251);
    $pdf->SetDrawColor(200, 210, 220);
    $pdf->Rect($leftMargin, $pdf->GetY(), $contentWidth, 9, 'FD');
    $pdf->SetFont('Times', 'B', 12);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell($contentWidth - 4, 9, ficheText('Numéro de dossier : ') . $numeroDossierFinal, 0, 1, 'L');
    $pdf->Ln(3);

    renderFicheSectionHeader($pdf, $leftMargin, $contentWidth, 'Informations du candidat', 'blue');

    $sectionStartY = $pdf->GetY();
    $photoX = $leftMargin + $contentWidth - $photoW;
    $photoY = $sectionStartY + 1;

    $pdf->SetFont('Times', '', 11);
    $pdf->SetXY($leftMargin + 2, $sectionStartY + 1);
    $pdf->Cell(42, 6, ficheText('Nom et prénom :'), 0, 0, 'L');
    $pdf->SetFont('Times', 'B', 11);
    $pdf->Cell($textWidth - 42, 6, strtoupper(ficheText(($candidat['nom'] ?? '') . ' ' . ($candidat['prenom'] ?? ''))), 0, 1, 'L');

    $pdf->SetFont('Times', '', 11);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, ficheText('Matricule :'), 0, 0, 'L');
    $pdf->SetFont('Times', 'B', 11);
    $pdf->Cell($textWidth - 42, 6, strtoupper(ficheText($candidat['matricule'] ?? 'EN ATTENTE')), 0, 1, 'L');

    $pdf->SetFont('Times', '', 11);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, ficheText('Date / lieu naiss. :'), 0, 0, 'L');
    $dateNaiss = !empty($candidat['dateNaiss']) ? date('d/m/Y', strtotime($candidat['dateNaiss'])) : 'N/A';
    $lieuNaiss = ficheText($candidat['lieuNaiss'] ?? 'N/A');
    $pdf->Cell($textWidth - 42, 6, $dateNaiss . ' / ' . $lieuNaiss, 0, 1, 'L');

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, ficheText('Série BAC :'), 0, 0, 'L');
    $pdf->Cell($textWidth - 42, 6, ficheText($serieBac ?: 'Non renseignée'), 0, 1, 'L');

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, ficheText('Email :'), 0, 0, 'L');
    $pdf->Cell($textWidth - 42, 6, ficheText($candidat['email'] ?? 'N/A'), 0, 1, 'L');

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(42, 6, ficheText('Téléphone :'), 0, 0, 'L');
    $pdf->Cell($textWidth - 42, 6, ficheText($candidat['telephone'] ?? 'Non renseigné'), 0, 1, 'L');

    $textEndY = $pdf->GetY();
    renderFichePhotoZoneFromBase64(
        $pdf,
        $photoBase64,
        $photoMime,
        $photoX,
        $photoY,
        $photoW,
        $photoH,
        $photoStoragePath
    );

    $pdf->SetY(max($textEndY, $photoY + $photoH) + 4);

    ensureSpacePreinscription($pdf, 45, $leftMargin, $rightMargin, $contentWidth);
    renderFicheSectionHeader($pdf, $leftMargin, $contentWidth, 'Informations du concours', 'green');

    $dateDebutSource = $concours['dateDebutDepot'] ?? $concours['dateDebut'] ?? null;
    $dateFinSource = $concours['dateFinDepot'] ?? $concours['dateFin'] ?? null;
    $dateDebut = !empty($dateDebutSource) ? date('d/m/Y', strtotime($dateDebutSource)) : 'N/A';
    $dateFin = !empty($dateFinSource) ? date('d/m/Y', strtotime($dateFinSource)) : 'N/A';
    $dateCompositionSource = $concours['dateDebutComposition'] ?? $concours['dateComposition'] ?? null;

    $pdf->Ln(1);
    $pdf->SetFont('Times', 'B', 11);
    $pdf->SetX($leftMargin + 2);
    $libelleConcours = ficheText($concours['libelle'] ?? 'Concours non renseigné');
    $pdf->MultiCell($contentWidth - 4, 6, $libelleConcours, 0, 'L');
    $pdf->Ln(3);

    $pdf->SetFont('Times', '', 11);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 7, ficheText("Période d'inscription :"), 0, 0, 'L');
    $pdf->MultiCell($contentWidth - 62, 7, ficheText('Du ') . $dateDebut . ficheText(' au ') . $dateFin, 0, 'L');
    $pdf->Ln(1);

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 7, ficheText('Centre de composition :'), 0, 0, 'L');

    // Uniquement le centre choisi par le candidat (jamais l'établissement du concours)
    $centreChoisi = null;
    if (!empty($data['centreCompositionChoisi']) && is_array($data['centreCompositionChoisi'])) {
        $centreChoisi = $data['centreCompositionChoisi'];
    } elseif (!empty($inscription['dossierInscription']['centreCompositionChoisi'])
        && is_array($inscription['dossierInscription']['centreCompositionChoisi'])) {
        $centreChoisi = $inscription['dossierInscription']['centreCompositionChoisi'];
    } elseif (!empty($inscription['dossierInscription']['centreChoisi']['centre']['nom'])) {
        $cc = $inscription['dossierInscription']['centreChoisi']['centre'];
        $centreChoisi = [
            'nom' => $cc['nom'],
            'ville' => $cc['ville'] ?? '',
            'adresse' => $cc['adresse'] ?? '',
        ];
    }

    $lieu = ficheText('Non renseigné');
    if (!empty($centreChoisi['nom'])) {
        $parts = [$centreChoisi['nom']];
        if (!empty($centreChoisi['ville'])) {
            $parts[] = $centreChoisi['ville'];
        }
        if (!empty($centreChoisi['adresse'])) {
            $parts[] = $centreChoisi['adresse'];
        }
        $lieu = ficheText(implode(' — ', $parts));
    }
    $pdf->MultiCell($contentWidth - 62, 7, $lieu, 0, 'L');
    $pdf->Ln(1);

    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(58, 7, ficheText('Date de composition :'), 0, 0, 'L');
    $dateComposition = !empty($dateCompositionSource)
        ? date('d/m/Y', strtotime($dateCompositionSource))
        : ficheText('À définir');
    $pdf->MultiCell($contentWidth - 62, 7, $dateComposition, 0, 'L');

    $pdf->Ln(3);
    ensureSpacePreinscription($pdf, 40, $leftMargin, $rightMargin, $contentWidth);
    renderFicheSectionHeader($pdf, $leftMargin, $contentWidth, 'État du dossier', 'blue');

    $statutAffiche = formatStatutFiche($statutRaw);
    $pdf->SetFont('Times', 'B', 11);
    $pdf->SetX($leftMargin + 2);
    $pdf->Cell(52, 7, ficheText('Statut actuel :'), 0, 0, 'L');
    $pdf->SetFont('Times', '', 11);
    $pdf->Cell(0, 7, ficheText($statutAffiche), 0, 1, 'L');
    $pdf->Ln(2);
    $pdf->SetFont('Times', 'I', 9);
    $pdf->SetTextColor(100, 100, 100);
    $pdf->SetX($leftMargin + 2);
    $pdf->MultiCell($contentWidth - 4, 5, ficheText(
        "Votre dossier est en cours d'examen par la commission. " .
        'Vous serez notifié par email de la décision. ' .
        'En cas de validation, une convocation officielle vous sera transmise.'
    ), 0, 'L');
    $pdf->SetTextColor(0, 0, 0);

    $pdf->Ln(2);
    ensureSpacePreinscription($pdf, 32, $leftMargin, $rightMargin, $contentWidth);
    renderFicheSectionHeader($pdf, $leftMargin, $contentWidth, 'Mentions importantes', 'red');
    $mentions = [
        "Compléter votre dossier dans les délais fixés par l'administration.",
        'Vérifier régulièrement votre espace UniPath pour suivre la décision de la commission.',
        'En cas de validation, votre convocation officielle sera générée automatiquement.',
    ];
    $pdf->SetFont('Times', '', 11);
    foreach ($mentions as $mention) {
        if ($pdf->GetY() + 8 > 270) {
            $pdf->AddPage();
            renderFicheOfficialHeader(
                $pdf,
                $leftMargin,
                $rightMargin,
                $contentWidth,
                'Fiche de pré-inscription',
                'Plateforme nationale UniPath'
            );
            renderFicheSectionHeader($pdf, $leftMargin, $contentWidth, 'Mentions importantes', 'red');
            $pdf->SetFont('Times', '', 11);
        }
        $pdf->SetX($leftMargin + 2);
        $pdf->MultiCell($contentWidth - 4, 5, ficheText('- ') . ficheText($mention), 0, 'L');
    }

    ensureSpacePreinscription($pdf, 20, $leftMargin, $rightMargin, $contentWidth);
    renderFicheSignatureBlock($pdf, 'Le Service des Inscriptions');
    renderFicheDocumentFooter($pdf);

    $pdf->Output('F', $outputFile);

    if (!file_exists($outputFile)) {
        die("Erreur: Le PDF n'a pas été créé correctement.\n");
    }

    echo "Succès: PDF créé avec succès: $outputFile\n";
} catch (Exception $e) {
    die('Erreur lors de la création du PDF: ' . $e->getMessage() . "\n");
}
