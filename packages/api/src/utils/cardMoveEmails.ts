import { and, eq, inArray, isNull } from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import * as listRepo from "@kan/db/repository/list.repo";
import * as pendingEmailRepo from "@kan/db/repository/pendingCardMoveEmail.repo";
import * as userRepo from "@kan/db/repository/user.repo";
import { cardToWorkspaceMembers, workspaceMembers } from "@kan/db/schema";

export async function queueCardMoveEmails({
  db,
  cardId,
  cardPublicId,
  cardTitle,
  fromListId,
  toListId,
  movedByUserId,
  workspaceId,
}: {
  db: dbClient;
  cardId: number;
  cardPublicId: string;
  cardTitle: string;
  fromListId: number;
  toListId: number;
  movedByUserId: string;
  workspaceId: number;
}) {
  const targetList = await listRepo.getById(db, toListId);
  if (!targetList) return;

  if (!targetList.emailAssigneesOnMove && !targetList.emailLeadersOnMove) return;

  const sourceList = await listRepo.getById(db, fromListId);
  const fromListName = sourceList?.name || "Unknown";
  const toListName = targetList.name || "Unknown";

  const mover = await userRepo.getById(db, movedByUserId);
  const movedByName = mover?.name?.trim() || mover?.email || "Someone";

  const board = await db.query.boards.findFirst({
    columns: { name: true },
    where: (boards, { eq }) => eq(boards.id, targetList.boardId),
  });
  const boardName = board?.name || "Board";

  const emailsToQueue: Array<{
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
  }> = [];

  if (targetList.emailAssigneesOnMove) {
    const assignedMembers = await db
      .select({
        userId: workspaceMembers.userId,
        email: workspaceMembers.email,
      })
      .from(cardToWorkspaceMembers)
      .innerJoin(
        workspaceMembers,
        eq(cardToWorkspaceMembers.workspaceMemberId, workspaceMembers.id),
      )
      .where(
        and(
          eq(cardToWorkspaceMembers.cardId, cardId),
          isNull(workspaceMembers.deletedAt),
          eq(workspaceMembers.status, "active"),
        ),
      );

    for (const member of assignedMembers) {
      if (!member.userId || member.userId === movedByUserId) continue;

      emailsToQueue.push({
        type: "assignee",
        recipientUserId: member.userId,
        recipientEmail: member.email,
        cardId,
        cardTitle,
        cardPublicId,
        fromListId,
        fromListName,
        toListId,
        toListName,
        movedByUserId,
        movedByName,
        boardName,
      });
    }
  }

  if (targetList.emailLeadersOnMove) {
    const leaders = await db
      .select({
        userId: workspaceMembers.userId,
        email: workspaceMembers.email,
      })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          isNull(workspaceMembers.deletedAt),
          eq(workspaceMembers.status, "active"),
          inArray(workspaceMembers.role, ["admin", "leader"]),
        ),
      );

    for (const leader of leaders) {
      if (!leader.userId || leader.userId === movedByUserId) continue;

      const alreadyQueued = emailsToQueue.some(
        (e) => e.recipientUserId === leader.userId,
      );
      if (alreadyQueued) continue;

      emailsToQueue.push({
        type: "leader",
        recipientUserId: leader.userId,
        recipientEmail: leader.email,
        cardId,
        cardTitle,
        cardPublicId,
        fromListId,
        fromListName,
        toListId,
        toListName,
        movedByUserId,
        movedByName,
        boardName,
      });
    }
  }

  if (emailsToQueue.length > 0) {
    await pendingEmailRepo.bulkCreate(db, emailsToQueue);
  }
}
