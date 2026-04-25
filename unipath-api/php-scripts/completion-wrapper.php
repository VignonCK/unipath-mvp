<?php
/**
 * Wrapper PHP pour le module SystemeCompletion
 * Permet aux contrôleurs Node.js d'appeler les fonctions PHP
 */

require_once __DIR__ . '/../php/db.php';
require_once __DIR__ . '/../php/SystemeCompletion.php';

// Fonction pour retourner une réponse JSON
function jsonResponse($data) {
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Fonction pour retourner une erreur JSON
function jsonError($message, $code = 500) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Récupérer les arguments de la ligne de commande
    $action = $argv[1] ?? null;
    
    if (!$action) {
        jsonError('Action non spécifiée', 400);
    }
    
    // Connexion à la base de données
    $pdo = Database::getInstance();
    $systemeCompletion = new SystemeCompletion($pdo);
    
    switch ($action) {
        case 'calculerPourcentage':
            $candidatId = $argv[2] ?? null;
            if (!$candidatId) {
                jsonError('candidatId manquant', 400);
            }
            
            $result = $systemeCompletion->calculerPourcentage($candidatId);
            jsonResponse($result);
            break;
            
        case 'obtenirPiecesManquantes':
            $candidatId = $argv[2] ?? null;
            if (!$candidatId) {
                jsonError('candidatId manquant', 400);
            }
            
            $result = $systemeCompletion->obtenirPiecesManquantes($candidatId);
            jsonResponse($result);
            break;
            
        case 'verifierCompletude':
            $candidatId = $argv[2] ?? null;
            if (!$candidatId) {
                jsonError('candidatId manquant', 400);
            }
            
            $result = $systemeCompletion->verifierCompletude($candidatId);
            jsonResponse(['estComplet' => $result]);
            break;
            
        case 'obtenirStatistiques':
            $candidatIds = [];
            if (isset($argv[2]) && $argv[2] !== 'null') {
                $candidatIds = json_decode($argv[2], true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    jsonError('Format JSON invalide pour candidatIds', 400);
                }
            }
            
            $result = $systemeCompletion->obtenirStatistiques($candidatIds);
            jsonResponse($result);
            break;
            
        case 'viderCache':
            $systemeCompletion->viderCache();
            jsonResponse(['success' => true, 'message' => 'Cache vidé']);
            break;
            
        case 'invaliderCacheCandidat':
            $candidatId = $argv[2] ?? null;
            if (!$candidatId) {
                jsonError('candidatId manquant', 400);
            }
            
            $systemeCompletion->invaliderCacheCandidat($candidatId);
            jsonResponse(['success' => true, 'message' => 'Cache candidat invalidé']);
            break;
            
        default:
            jsonError("Action non reconnue: $action", 400);
    }
    
} catch (Exception $e) {
    error_log("Erreur wrapper completion: " . $e->getMessage());
    jsonError($e->getMessage(), 500);
}
?>