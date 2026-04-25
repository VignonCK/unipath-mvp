-- Migration: Ajout de la table ActionHistory pour la traçabilité des actions
-- Date: 2025-01-04
-- Fonctionnalité: dossier-completion-tracking

-- Création de la table ActionHistory
CREATE TABLE "ActionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "utilisateurId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "typeAction" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX "ActionHistory_dossierId_idx" ON "ActionHistory"("dossierId");
CREATE INDEX "ActionHistory_utilisateurId_idx" ON "ActionHistory"("utilisateurId");
CREATE INDEX "ActionHistory_timestamp_idx" ON "ActionHistory"("timestamp");
CREATE INDEX "ActionHistory_typeAction_idx" ON "ActionHistory"("typeAction");

-- Index composé pour les requêtes fréquentes
CREATE INDEX "ActionHistory_dossier_timestamp_idx" ON "ActionHistory"("dossierId", "timestamp" DESC);
CREATE INDEX "ActionHistory_user_timestamp_idx" ON "ActionHistory"("utilisateurId", "timestamp" DESC);

-- Commentaires pour documentation
COMMENT ON TABLE "ActionHistory" IS 'Table de traçabilité des actions effectuées sur les dossiers';
COMMENT ON COLUMN "ActionHistory"."utilisateurId" IS 'ID de l''utilisateur qui a effectué l''action';
COMMENT ON COLUMN "ActionHistory"."dossierId" IS 'ID du dossier concerné par l''action';
COMMENT ON COLUMN "ActionHistory"."typeAction" IS 'Type d''action: DOSSIER_CREE, PIECE_AJOUTEE, PIECE_SUPPRIMEE, DOSSIER_VALIDE, DOSSIER_REJETE, DOSSIER_SOUMIS';
COMMENT ON COLUMN "ActionHistory"."details" IS 'Détails optionnels de l''action au format JSON';
COMMENT ON COLUMN "ActionHistory"."ipAddress" IS 'Adresse IP de l''utilisateur (pour audit)';
COMMENT ON COLUMN "ActionHistory"."userAgent" IS 'User Agent du navigateur (pour audit)';