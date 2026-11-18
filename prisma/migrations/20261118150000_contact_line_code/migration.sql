ALTER TABLE "contacts" ADD COLUMN "lineCode" TEXT;

UPDATE "contacts"
SET "lineCode" = 'LK-' || UPPER(REPLACE("id", 'ct_', ''))
WHERE "id" LIKE 'ct_%' AND "lineCode" IS NULL;

UPDATE "contacts"
SET "lineCode" = 'LK-' || UPPER(RIGHT("id", 6))
WHERE "lineCode" IS NULL;

ALTER TABLE "contacts" ALTER COLUMN "lineCode" SET NOT NULL;

CREATE UNIQUE INDEX "contacts_lineCode_key" ON "contacts"("lineCode");

UPDATE "contacts"
SET "lineUserId" = NULL
WHERE "lineUserId" LIKE 'Udemo%';
