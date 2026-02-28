import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "next-runtime-env";

import { createDrizzleClient } from "@kan/db/client";
import * as pendingEmailRepo from "@kan/db/repository/pendingCardMoveEmail.repo";
import { sendEmail } from "@kan/email";

type ResponseData =
  | { success: true; sent: number; recipients: number }
  | { success: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const db = createDrizzleClient();
    const baseUrl = env("NEXT_PUBLIC_BASE_URL");

    const pending = await pendingEmailRepo.getAndDeletePendingBefore(
      db,
      new Date(),
    );

    if (pending.length === 0) {
      return res.status(200).json({ success: true, sent: 0, recipients: 0 });
    }

    // Group by recipient
    const byRecipient = new Map<
      string,
      {
        email: string;
        movements: Array<{
          cardTitle: string;
          cardUrl: string;
          fromListName: string;
          toListName: string;
          movedByName: string;
          boardName: string;
        }>;
      }
    >();

    for (const item of pending) {
      const movement = {
        cardTitle: item.cardTitle,
        cardUrl: `${baseUrl}/cards/${item.cardPublicId}`,
        fromListName: item.fromListName,
        toListName: item.toListName,
        movedByName: item.movedByName || "Someone",
        boardName: item.boardName,
      };

      const existing = byRecipient.get(item.recipientUserId);

      if (existing) {
        // Deduplicate: skip if same card moved to same list already in batch
        const isDupe = existing.movements.some(
          (m) =>
            m.cardTitle === movement.cardTitle &&
            m.fromListName === movement.fromListName &&
            m.toListName === movement.toListName,
        );
        if (!isDupe) {
          existing.movements.push(movement);
        }
      } else {
        byRecipient.set(item.recipientUserId, {
          email: item.recipientEmail,
          movements: [movement],
        });
      }
    }

    // Send one digest email per recipient
    let sentCount = 0;
    for (const [, recipient] of byRecipient) {
      try {
        const count = recipient.movements.length;
        const subject =
          count === 1
            ? `Zadatak "${recipient.movements[0]!.cardTitle}" premješten u ${recipient.movements[0]!.toListName}`
            : `${count} zadatka premještena`;

        await sendEmail(recipient.email, subject, "CARD_MOVE_DIGEST", {
          movements: JSON.stringify(recipient.movements),
        });
        sentCount++;
      } catch (error) {
        console.error("Failed to send card move digest email:", {
          email: recipient.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return res.status(200).json({
      success: true,
      sent: sentCount,
      recipients: byRecipient.size,
    });
  } catch (error) {
    console.error("Error processing card move emails:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
