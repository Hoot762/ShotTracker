import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table with user reference
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  date: text("date").notNull(),
  rifle: text("rifle").notNull(),
  calibre: text("calibre").notNull(),
  bulletWeight: integer("bullet_weight").notNull(),
  distance: integer("distance").notNull(),
  elevation: real("elevation"),
  windage: real("windage"),
  shots: text("shots").array().notNull(),
  totalScore: real("total_score").notNull(),
  vCount: integer("v_count").notNull(),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Session schemas
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  userId: true,
  totalScore: true,
  vCount: true,
  createdAt: true,
}).extend({
  shots: z.array(z.union([z.string(), z.number()])).length(12),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
