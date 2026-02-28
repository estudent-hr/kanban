import { relations } from "drizzle-orm";
import {
  bigint,
  bigserial,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { cards } from "./cards";
import { lists } from "./lists";
import { users } from "./users";

export const cardMoveEmailTypes = ["assignee", "leader"] as const;
export type CardMoveEmailType = (typeof cardMoveEmailTypes)[number];
export const cardMoveEmailTypeEnum = pgEnum(
  "card_move_email_type",
  cardMoveEmailTypes,
);

export const pendingCardMoveEmails = pgTable("pending_card_move_email", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  type: cardMoveEmailTypeEnum("type").notNull(),
  recipientUserId: uuid("recipientUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientEmail: varchar("recipientEmail", { length: 255 }).notNull(),
  cardId: bigint("cardId", { mode: "number" })
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  cardTitle: varchar("cardTitle", { length: 500 }).notNull(),
  cardPublicId: varchar("cardPublicId", { length: 12 }).notNull(),
  fromListId: bigint("fromListId", { mode: "number" })
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  fromListName: varchar("fromListName", { length: 255 }).notNull(),
  toListId: bigint("toListId", { mode: "number" })
    .notNull()
    .references(() => lists.id, { onDelete: "cascade" }),
  toListName: varchar("toListName", { length: 255 }).notNull(),
  movedByUserId: uuid("movedByUserId").references(() => users.id, {
    onDelete: "set null",
  }),
  movedByName: varchar("movedByName", { length: 255 }),
  boardName: varchar("boardName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}).enableRLS();

export const pendingCardMoveEmailsRelations = relations(
  pendingCardMoveEmails,
  ({ one }) => ({
    recipient: one(users, {
      fields: [pendingCardMoveEmails.recipientUserId],
      references: [users.id],
      relationName: "pendingCardMoveEmailRecipient",
    }),
    card: one(cards, {
      fields: [pendingCardMoveEmails.cardId],
      references: [cards.id],
      relationName: "pendingCardMoveEmailCard",
    }),
    fromList: one(lists, {
      fields: [pendingCardMoveEmails.fromListId],
      references: [lists.id],
      relationName: "pendingCardMoveEmailFromList",
    }),
    toList: one(lists, {
      fields: [pendingCardMoveEmails.toListId],
      references: [lists.id],
      relationName: "pendingCardMoveEmailToList",
    }),
    movedBy: one(users, {
      fields: [pendingCardMoveEmails.movedByUserId],
      references: [users.id],
      relationName: "pendingCardMoveEmailMovedBy",
    }),
  }),
);
