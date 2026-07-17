-- Add new fields to EmailDelivery table for email content and retry management

-- Add htmlBody field for HTML email content
ALTER TABLE "EmailDelivery" ADD COLUMN IF NOT EXISTS "htmlBody" TEXT;

-- Add textBody field for plain text email content
ALTER TABLE "EmailDelivery" ADD COLUMN IF NOT EXISTS "textBody" TEXT;

-- Add attachments field for storing attachment metadata as JSON
ALTER TABLE "EmailDelivery" ADD COLUMN IF NOT EXISTS "attachments" JSONB;

-- Add nextRetryAt field for scheduling next retry attempt
ALTER TABLE "EmailDelivery" ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3);

-- Make userId nullable to support confirmation emails (candidate not yet created)
ALTER TABLE "EmailDelivery" ALTER COLUMN "userId" DROP NOT NULL;

-- Create index for worker query optimization (status + nextRetryAt)
CREATE INDEX IF NOT EXISTS "EmailDelivery_status_nextRetryAt_idx" 
ON "EmailDelivery"(status, "nextRetryAt") 
WHERE status IN ('QUEUED', 'FAILED');

-- Create index for rate limiting queries (userId + createdAt)
CREATE INDEX IF NOT EXISTS "EmailDelivery_userId_createdAt_idx" 
ON "EmailDelivery"("userId", "createdAt")
WHERE "userId" IS NOT NULL;

-- Create index for statistics queries (createdAt + status)
CREATE INDEX IF NOT EXISTS "EmailDelivery_createdAt_status_idx" 
ON "EmailDelivery"("createdAt", status);
