-- Phase 1/6 DEC/DGES : table AdministrateurDEC (miroir exact AdministrateurDGES)
-- Aucune modification des données AdministrateurDGES existantes.

CREATE TABLE IF NOT EXISTS "AdministrateurDEC" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DEC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrateurDEC_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdministrateurDEC_email_key" ON "AdministrateurDEC"("email");
