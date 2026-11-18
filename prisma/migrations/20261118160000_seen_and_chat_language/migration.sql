ALTER TABLE "contacts" ADD COLUMN "chatLanguage" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "messages" ADD COLUMN "seenAt" TIMESTAMP(3);
UPDATE "messages" SET "seenAt" = "createdAt" WHERE "direction" = 'INBOUND' AND "seenAt" IS NULL;
