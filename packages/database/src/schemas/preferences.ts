import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const preference = pgTable("preference", {
   createdAt: timestamp("created_at").defaultNow().notNull(),
   currency: text("currency").notNull().default("USD"),
   id: text("id").primaryKey(),
   updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});
