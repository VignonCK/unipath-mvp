-- Module 2: private school application dossier flow

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationStatus') THEN
    CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'DOSSIER_FEES_PAID', 'PENDING_DOCUMENTS', 'READY_FOR_PREINSCRIPTION', 'FICHE_GENERATED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequirementType') THEN
    CREATE TYPE "RequirementType" AS ENUM ('PROFILE_FIELD', 'DOCUMENT_UPLOAD');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationDocSource') THEN
    CREATE TYPE "ApplicationDocSource" AS ENUM ('PROFILE_AUTO', 'STUDENT_UPLOAD', 'SYSTEM_GENERATED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationDocStatus') THEN
    CREATE TYPE "ApplicationDocStatus" AS ENUM ('PENDING', 'PROVIDED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentType') THEN
    CREATE TYPE "PaymentType" AS ENUM ('DOSSIER_FEES', 'DROITS_INSCRIPTION');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentMethod') THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('PLATFORM_GATEWAY', 'BANK_TRANSFER');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReceiptType') THEN
    CREATE TYPE "ReceiptType" AS ENUM ('DOSSIER_FEES_RECEIPT', 'BANK_RECEIPT', 'PREINSCRIPTION_FICHE');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Application" (
  "id" TEXT NOT NULL,
  "numeroApplication" TEXT NOT NULL,
  "candidatId" TEXT NOT NULL,
  "etablissementId" TEXT NOT NULL,
  "filiereId" TEXT NOT NULL,
  "anneeAcademique" TEXT NOT NULL,
  "niveau" INTEGER NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "preinscriptionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SchoolRequirement" (
  "id" TEXT NOT NULL,
  "etablissementId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "requirementType" "RequirementType" NOT NULL,
  "profileFieldKey" TEXT,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SchoolRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApplicationDocument" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "schoolRequirementId" TEXT,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "source" "ApplicationDocSource" NOT NULL,
  "documentUrl" TEXT,
  "status" "ApplicationDocStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "paymentType" "PaymentType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'XOF',
  "paymentProvider" TEXT,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "externalRef" TEXT,
  "providerPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Receipt" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT,
  "applicationId" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "receiptType" "ReceiptType" NOT NULL,
  "receiptUrl" TEXT,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Application_numeroApplication_key" ON "Application"("numeroApplication");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_preinscriptionId_key" ON "Application"("preinscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_candidatId_filiereId_anneeAcademique_key" ON "Application"("candidatId", "filiereId", "anneeAcademique");
CREATE INDEX IF NOT EXISTS "Application_candidatId_idx" ON "Application"("candidatId");
CREATE INDEX IF NOT EXISTS "Application_etablissementId_status_idx" ON "Application"("etablissementId", "status");
CREATE INDEX IF NOT EXISTS "Application_createdAt_idx" ON "Application"("createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "SchoolRequirement_etablissementId_code_key" ON "SchoolRequirement"("etablissementId", "code");
CREATE INDEX IF NOT EXISTS "SchoolRequirement_etablissementId_idx" ON "SchoolRequirement"("etablissementId");

CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationDocument_applicationId_code_key" ON "ApplicationDocument"("applicationId", "code");
CREATE INDEX IF NOT EXISTS "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

CREATE INDEX IF NOT EXISTS "Payment_applicationId_paymentType_idx" ON "Payment"("applicationId", "paymentType");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_paymentId_key" ON "Receipt"("paymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Receipt_receiptNumber_key" ON "Receipt"("receiptNumber");
CREATE INDEX IF NOT EXISTS "Receipt_applicationId_receiptType_idx" ON "Receipt"("applicationId", "receiptType");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Application_candidatId_fkey') THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_candidatId_fkey"
      FOREIGN KEY ("candidatId") REFERENCES "Candidat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Application_etablissementId_fkey') THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_etablissementId_fkey"
      FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Application_filiereId_fkey') THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_filiereId_fkey"
      FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Application_preinscriptionId_fkey') THEN
    ALTER TABLE "Application" ADD CONSTRAINT "Application_preinscriptionId_fkey"
      FOREIGN KEY ("preinscriptionId") REFERENCES "PreinscriptionEtablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SchoolRequirement_etablissementId_fkey') THEN
    ALTER TABLE "SchoolRequirement" ADD CONSTRAINT "SchoolRequirement_etablissementId_fkey"
      FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApplicationDocument_applicationId_fkey') THEN
    ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApplicationDocument_schoolRequirementId_fkey') THEN
    ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_schoolRequirementId_fkey"
      FOREIGN KEY ("schoolRequirementId") REFERENCES "SchoolRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_applicationId_fkey') THEN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receipt_paymentId_fkey') THEN
    ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_paymentId_fkey"
      FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receipt_applicationId_fkey') THEN
    ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
