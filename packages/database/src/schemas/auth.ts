import { relations, sql } from "drizzle-orm";
import {
   boolean,
   index,
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
   banExpires: timestamp("ban_expires"),
   banned: boolean("banned").default(false),
   banReason: text("ban_reason"),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   email: text("email").notNull().unique(),
   emailVerified: boolean("email_verified").default(false).notNull(),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   image: text("image"),
   name: text("name").notNull(),
   role: text("role"),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
});

export const session = pgTable(
   "session",
   {
      activeOrganizationId: text("active_organization_id"),
      activeTeamId: text("active_team_id"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      impersonatedBy: text("impersonated_by"),
      ipAddress: text("ip_address"),
      token: text("token").notNull().unique(),
      updatedAt: timestamp("updated_at")
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
      userAgent: text("user_agent"),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
   "account",
   {
      accessToken: text("access_token"),
      accessTokenExpiresAt: timestamp("access_token_expires_at"),
      accountId: text("account_id").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      idToken: text("id_token"),
      password: text("password"),
      providerId: text("provider_id").notNull(),
      refreshToken: text("refresh_token"),
      refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
      scope: text("scope"),
      updatedAt: timestamp("updated_at")
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
   "verification",
   {
      createdAt: timestamp("created_at").defaultNow().notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      identifier: text("identifier").notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => /* @__PURE__ */ new Date())
         .notNull(),
      value: text("value").notNull(),
   },
   (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable("organization", {
   createdAt: timestamp("created_at").notNull(),
   description: text("description").default(""),
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   logo: text("logo"),
   metadata: text("metadata"),
   name: text("name").notNull(),
   slug: text("slug").notNull().unique(),
});

export const team = pgTable(
   "team",
   {
      createdAt: timestamp("created_at").notNull(),
      description: text("description").default(""),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      name: text("name").notNull(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      updatedAt: timestamp("updated_at").$onUpdate(
         () => /* @__PURE__ */ new Date(),
      ),
   },
   (table) => [index("team_organizationId_idx").on(table.organizationId)],
);

export const teamMember = pgTable(
   "team_member",
   {
      createdAt: timestamp("created_at"),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [
      index("teamMember_teamId_idx").on(table.teamId),
      index("teamMember_userId_idx").on(table.userId),
   ],
);

export const member = pgTable(
   "member",
   {
      createdAt: timestamp("created_at").notNull(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      role: text("role").default("member").notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [
      index("member_organizationId_idx").on(table.organizationId),
      index("member_userId_idx").on(table.userId),
   ],
);

export const invitation = pgTable(
   "invitation",
   {
      createdAt: timestamp("created_at").defaultNow().notNull(),
      email: text("email").notNull(),
      expiresAt: timestamp("expires_at").notNull(),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      inviterId: uuid("inviter_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      role: text("role"),
      status: text("status").default("pending").notNull(),
      teamId: text("team_id"),
   },
   (table) => [
      index("invitation_organizationId_idx").on(table.organizationId),
      index("invitation_email_idx").on(table.email),
   ],
);

export const apikey = pgTable(
   "apikey",
   {
      createdAt: timestamp("created_at").notNull(),
      enabled: boolean("enabled").default(true),
      expiresAt: timestamp("expires_at"),
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      key: text("key").notNull(),
      lastRefillAt: timestamp("last_refill_at"),
      lastRequest: timestamp("last_request"),
      metadata: text("metadata"),
      name: text("name"),
      permissions: text("permissions"),
      prefix: text("prefix"),
      rateLimitEnabled: boolean("rate_limit_enabled").default(true),
      rateLimitMax: integer("rate_limit_max").default(500),
      rateLimitTimeWindow: integer("rate_limit_time_window").default(3600000),
      refillAmount: integer("refill_amount"),
      refillInterval: integer("refill_interval"),
      remaining: integer("remaining"),
      requestCount: integer("request_count").default(0),
      start: text("start"),
      updatedAt: timestamp("updated_at").notNull(),
      userId: uuid("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
   },
   (table) => [
      index("apikey_key_idx").on(table.key),
      index("apikey_userId_idx").on(table.userId),
   ],
);

export const userRelations = relations(user, ({ many }) => ({
   accounts: many(account),
   apikeys: many(apikey),
   invitations: many(invitation),
   members: many(member),
   sessions: many(session),
   teamMembers: many(teamMember),
}));

export const sessionRelations = relations(session, ({ one }) => ({
   user: one(user, {
      fields: [session.userId],
      references: [user.id],
   }),
}));

export const accountRelations = relations(account, ({ one }) => ({
   user: one(user, {
      fields: [account.userId],
      references: [user.id],
   }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
   invitations: many(invitation),
   members: many(member),
   teams: many(team),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
   organization: one(organization, {
      fields: [team.organizationId],
      references: [organization.id],
   }),
   teamMembers: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
   team: one(team, {
      fields: [teamMember.teamId],
      references: [team.id],
   }),
   user: one(user, {
      fields: [teamMember.userId],
      references: [user.id],
   }),
}));

export const memberRelations = relations(member, ({ one }) => ({
   organization: one(organization, {
      fields: [member.organizationId],
      references: [organization.id],
   }),
   user: one(user, {
      fields: [member.userId],
      references: [user.id],
   }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
   organization: one(organization, {
      fields: [invitation.organizationId],
      references: [organization.id],
   }),
   user: one(user, {
      fields: [invitation.inviterId],
      references: [user.id],
   }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
   user: one(user, {
      fields: [apikey.userId],
      references: [user.id],
   }),
}));
