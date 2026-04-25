<?php

/**
 * Système de Gestion de l'Historique des Actions
 * 
 * Ce module PHP gère l'enregistrement et la récupération de l'historique
 * des actions effectuées sur les dossiers candidats.
 * 
 * Architecture: PHP au cœur de la logique métier
 * 
 * @author UniPath Team
 * @version 1.0.0
 */

class SystemeHistorique {
    
    private $pdo;
    private $cache = [];
    private $cacheTTL = 180; // 3 minutes de cache pour l'historique
    
    // Types d'actions supportées
    const TYPES_ACTIONS = [
        'DOSSIER_CREE' => 'Dossier créé',
        'PIECE_AJOUTEE' => 'Pièce justificative ajoutée',
        'PIECE_SUPPRIMEE' => 'Pièce justificative supprimée',
        'DOSSIER_VALIDE' => 'Dossier validé par la commission',
        'DOSSIER_REJETE' => 'Dossier rejeté par la commission',
        'DOSSIER_SOUMIS' => 'Dossier soumis par le candidat',
        'DOSSIER_MODIFIE' => 'Dossier modifié',
        'ACCES_REFUSE' => 'Tentative d\'accès non autorisé'
    ];
    
    // Rôles autorisés à consulter l'historique
    const ROLES_AUTORISES_LECTURE = ['COMMISSION', 'DGES'];
    
    /**
     * Constructeur
     * @param PDO $pdo Connexion à la base de données
     */
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    /**
     * Enregistre une action dans l'historique
     * 
     * @param string $utilisateurId ID de l'utilisateur qui effectue l'action
     * @param string $dossierId ID du dossier concerné
     * @param string $typeAction Type d'action (voir TYPES_ACTIONS)
     * @param array|null $details Détails optionnels de l'action
     * @param string|null $ipAddress Adresse IP de l'utilisateur
     * @param string|null $userAgent User Agent du navigateur
     * @return bool True si l'enregistrement a réussi
     * @throws Exception Si les paramètres sont invalides
     */
    public function enregistrerAction($utilisateurId, $dossierId, $typeAction, $details = null, $ipAddress = null, $userAgent = null) {
        try {
            // Validation des paramètres obligatoires
            if (empty($utilisateurId)) {
                throw new InvalidArgumentException("utilisateurId est obligatoire");
            }
            
            if (empty($dossierId)) {
                throw new InvalidArgumentException("dossierId est obligatoire");
            }
            
            if (empty($typeAction)) {
                throw new InvalidArgumentException("typeAction est obligatoire");
            }
            
            // Vérifier que le type d'action est valide
            if (!array_key_exists($typeAction, self::TYPES_ACTIONS)) {
                throw new InvalidArgumentException("Type d'action invalide: $typeAction");
            }
            
            // Vérifier que le dossier existe (sauf pour DOSSIER_CREE)
            if ($typeAction !== 'DOSSIER_CREE') {
                if (!$this->verifierDossierExiste($dossierId)) {
                    throw new InvalidArgumentException("Dossier inexistant: $dossierId");
                }
            }
            
            // Préparer les données à insérer
            $data = [
                'id' => $this->genererUUID(),
                'utilisateurId' => $utilisateurId,
                'dossierId' => $dossierId,
                'typeAction' => $typeAction,
                'details' => $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
                'timestamp' => date('Y-m-d H:i:s'),
                'ipAddress' => $ipAddress ?: $this->obtenirAdresseIP(),
                'userAgent' => $userAgent ?: $this->obtenirUserAgent(),
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ];
            
            // Insérer dans la base de données
            $stmt = $this->pdo->prepare("
                INSERT INTO \"ActionHistory\" 
                (id, \"utilisateurId\", \"dossierId\", \"typeAction\", details, timestamp, \"ipAddress\", \"userAgent\", \"createdAt\", \"updatedAt\")
                VALUES (:id, :utilisateurId, :dossierId, :typeAction, :details, :timestamp, :ipAddress, :userAgent, :createdAt, :updatedAt)
            ");
            
            $success = $stmt->execute($data);
            
            if ($success) {
                // Invalider le cache pour ce dossier
                $this->invaliderCacheDossier($dossierId);
                
                // Log de l'action pour audit
                error_log("Action enregistrée: $typeAction pour dossier $dossierId par utilisateur $utilisateurId");
            }
            
            return $success;
            
        } catch (Exception $e) {
            error_log("Erreur enregistrement historique: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Récupère l'historique des actions pour un dossier
     * 
     * @param string $dossierId ID du dossier
     * @param array|null $filtres Filtres optionnels (periode, utilisateur, typeAction)
     * @param int $limite Nombre maximum d'enregistrements à retourner
     * @param int $offset Décalage pour la pagination
     * @return array Liste des actions avec métadonnées
     */
    public function obtenirHistorique($dossierId, $filtres = null, $limite = 50, $offset = 0) {
        try {
            // Vérifier que le dossier existe
            if (!$this->verifierDossierExiste($dossierId)) {
                throw new InvalidArgumentException("Dossier inexistant: $dossierId");
            }
            
            // Vérifier le cache
            $cacheKey = $this->genererCleCacheHistorique($dossierId, $filtres, $limite, $offset);
            if (isset($this->cache[$cacheKey])) {
                $cacheData = $this->cache[$cacheKey];
                if (time() - $cacheData['timestamp'] < $this->cacheTTL) {
                    return $cacheData['data'];
                }
            }
            
            // Construire la requête SQL avec filtres
            $sql = "SELECT * FROM \"ActionHistory\" WHERE \"dossierId\" = :dossierId";
            $params = ['dossierId' => $dossierId];
            
            // Appliquer les filtres
            if ($filtres) {
                if (isset($filtres['dateDebut']) && isset($filtres['dateFin'])) {
                    $sql .= " AND timestamp BETWEEN :dateDebut AND :dateFin";
                    $params['dateDebut'] = $filtres['dateDebut'];
                    $params['dateFin'] = $filtres['dateFin'];
                }
                
                if (isset($filtres['utilisateur']) && !empty($filtres['utilisateur'])) {
                    $sql .= " AND \"utilisateurId\" = :utilisateur";
                    $params['utilisateur'] = $filtres['utilisateur'];
                }
                
                if (isset($filtres['typeAction']) && !empty($filtres['typeAction'])) {
                    $sql .= " AND \"typeAction\" = :typeAction";
                    $params['typeAction'] = $filtres['typeAction'];
                }
            }
            
            // Tri par timestamp décroissant (plus récent en premier)
            $sql .= " ORDER BY timestamp DESC";
            
            // Pagination
            $sql .= " LIMIT :limite OFFSET :offset";
            $params['limite'] = $limite;
            $params['offset'] = $offset;
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Enrichir les données avec les informations utilisateur
            $actionsEnrichies = $this->enrichirAvecInfosUtilisateur($actions);
            
            // Compter le total pour la pagination
            $totalSql = "SELECT COUNT(*) FROM \"ActionHistory\" WHERE \"dossierId\" = :dossierId";
            $totalParams = ['dossierId' => $dossierId];
            
            if ($filtres) {
                if (isset($filtres['dateDebut']) && isset($filtres['dateFin'])) {
                    $totalSql .= " AND timestamp BETWEEN :dateDebut AND :dateFin";
                    $totalParams['dateDebut'] = $filtres['dateDebut'];
                    $totalParams['dateFin'] = $filtres['dateFin'];
                }
                
                if (isset($filtres['utilisateur']) && !empty($filtres['utilisateur'])) {
                    $totalSql .= " AND \"utilisateurId\" = :utilisateur";
                    $totalParams['utilisateur'] = $filtres['utilisateur'];
                }
                
                if (isset($filtres['typeAction']) && !empty($filtres['typeAction'])) {
                    $totalSql .= " AND \"typeAction\" = :typeAction";
                    $totalParams['typeAction'] = $filtres['typeAction'];
                }
            }
            
            $totalStmt = $this->pdo->prepare($totalSql);
            $totalStmt->execute($totalParams);
            $total = $totalStmt->fetchColumn();
            
            $resultat = [
                'dossierId' => $dossierId,
                'actions' => $actionsEnrichies,
                'pagination' => [
                    'total' => (int)$total,
                    'limite' => $limite,
                    'offset' => $offset,
                    'pages' => ceil($total / $limite)
                ],
                'filtres' => $filtres,
                'timestamp' => date('Y-m-d H:i:s')
            ];
            
            // Mettre en cache
            $this->cache[$cacheKey] = [
                'data' => $resultat,
                'timestamp' => time()
            ];
            
            return $resultat;
            
        } catch (Exception $e) {
            error_log("Erreur récupération historique pour dossier $dossierId: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Vérifie si un utilisateur a l'autorisation d'accéder à l'historique
     * 
     * @param string $utilisateurId ID de l'utilisateur
     * @param string $role Rôle de l'utilisateur
     * @return bool True si l'accès est autorisé
     */
    public function verifierAcces($utilisateurId, $role) {
        try {
            // Seuls COMMISSION et DGES peuvent accéder à l'historique
            $acces = in_array($role, self::ROLES_AUTORISES_LECTURE);
            
            if (!$acces) {
                // Enregistrer la tentative d'accès non autorisé
                $this->enregistrerTentativeNonAutorisee($utilisateurId, 'ACCES_HISTORIQUE_REFUSE', [
                    'role' => $role,
                    'action' => 'consultation_historique'
                ]);
            }
            
            return $acces;
            
        } catch (Exception $e) {
            error_log("Erreur vérification accès pour utilisateur $utilisateurId: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Génère un rapport d'audit des actions
     * 
     * @param array $criteres Critères de filtrage (periode, utilisateurs, types_actions)
     * @return array Rapport avec statistiques et détails
     */
    public function genererRapportAudit($criteres = []) {
        try {
            $sql = "SELECT * FROM \"ActionHistory\"";
            $params = [];
            $conditions = [];
            
            // Appliquer les critères
            if (isset($criteres['dateDebut']) && isset($criteres['dateFin'])) {
                $conditions[] = "timestamp BETWEEN :dateDebut AND :dateFin";
                $params['dateDebut'] = $criteres['dateDebut'];
                $params['dateFin'] = $criteres['dateFin'];
            }
            
            if (isset($criteres['utilisateurs']) && !empty($criteres['utilisateurs'])) {
                $placeholders = str_repeat('?,', count($criteres['utilisateurs']) - 1) . '?';
                $conditions[] = "\"utilisateurId\" IN ($placeholders)";
                $params = array_merge($params, $criteres['utilisateurs']);
            }
            
            if (isset($criteres['typesActions']) && !empty($criteres['typesActions'])) {
                $placeholders = str_repeat('?,', count($criteres['typesActions']) - 1) . '?';
                $conditions[] = "\"typeAction\" IN ($placeholders)";
                $params = array_merge($params, $criteres['typesActions']);
            }
            
            if (!empty($conditions)) {
                $sql .= " WHERE " . implode(' AND ', $conditions);
            }
            
            $sql .= " ORDER BY timestamp DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Enrichir avec les informations utilisateur
            $actionsEnrichies = $this->enrichirAvecInfosUtilisateur($actions);
            
            // Calculer les statistiques
            $stats = $this->calculerStatistiquesAudit($actions);
            
            return [
                'criteres' => $criteres,
                'statistiques' => $stats,
                'actions' => $actionsEnrichies,
                'totalActions' => count($actions),
                'dateGeneration' => date('Y-m-d H:i:s')
            ];
            
        } catch (Exception $e) {
            error_log("Erreur génération rapport audit: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Exporte l'historique au format CSV
     * 
     * @param string $dossierId ID du dossier (optionnel, si vide exporte tout)
     * @param array $filtres Filtres optionnels
     * @return string Contenu CSV
     */
    public function exporterCSV($dossierId = null, $filtres = []) {
        try {
            $sql = "SELECT * FROM \"ActionHistory\"";
            $params = [];
            $conditions = [];
            
            if ($dossierId) {
                $conditions[] = "\"dossierId\" = :dossierId";
                $params['dossierId'] = $dossierId;
            }
            
            // Appliquer les filtres
            if (isset($filtres['dateDebut']) && isset($filtres['dateFin'])) {
                $conditions[] = "timestamp BETWEEN :dateDebut AND :dateFin";
                $params['dateDebut'] = $filtres['dateDebut'];
                $params['dateFin'] = $filtres['dateFin'];
            }
            
            if (isset($filtres['utilisateur']) && !empty($filtres['utilisateur'])) {
                $conditions[] = "\"utilisateurId\" = :utilisateur";
                $params['utilisateur'] = $filtres['utilisateur'];
            }
            
            if (isset($filtres['typeAction']) && !empty($filtres['typeAction'])) {
                $conditions[] = "\"typeAction\" = :typeAction";
                $params['typeAction'] = $filtres['typeAction'];
            }
            
            if (!empty($conditions)) {
                $sql .= " WHERE " . implode(' AND ', $conditions);
            }
            
            $sql .= " ORDER BY timestamp DESC";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Enrichir avec les informations utilisateur
            $actionsEnrichies = $this->enrichirAvecInfosUtilisateur($actions);
            
            // Générer le CSV
            $csv = $this->genererContenuCSV($actionsEnrichies);
            
            return $csv;
            
        } catch (Exception $e) {
            error_log("Erreur export CSV: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Génère le rapport d'audit au format CSV pour téléchargement
     * 
     * @param array $criteres Critères de filtrage
     * @return array Données pour le téléchargement (contenu, nom_fichier)
     */
    public function genererRapportAuditCSV($criteres = []) {
        try {
            $rapport = $this->genererRapportAudit($criteres);
            $csv = $this->genererContenuCSV($rapport['actions']);
            
            // Générer un nom de fichier avec timestamp
            $timestamp = date('Y-m-d_H-i-s');
            $nomFichier = "rapport_audit_$timestamp.csv";
            
            return [
                'contenu' => $csv,
                'nomFichier' => $nomFichier,
                'mimeType' => 'text/csv',
                'taille' => strlen($csv)
            ];
            
        } catch (Exception $e) {
            error_log("Erreur génération rapport CSV: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Enregistre une tentative d'accès non autorisé
     * 
     * @param string $utilisateurId ID de l'utilisateur
     * @param string $typeAction Type d'action refusée
     * @param array $details Détails de la tentative
     */
    public function enregistrerTentativeNonAutorisee($utilisateurId, $typeAction, $details = []) {
        try {
            $detailsComplets = array_merge($details, [
                'timestamp' => date('Y-m-d H:i:s'),
                'ip' => $this->obtenirAdresseIP(),
                'userAgent' => $this->obtenirUserAgent()
            ]);
            
            // Utiliser un dossierId spécial pour les tentatives non autorisées
            $dossierId = 'SECURITY_LOG';
            
            $stmt = $this->pdo->prepare("
                INSERT INTO \"ActionHistory\" 
                (id, \"utilisateurId\", \"dossierId\", \"typeAction\", details, timestamp, \"ipAddress\", \"userAgent\", \"createdAt\", \"updatedAt\")
                VALUES (:id, :utilisateurId, :dossierId, :typeAction, :details, :timestamp, :ipAddress, :userAgent, :createdAt, :updatedAt)
            ");
            
            $stmt->execute([
                'id' => $this->genererUUID(),
                'utilisateurId' => $utilisateurId,
                'dossierId' => $dossierId,
                'typeAction' => $typeAction,
                'details' => json_encode($detailsComplets, JSON_UNESCAPED_UNICODE),
                'timestamp' => date('Y-m-d H:i:s'),
                'ipAddress' => $this->obtenirAdresseIP(),
                'userAgent' => $this->obtenirUserAgent(),
                'createdAt' => date('Y-m-d H:i:s'),
                'updatedAt' => date('Y-m-d H:i:s')
            ]);
            
            error_log("Tentative d'accès non autorisé enregistrée: $typeAction par utilisateur $utilisateurId");
            
        } catch (Exception $e) {
            error_log("Erreur enregistrement tentative non autorisée: " . $e->getMessage());
        }
    }
    
    /**
     * Vide le cache d'historique
     */
    public function viderCache() {
        $this->cache = [];
    }
    
    /**
     * Invalide le cache pour un dossier spécifique
     */
    public function invaliderCacheDossier($dossierId) {
        foreach (array_keys($this->cache) as $key) {
            if (strpos($key, "history_{$dossierId}_") === 0) {
                unset($this->cache[$key]);
            }
        }
    }
    
    // ========== MÉTHODES PRIVÉES ==========
    
    /**
     * Vérifie qu'un dossier existe dans la base
     */
    private function verifierDossierExiste($dossierId) {
        if ($dossierId === 'SECURITY_LOG') {
            return true; // Dossier spécial pour les logs de sécurité
        }
        
        $stmt = $this->pdo->prepare("SELECT id FROM \"Dossier\" WHERE id = ?");
        $stmt->execute([$dossierId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    }
    
    /**
     * Enrichit les actions avec les informations utilisateur
     */
    private function enrichirAvecInfosUtilisateur($actions) {
        $utilisateurIds = array_unique(array_column($actions, 'utilisateurId'));
        $utilisateurs = $this->obtenirInfosUtilisateurs($utilisateurIds);
        
        foreach ($actions as &$action) {
            $userId = $action['utilisateurId'];
            $action['utilisateur'] = $utilisateurs[$userId] ?? [
                'nom' => 'Utilisateur inconnu',
                'email' => 'inconnu@example.com',
                'role' => 'INCONNU'
            ];
            
            // Décoder les détails JSON
            if ($action['details']) {
                $action['details'] = json_decode($action['details'], true);
            }
            
            // Ajouter le libellé de l'action
            $action['typeActionLibelle'] = self::TYPES_ACTIONS[$action['typeAction']] ?? $action['typeAction'];
        }
        
        return $actions;
    }
    
    /**
     * Récupère les informations des utilisateurs
     */
    private function obtenirInfosUtilisateurs($utilisateurIds) {
        if (empty($utilisateurIds)) {
            return [];
        }
        
        $utilisateurs = [];
        
        // Chercher dans les candidats
        $placeholders = str_repeat('?,', count($utilisateurIds) - 1) . '?';
        $stmt = $this->pdo->prepare("
            SELECT id, nom, prenom, email, role 
            FROM \"Candidat\" 
            WHERE id IN ($placeholders)
        ");
        $stmt->execute($utilisateurIds);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $utilisateurs[$row['id']] = [
                'nom' => $row['prenom'] . ' ' . $row['nom'],
                'email' => $row['email'],
                'role' => $row['role']
            ];
        }
        
        // Chercher dans les membres de commission
        $stmt = $this->pdo->prepare("
            SELECT id, nom, prenom, email, role 
            FROM \"MembreCommission\" 
            WHERE id IN ($placeholders)
        ");
        $stmt->execute($utilisateurIds);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $utilisateurs[$row['id']] = [
                'nom' => $row['prenom'] . ' ' . $row['nom'],
                'email' => $row['email'],
                'role' => $row['role']
            ];
        }
        
        // Chercher dans les administrateurs DGES
        $stmt = $this->pdo->prepare("
            SELECT id, nom, prenom, email, role 
            FROM \"AdministrateurDGES\" 
            WHERE id IN ($placeholders)
        ");
        $stmt->execute($utilisateurIds);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $utilisateurs[$row['id']] = [
                'nom' => $row['prenom'] . ' ' . $row['nom'],
                'email' => $row['email'],
                'role' => $row['role']
            ];
        }
        
        return $utilisateurs;
    }
    
    /**
     * Calcule les statistiques pour un rapport d'audit
     */
    private function calculerStatistiquesAudit($actions) {
        $stats = [
            'totalActions' => count($actions),
            'parType' => [],
            'parUtilisateur' => [],
            'parJour' => [],
            'tentativesNonAutorisees' => 0
        ];
        
        foreach ($actions as $action) {
            // Statistiques par type
            $type = $action['typeAction'];
            $stats['parType'][$type] = ($stats['parType'][$type] ?? 0) + 1;
            
            // Statistiques par utilisateur
            $userId = $action['utilisateurId'];
            $stats['parUtilisateur'][$userId] = ($stats['parUtilisateur'][$userId] ?? 0) + 1;
            
            // Statistiques par jour
            $jour = date('Y-m-d', strtotime($action['timestamp']));
            $stats['parJour'][$jour] = ($stats['parJour'][$jour] ?? 0) + 1;
            
            // Compter les tentatives non autorisées
            if (strpos($type, 'REFUSE') !== false || $type === 'ACCES_REFUSE') {
                $stats['tentativesNonAutorisees']++;
            }
        }
        
        return $stats;
    }
    
    /**
     * Génère une clé de cache pour l'historique
     */
    private function genererCleCacheHistorique($dossierId, $filtres, $limite, $offset) {
        $filtresStr = $filtres ? md5(serialize($filtres)) : 'no_filters';
        return "history_{$dossierId}_{$filtresStr}_{$limite}_{$offset}";
    }
    
    /**
     * Génère un UUID v4
     */
    private function genererUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    /**
     * Obtient l'adresse IP du client
     */
    private function obtenirAdresseIP() {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Obtient le User Agent du client
     */
    private function obtenirUserAgent() {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    }
    
    /**
     * Génère le contenu CSV à partir des actions
     */
    private function genererContenuCSV($actions) {
        // En-têtes CSV
        $headers = [
            'ID',
            'Date/Heure',
            'Utilisateur',
            'Email Utilisateur',
            'Rôle',
            'Dossier ID',
            'Type Action',
            'Action',
            'Détails',
            'Adresse IP',
            'Navigateur'
        ];
        
        // Créer le contenu CSV
        $csv = [];
        
        // Ajouter les en-têtes
        $csv[] = $this->echapperCSV($headers);
        
        // Ajouter les données
        foreach ($actions as $action) {
            $details = '';
            if ($action['details']) {
                if (is_array($action['details'])) {
                    $details = json_encode($action['details'], JSON_UNESCAPED_UNICODE);
                } else {
                    $details = $action['details'];
                }
            }
            
            $ligne = [
                $action['id'],
                $action['timestamp'],
                $action['utilisateur']['nom'] ?? 'Inconnu',
                $action['utilisateur']['email'] ?? 'inconnu@example.com',
                $action['utilisateur']['role'] ?? 'INCONNU',
                $action['dossierId'],
                $action['typeAction'],
                $action['typeActionLibelle'] ?? $action['typeAction'],
                $details,
                $action['ipAddress'] ?? '',
                $action['userAgent'] ?? ''
            ];
            
            $csv[] = $this->echapperCSV($ligne);
        }
        
        return implode("\n", $csv);
    }
    
    /**
     * Échappe les valeurs pour le format CSV
     */
    private function echapperCSV($ligne) {
        $escaped = [];
        foreach ($ligne as $valeur) {
            // Échapper les guillemets et entourer de guillemets si nécessaire
            $valeur = str_replace('"', '""', $valeur);
            if (strpos($valeur, ',') !== false || strpos($valeur, '"') !== false || strpos($valeur, "\n") !== false) {
                $valeur = '"' . $valeur . '"';
            }
            $escaped[] = $valeur;
        }
        return implode(',', $escaped);
    }
}

?>