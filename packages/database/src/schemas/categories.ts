import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const category = pgTable("category", {
   color: text("color").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   icon: text("icon").notNull(),
   id: text("id").primaryKey(),
   name: text("name").notNull(),
   updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
   userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
});
