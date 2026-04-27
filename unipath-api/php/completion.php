<?php
/**
 * Système_Completion.php
 * Module PHP au cœur du calcul de complétude des dossiers
 * UniPath — EPAC, Université d'Abomey-Calavi
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/db.php';

class SystemeCompletion {

    // Les 5 pièces justificatives requises
    private static array $PIECES_REQUISES = [
        'acteNaissance' => 'Acte de naissance',
        'carteIdentite' => 'Carte d\'identité',
        'photo'         => 'Photo d\'identité',
        'releve'        => 'Relevé de notes',
        'quittance'     => 'Quittance d\'inscription',
    ];

    /**
     * Calcule le pourcentage de complétude d'un dossier
     * Propriété 1 : pourcentage = (pièces_déposées / 5) * 100
     * Propriété 2 : résultat toujours dans [0, 100]
     */
    public static function calculerPourcentage(string $candidatId): array {
        try {
            $db = Database::getInstance();
            
            // Récupérer le dossier du candidat
            $stmt = $db->prepare("
                SELECT acteNaissance, carteIdentite, photo, releve, quittance
                FROM \"Dossier\"
                WHERE \"candidatId\" = :candidatId
                LIMIT 1
            ");
            $stmt->execute([':candidatId' => $candidatId]);
            $dossier = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$dossier) {
                // Dossier non encore créé = 0%
                return [
                    'pourcentage'    => 0,
                    'piecesDeposees' => 0,
                    'piecesRequises' => 5,
                    'estComplet'     => false,
                    'pieces'         => self::getPiecesVides(),
                ];
            }

            return self::calculerDepuisDossier($dossier);

        } catch (Exception $e) {
            error_log("Erreur SystemeCompletion::calculerPourcentage - " . $e->getMessage());
            return [
                'pourcentage'    => 0,
                'piecesDeposees' => 0,
                'piecesRequises' => 5,
                'estComplet'     => false,
                'pieces'         => self::getPiecesVides(),
                'erreur'         => 'Calcul impossible',
            ];
        }
    }

    /**
     * Calcule la complétude depuis les données du dossier
     */
    private static function calculerDepuisDossier(array $dossier): array {
        $pieces = [];
        $piecesDeposees = 0;

        foreach (self::$PIECES_REQUISES as $cle => $libelle) {
            $deposee = !empty($dossier[$cle]);
            if ($deposee) $piecesDeposees++;

            $pieces[$cle] = [
                'libelle' => $libelle,
                'deposee' => $deposee,
                'url'     => $deposee ? $dossier[$cle] : null,
            ];
        }

        $total = count(self::$PIECES_REQUISES); // 5
        $pourcentage = (int) round(($piecesDeposees / $total) * 100);

        return [
            'pourcentage'    => $pourcentage,
            'piecesDeposees' => $piecesDeposees,
            'piecesRequises' => $total,
            'estComplet'     => $piecesDeposees === $total,
            'pieces'         => $pieces,
        ];
    }

    /**
     * Retourne les pièces manquantes uniquement
     */
    public static function obtenirPiecesManquantes(string $candidatId): array {
        $resultat = self::calculerPourcentage($candidatId);
        $manquantes = [];

        foreach ($resultat['pieces'] as $cle => $piece) {
            if (!$piece['deposee']) {
                $manquantes[] = [
                    'cle'     => $cle,
                    'libelle' => $piece['libelle'],
                ];
            }
        }

        return $manquantes;
    }

    /**
     * Vérifie si le dossier est complet (100%)
     * Propriété 4 : classification binaire
     */
    public static function verifierCompletude(string $candidatId): bool {
        $resultat = self::calculerPourcentage($candidatId);
        return $resultat['estComplet'];
    }

    /**
     * Retourne un tableau de pièces vides (dossier non créé)
     */
    private static function getPiecesVides(): array {
        $pieces = [];
        foreach (self::$PIECES_REQUISES as $cle => $libelle) {
            $pieces[$cle] = [
                'libelle' => $libelle,
                'deposee' => false,
                'url'     => null,
            ];
        }
        return $pieces;
    }
}

// ── Point d'entrée HTTP ──────────────────────────────────────
// Appelé par Node.js via exec() ou HTTP interne
if (php_sapi_name() !== 'cli') {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $candidatId = $_GET['candidatId'] ?? null;

    if (!$candidatId) {
        http_response_code(400);
        echo json_encode(['erreur' => 'candidatId requis']);
        exit;
    }

    $action = $_GET['action'] ?? 'calculer';

    switch ($action) {
        case 'calculer':
            echo json_encode(SystemeCompletion::calculerPourcentage($candidatId));
            break;
        case 'manquantes':
            echo json_encode(SystemeCompletion::obtenirPiecesManquantes($candidatId));
            break;
        case 'verifier':
            echo json_encode(['estComplet' => SystemeCompletion::verifierCompletude($candidatId)]);
            break;
        default:
            http_response_code(400);
            echo json_encode(['erreur' => 'Action inconnue']);
    }
}
