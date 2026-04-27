<?php

/**
 * Système de Calcul de Complétude des Dossiers
 * 
 * Ce module PHP gère le calcul du pourcentage de complétude des dossiers candidats
 * basé sur les 5 pièces justificatives requises.
 * 
 * Architecture: PHP au cœur de la logique métier
 * 
 * @author UniPath Team
 * @version 1.0.0
 */

class SystemeCompletion {
    
    private $pdo;
    private $cache = [];
    private $cacheTTL = 300; // 5 minutes de cache
    
    // Définition des 5 pièces justificatives requises
    const PIECES_REQUISES = [
        'acteNaissance' => 'Acte de naissance',
        'carteIdentite' => 'Carte d\'identité',
        'photo' => 'Photo d\'identité',
        'releve' => 'Relevé de notes',
        'quittance' => 'Quittance de paiement'
    ];
    
    /**
     * Constructeur
     * @param PDO $pdo Connexion à la base de données
     */
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Calcule le pourcentage de complétude d'un dossier
     * 
     * @param string $candidatId ID du candidat
     * @return array Résultat avec pourcentage et détails
     * @throws Exception Si le candidat n'existe pas
     */
    public function calculerPourcentage($candidatId) {
        try {
            // Vérifier si le résultat est en cache et encore valide
            $cacheKey = "completion_" . $candidatId;
            if (isset($this->cache[$cacheKey])) {
                $cacheData = $this->cache[$cacheKey];
                if (time() - $cacheData['timestamp'] < $this->cacheTTL) {
                    return $cacheData['data'];
                } else {
                    // Cache expiré, le supprimer
                    unset($this->cache[$cacheKey]);
                }
            }
            
            // Vérifier que le candidat existe
            $candidat = $this->verifierCandidatExiste($candidatId);
            if (!$candidat) {
                throw new Exception("Candidat non trouvé: " . $candidatId);
            }
            
            // Récupérer le dossier du candidat
            $dossier = $this->obtenirDossier($candidatId);
            
            if (!$dossier) {
                // Aucun dossier créé = 0% de complétude
                $resultat = [
                    'candidatId' => $candidatId,
                    'pourcentage' => 0,
                    'piecesPresentes' => 0,
                    'piecesRequises' => count(self::PIECES_REQUISES),
                    'piecesManquantes' => array_keys(self::PIECES_REQUISES),
                    'estComplet' => false,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            } else {
                // Calculer la complétude
                $piecesPresentes = $this->compterPiecesPresentes($dossier);
                $totalPieces = count(self::PIECES_REQUISES);
                $pourcentage = round(($piecesPresentes / $totalPieces) * 100);
                
                $resultat = [
                    'candidatId' => $candidatId,
                    'pourcentage' => $pourcentage,
                    'piecesPresentes' => $piecesPresentes,
                    'piecesRequises' => $totalPieces,
                    'piecesManquantes' => $this->obtenirPiecesManquantes($dossier),
                    'estComplet' => $pourcentage === 100,
                    'timestamp' => date('Y-m-d H:i:s')
                ];
            }
            
            // Mettre en cache le résultat avec timestamp
            $this->cache[$cacheKey] = [
                'data' => $resultat,
                'timestamp' => time()
            ];
            
            
            return $resultat;
            
        } catch (Exception $e) {
            error_log("Erreur calcul complétude pour candidat $candidatId: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Obtient la liste des pièces manquantes pour un dossier
     * 
     * @param string $candidatId ID du candidat
     * @return array Liste des pièces manquantes
     */
    public function obtenirPiecesManquantes($candidatId) {
        if (is_string($candidatId)) {
            // Si on passe un candidatId, récupérer le dossier
            $dossier = $this->obtenirDossier($candidatId);
            if (!$dossier) {
                return array_keys(self::PIECES_REQUISES);
            }
        } else {
            // Si on passe directement le dossier
            $dossier = $candidatId;
        }
        
        $piecesManquantes = [];
        
        foreach (self::PIECES_REQUISES as $champ => $libelle) {
            if (empty($dossier[$champ])) {
                $piecesManquantes[] = $champ;
            }
        }
        
        return $piecesManquantes;
    }
    
    /**
     * Vérifie si un dossier est complet (100%)
     * 
     * @param string $candidatId ID du candidat
     * @return bool True si le dossier est complet
     */
    public function verifierCompletude($candidatId) {
        $resultat = $this->calculerPourcentage($candidatId);
        return $resultat['estComplet'];
    }
    
    /**
     * Obtient les statistiques de complétude pour plusieurs candidats (optimisé)
     * 
     * @param array $candidatIds Liste des IDs candidats
     * @return array Statistiques agrégées
     */
    public function obtenirStatistiques($candidatIds = []) {
        try {
            $stats = [
                'totalCandidats' => 0,
                'dossiersComplets' => 0,
                'dossiersPartiels' => 0,
                'dossiersVides' => 0,
                'pourcentageMoyen' => 0,
                'repartition' => [
                    '0%' => 0,
                    '1-25%' => 0,
                    '26-50%' => 0,
                    '51-75%' => 0,
                    '76-99%' => 0,
                    '100%' => 0
                ]
            ];
            
            if (empty($candidatIds)) {
                // Si aucun ID spécifié, prendre tous les candidats
                $candidatIds = $this->obtenirTousCandidats();
            }
            
            // Optimisation: récupérer tous les dossiers en une seule requête
            $dossiers = $this->obtenirDossiersMultiples($candidatIds);
            
            $totalPourcentage = 0;
            
            foreach ($candidatIds as $candidatId) {
                $dossier = $dossiers[$candidatId] ?? null;
                
                // Calculer directement sans passer par calculerPourcentage pour éviter les requêtes répétées
                if (!$dossier) {
                    $pourcentage = 0;
                } else {
                    $piecesPresentes = $this->compterPiecesPresentes($dossier);
                    $pourcentage = round(($piecesPresentes / count(self::PIECES_REQUISES)) * 100);
                }
                
                $stats['totalCandidats']++;
                $totalPourcentage += $pourcentage;
                
                // Catégoriser
                if ($pourcentage === 0) {
                    $stats['dossiersVides']++;
                    $stats['repartition']['0%']++;
                } elseif ($pourcentage === 100) {
                    $stats['dossiersComplets']++;
                    $stats['repartition']['100%']++;
                } else {
                    $stats['dossiersPartiels']++;
                    
                    if ($pourcentage <= 25) {
                        $stats['repartition']['1-25%']++;
                    } elseif ($pourcentage <= 50) {
                        $stats['repartition']['26-50%']++;
                    } elseif ($pourcentage <= 75) {
                        $stats['repartition']['51-75%']++;
                    } else {
                        $stats['repartition']['76-99%']++;
                    }
                }
            }
            
            // Calculer la moyenne
            if ($stats['totalCandidats'] > 0) {
                $stats['pourcentageMoyen'] = round($totalPourcentage / $stats['totalCandidats'], 1);
            }
            
            return $stats;
            
        } catch (Exception $e) {
            error_log("Erreur calcul statistiques: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Vide le cache de complétude
     */
    public function viderCache() {
        $this->cache = [];
    }
    
    /**
     * Invalide le cache pour un candidat spécifique
     * À appeler quand le dossier d'un candidat est modifié
     * 
     * @param string $candidatId ID du candidat
     */
    public function invaliderCacheCandidat($candidatId) {
        $cacheKey = "completion_" . $candidatId;
        unset($this->cache[$cacheKey]);
    }
    
    /**
     * Nettoie le cache expiré
     */
    public function nettoyerCacheExpire() {
        $now = time();
        foreach ($this->cache as $key => $cacheData) {
            if ($now - $cacheData['timestamp'] >= $this->cacheTTL) {
                unset($this->cache[$key]);
            }
        }
    }
    
    // ========== MÉTHODES PRIVÉES ==========
    
    /**
     * Vérifie qu'un candidat existe dans la base
     */
    private function verifierCandidatExiste($candidatId) {
        $stmt = $this->pdo->prepare("SELECT id FROM \"Candidat\" WHERE id = ?");
        $stmt->execute([$candidatId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Récupère le dossier d'un candidat (optimisé - seulement les champs nécessaires)
     */
    private function obtenirDossier($candidatId) {
        $stmt = $this->pdo->prepare("
            SELECT \"candidatId\", \"acteNaissance\", \"carteIdentite\", \"photo\", \"releve\", \"quittance\", \"updatedAt\"
            FROM \"Dossier\" 
            WHERE \"candidatId\" = ?
        ");
        $stmt->execute([$candidatId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Compte le nombre de pièces présentes dans un dossier
     */
    private function compterPiecesPresentes($dossier) {
        $count = 0;
        
        foreach (self::PIECES_REQUISES as $champ => $libelle) {
            if (!empty($dossier[$champ])) {
                $count++;
            }
        }
        
        return $count;
    }
    
    /**
     * Récupère tous les IDs candidats
     */
    private function obtenirTousCandidats() {
        $stmt = $this->pdo->query("SELECT id FROM \"Candidat\"");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    /**
     * Récupère plusieurs dossiers en une seule requête (optimisation anti N+1)
     * 
     * @param array $candidatIds Liste des IDs candidats
     * @return array Dossiers indexés par candidatId
     */
    private function obtenirDossiersMultiples($candidatIds) {
        if (empty($candidatIds)) {
            return [];
        }
        
        // Créer les placeholders pour la requête IN
        $placeholders = str_repeat('?,', count($candidatIds) - 1) . '?';
        
        $stmt = $this->pdo->prepare("
            SELECT \"candidatId\", \"acteNaissance\", \"carteIdentite\", \"photo\", \"releve\", \"quittance\", \"updatedAt\"
            FROM \"Dossier\" 
            WHERE \"candidatId\" IN ($placeholders)
        ");
        $stmt->execute($candidatIds);
        
        // Indexer par candidatId pour un accès rapide
        $dossiers = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $dossiers[$row['candidatId']] = $row;
        }
        
        return $dossiers;
    }
}

?>