# UniPath — Module 2 : Suivi numérique du parcours académique
**EPAC Groupe 2 — 2025–2026**

KANLINHANON Vignon · DEDJI Harry · ELEGBE Adébayor | Année 2025–2026

---

## Informations générales

| Information | Détail |
|---|---|
| Projet | UniPath — Module 2 : Suivi numérique du parcours académique |
| Base | Module 1 entièrement terminé et déployé en production |
| Sprint | 10 jours × 4h/personne = 40h/personne — 120h équipe |
| Équipe | KANLINHANON Vignon · DEDJI Harry · ELEGBE Adébayor |
| Encadrant | Dr ASSOUMA Abdoul Kamal |
| Superviseur | Pr DJARA Tahirou |
| Année Académique | 2025–2026 |

## Ce que le Module 2 ajoute par rapport au Module 1

- **Module 1** → Inscription aux concours (bacheliers → entrée université)
- **Module 2** → Suivi complet du parcours académique (Licence → Master)
- **Nouveaux acteurs :** Établissement (public & privé), Admin système
- **Nouvelles entités :** Etudiant, Etablissement, Filiere, Inscription académique, Resultat, Niveau
- **Nouvelles règles métier :** contrôle progression N→N+1, passerelle Licence/Master
- **Nouvelle interface :** Espace Établissement + relevés de notes consolidés

---

## SECTION 1 — Analyse : Ce qui change par rapport au Module 1

### 1.1 — Ce que le Module 2 réutilise du Module 1

Le Module 2 n'est pas un projet from scratch. Il s'appuie sur toute l'infrastructure déjà en place.

| Élément réutilisé | Comment il est réutilisé dans le Module 2 |
|---|---|
| Supabase (DB + Auth + Storage) | Même projet Supabase — nouvelles tables ajoutées au schéma existant |
| Prisma ORM | Nouvelles entités ajoutées dans schema.prisma — migration additive |
| Node.js + Express | Nouvelles routes ajoutées dans le même projet unipath-api |
| React + Vite + Tailwind | Nouvelles pages ajoutées dans le même projet unipath-front |
| Authentification JWT | Les mêmes tokens JWT — nouveaux rôles ajoutés (etablissement, admin) |
| Déploiement Vercel + Render | Même infrastructure — un redéploiement suffit |
| Matricule national étudiant | Le matricule UAC-YYYY-XXXXXX du Module 1 est réutilisé tel quel |

### 1.2 — Les nouvelles entités du Module 2

Le Module 2 introduit 6 nouvelles tables dans le schéma Prisma.

| Nouvelle table | Rôle et description |
|---|---|
| Etablissement | Représente une université ou école privée. Attributs : id, nom, type (PUBLIC/PRIVE), ville, code. Lié à Filiere et InscriptionAcademique. |
| Filiere | Une filière d'étude dans un établissement (ex: Informatique, Génie Civil). Attributs : id, nom, etablissementId, dureeAnnees. |
| NiveauEtude | Enum : L1, L2, L3, M1, M2 — les 5 niveaux du parcours LicenceMaster. |
| InscriptionAcademique | Liaison Etudiant ↔ Filiere ↔ NiveauEtude pour une année académique donnée. C'est la table centrale du Module 2. |
| Resultat | Notes annuelles d'un étudiant dans une InscriptionAcademique. Attributs : moyenne, mention, valide (boolean). Saisi par l'établissement. |
| DiplomeLicence | Enregistrement du diplôme de Licence validé — utilisé pour la passerelle Licence→Master. |

### 1.3 — Les nouvelles règles métier critiques

**Règle 1 — Contrôle de progression N → N+1**

Un étudiant ne peut s'inscrire en niveau N+1 que si son résultat de niveau N est validé.
- Implémentation : trigger `BEFORE INSERT` sur `InscriptionAcademique`.
- Le trigger vérifie que `Resultat.valide = true` pour l'inscription précédente du même étudiant.
- Si non validé : `RAISE EXCEPTION 'Résultats de l'année précédente non validés'`.

**Règle 2 — Passerelle Licence → Master**

Un étudiant ne peut s'inscrire en M1 que s'il possède un diplôme de Licence valide.
- Implémentation : trigger `BEFORE INSERT` sur `InscriptionAcademique` pour niveau M1.
- Le trigger vérifie l'existence d'un enregistrement dans `DiplomeLicence` pour cet étudiant.
- Si absent : `RAISE EXCEPTION 'Diplôme de Licence requis pour accéder au Master'`.

**Règle 3 — Multi-tenancy établissements**

Chaque établissement ne voit QUE ses propres étudiants.
- Implémentation : Row Level Security (RLS) Supabase sur `InscriptionAcademique`.
- La politique filtre par `etablissementId = auth.uid()` (ID de l'établissement connecté).
- La DGES, elle, voit tout — pas de RLS sur son rôle superviseur.

### 1.4 — Stack technique : aucun changement

Le Module 2 utilise exactement la même stack que le Module 1. Seule addition : **SheetJS** pour l'import ETL des fichiers Excel.

| Outil | Ajout pour le Module 2 |
|---|---|
| Prisma | Nouvelles entités dans schema.prisma — même syntaxe |
| Express | Nouvelles routes dans src/routes/ — même structure |
| React + Tailwind | Nouvelles pages — même architecture composants |
| Supabase | Nouvelles politiques RLS — même tableau de bord |
| SheetJS **(NOUVEAU)** | `npm install xlsx` — lecture des fichiers Excel pour l'import ETL |

> 🔗 [Documentation SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/nodejs)

---

## SECTION 2 — Planning Sprint 10 jours

### 2.1 — Rôles (inchangés)

| Étudiant | Rôle et focus Module 2 |
|---|---|
| Vignon — DB Architect | Nouvelles tables Prisma · Triggers progression et passerelle · Vues statistiques Module 2 · RLS établissements · Seeds |
| Harry — Backend/API | Routes établissement · Routes résultats · Import ETL SheetJS · Route passerelle Licence/Master · Mise à jour app.js |
| Adébayor — Frontend | Dashboard Étudiant · Espace Établissement · Relevés de notes · Import CSV UI · Mise à jour Home et App.jsx |

### 2.2 — Vue d'ensemble du sprint

| Phase | Contenu |
|---|---|
| Jours 1–2 — Fondations M2 | Schéma Prisma M2 · Migration · Triggers · Seeds · Structure routes · Nouvelles pages squelettes |
| Jours 3–5 — Cœur fonctionnel | Routes inscription académique · Saisie résultats · Contrôle progression · Passerelle Licence/Master |
| Jours 6–7 — Intégration | Import ETL Excel/CSV · Dashboard DGES M2 · Relevé de notes PDF · Espace établissement |
| Jours 8–9 — Tests & Polish | Tests triggers · Tests routes · Tests UI · Correction bugs · Script démo M2 |
| Jour 10 — Finalisation | README M2 · Redéploiement · Rapport d'avancement M2 |

### 2.3 — Détail Jours 1–2 : Fondations Module 2

**Objectif fin Jour 2**
- **Vignon :** 6 nouvelles tables créées en base, 2 triggers implémentés, RLS configuré, seeds M2
- **Harry :** structure routes/controllers créée, dépendances installées (SheetJS), app.js prêt
- **Adébayor :** 5 nouvelles pages squelettes, routes App.jsx mises à jour, services api.js étendus
- **Tous :** git pull, STANDUP.md Jour 1 M2 rempli, branches créées

#### ▸ Vignon — Jours 1–2

| Tâche | Livrable attendu |
|---|---|
| Étendre schema.prisma avec les 6 nouvelles entités | Migration M2 appliquée — tables visibles dans Supabase |
| Implémenter trigger contrôle progression N→N+1 | `trg_controle_progression` actif sur InscriptionAcademique |
| Implémenter trigger passerelle Licence→Master | `trg_passerelle_master` actif |
| Configurer RLS multi-tenancy établissements | Politiques RLS sur InscriptionAcademique et Resultat |
| Créer seeds M2 | 2 établissements, 3 filières, 5 étudiants avec parcours |
| Mettre à jour DATABASE.md | Section Module 2 ajoutée |

#### ▸ Harry — Jours 1–2

| Tâche | Livrable attendu |
|---|---|
| Installer SheetJS : `npm install xlsx` | package.json mis à jour |
| Créer structure dossiers M2 | `src/routes/m2/` et `src/controllers/m2/` créés |
| Créer squelettes des 6 fichiers routes M2 | Fichiers créés avec routes vides |
| Mettre à jour app.js avec les nouvelles routes | Routes M2 montées sur `/api/m2/...` |
| Créer `src/services/etl.service.js` vide | Fichier prêt pour l'implémentation J3-5 |

#### ▸ Adébayor — Jours 1–2

| Tâche | Livrable attendu |
|---|---|
| Créer 5 pages squelettes M2 | DashboardEtudiant.jsx, EspaceEtablissement.jsx, RelevelNotes.jsx, InscriptionAcademique.jsx, ImportDonnees.jsx |
| Ajouter routes M2 dans App.jsx | Routes `/etudiant`, `/etablissement`, `/import` protégées |
| Étendre `src/services/api.js` avec services M2 | etudiantService, etablissementService, resultatService créés vides |
| Ajouter liens M2 dans la page d'accueil Home.jsx | Carte 'Établissement' ajoutée dans les espaces |

### 2.4 — Détail Jours 3–5 : Cœur fonctionnel Module 2

**Objectif fin Jour 5**
- **Vignon :** toutes les contraintes SQL vérifiées avec des tests directs en SQL Editor
- **Harry :** routes inscription académique, saisie résultats, passerelle fonctionnelles + testées Thunder Client
- **Adébayor :** formulaire inscription académique, saisie résultats, dashboard étudiant fonctionnels
- **Revue de code Jour 5 :** 30 min en appel vocal Discord

#### ▸ Vignon — Jours 3–5

| Tâche | Livrable attendu |
|---|---|
| Tester trigger progression avec cas nominaux et cas d'erreur | Rapport tests SQL dans TESTS.md M2 |
| Tester trigger passerelle avec et sans diplôme | Rapport tests SQL dans TESTS.md M2 |
| Créer vue `v_parcours_etudiant` | Vue SQL : historique inscriptions + résultats par étudiant |
| Créer vue `v_statistiques_dges_m2` | Vue SQL : effectifs par établissement, filière, niveau, taux réussite |
| Tester politiques RLS | Établissement A ne voit pas les étudiants de B |

#### ▸ Harry — Jours 3–5

| Tâche | Livrable attendu |
|---|---|
| `POST /api/m2/inscriptions` | Créer une inscription académique (déclenche trigger progression) |
| `GET /api/m2/inscriptions/mesinscriptions` | Historique inscriptions d'un étudiant |
| `POST /api/m2/resultats` | Saisir les résultats annuels (par l'établissement) |
| `GET /api/m2/resultats/:etudiantId` | Relevé de notes complet d'un étudiant |
| `POST /api/m2/diplomes/licence` | Enregistrer un diplôme de Licence validé |
| `GET /api/m2/etablissements/etudiants` | Liste étudiants par filière et année (espace établissement) |
| `GET /api/m2/dges/statistiques` | Statistiques M2 via vue `v_statistiques_dges_m2` |

#### ▸ Adébayor — Jours 3–5

| Tâche | Livrable attendu |
|---|---|
| Formulaire InscriptionAcademique.jsx complet | Sélection filière + niveau + établissement avec validation |
| Page DashboardEtudiant.jsx complet | Historique inscriptions, résultats, matricule, bouton relevé PDF |
| Page EspaceEtablissement.jsx — liste étudiants | Tableau filtrable par filière et par année d'étude |
| Saisie des résultats dans EspaceEtablissement | Formulaire note/mention/validation par étudiant |

### 2.5 — Détail Jours 6–7 : Intégration et fonctionnalités avancées

**Objectif fin Jour 7**
- **Vignon :** vues M2 opérationnelles, optimisations requêtes
- **Harry :** import ETL fonctionnel, relevé PDF, dashboard DGES M2 via vue SQL
- **Adébayor :** import CSV UI, dashboard DGES M2 avec graphiques, relevé PDF téléchargeable

#### ▸ Vignon — Jours 6–7

| Tâche | Livrable attendu |
|---|---|
| Enrichir vue `v_statistiques_dges_m2` | Taux de réussite par filière, par niveau, par établissement |
| Créer index sur colonnes fréquentes | Index sur etudiantId, etablissementId, niveauEtude dans InscriptionAcademique |
| Mettre à jour DATABASE.md section M2 | Documentation complète des nouvelles tables et vues |

#### ▸ Harry — Jours 6–7

| Tâche | Livrable attendu |
|---|---|
| Implémenter etl.service.js avec SheetJS | Lecture fichier Excel/CSV → validation → insertion en masse |
| `POST /api/m2/import` | Route import ETL — reçoit fichier, parse, insère les étudiants |
| `GET /api/m2/dges/statistiques-m2` | Route DGES Module 2 via `$queryRaw` et vue SQL |
| `GET /api/m2/etudiants/releve/:etudiantId` | Génération relevé de notes PDF (PDFKit) — toutes les années |

#### ▸ Adébayor — Jours 6–7

| Tâche | Livrable attendu |
|---|---|
| Page ImportDonnees.jsx | Upload CSV/Excel + preview des données + bouton import |
| Dashboard DGES M2 avec graphiques | Recharts — effectifs par filière, taux réussite par établissement |
| Bouton téléchargement relevé PDF | Dans DashboardEtudiant, déclenche `GET /releve/:id` |
| Mettre à jour Home.jsx avec M2 | Section Module 2 visible sur la page d'accueil |

### 2.6 — Détail Jours 8–9 : Tests & Polish

| Étudiant | Tests à réaliser |
|---|---|
| Vignon | Test trigger progression : inscription L2 sans résultats L1 → ERREUR · Test passerelle : M1 sans diplôme → ERREUR · Test RLS : établissement B ne voit pas étudiants A |
| Harry | 14 nouvelles routes testées Thunder Client · Import ETL testé avec fichier Excel réel · Génération relevé PDF testé · TESTS.md M2 complété |
| Adébayor | Parcours étudiant complet L1→L2 · Saisie résultats établissement · Import données · Dashboard DGES M2 · Responsive mobile |

### 2.7 — Jour 10 : Finalisation et déploiement

| Tâche | Responsable |
|---|---|
| Mettre à jour README.md avec Module 2 | Vignon |
| Redéployer backend sur Render | Harry |
| Redéployer frontend sur Vercel | Adébayor |
| Tester l'URL de production Module 2 complet | Tous |
| Mettre à jour STANDUP.md bilan sprint M2 | Vignon |
| Préparer démo Module 2 | Tous |

---

## SECTION 3 — Schéma Prisma Module 2 (Vignon)

Ajoutez ces nouvelles entités à la **FIN** du fichier `prisma/schema.prisma` existant. Ne modifiez pas les entités du Module 1.

> 🔗 [Prisma — Relations entre modèles](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
> 🔗 [Prisma — Enums](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-enums)

```prisma
// ─────────────────────────────────────────────────────────────────
// MODULE 2 — Suivi numérique du parcours académique
// Ajoutez ces entités à la fin de prisma/schema.prisma
// ─────────────────────────────────────────────────────────────────

// ── ENUM : NiveauEtude ─────────────────────────────────────────
// Les 5 niveaux du parcours LMD
enum NiveauEtude {
  L1
  L2
  L3
  M1
  M2
}

// ── ENUM : TypeEtablissement ───────────────────────────────────
enum TypeEtablissement {
  PUBLIC
  PRIVE
}

// ── ENUM : Mention ─────────────────────────────────────────────
enum Mention {
  PASSABLE
  ASSEZ_BIEN
  BIEN
  TRES_BIEN
  ECHEC
}

// ── TABLE : Etablissement ──────────────────────────────────────
// Une université ou école (publique ou privée)
model Etablissement {
  id        String             @id @default(uuid())
  nom       String
  type      TypeEtablissement
  ville     String
  code      String             @unique // Ex: EPAC, UAC-FSS
  createdAt DateTime           @default(now())

  filieres                 Filiere[]
  inscriptionsAcademiques  InscriptionAcademique[]
}

// ── TABLE : Filiere ────────────────────────────────────────────
// Une filière dans un établissement
model Filiere {
  id               String   @id @default(uuid())
  nom              String   // Ex: Génie Informatique, Médecine
  etablissementId  String
  dureeAnnees      Int      // 3 pour Licence, 5 pour Licence+Master
  createdAt        DateTime @default(now())

  etablissement           Etablissement          @relation(fields: [etablissementId], references: [id])
  inscriptionsAcademiques InscriptionAcademique[]
}

// ── TABLE : InscriptionAcademique ──────────────────────────────
// Inscription d'un étudiant dans une filière pour une année
// C'est la table centrale du Module 2
model InscriptionAcademique {
  id               String      @id @default(uuid())
  candidatId       String      // Réutilise l'étudiant du Module 1
  etablissementId  String
  filiereId        String
  niveau           NiveauEtude // L1, L2, L3, M1, M2
  anneeAcademique  String      // Ex: '2025-2026'
  createdAt        DateTime    @default(now())

  candidat      Candidat      @relation(fields: [candidatId], references: [id])
  etablissement Etablissement @relation(fields: [etablissementId], references: [id])
  filiere       Filiere       @relation(fields: [filiereId], references: [id])
  resultat      Resultat?

  // Un étudiant ne peut s'inscrire qu'une fois par niveau par année dans une filière
  @@unique([candidatId, filiereId, niveau, anneeAcademique])
}

// ── TABLE : Resultat ───────────────────────────────────────────
// Notes annuelles d'un étudiant — saisi par l'établissement
model Resultat {
  id                      String   @id @default(uuid())
  inscriptionAcademiqueId String   @unique
  moyenne                 Float    // Note sur 20
  mention                 Mention
  valide                  Boolean  @default(false) // true = peut passer au niveau suivant
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt

  inscriptionAcademique InscriptionAcademique @relation(fields: [inscriptionAcademiqueId], references: [id])
}

// ── TABLE : DiplomeLicence ─────────────────────────────────────
// Enregistrement du diplôme de Licence — requis pour accéder au Master
model DiplomeLicence {
  id          String   @id @default(uuid())
  candidatId  String   @unique // Un étudiant = un seul diplôme de Licence
  filiereId   String
  mention     Mention
  annee       String   // Année d'obtention
  verifie     Boolean  @default(false) // Authentifié par l'administration
  createdAt   DateTime @default(now())

  candidat Candidat @relation(fields: [candidatId], references: [id])
}
```

> **Important :** ajoutez aussi ces relations dans le model `Candidat` existant (Module 1) :

```prisma
// Dans le model Candidat existant, ajoutez ces deux lignes :
inscriptionsAcademiques InscriptionAcademique[]
diplomeLicence          DiplomeLicence?
```

Ensuite lancez la migration :

```bash
npx prisma migrate dev --name module2_parcours_academique

# Résultat attendu :
# ✔ Generated Prisma Client
# ✔ Your database is now in sync with your Prisma schema
# Vérifiez dans Supabase > Table Editor que les 5 nouvelles tables apparaissent :
# Etablissement, Filiere, InscriptionAcademique, Resultat, DiplomeLicence
```

### 3.1 — Triggers PostgreSQL Module 2

#### ▸ Trigger 1 — trg_controle_progression

Ce trigger vérifie que l'étudiant a validé son niveau N avant de s'inscrire en N+1.

```sql
-- Dans le SQL Editor de Supabase, exécutez ce code :
CREATE OR REPLACE FUNCTION check_progression_niveau()
RETURNS TRIGGER AS $$
DECLARE
  niveau_precedent TEXT;
  resultat_valide  BOOLEAN;
BEGIN
  -- Déterminer le niveau précédent
  niveau_precedent := CASE NEW.niveau
    WHEN 'L2' THEN 'L1'
    WHEN 'L3' THEN 'L2'
    WHEN 'M1' THEN 'L3' -- M1 nécessite L3 validé (voir aussi trigger passerelle)
    WHEN 'M2' THEN 'M1'
    ELSE NULL            -- L1 : premier niveau, pas de prérequis
  END;

  -- Si L1 : aucun prérequis, on laisse passer
  IF niveau_precedent IS NULL THEN
    RETURN NEW;
  END IF;

  -- Vérifier que le niveau précédent a été validé
  SELECT r.valide INTO resultat_valide
  FROM "InscriptionAcademique" ia
  JOIN "Resultat" r ON r."inscriptionAcademiqueId" = ia.id
  WHERE ia."candidatId" = NEW."candidatId"
    AND ia."filiereId" = NEW."filiereId"
    AND ia.niveau = niveau_precedent::"NiveauEtude"
  ORDER BY ia."createdAt" DESC
  LIMIT 1;

  IF resultat_valide IS NULL OR resultat_valide = FALSE THEN
    RAISE EXCEPTION
      'Inscription en % refusée : les résultats de % ne sont pas validés.',
      NEW.niveau, niveau_precedent;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_controle_progression
  BEFORE INSERT ON "InscriptionAcademique"
  FOR EACH ROW
  EXECUTE FUNCTION check_progression_niveau();
```

#### ▸ Trigger 2 — trg_passerelle_master

Ce trigger vérifie qu'un étudiant possède un diplôme de Licence avant de s'inscrire en M1.

```sql
CREATE OR REPLACE FUNCTION check_passerelle_master()
RETURNS TRIGGER AS $$
DECLARE
  has_licence BOOLEAN;
BEGIN
  -- Vérification uniquement pour le niveau M1
  IF NEW.niveau <> 'M1' THEN
    RETURN NEW;
  END IF;

  -- Vérifier l'existence d'un diplôme de Licence vérifié
  SELECT EXISTS(
    SELECT 1 FROM "DiplomeLicence"
    WHERE "candidatId" = NEW."candidatId"
      AND verifie = TRUE
  ) INTO has_licence;

  IF NOT has_licence THEN
    RAISE EXCEPTION
      'Inscription en Master refusée : diplôme de Licence vérifié requis.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_passerelle_master
  BEFORE INSERT ON "InscriptionAcademique"
  FOR EACH ROW
  EXECUTE FUNCTION check_passerelle_master();
```

#### ▸ Vue statistique Module 2

```sql
-- Vue pour le dashboard DGES Module 2
CREATE OR REPLACE VIEW v_statistiques_dges_m2 AS
SELECT
  e.nom                                                          AS etablissement,
  e.type                                                         AS type_etablissement,
  f.nom                                                          AS filiere,
  ia.niveau,
  ia."anneeAcademique",
  COUNT(ia.id)                                                   AS total_inscrits,
  COUNT(r.id) FILTER (WHERE r.valide = TRUE)                    AS passes,
  COUNT(r.id) FILTER (WHERE r.valide = FALSE)                   AS echoues,
  COUNT(r.id) FILTER (WHERE r.id IS NULL)                       AS sans_resultats,
  ROUND(
    COUNT(r.id) FILTER (WHERE r.valide = TRUE)::NUMERIC
    / NULLIF(COUNT(r.id), 0) * 100, 2
  )                                                              AS taux_reussite_pct
FROM "Etablissement" e
JOIN "Filiere" f            ON f."etablissementId" = e.id
JOIN "InscriptionAcademique" ia ON ia."filiereId" = f.id
LEFT JOIN "Resultat" r      ON r."inscriptionAcademiqueId" = ia.id
GROUP BY e.id, e.nom, e.type, f.id, f.nom, ia.niveau, ia."anneeAcademique"
ORDER BY e.nom, f.nom, ia.niveau;
```

#### ▸ Configuration RLS Multi-tenancy

```sql
-- Activer RLS sur les tables sensibles
ALTER TABLE "InscriptionAcademique" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resultat"              ENABLE ROW LEVEL SECURITY;

-- Politique : un établissement ne voit que ses propres inscriptions
CREATE POLICY "etablissement_own_inscriptions"
ON "InscriptionAcademique"
FOR ALL
TO authenticated
USING ("etablissementId" = auth.uid());

-- La DGES a accès à tout (pas de RLS restrictif pour le rôle DGES)
-- Cette logique est gérée côté API via le rôle de l'utilisateur connecté
```

#### ▸ Seeds Module 2

Créez le fichier `prisma/seed_m2.js` :

```javascript
// prisma/seed_m2.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seed Module 2 en cours...');

  // Nettoyer les données M2 existantes
  await prisma.resultat.deleteMany();
  await prisma.inscriptionAcademique.deleteMany();
  await prisma.diplomeLicence.deleteMany();
  await prisma.filiere.deleteMany();
  await prisma.etablissement.deleteMany();

  // Créer 2 établissements
  const epac = await prisma.etablissement.create({
    data: { nom: 'EPAC', type: 'PUBLIC', ville: 'Abomey-Calavi', code: 'EPAC' },
  });
  const privee = await prisma.etablissement.create({
    data: { nom: 'ESATIC', type: 'PRIVE', ville: 'Cotonou', code: 'ESATIC' },
  });

  // Créer 3 filières
  const git = await prisma.filiere.create({
    data: { nom: 'Génie Informatique', etablissementId: epac.id, dureeAnnees: 5 },
  });
  const gc = await prisma.filiere.create({
    data: { nom: 'Génie Civil', etablissementId: epac.id, dureeAnnees: 5 },
  });
  const dev = await prisma.filiere.create({
    data: { nom: 'Développement Logiciel', etablissementId: privee.id, dureeAnnees: 3 },
  });

  // Récupérer un candidat existant du Module 1 pour les tests
  const candidat = await prisma.candidat.findFirst();
  if (candidat) {
    // Inscrire en L1 (premier niveau — pas de prérequis)
    const inscL1 = await prisma.inscriptionAcademique.create({
      data: {
        candidatId:      candidat.id,
        etablissementId: epac.id,
        filiereId:       git.id,
        niveau:          'L1',
        anneeAcademique: '2023-2024',
      },
    });

    // Saisir un résultat L1 validé
    await prisma.resultat.create({
      data: {
        inscriptionAcademiqueId: inscL1.id,
        moyenne:  13.5,
        mention:  'ASSEZ_BIEN',
        valide:   true,
      },
    });

    // L2 est maintenant possible (L1 validé)
    await prisma.inscriptionAcademique.create({
      data: {
        candidatId:      candidat.id,
        etablissementId: epac.id,
        filiereId:       git.id,
        niveau:          'L2',
        anneeAcademique: '2024-2025',
      },
    });
  }

  console.log('Seed Module 2 terminé !');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Ajoutez dans `package.json` et exécutez :

```json
// Dans package.json, section prisma :
"prisma": {
  "seed": "node prisma/seed.js && node prisma/seed_m2.js"
}
```

```bash
// Exécuter uniquement le seed M2 :
node prisma/seed_m2.js
```

---

## SECTION 4 — Backend Module 2 (Harry)

Toutes les nouvelles routes sont préfixées `/api/m2/` pour les distinguer clairement du Module 1.

> 🔗 [SheetJS documentation](https://docs.sheetjs.com/docs/getting-started)
> 🔗 [Prisma $queryRaw documentation](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)

### 4.1 — Structure des fichiers à créer

```
unipath-api/src/
├── routes/
│   ├── m2/
│   │   ├── etudiant.routes.js        ← GET profil académique, historique
│   │   ├── inscription.routes.js     ← POST inscription académique
│   │   ├── resultat.routes.js        ← POST/PUT saisie résultats
│   │   ├── etablissement.routes.js   ← GET liste étudiants, stats
│   │   ├── import.routes.js          ← POST import ETL
│   │   └── dges_m2.routes.js         ← GET statistiques M2
├── controllers/
│   ├── m2/
│   │   ├── etudiant.controller.js
│   │   ├── inscription.controller.js
│   │   ├── resultat.controller.js
│   │   ├── etablissement.controller.js
│   │   ├── import.controller.js
│   │   └── dges_m2.controller.js
└── services/
    └── etl.service.js                ← Logique SheetJS import
```

### 4.2 — Routes inscription académique

```javascript
// src/routes/m2/inscription.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const ctrl = require('../../controllers/m2/inscription.controller');

// POST /api/m2/inscriptions — S'inscrire dans une filière
// Déclenche trigger trg_controle_progression et trg_passerelle_master
router.post('/', protect, ctrl.creerInscription);

// GET /api/m2/inscriptions/mes-inscriptions — Historique de l'étudiant connecté
router.get('/mes-inscriptions', protect, ctrl.getMesInscriptions);

module.exports = router;
```

```javascript
// src/controllers/m2/inscription.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.creerInscription = async (req, res) => {
  try {
    const { filiereId, etablissementId, niveau, anneeAcademique } = req.body;
    const candidatId = req.user.id;

    const inscription = await prisma.inscriptionAcademique.create({
      data: { candidatId, filiereId, etablissementId, niveau, anneeAcademique },
      include: { filiere: true, etablissement: true },
    });

    res.status(201).json({
      message: 'Inscription académique créée',
      inscription,
    });
  } catch (error) {
    // Trigger progression
    if (error.message?.includes('résultats de')) {
      return res.status(409).json({ error: error.message });
    }
    // Trigger passerelle
    if (error.message?.includes('Licence')) {
      return res.status(409).json({ error: error.message });
    }
    // Contrainte unique
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Inscription déjà existante pour ce niveau et cette année.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getMesInscriptions = async (req, res) => {
  try {
    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId: req.user.id },
      include: {
        filiere:       true,
        etablissement: true,
        resultat:      true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(inscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

### 4.3 — Routes saisie des résultats

```javascript
// src/controllers/m2/resultat.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/m2/resultats — Saisir les résultats (par l'établissement)
exports.saisirResultat = async (req, res) => {
  try {
    const { inscriptionAcademiqueId, moyenne, mention, valide } = req.body;

    // upsert : créer ou mettre à jour si déjà existant
    const resultat = await prisma.resultat.upsert({
      where:  { inscriptionAcademiqueId },
      update: { moyenne, mention, valide },
      create: { inscriptionAcademiqueId, moyenne, mention, valide },
    });

    res.json({ message: 'Résultat enregistré', resultat });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /api/m2/resultats/:candidatId — Relevé de notes complet
exports.getReleve = async (req, res) => {
  try {
    const { candidatId } = req.params;
    const inscriptions = await prisma.inscriptionAcademique.findMany({
      where: { candidatId },
      include: {
        filiere:       true,
        etablissement: true,
        resultat:      true,
      },
      orderBy: [{ anneeAcademique: 'asc' }, { niveau: 'asc' }],
    });
    res.json(inscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
```

### 4.4 — Service ETL Import (SheetJS)

```javascript
// src/services/etl.service.js
// Service d'import de données depuis fichiers Excel/CSV
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Colonnes attendues dans le fichier Excel :
// | nom | prenom | email | filiere | niveau | anneeAcademique |

const importEtudiants = async (fileBuffer, etablissementId) => {
  // Lire le fichier Excel depuis le buffer en mémoire
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0]; // Première feuille
  const worksheet = workbook.Sheets[sheetName];

  // Convertir en tableau d'objets JavaScript
  const rows = XLSX.utils.sheet_to_json(worksheet);
  const results = { success: 0, errors: [] };

  for (const row of rows) {
    try {
      // Vérifier que les colonnes obligatoires sont présentes
      if (!row.nom || !row.prenom || !row.email || !row.filiere || !row.niveau) {
        results.errors.push(`Ligne ignorée : données incomplètes — ${JSON.stringify(row)}`);
        continue;
      }

      // Trouver la filière correspondante
      const filiere = await prisma.filiere.findFirst({
        where: {
          nom: { contains: row.filiere, mode: 'insensitive' },
          etablissementId,
        },
      });

      if (!filiere) {
        results.errors.push(`Filière inconnue : ${row.filiere}`);
        continue;
      }

      // Créer ou retrouver le candidat
      let candidat = await prisma.candidat.findUnique({
        where: { email: row.email },
      });

      if (!candidat) {
        candidat = await prisma.candidat.create({
          data: {
            email:     row.email,
            nom:       row.nom.toUpperCase(),
            prenom:    row.prenom,
            matricule: 'TEMP', // Trigger génère le vrai matricule
          },
        });
      }

      // Créer l'inscription académique
      await prisma.inscriptionAcademique.create({
        data: {
          candidatId:      candidat.id,
          etablissementId,
          filiereId:       filiere.id,
          niveau:          row.niveau,
          anneeAcademique: row.anneeAcademique || '2025-2026',
        },
      });

      results.success++;
    } catch (err) {
      results.errors.push(`Erreur ligne ${row.email} : ${err.message}`);
    }
  }

  return results;
};

module.exports = { importEtudiants };
```

### 4.5 — Mise à jour app.js

```javascript
// Dans src/app.js, ajoutez après les routes Module 1 :

// ── Routes Module 2 ───────────────────────────────────────────
const m2EtudiantRoutes      = require('./routes/m2/etudiant.routes');
const m2InscriptionRoutes   = require('./routes/m2/inscription.routes');
const m2ResultatRoutes      = require('./routes/m2/resultat.routes');
const m2EtablissementRoutes = require('./routes/m2/etablissement.routes');
const m2ImportRoutes        = require('./routes/m2/import.routes');
const m2DgesRoutes          = require('./routes/m2/dges_m2.routes');

app.use('/api/m2/etudiants',      m2EtudiantRoutes);
app.use('/api/m2/inscriptions',   m2InscriptionRoutes);
app.use('/api/m2/resultats',      m2ResultatRoutes);
app.use('/api/m2/etablissements', m2EtablissementRoutes);
app.use('/api/m2/import',         m2ImportRoutes);
app.use('/api/m2/dges',           m2DgesRoutes);
```

### 4.6 — Tableau complet des routes Module 2

| Route | Description |
|---|---|
| `POST /api/m2/inscriptions` | Inscription académique — déclenche les 2 triggers |
| `GET /api/m2/inscriptions/mesinscriptions` | Historique inscriptions de l'étudiant connecté |
| `POST /api/m2/resultats` | Saisir/mettre à jour résultats (établissement) |
| `GET /api/m2/resultats/:candidatId` | Relevé de notes complet d'un étudiant |
| `GET /api/m2/etudiants/releve/:candidatId` | Génération relevé de notes PDF (PDFKit) |
| `POST /api/m2/diplomes/licence` | Enregistrer un diplôme de Licence vérifié |
| `GET /api/m2/etablissements/etudiants` | Liste étudiants par filière et niveau |
| `POST /api/m2/import` | Import ETL fichier Excel/CSV — SheetJS |
| `GET /api/m2/dges/statistiques` | Stats M2 via vue `v_statistiques_dges_m2` |

---

## SECTION 5 — Frontend Module 2 (Adébayor)

Cinq nouvelles pages à créer dans `unipath-front/src/pages/m2/`. Créez ce sous-dossier pour garder le code bien organisé.

> 🔗 [React — Hooks avancés](https://fr.react.dev/reference/react)
> 🔗 [Recharts — guide complet](https://recharts.org/en-US/guide)

### 5.1 — Étendre src/services/api.js

```javascript
// Ajoutez à la fin de src/services/api.js :

// ── Module 2 — Étudiant ───────────────────────────────────────
export const etudiantM2Service = {
  getMesInscriptions: ()            => request('/m2/inscriptions/mes-inscriptions'),
  getReleve:          (candidatId)  => request(`/m2/resultats/${candidatId}`),
};

// ── Module 2 — Inscription académique ────────────────────────
export const inscriptionAcadService = {
  creer: (data) =>
    request('/m2/inscriptions', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Module 2 — Résultats ─────────────────────────────────────
export const resultatService = {
  saisir: (data) =>
    request('/m2/resultats', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Module 2 — Établissement ─────────────────────────────────
export const etablissementService = {
  getEtudiants: (params) =>
    request(`/m2/etablissements/etudiants?${new URLSearchParams(params)}`),
};

// ── Module 2 — Import ETL ─────────────────────────────────────
export const importService = {
  importerFichier: async (fichier, etablissementId) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('fichier', fichier);
    formData.append('etablissementId', etablissementId);
    const response = await fetch(`${BASE_URL}/m2/import`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },
};

// ── Module 2 — DGES ──────────────────────────────────────────
export const dgesM2Service = {
  getStatistiques: () => request('/m2/dges/statistiques'),
};

// ── Module 2 — Relevé PDF ─────────────────────────────────────
export const releveService = {
  telecharger: async (candidatId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/m2/etudiants/releve/${candidatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) { const e = await response.json(); throw new Error(e.error); }
    const blob = await response.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `releve_${candidatId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
```

### 5.2 — Dashboard Étudiant Module 2

```jsx
// src/pages/m2/DashboardEtudiantM2.jsx
import { useState, useEffect } from 'react';
import { etudiantM2Service, releveService } from '../../services/api';

const COULEUR_NIVEAU = {
  L1: 'bg-blue-100 text-blue-700',
  L2: 'bg-green-100 text-green-700',
  L3: 'bg-teal-100 text-teal-700',
  M1: 'bg-purple-100 text-purple-700',
  M2: 'bg-orange-100 text-orange-700',
};

export default function DashboardEtudiantM2() {
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [message, setMessage]           = useState('');

  useEffect(() => {
    etudiantM2Service.getMesInscriptions()
      .then(setInscriptions)
      .finally(() => setLoading(false));
  }, []);

  const handleReleve = async () => {
    try {
      const candidatId = localStorage.getItem('userId');
      await releveService.telecharger(candidatId);
    } catch (err) { setMessage(err.message); }
  };

  if (loading) return <div className='p-8'>Chargement...</div>;

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-blue-900 text-white px-6 py-4 flex justify-between items-center'>
        <h1 className='text-xl font-bold'>UniPath — Mon parcours académique</h1>
        <button onClick={handleReleve}
          className='text-sm bg-teal-500 px-4 py-2 rounded-lg hover:bg-teal-600'>
          Télécharger mon relevé PDF
        </button>
      </header>
      <main className='max-w-4xl mx-auto p-6'>
        {message && <div className='bg-red-50 text-red-700 p-3 rounded mb-4'>{message}</div>}
        <h2 className='text-lg font-bold text-gray-800 mb-4'>Mon historique académique</h2>
        {inscriptions.length === 0 ? (
          <p className='text-gray-500'>Aucune inscription académique enregistrée.</p>
        ) : (
          <div className='space-y-4'>
            {inscriptions.map(insc => (
              <div key={insc.id} className='bg-white rounded-xl shadow p-6'>
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${COULEUR_NIVEAU[insc.niveau]}`}>
                      {insc.niveau}
                    </span>
                    <span className='font-medium'>{insc.filiere?.nom}</span>
                    <span className='text-gray-500 text-sm ml-2'>— {insc.etablissement?.nom}</span>
                  </div>
                  <span className='text-gray-400 text-sm'>{insc.anneeAcademique}</span>
                </div>
                {insc.resultat ? (
                  <div className='flex items-center gap-4 mt-2'>
                    <span className='text-2xl font-black text-blue-900'>{insc.resultat.moyenne}/20</span>
                    <span className='text-gray-600'>{insc.resultat.mention?.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${insc.resultat.valide ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {insc.resultat.valide ? '✓ Validé' : '✗ Non validé'}
                    </span>
                  </div>
                ) : (
                  <p className='text-gray-400 text-sm mt-2'>Résultats non encore saisis</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.3 — Espace Établissement

```jsx
// src/pages/m2/EspaceEtablissement.jsx
import { useState, useEffect } from 'react';
import { etablissementService, resultatService } from '../../services/api';

export default function EspaceEtablissement() {
  const [etudiants, setEtudiants] = useState([]);
  const [filtre, setFiltre]       = useState({ filiere: '', niveau: '' });
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState('');

  const charger = async () => {
    setLoading(true);
    try {
      const data = await etablissementService.getEtudiants(filtre);
      setEtudiants(data);
    } catch (e) { setMessage(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, [filtre]);

  const handleSaisirResultat = async (inscriptionId, moyenne, mention, valide) => {
    try {
      await resultatService.saisir({
        inscriptionAcademiqueId: inscriptionId, moyenne, mention, valide,
      });
      setMessage('Résultat enregistré !');
      charger();
    } catch (e) { setMessage(e.message); }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-teal-800 text-white px-6 py-4'>
        <h1 className='text-xl font-bold'>UniPath — Espace Établissement</h1>
      </header>
      <main className='max-w-5xl mx-auto p-6'>
        {/* Filtres */}
        <div className='flex gap-4 mb-6'>
          <input placeholder='Filière...'
            value={filtre.filiere}
            onChange={e => setFiltre(f => ({...f, filiere: e.target.value}))}
            className='border rounded-lg px-3 py-2 flex-1'/>
          <select value={filtre.niveau}
            onChange={e => setFiltre(f => ({...f, niveau: e.target.value}))}
            className='border rounded-lg px-3 py-2'>
            <option value=''>Tous niveaux</option>
            {['L1','L2','L3','M1','M2'].map(n =>
              <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {message && <div className='bg-blue-50 text-blue-700 p-3 rounded mb-4'>{message}</div>}
        {loading ? <p>Chargement...</p> : (
          <div className='bg-white rounded-xl shadow overflow-hidden'>
            <table className='w-full text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  {['Matricule','Nom complet','Filière','Niveau','Année','Moyenne','Validé','Action'].map(h =>
                    <th key={h} className='px-4 py-3 text-left text-gray-600 font-medium'>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {etudiants.map((e, i) => (
                  <tr key={e.id} className={i%2===0?'bg-white':'bg-gray-50'}>
                    <td className='px-4 py-3 font-mono text-xs'>{e.candidat?.matricule}</td>
                    <td className='px-4 py-3 font-medium'>{e.candidat?.prenom} {e.candidat?.nom}</td>
                    <td className='px-4 py-3'>{e.filiere?.nom}</td>
                    <td className='px-4 py-3'>
                      <span className='bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold'>
                        {e.niveau}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-gray-500'>{e.anneeAcademique}</td>
                    <td className='px-4 py-3'>{e.resultat?.moyenne ?? '—'}</td>
                    <td className='px-4 py-3'>{e.resultat ? (e.resultat.valide ? '✓':'✗') : '—'}</td>
                    <td className='px-4 py-3'>
                      <button onClick={() => {
                        const moyenne = parseFloat(prompt('Moyenne (/20) :'));
                        const valide  = confirm('Résultat validé ?');
                        const mention = moyenne>=16?'TRES_BIEN':moyenne>=14?'BIEN':moyenne>=12?'ASSEZ_BIEN':moyenne>=10?'PASSABLE':'ECHEC';
                        handleSaisirResultat(e.id, moyenne, mention, valide);
                      }} className='text-xs bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700'>
                        Saisir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.4 — Mettre à jour App.jsx avec les routes M2

```jsx
// Dans src/App.jsx, ajoutez les imports et routes M2 :
import DashboardEtudiantM2  from './pages/m2/DashboardEtudiantM2';
import EspaceEtablissement  from './pages/m2/EspaceEtablissement';
import ImportDonnees        from './pages/m2/ImportDonnees';
import DashboardDGESM2      from './pages/m2/DashboardDGESM2';
import InscriptionAcad      from './pages/m2/InscriptionAcademique';

// Dans le bloc Routes :
<Route path='/parcours'
  element={<RouteProtegee><DashboardEtudiantM2 /></RouteProtegee>} />
<Route path='/etablissement'
  element={<RouteProtegee><EspaceEtablissement /></RouteProtegee>} />
<Route path='/import'
  element={<RouteProtegee><ImportDonnees /></RouteProtegee>} />
<Route path='/dges-m2'
  element={<RouteProtegee><DashboardDGESM2 /></RouteProtegee>} />
<Route path='/inscription-acad'
  element={<RouteProtegee><InscriptionAcad /></RouteProtegee>} />
```

---

## SECTION 6 — Checklists par phase

### Checklist Jours 1–2

| À vérifier | Comment vérifier |
|---|---|
| Migration M2 appliquée | Supabase > Table Editor — 5 nouvelles tables visibles |
| Trigger progression actif | SQL Editor : `SELECT trigger_name FROM information_schema.triggers` |
| Trigger passerelle actif | Même requête — `trg_passerelle_master` présent |
| RLS configuré | Supabase > Authentication > Policies — politiques sur InscriptionAcademique |
| Seeds M2 exécutés | `node prisma/seed_m2.js` — 2 établissements et 3 filières visibles |
| SheetJS installé (Harry) | `npm list xlsx` — version affichée |
| Structure routes/m2/ créée (Harry) | Dossier et 6 fichiers routes présents |
| 5 pages squelettes créées (Adébayor) | `src/pages/m2/` — 5 fichiers .jsx |
| Routes M2 dans App.jsx (Adébayor) | Naviguer vers `/parcours` sans erreur 404 |

### Checklist Jours 3–5

| À vérifier | Comment vérifier |
|---|---|
| `POST /api/m2/inscriptions` fonctionne | Thunder Client — inscription L1 → 201 Created |
| Trigger progression bloque L2 sans résultat | Thunder Client — inscription L2 sans résultat L1 → 409 |
| Trigger passerelle bloque M1 sans licence | Thunder Client — inscription M1 sans DiplomeLicence → 409 |
| `POST /api/m2/resultats` fonctionne | Thunder Client — saisie résultat → 200 OK |
| `GET /api/m2/resultats/:id` retourne relevé | Thunder Client — relevé complet avec filières et niveaux |
| Dashboard étudiant M2 s'affiche | `http://localhost:5173/parcours` — inscriptions visibles |
| Espace établissement s'affiche | `http://localhost:5173/etablissement` — tableau étudiants |

### Checklist Jours 6–7

| À vérifier | Comment vérifier |
|---|---|
| Import ETL fonctionne | `POST /api/m2/import` avec fichier Excel test → résultat JSON |
| Page ImportDonnees.jsx fonctionne | Upload Excel depuis le browser → résultat affiché |
| `GET /api/m2/dges/statistiques` | Retourne données de `v_statistiques_dges_m2` |
| Dashboard DGES M2 graphique visible | `http://localhost:5173/dges-m2` — graphique Recharts affiché |
| Relevé PDF M2 généré | Téléchargement déclenche un PDF avec toutes les années |

### Checklist Jours 8–9

| Test | Résultat attendu |
|---|---|
| Trigger progression — cas nominal | PASS — inscription L2 après résultat L1 validé : 201 |
| Trigger progression — cas erreur | PASS — inscription L2 sans résultat L1 : 409 avec message |
| Trigger passerelle — cas erreur | PASS — inscription M1 sans diplôme : 409 avec message |
| RLS — établissement B voit ses seuls étudiants | PASS — pas de fuite de données inter-établissements |
| Import ETL — fichier valide | PASS — étudiants créés, inscriptions créées |
| Import ETL — fichier invalide | PASS — erreurs listées, pas de crash |
| Parcours L1→L2→L3 complet | PASS — 3 inscriptions, résultats saisis, progression validée |

### Checklist Jour 10

| Tâche | Responsable |
|---|---|
| README.md mis à jour avec Module 2 | Vignon |
| DATABASE.md section M2 complète | Vignon |
| Backend redéployé sur Render | Harry |
| Frontend redéployé sur Vercel | Adébayor |
| URL production testée pour M2 | Tous |
| TESTS.md M2 complété | Tous |

---

## Récapitulatif — Ce que le Module 2 livre en plus du Module 1

- **6 nouvelles tables PostgreSQL :** Etablissement, Filiere, InscriptionAcademique, Resultat, DiplomeLicence + 2 enums
- **2 nouveaux triggers PL/pgSQL :** contrôle progression N→N+1 et passerelle Licence→Master
- **1 nouvelle vue SQL :** `v_statistiques_dges_m2` (taux réussite par filière/établissement/niveau)
- **Multi-tenancy RLS :** chaque établissement ne voit que ses propres données
- **9 nouvelles routes API REST** préfixées `/api/m2/`
- **Service ETL SheetJS :** import en masse depuis Excel/CSV
- **5 nouvelles pages React :** parcours étudiant, espace établissement, import données, DGES M2, inscription académique
- **Relevé de notes PDF** multi-années généré côté serveur
