import { decimal, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const category = pgTable("category", {
   budget: decimal("budget", { precision: 10, scale: 2 }).default("0"),
   color: text("color").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   icon: text("icon").default("Wallet"),
   id: text("id").primaryKey(),
   name: text("name").notNull(),
   updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});
