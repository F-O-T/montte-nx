import { decimal, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const category = pgTable(
   "category",
   {
      budget: decimal("budget", { precision: 10, scale: 2 }).default("0"),
      color: text("color").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      icon: text("icon").default("Wallet"),
      id: text("id").primaryKey(),
      name: text("name").notNull(),
      slug: text("slug").notNull(),
      updatedAt: timestamp("updated_at")
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [
      uniqueIndex("category_userId_slug_idx").on(table.userId, table.slug),
   ],
);
