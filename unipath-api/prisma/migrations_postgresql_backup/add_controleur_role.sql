-- Migration: Ajout du rôle CONTROLEUR et des champs de traçabilité

-- 1. Ajouter le nouveau rôle CONTROLEUR dans l'enum Role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CONTROLEUR';

-- 2. Ajouter les nouveaux statuts dans l'enum StatutDossier
ALTER TYPE "StatutDossier" ADD VALUE IF NOT EXISTS 'VALIDE_PAR_COMMISSION';
ALTER TYPE "StatutDossier" ADD VALUE IF NOT EXISTS 'REJETE_PAR_COMMISSION';
ALTER TYPE "StatutDossier" ADD VALUE IF NOT EXISTS 'SOUS_RESERVE_PAR_COMMISSION';

-- 3. Créer la table Controleur
CREATE TABLE IF NOT EXISTS "Controleur" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CONTROLEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- 4. Ajouter les champs de traçabilité dans la table Inscription
ALTER TABLE "Inscription" 
ADD COLUMN IF NOT EXISTS "decisionCommissionPar" TEXT,
ADD COLUMN IF NOT EXISTS "decisionCommissionDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "decisionControleurPar" TEXT,
ADD COLUMN IF NOT EXISTS "decisionControleurDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "commentaireControleur" TEXT;

-- 5. Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS "Inscription_decisionCommissionDate_idx" ON "Inscription"("decisionCommissionDate");
CREATE INDEX IF NOT EXISTS "Inscription_decisionControleurDate_idx" ON "Inscription"("decisionControleurDate");
CREATE INDEX IF NOT EXISTS "Controleur_email_idx" ON "Controleur"("email");

-- 6. Commentaires pour documentation
COMMENT ON TABLE "Controleur" IS 'Table des contrôleurs qui valident les décisions de la commission';
COMMENT ON COLUMN "Inscription"."decisionCommissionPar" IS 'ID du membre de la commission qui a pris la décision';
COMMENT ON COLUMN "Inscription"."decisionCommissionDate" IS 'Date de la décision de la commission';
COMMENT ON COLUMN "Inscription"."decisionControleurPar" IS 'ID du contrôleur qui a validé/modifié la décision';
COMMENT ON COLUMN "Inscription"."decisionControleurDate" IS 'Date de la décision du contrôleur';
COMMENT ON COLUMN "Inscription"."commentaireControleur" IS 'Commentaire du contrôleur si modification de la décision';
