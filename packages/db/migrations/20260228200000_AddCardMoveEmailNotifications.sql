-- Add email notification toggle columns to list table
ALTER TABLE "list" ADD COLUMN IF NOT EXISTS "emailAssigneesOnMove" boolean NOT NULL DEFAULT false;
ALTER TABLE "list" ADD COLUMN IF NOT EXISTS "emailLeadersOnMove" boolean NOT NULL DEFAULT false;

-- Create card_move_email_type enum
DO $$ BEGIN
  CREATE TYPE "card_move_email_type" AS ENUM('assignee', 'leader');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create pending_card_move_email table
CREATE TABLE IF NOT EXISTS "pending_card_move_email" (
  "id" bigserial PRIMARY KEY,
  "type" "card_move_email_type" NOT NULL,
  "recipientUserId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "recipientEmail" varchar(255) NOT NULL,
  "cardId" bigint NOT NULL REFERENCES "card"("id") ON DELETE CASCADE,
  "cardTitle" varchar(500) NOT NULL,
  "cardPublicId" varchar(12) NOT NULL,
  "fromListId" bigint NOT NULL REFERENCES "list"("id") ON DELETE CASCADE,
  "fromListName" varchar(255) NOT NULL,
  "toListId" bigint NOT NULL REFERENCES "list"("id") ON DELETE CASCADE,
  "toListName" varchar(255) NOT NULL,
  "movedByUserId" uuid REFERENCES "user"("id") ON DELETE SET NULL,
  "movedByName" varchar(255),
  "boardName" varchar(255) NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Enable RLS on the new table
ALTER TABLE "pending_card_move_email" ENABLE ROW LEVEL SECURITY;
