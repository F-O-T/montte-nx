import { relations, sql } from "drizzle-orm";
import {
   decimal,
   index,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { member, organization, team } from "./auth";
import { bill } from "./bills";
import { transaction } from "./transactions";

export type SplitType = "equal" | "percentage" | "amount" | "shares";
export type SplitParticipantStatus = "pending" | "partial" | "settled";

export const expenseSplit = pgTable(
   "expense_split",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      transactionId: uuid("transaction_id").references(() => transaction.id, {
         onDelete: "set null",
      }),
      billId: uuid("bill_id").references(() => bill.id, {
         onDelete: "set null",
      }),
      teamId: uuid("team_id").references(() => team.id, {
         onDelete: "set null",
      }),
      splitType: text("split_type").notNull().$type<SplitType>(),
      totalAmount: decimal("total_amount", {
         precision: 10,
         scale: 2,
      }).notNull(),
      description: text("description"),
      createdBy: uuid("created_by").references(() => member.id, {
         onDelete: "set null",
      }),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("expense_split_organization_id_idx").on(table.organizationId),
      index("expense_split_transaction_id_idx").on(table.transactionId),
      index("expense_split_bill_id_idx").on(table.billId),
      index("expense_split_team_id_idx").on(table.teamId),
   ],
);

export const expenseSplitParticipant = pgTable(
   "expense_split_participant",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      expenseSplitId: uuid("expense_split_id")
         .notNull()
         .references(() => expenseSplit.id, { onDelete: "cascade" }),
      memberId: uuid("member_id")
         .notNull()
         .references(() => member.id, { onDelete: "cascade" }),
      allocatedAmount: decimal("allocated_amount", {
         precision: 10,
         scale: 2,
      }).notNull(),
      settledAmount: decimal("settled_amount", { precision: 10, scale: 2 })
         .default("0")
         .notNull(),
      status: text("status")
         .notNull()
         .$type<SplitParticipantStatus>()
         .default("pending"),
      shareValue: decimal("share_value", { precision: 10, scale: 2 }),
      percentageValue: decimal("percentage_value", { precision: 5, scale: 2 }),
      notes: text("notes"),
      settledAt: timestamp("settled_at"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("expense_split_participant_split_id_idx").on(table.expenseSplitId),
      index("expense_split_participant_member_id_idx").on(table.memberId),
   ],
);

export const expenseSplitSettlement = pgTable(
   "expense_split_settlement",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      participantId: uuid("participant_id")
         .notNull()
         .references(() => expenseSplitParticipant.id, { onDelete: "cascade" }),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      paidAt: timestamp("paid_at").defaultNow().notNull(),
      recordedBy: uuid("recorded_by").references(() => member.id, {
         onDelete: "set null",
      }),
      linkedTransactionId: uuid("linked_transaction_id").references(
         () => transaction.id,
         { onDelete: "set null" },
      ),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
   },
   (table) => [
      index("expense_split_settlement_participant_id_idx").on(
         table.participantId,
      ),
   ],
);

// Relations
export const expenseSplitRelations = relations(
   expenseSplit,
   ({ one, many }) => ({
      organization: one(organization, {
         fields: [expenseSplit.organizationId],
         references: [organization.id],
      }),
      transaction: one(transaction, {
         fields: [expenseSplit.transactionId],
         references: [transaction.id],
      }),
      bill: one(bill, {
         fields: [expenseSplit.billId],
         references: [bill.id],
      }),
      team: one(team, {
         fields: [expenseSplit.teamId],
         references: [team.id],
      }),
      createdByMember: one(member, {
         fields: [expenseSplit.createdBy],
         references: [member.id],
      }),
      participants: many(expenseSplitParticipant),
   }),
);

export const expenseSplitParticipantRelations = relations(
   expenseSplitParticipant,
   ({ one, many }) => ({
      expenseSplit: one(expenseSplit, {
         fields: [expenseSplitParticipant.expenseSplitId],
         references: [expenseSplit.id],
      }),
      member: one(member, {
         fields: [expenseSplitParticipant.memberId],
         references: [member.id],
      }),
      settlements: many(expenseSplitSettlement),
   }),
);

export const expenseSplitSettlementRelations = relations(
   expenseSplitSettlement,
   ({ one }) => ({
      participant: one(expenseSplitParticipant, {
         fields: [expenseSplitSettlement.participantId],
         references: [expenseSplitParticipant.id],
      }),
      recordedByMember: one(member, {
         fields: [expenseSplitSettlement.recordedBy],
         references: [member.id],
      }),
      linkedTransaction: one(transaction, {
         fields: [expenseSplitSettlement.linkedTransactionId],
         references: [transaction.id],
      }),
   }),
);

// Inferred types
export type ExpenseSplit = typeof expenseSplit.$inferSelect;
export type NewExpenseSplit = typeof expenseSplit.$inferInsert;
export type ExpenseSplitParticipant =
   typeof expenseSplitParticipant.$inferSelect;
export type NewExpenseSplitParticipant =
   typeof expenseSplitParticipant.$inferInsert;
export type ExpenseSplitSettlement = typeof expenseSplitSettlement.$inferSelect;
export type NewExpenseSplitSettlement =
   typeof expenseSplitSettlement.$inferInsert;
