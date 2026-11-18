ALTER TABLE "users" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';

UPDATE "users" SET "title" = 'Sales' WHERE btrim("title") = '';

ALTER TABLE "users" ADD CONSTRAINT "users_title_length" CHECK (char_length(btrim("title")) BETWEEN 2 AND 120);
