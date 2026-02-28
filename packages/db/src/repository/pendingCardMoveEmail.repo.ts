import { lte } from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import { pendingCardMoveEmails } from "@kan/db/schema";

export const bulkCreate = async (
  db: dbClient,
  inputs: Array<{
    type: "assignee" | "leader";
    recipientUserId: string;
    recipientEmail: string;
    cardId: number;
    cardTitle: string;
    cardPublicId: string;
    fromListId: number;
    fromListName: string;
    toListId: number;
    toListName: string;
    movedByUserId: string | null;
    movedByName: string | null;
    boardName: string;
  }>,
) => {
  if (inputs.length === 0) return [];
  return db.insert(pendingCardMoveEmails).values(inputs).returning();
};

export const getAndDeletePendingBefore = async (
  db: dbClient,
  before: Date,
) => {
  return db.transaction(async (tx) => {
    const pending = await tx.query.pendingCardMoveEmails.findMany({
      where: lte(pendingCardMoveEmails.createdAt, before),
    });

    if (pending.length > 0) {
      await tx
        .delete(pendingCardMoveEmails)
        .where(lte(pendingCardMoveEmails.createdAt, before));
    }

    return pending;
  });
};
