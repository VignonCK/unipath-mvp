-- CreateEnum
CREATE TYPE "StatutDossier" AS ENUM ('EN_ATTENTE', 'VALIDE_PAR_COMMISSION', 'REJETE_PAR_COMMISSION', 'SOUS_RESERVE_PAR_COMMISSION', 'VALIDE', 'REJETE', 'SOUS_RESERVE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PRE_INSCRIPTION', 'VALIDATION', 'CONVOCATION', 'REJET', 'NOUVEAU_DOSSIER', 'RAPPORT_HEBDO', 'RAPPORT_MENSUEL', 'SYSTEME', 'ALERTE');

-- CreateEnum
CREATE TYPE "PriorityLevel" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('NOTIFICATION_CREATED', 'NOTIFICATION_SENT', 'NOTIFICATION_DELIVERED', 'NOTIFICATION_FAILED', 'NOTIFICATION_READ', 'NOTIFICATION_DELETED', 'TEMPLATE_CREATED', 'TEMPLATE_UPDATED', 'TEMPLATE_DELETED', 'PREFERENCES_UPDATED', 'DATA_ACCESSED', 'RETRY_ATTEMPTED', 'ALERT_CREATED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('HIGH_FAILURE_RATE', 'QUEUE_OVERLOAD', 'SMTP_ERROR', 'DELIVERY_ISSUE', 'SYSTEM_ERROR');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- AlterTable
ALTER TABLE "ActionHistory" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Candidat" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "anip" TEXT,
    "serie" TEXT,
    "sexe" TEXT,
    "nationalite" TEXT,
    "email" TEXT NOT NULL,
    "emailConfirme" BOOLEAN NOT NULL DEFAULT false,
    "telephone" TEXT,
    "dateNaiss" TIMESTAMP(3),
    "lieuNaiss" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CANDIDAT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreCommission" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'COMMISSION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembreCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdministrateurDGES" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'DGES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdministrateurDGES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Controleur" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CONTROLEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Controleur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concours" (
    "id" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "etablissement" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "dateComposition" TIMESTAMP(3),
    "description" TEXT,
    "fraisParticipation" INTEGER,
    "seriesAcceptees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matieres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "piecesRequises" JSONB,
    "dateDebutDepot" TIMESTAMP(3),
    "dateFinDepot" TIMESTAMP(3),
    "dateDebutComposition" TIMESTAMP(3),
    "dateFinComposition" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Concours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" TEXT NOT NULL,
    "numeroInscription" TEXT,
    "candidatId" TEXT NOT NULL,
    "concoursId" TEXT NOT NULL,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_ATTENTE',
    "quittanceUrl" TEXT,
    "piecesExtras" JSONB,
    "commentaireRejet" TEXT,
    "commentaireSousReserve" TEXT,
    "decisionCommissionPar" TEXT,
    "decisionCommissionDate" TIMESTAMP(3),
    "decisionControleurPar" TEXT,
    "decisionControleurDate" TIMESTAMP(3),
    "commentaireControleur" TEXT,
    "note" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "candidatId" TEXT NOT NULL,
    "acteNaissance" TEXT,
    "carteIdentite" TEXT,
    "photo" TEXT,
    "releve" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "priority" "PriorityLevel" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "userId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "smtpCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAuditLog" (
    "id" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "userId" TEXT,
    "actorId" TEXT,
    "resourceId" TEXT,
    "resourceType" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidat_matricule_key" ON "Candidat"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "Candidat_anip_key" ON "Candidat"("anip");

-- CreateIndex
CREATE UNIQUE INDEX "Candidat_email_key" ON "Candidat"("email");

-- CreateIndex
CREATE INDEX "Candidat_anip_idx" ON "Candidat"("anip");

-- CreateIndex
CREATE UNIQUE INDEX "MembreCommission_email_key" ON "MembreCommission"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdministrateurDGES_email_key" ON "AdministrateurDGES"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Controleur_email_key" ON "Controleur"("email");

-- CreateIndex
CREATE INDEX "Concours_dateDebutDepot_idx" ON "Concours"("dateDebutDepot");

-- CreateIndex
CREATE INDEX "Concours_dateFinDepot_idx" ON "Concours"("dateFinDepot");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_numeroInscription_key" ON "Inscription"("numeroInscription");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_candidatId_concoursId_key" ON "Inscription"("candidatId", "concoursId");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_candidatId_key" ON "Dossier"("candidatId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_expiresAt_idx" ON "Notification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_name_key" ON "NotificationTemplate"("name");

-- CreateIndex
CREATE INDEX "NotificationTemplate_type_idx" ON "NotificationTemplate"("type");

-- CreateIndex
CREATE INDEX "NotificationTemplate_isActive_idx" ON "NotificationTemplate"("isActive");

-- CreateIndex
CREATE INDEX "EmailDelivery_notificationId_idx" ON "EmailDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "EmailDelivery_userId_idx" ON "EmailDelivery"("userId");

-- CreateIndex
CREATE INDEX "EmailDelivery_status_idx" ON "EmailDelivery"("status");

-- CreateIndex
CREATE INDEX "EmailDelivery_createdAt_idx" ON "EmailDelivery"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_eventType_idx" ON "NotificationAuditLog"("eventType");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_userId_idx" ON "NotificationAuditLog"("userId");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_actorId_idx" ON "NotificationAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "NotificationAuditLog_timestamp_idx" ON "NotificationAuditLog"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "NotificationAuditLog_resourceType_resourceId_idx" ON "NotificationAuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "SystemAlert_resolved_idx" ON "SystemAlert"("resolved");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_createdAt_idx" ON "SystemAlert"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "Candidat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_concoursId_fkey" FOREIGN KEY ("concoursId") REFERENCES "Concours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "Candidat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "ActionHistory_dossier_timestamp_idx" RENAME TO "ActionHistory_dossierId_timestamp_idx";

-- RenameIndex
ALTER INDEX "ActionHistory_user_timestamp_idx" RENAME TO "ActionHistory_utilisateurId_timestamp_idx";
