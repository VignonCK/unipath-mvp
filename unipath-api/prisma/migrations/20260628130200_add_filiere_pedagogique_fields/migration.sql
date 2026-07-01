-- AlterTable
ALTER TABLE "Filiere" ADD COLUMN "fraisScolariteAnnuels" INTEGER,
ADD COLUMN "fraisInscriptionEffective" INTEGER,
ADD COLUMN "fraisAutres" TEXT,
ADD COLUMN "debouches" TEXT,
ADD COLUMN "partenariatsEntreprises" TEXT,
ADD COLUMN "partenariatsUniversites" TEXT,
ADD COLUMN "tauxReussite" DOUBLE PRECISION,
ADD COLUMN "dureeStage" TEXT,
ADD COLUMN "langueEnseignement" TEXT;
