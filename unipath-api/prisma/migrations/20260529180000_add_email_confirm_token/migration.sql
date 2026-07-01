-- AlterTable
ALTER TABLE "Candidat" ADD COLUMN IF NOT EXISTS "emailConfirmToken" TEXT;
ALTER TABLE "Candidat" ADD COLUMN IF NOT EXISTS "emailConfirmExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Candidat_emailConfirmToken_key" ON "Candidat"("emailConfirmToken");
