import { relations, sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export type FilterMetadata = {
   bankAccounts: Array<{ id: string; name: string }>;
   categories: Array<{ id: string; name: string }>;
   costCenters: Array<{ id: string; name: string }>;
   tags: Array<{ id: string; name: string }>;
};

export type DRESnapshotData = {
   summary: {
      totalIncome: number;
      totalExpenses: number;
      netResult: number;
      transactionCount: number;
   };
   categoryBreakdown: Array<{
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      income: number;
      expenses: number;
   }>;
   dreLines: DRELineItem[];
   transactions: TransactionSnapshot[];
   generatedAt: string;
   filterMetadata?: FilterMetadata;
};

export type DRELineItem = {
   code: string;
   label: string;
   value: number;
   plannedValue?: number;
   variance?: number;
   isTotal: boolean;
   indent: number;
};

export type TransactionSnapshot = {
   id: string;
   date: string;
   description: string;
   amount: number;
   type: "income" | "expense" | "transfer";
   bankAccount?: {
      id: string;
      name: string;
   };
   costCenter?: {
      id: string;
      name: string;
      code?: string;
   };
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon?: string;
   }>;
   tags: Array<{
      id: string;
      name: string;
      color: string;
   }>;
   categorySplits?: Array<{
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      value: number;
   }>;
};

export type ReportFilterConfig = {
   bankAccountIds?: string[];
   categoryIds?: string[];
   costCenterIds?: string[];
   tagIds?: string[];
   includeTransfers?: boolean;
};

export const customReport = pgTable("custom_report", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   createdBy: uuid("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
   description: text("description"),
   endDate: timestamp("end_date").notNull(),
   filterConfig: jsonb("filter_config").$type<ReportFilterConfig>(),
   id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
   name: text("name").notNull(),
   organizationId: uuid("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
   snapshotData: jsonb("snapshot_data").$type<DRESnapshotData>().notNull(),
   startDate: timestamp("start_date").notNull(),
   type: text("type").notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const customReportRelations = relations(customReport, ({ one }) => ({
   createdByUser: one(user, {
      fields: [customReport.createdBy],
      references: [user.id],
   }),
   organization: one(organization, {
      fields: [customReport.organizationId],
      references: [organization.id],
   }),
}));

export type CustomReport = typeof customReport.$inferSelect;
export type NewCustomReport = typeof customReport.$inferInsert;
