import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  totalScore: true,
  vCount: true,
  createdAt: true,
}).extend({
  shots: z.array(z.union([z.string(), z.number()])).length(12),
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
