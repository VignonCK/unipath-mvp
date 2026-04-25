<?php
/**
 * Wrapper PHP pour le module SystemeHistorique
 * Permet aux contrôleurs Node.js d'appeler les fonctions PHP
 */

require_once __DIR__ . '/../php/db.php';
require_once __DIR__ . '/../php/SystemeHistorique.php';

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
    $systemeHistorique = new SystemeHistorique($pdo);
    
    switch ($action) {
        case 'enregistrerAction':
            $utilisateurId = $argv[2] ?? null;
            $dossierId = $argv[3] ?? null;
            $typeAction = $argv[4] ?? null;
            $details = isset($argv[5]) && $argv[5] !== 'null' ? json_decode($argv[5], true) : null;
            $ipAddress = $argv[6] ?? null;
            $userAgent = $argv[7] ?? null;
            
            if (!$utilisateurId || !$dossierId || !$typeAction) {
                jsonError('Paramètres manquants: utilisateurId, dossierId, typeAction requis', 400);
            }
            
            $success = $systemeHistorique->enregistrerAction(
                $utilisateurId, 
                $dossierId, 
                $typeAction, 
                $details, 
                $ipAddress, 
                $userAgent
            );
            
            if ($success) {
                jsonResponse([
                    'success' => true,
                    'message' => 'Action enregistrée avec succès',
                    'timestamp' => date('Y-m-d H:i:s')
                ]);
            } else {
                jsonError('Échec de l\'enregistrement de l\'action', 500);
            }
            break;
            
        case 'obtenirHistorique':
            $dossierId = $argv[2] ?? null;
            $filtres = isset($argv[3]) && $argv[3] !== 'null' ? json_decode($argv[3], true) : null;
            $limite = isset($argv[4]) ? (int)$argv[4] : 50;
            $offset = isset($argv[5]) ? (int)$argv[5] : 0;
            
            if (!$dossierId) {
                jsonError('dossierId manquant', 400);
            }
            
            $result = $systemeHistorique->obtenirHistorique($dossierId, $filtres, $limite, $offset);
            jsonResponse($result);
            break;
            
        case 'verifierAcces':
            $utilisateurId = $argv[2] ?? null;
            $role = $argv[3] ?? null;
            
            if (!$utilisateurId || !$role) {
                jsonError('utilisateurId et role manquants', 400);
            }
            
            $acces = $systemeHistorique->verifierAcces($utilisateurId, $role);
            jsonResponse(['accesAutorise' => $acces]);
            break;
            
        case 'genererRapportAudit':
            $criteres = isset($argv[2]) && $argv[2] !== 'null' ? json_decode($argv[2], true) : [];
            
            if (isset($argv[2]) && json_last_error() !== JSON_ERROR_NONE) {
                jsonError('Format JSON invalide pour critères', 400);
            }
            
            $result = $systemeHistorique->genererRapportAudit($criteres);
            jsonResponse($result);
            break;
            
        case 'exporterCSV':
            $dossierId = isset($argv[2]) && $argv[2] !== 'null' ? $argv[2] : null;
            $filtres = isset($argv[3]) && $argv[3] !== 'null' ? json_decode($argv[3], true) : [];
            
            if (isset($argv[3]) && json_last_error() !== JSON_ERROR_NONE) {
                jsonError('Format JSON invalide pour filtres', 400);
            }
            
            $csv = $systemeHistorique->exporterCSV($dossierId, $filtres);
            jsonResponse(['contenu' => $csv]);
            break;
            
        case 'genererRapportAuditCSV':
            $criteres = isset($argv[2]) && $argv[2] !== 'null' ? json_decode($argv[2], true) : [];
            
            if (isset($argv[2]) && json_last_error() !== JSON_ERROR_NONE) {
                jsonError('Format JSON invalide pour critères', 400);
            }
            
            $result = $systemeHistorique->genererRapportAuditCSV($criteres);
            jsonResponse($result);
            break;
            
        case 'enregistrerTentativeNonAutorisee':
            $utilisateurId = $argv[2] ?? null;
            $typeAction = $argv[3] ?? null;
            $details = isset($argv[4]) && $argv[4] !== 'null' ? json_decode($argv[4], true) : [];
            
            if (!$utilisateurId || !$typeAction) {
                jsonError('utilisateurId et typeAction manquants', 400);
            }
            
            $systemeHistorique->enregistrerTentativeNonAutorisee($utilisateurId, $typeAction, $details);
            jsonResponse(['success' => true, 'message' => 'Tentative non autorisée enregistrée']);
            break;
            
        case 'viderCache':
            $systemeHistorique->viderCache();
            jsonResponse(['success' => true, 'message' => 'Cache vidé']);
            break;
            
        case 'invaliderCacheDossier':
            $dossierId = $argv[2] ?? null;
            if (!$dossierId) {
                jsonError('dossierId manquant', 400);
            }
            
            $systemeHistorique->invaliderCacheDossier($dossierId);
            jsonResponse(['success' => true, 'message' => 'Cache dossier invalidé']);
            break;
            
        default:
            jsonError("Action non reconnue: $action", 400);
    }
    
} catch (Exception $e) {
    error_log("Erreur wrapper historique: " . $e->getMessage());
    jsonError($e->getMessage(), 500);
}
?>