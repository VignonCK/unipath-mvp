-- Limite les corrections de décision du contrôleur (une par cycle sous réserve)
ALTER TABLE "DossierInscription"
ADD COLUMN IF NOT EXISTS "decisionControleurModifieCount" INTEGER NOT NULL DEFAULT 0;
