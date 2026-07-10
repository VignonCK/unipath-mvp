-- AlterEnum
CREATE TYPE "SousRoleEtablissement" AS ENUM ('ADMIN', 'SUPERVISEUR', 'CONTROLEUR');

-- AlterTable
ALTER TABLE "AdminEtablissement"
ADD COLUMN "sousRole" "SousRoleEtablissement" NOT NULL DEFAULT 'ADMIN';

-- CreateIndex
CREATE INDEX "AdminEtablissement_etablissementId_sousRole_idx"
ON "AdminEtablissement"("etablissementId", "sousRole");
