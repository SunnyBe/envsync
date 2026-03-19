-- Add expiresAt to ProjectMember for invite link expiry (7-day TTL)
ALTER TABLE "ProjectMember" ADD COLUMN "expiresAt" TIMESTAMP(3);
