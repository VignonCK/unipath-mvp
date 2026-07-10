-- AlterEnum
ALTER TYPE "ApplicationDocStatus" ADD VALUE 'A_CORRIGER';

-- AlterTable
ALTER TABLE "PreinscriptionEtablissement" ADD COLUMN "piecesACorriger" JSONB;
