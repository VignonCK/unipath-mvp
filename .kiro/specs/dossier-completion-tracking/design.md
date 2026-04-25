# Document de Conception Technique - Suivi de Complétude des Dossiers

## Vue d'ensemble

Cette conception technique détaille l'implémentation des fonctionnalités de suivi de complétude des dossiers et d'historique des actions pour la plateforme UniPath. Le système s'intègre dans l'architecture hybride existante avec **PHP au cœur de la logique métier**, Node.js pour l'API backend, et React pour l'interface utilisateur.

### Objectifs Techniques

1. **Module PHP de calcul de complétude** (`Système_Completion`) - Calcul en temps réel du pourcentage de complétude basé sur les 5 pièces justificatives
2. **Module PHP d'historique des actions** (`Système_Historique`) - Traçabilité complète des actions effectuées sur les dossiers
3. **Endpoints Node.js** - Exposition des fonctionnalités PHP via l'API REST existante
4. **Composants React** - Interface utilisateur pour l'affichage des données de complétude et d'historique

### Contraintes Architecturales

- **PHP obligatoire** pour toute la logique métier (calculs, validations, traçabilité)
- **Intégration transparente** avec l'architecture existante (Prisma, Supabase, système de rôles)
- **Aucune modification** du schéma Prisma existant (table Dossier)
- **Respect des rôles** existants (CANDIDAT, COMMISSION, DGES)

## Architecture

### Architecture Globale

```mermaid
graph TB
    subgraph "Frontend React"
        UI_CANDIDAT[Interface Candidat]
        UI_COMMISSION[Interface Commission]
        COMP_PROGRESS[Composant ProgressBar]
        COMP_HISTORY[Composant HistoryViewer]
    end
    
    subgraph "API Node.js"
        API_COMPLETION[/completion/:candidatId]
        API_HISTORY[/history/:dossierId]
        API_MIDDLEWARE[Middleware Auth]
    end
    
    subgraph "Modules PHP"
        PHP_COMPLETION[Système_Completion.php]
        PHP_HISTORY[Système_Historique.php]
        PHP_UTILS[Utils.php]
    end
    
    subgraph "Base de données"
        DB_DOSSIER[(Table Dossier)]
        DB_HISTORY[(Table ActionHistory)]
        DB_CANDIDAT[(Table Candidat)]
    end
    
    UI_CANDIDAT --> API_COMPLETION
    UI_COMMISSION --> API_HISTORY
    API_COMPLETION --> PHP_COMPLETION
    API_HISTORY --> PHP_HISTORY
    PHP_COMPLETION --> DB_DOSSIER
    PHP_HISTORY --> DB_HISTORY
    
    COMP_PROGRESS --> API_COMPLETION
    COMP_HISTORY --> API_HISTORY
```

### Flux de Données

1. **Calcul de Complétude** : React → Node.js → PHP → Prisma → PostgreSQL
2. **Historique des Actions** : React → Node.js → PHP → Prisma → PostgreSQL
3. **Authentification** : Middleware Node.js vérifie les rôles avant d'appeler PHP

## Composants et Interfaces

### 1. Module PHP Système_Completion

**Fichier** : `unipath-api/php/completion.php`

**Responsabilités** :
- Calcul du pourcentage de complétude (0% à 100%)
- Identification des pièces manquantes
- Validation des données de dossier
- Optimisation des requêtes de base de données

**Interface Publique** :
```php
class SystemeCompletion {
    public static function calculerPourcentage(string $candidatId): array
    public static function obtenirPiecesManquantes(string $candidatId): array
    public static function verifierCompletude(string $candidatId): bool
}
```

**Algorithme de Calcul** :
```php
// Pièces requises : acteNaissance, carteIdentite, photo, releve, quittance
$piecesRequises = 5;
$piecesDeposees = count(array_filter([
    $dossier->acteNaissance,
    $dossier->carteIdentite, 
    $dossier->photo,
    $dossier->releve,
    $dossier->quittance
]));
$pourcentage = ($piecesDeposees / $piecesRequises) * 100;
```

### 2. Module PHP Système_Historique

**Fichier** : `unipath-api/php/historique.php`

**Responsabilités** :
- Enregistrement des actions sur les dossiers
- Récupération de l'historique avec filtrage
- Contrôle d'accès basé sur les rôles
- Génération de rapports d'audit

**Interface Publique** :
```php
class SystemeHistorique {
    public static function enregistrerAction(string $utilisateurId, string $dossierId, string $typeAction, ?array $details = null): bool
    public static function obtenirHistorique(string $dossierId, ?array $filtres = null): array
    public static function genererRapportAudit(array $criteres): array
    public static function verifierAcces(string $utilisateurId, string $role): bool
}
```

**Types d'Actions Supportées** :
- `DOSSIER_CREE` - Création du dossier
- `PIECE_AJOUTEE` - Ajout d'une pièce justificative
- `PIECE_SUPPRIMEE` - Suppression d'une pièce
- `DOSSIER_VALIDE` - Validation par la commission
- `DOSSIER_REJETE` - Rejet par la commission
- `DOSSIER_SOUMIS` - Soumission par le candidat

### 3. Endpoints Node.js

**Fichier** : `unipath-api/src/routes/completion.js`

```javascript
// GET /api/completion/:candidatId
// Retourne le pourcentage de complétude et les pièces manquantes
router.get('/completion/:candidatId', authenticateToken, async (req, res) => {
    // Vérification des permissions
    // Appel du module PHP Système_Completion
    // Retour des données JSON
});

// GET /api/history/:dossierId  
// Retourne l'historique des actions sur un dossier
router.get('/history/:dossierId', authenticateToken, authorizeRoles(['COMMISSION', 'DGES']), async (req, res) => {
    // Vérification des permissions
    // Appel du module PHP Système_Historique
    // Retour des données JSON
});

// POST /api/history/action
// Enregistre une nouvelle action dans l'historique
router.post('/history/action', authenticateToken, async (req, res) => {
    // Validation des données
    // Appel du module PHP Système_Historique
    // Confirmation de l'enregistrement
});
```

### 4. Composants React

#### Composant ProgressBar

**Fichier** : `unipath-front/src/components/ProgressBar.jsx`

```jsx
const ProgressBar = ({ candidatId }) => {
    const [completion, setCompletion] = useState(null);
    const [pieces, setPieces] = useState([]);
    
    useEffect(() => {
        fetchCompletionData(candidatId);
    }, [candidatId]);
    
    return (
        <div className="completion-container">
            <div className="progress-bar">
                <div className="progress-fill" style={{width: `${completion?.pourcentage}%`}} />
            </div>
            <PiecesList pieces={pieces} />
        </div>
    );
};
```

#### Composant HistoryViewer

**Fichier** : `unipath-front/src/components/HistoryViewer.jsx`

```jsx
const HistoryViewer = ({ dossierId, userRole }) => {
    const [history, setHistory] = useState([]);
    const [filters, setFilters] = useState({});
    
    // Accessible uniquement aux rôles COMMISSION et DGES
    if (!['COMMISSION', 'DGES'].includes(userRole)) {
        return <AccessDenied />;
    }
    
    return (
        <div className="history-container">
            <HistoryFilters onFilterChange={setFilters} />
            <HistoryTimeline actions={history} />
        </div>
    );
};
```

## Modèles de Données

### Extension du Schéma (Nouvelle Table)

Bien que le schéma Prisma existant ne soit pas modifié, une nouvelle table sera créée pour l'historique :

```sql
-- Migration SQL pour la table ActionHistory
CREATE TABLE "ActionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "utilisateurId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "typeAction" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT
);

CREATE INDEX "ActionHistory_dossierId_idx" ON "ActionHistory"("dossierId");
CREATE INDEX "ActionHistory_utilisateurId_idx" ON "ActionHistory"("utilisateurId");
CREATE INDEX "ActionHistory_timestamp_idx" ON "ActionHistory"("timestamp");
```

### Structure des Données de Complétude

```typescript
interface CompletionData {
    candidatId: string;
    pourcentage: number; // 0-100
    piecesDeposees: number; // 0-5
    piecesRequises: number; // 5
    pieces: {
        acteNaissance: PieceStatus;
        carteIdentite: PieceStatus;
        photo: PieceStatus;
        releve: PieceStatus;
        quittance: PieceStatus;
    };
    estComplet: boolean;
    derniereMiseAJour: Date;
}

interface PieceStatus {
    nom: string;
    deposee: boolean;
    url?: string;
    dateDepot?: Date;
}
```

### Structure des Données d'Historique

```typescript
interface ActionHistory {
    id: string;
    utilisateurId: string;
    dossierId: string;
    typeAction: ActionType;
    details?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}

enum ActionType {
    DOSSIER_CREE = 'DOSSIER_CREE',
    PIECE_AJOUTEE = 'PIECE_AJOUTEE',
    PIECE_SUPPRIMEE = 'PIECE_SUPPRIMEE',
    DOSSIER_VALIDE = 'DOSSIER_VALIDE',
    DOSSIER_REJETE = 'DOSSIER_REJETE',
    DOSSIER_SOUMIS = 'DOSSIER_SOUMIS'
}
```

## Propriétés de Correction

*Une propriété est une caractéristique ou un comportement qui doit être vrai dans toutes les exécutions valides d'un système - essentiellement, une déclaration formelle sur ce que le système doit faire. Les propriétés servent de pont entre les spécifications lisibles par l'homme et les garanties de correction vérifiables par machine.*

Après analyse des critères d'acceptation, les propriétés suivantes ont été identifiées pour les tests basés sur les propriétés :

### Propriété 1: Calcul de Pourcentage de Complétude

*Pour tout* dossier candidat avec un nombre donné de pièces justificatives déposées (0 à 5), le pourcentage de complétude calculé doit être égal à (nombre_pieces_deposees / 5) * 100

**Valide : Exigences 1.1, 1.2**

### Propriété 2: Bornes du Pourcentage

*Pour tout* dossier candidat, le pourcentage de complétude doit toujours être dans l'intervalle [0, 100] inclus

**Valide : Exigences 1.2**

### Propriété 3: Cohérence du Recalcul

*Pour tout* dossier candidat, l'ajout d'une pièce justificative doit augmenter le pourcentage de 20%, et la suppression d'une pièce doit le diminuer de 20%

**Valide : Exigences 1.3**

### Propriété 4: Classification Binaire des Pièces

*Pour toute* pièce justificative dans un dossier, elle doit être soit "déposée" soit "manquante", mais jamais les deux simultanément

**Valide : Exigences 2.1**

### Propriété 5: Enregistrement Complet des Actions

*Pour toute* action effectuée sur un dossier (validation, rejet, modification), un enregistrement d'historique doit être créé contenant obligatoirement : utilisateur_id, type_action, dossier_id, timestamp

**Valide : Exigences 3.1, 3.2, 3.3**

### Propriété 6: Contrôle d'Accès par Rôle

*Pour tout* utilisateur avec le rôle CANDIDAT, l'accès aux données d'historique doit être refusé, et pour tout utilisateur avec le rôle COMMISSION ou DGES, l'accès doit être autorisé

**Valide : Exigences 4.1, 4.2, 4.3**

### Propriété 7: Audit des Tentatives Non Autorisées

*Pour toute* tentative d'accès non autorisé aux données d'historique, un enregistrement d'audit doit être créé dans le système

**Valide : Exigences 4.5**

### Propriété 8: Notification de Complétude

*Pour tout* dossier dont le pourcentage de complétude atteint exactement 100%, une notification de succès doit être déclenchée

**Valide : Exigences 7.1**

### Propriété 9: Enregistrement des Transitions d'État

*Pour toute* transition d'un dossier de l'état "incomplet" à "complet", une notification visuelle doit être déclenchée et l'action doit être enregistrée dans l'historique

**Valide : Exigences 7.3, 7.5**

### Propriété 10: Filtrage Correct de l'Historique

*Pour tout* filtre appliqué sur l'historique (par période, utilisateur, ou type d'action), tous les résultats retournés doivent correspondre exactement aux critères du filtre

**Valide : Exigences 8.1**

### Propriété 11: Statistiques Agrégées Correctes

*Pour tout* rapport d'audit généré, les statistiques agrégées (nombre d'actions par type, par utilisateur) doivent correspondre exactement au décompte réel des actions dans l'historique

**Valide : Exigences 8.5**

## Gestion des Erreurs

### Stratégies de Gestion d'Erreur

#### 1. Erreurs de Calcul de Complétude

**Cas d'Erreur** :
- Dossier candidat inexistant
- Données de dossier corrompues
- Pièces justificatives avec URLs invalides

**Stratégie** :
```php
// Dans Système_Completion
try {
    $dossier = $this->prisma->dossier->findUnique(['where' => ['candidatId' => $candidatId]]);
    if (!$dossier) {
        throw new DossierNotFoundException("Dossier non trouvé pour le candidat: $candidatId");
    }
    return $this->calculerPourcentageInterne($dossier);
} catch (Exception $e) {
    $this->logger->error("Erreur calcul complétude", ['candidatId' => $candidatId, 'error' => $e->getMessage()]);
    return ['pourcentage' => 0, 'erreur' => 'Calcul impossible', 'pieces' => []];
}
```

#### 2. Erreurs d'Historique

**Cas d'Erreur** :
- Échec d'enregistrement en base de données
- Utilisateur inexistant
- Dossier inexistant
- Données JSON malformées

**Stratégie** :
```php
// Dans Système_Historique
public static function enregistrerAction(string $utilisateurId, string $dossierId, string $typeAction, ?array $details = null): bool {
    try {
        // Validation des paramètres
        if (empty($utilisateurId) || empty($dossierId) || empty($typeAction)) {
            throw new InvalidArgumentException("Paramètres obligatoires manquants");
        }
        
        // Vérification de l'existence du dossier
        $dossierExists = $this->prisma->dossier->findUnique(['where' => ['id' => $dossierId]]);
        if (!$dossierExists) {
            throw new DossierNotFoundException("Dossier inexistant: $dossierId");
        }
        
        // Enregistrement
        $this->prisma->actionHistory->create([
            'data' => [
                'utilisateurId' => $utilisateurId,
                'dossierId' => $dossierId,
                'typeAction' => $typeAction,
                'details' => $details ? json_encode($details) : null,
                'timestamp' => new DateTime(),
                'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? null,
                'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? null
            ]
        ]);
        
        return true;
    } catch (Exception $e) {
        $this->logger->error("Erreur enregistrement historique", [
            'utilisateurId' => $utilisateurId,
            'dossierId' => $dossierId,
            'typeAction' => $typeAction,
            'error' => $e->getMessage()
        ]);
        return false;
    }
}
```

#### 3. Erreurs d'Autorisation

**Cas d'Erreur** :
- Token JWT invalide ou expiré
- Rôle utilisateur insuffisant
- Tentative d'accès à un dossier non autorisé

**Stratégie** :
```javascript
// Dans l'API Node.js
const authorizeHistoryAccess = (req, res, next) => {
    try {
        const { role, userId } = req.user; // Extrait du JWT
        const { dossierId } = req.params;
        
        // Seuls COMMISSION et DGES peuvent accéder à l'historique
        if (!['COMMISSION', 'DGES'].includes(role)) {
            // Enregistrer la tentative non autorisée
            SystemeHistorique.enregistrerTentativeNonAutorisee(userId, dossierId, 'ACCES_HISTORIQUE_REFUSE');
            return res.status(403).json({ 
                erreur: 'Accès refusé', 
                code: 'INSUFFICIENT_PERMISSIONS' 
            });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ 
            erreur: 'Token invalide', 
            code: 'INVALID_TOKEN' 
        });
    }
};
```

#### 4. Erreurs de Performance

**Cas d'Erreur** :
- Timeout de base de données
- Charge système élevée
- Requêtes trop lentes

**Stratégie** :
```php
// Timeout et retry avec backoff exponentiel
class DatabaseManager {
    private const MAX_RETRIES = 3;
    private const BASE_DELAY = 100; // ms
    
    public function executeWithRetry(callable $operation) {
        $attempt = 0;
        while ($attempt < self::MAX_RETRIES) {
            try {
                return $operation();
            } catch (DatabaseTimeoutException $e) {
                $attempt++;
                if ($attempt >= self::MAX_RETRIES) {
                    throw new ServiceUnavailableException("Service temporairement indisponible");
                }
                
                $delay = self::BASE_DELAY * pow(2, $attempt - 1);
                usleep($delay * 1000); // Conversion en microsecondes
            }
        }
    }
}
```

### Codes d'Erreur Standardisés

```php
class ErrorCodes {
    // Erreurs de complétude
    const DOSSIER_NOT_FOUND = 'DOSSIER_001';
    const CALCULATION_ERROR = 'COMPLETION_001';
    const INVALID_PIECE_DATA = 'COMPLETION_002';
    
    // Erreurs d'historique
    const HISTORY_SAVE_FAILED = 'HISTORY_001';
    const INVALID_ACTION_TYPE = 'HISTORY_002';
    const HISTORY_ACCESS_DENIED = 'HISTORY_003';
    
    // Erreurs d'autorisation
    const INSUFFICIENT_PERMISSIONS = 'AUTH_001';
    const INVALID_TOKEN = 'AUTH_002';
    const USER_NOT_FOUND = 'AUTH_003';
    
    // Erreurs système
    const DATABASE_TIMEOUT = 'SYS_001';
    const SERVICE_UNAVAILABLE = 'SYS_002';
    const RATE_LIMIT_EXCEEDED = 'SYS_003';
}
```

## Stratégie de Test

### Approche de Test Dual

Le système utilisera une approche de test combinant :

1. **Tests unitaires** : Exemples spécifiques, cas limites, conditions d'erreur
2. **Tests basés sur les propriétés** : Propriétés universelles à travers tous les inputs (minimum 100 itérations par propriété)

### Configuration des Tests Basés sur les Propriétés

**Bibliothèque** : PHPUnit avec Eris (générateur de données aléatoires pour PHP)

**Configuration minimale** :
- 100 itérations par test de propriété
- Génération de données aléatoires pour candidats, dossiers, et actions
- Tag de référence : **Feature: dossier-completion-tracking, Property {number}: {property_text}**

**Exemple de Test de Propriété** :
```php
/**
 * Feature: dossier-completion-tracking, Property 1: Calcul de Pourcentage de Complétude
 * Pour tout dossier candidat avec un nombre donné de pièces justificatives déposées (0 à 5), 
 * le pourcentage de complétude calculé doit être égal à (nombre_pieces_deposees / 5) * 100
 */
public function testCalculPourcentageComplétude() {
    $this->forAll(
        Generator\choose(0, 5), // Nombre de pièces déposées
        Generator\elements(['acteNaissance', 'carteIdentite', 'photo', 'releve', 'quittance'])
    )->then(function ($nombrePieces, $typePieces) {
        // Créer un dossier avec le nombre spécifié de pièces
        $dossier = $this->creerDossierAvecPieces($nombrePieces, $typePieces);
        
        // Calculer le pourcentage
        $resultat = SystemeCompletion::calculerPourcentage($dossier->candidatId);
        
        // Vérifier la propriété
        $pourcentageAttendu = ($nombrePieces / 5) * 100;
        $this->assertEquals($pourcentageAttendu, $resultat['pourcentage']);
    });
}
```

### Tests d'Intégration

**Endpoints API** :
- Test de l'authentification et autorisation
- Test de l'intégration PHP ↔ Node.js
- Test des performances (< 100ms pour complétude, < 200ms pour historique)

**Interface Utilisateur** :
- Tests de rendu des composants React
- Tests d'interaction utilisateur
- Tests de responsivité et accessibilité

### Tests de Sécurité

**Contrôle d'Accès** :
- Vérification des permissions par rôle
- Test des tentatives d'accès non autorisé
- Validation des tokens JWT

**Audit et Traçabilité** :
- Vérification de l'enregistrement de toutes les actions
- Test de l'intégrité des logs d'audit
- Validation de la rétention des données (5 ans)

### Métriques de Couverture

**Objectifs** :
- Couverture de code PHP : > 90%
- Couverture des propriétés : 100% des propriétés identifiées
- Couverture des cas d'erreur : > 85%
- Tests d'intégration : Tous les endpoints critiques

**Outils** :
- PHPUnit + Xdebug pour la couverture PHP
- Jest + React Testing Library pour les composants React
- Postman/Newman pour les tests d'API
- Eris pour les tests basés sur les propriétés