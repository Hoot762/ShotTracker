import { 
  type Session, 
  type InsertSession, 
  type User, 
  type InsertUser,
  type DopeCard,
  type DopeRange,
  type InsertDopeCard,
  type InsertDopeRange,
  users, 
  sessions,
  dopeCards,
  dopeRanges
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ilike, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  
  // Session methods
  getSessions(userId: string): Promise<Session[]>;
  getSession(id: string, userId: string): Promise<Session | undefined>;
  createSession(session: InsertSession, userId: string): Promise<Session>;
  updateSession(id: string, session: Partial<InsertSession>, userId: string): Promise<Session | undefined>;
  deleteSession(id: string, userId: string): Promise<boolean>;
  getFilteredSessions(filters: {
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    rifle?: string;
    distance?: number;
  }, userId: string): Promise<Session[]>;
  
  // DOPE Card methods
  getDopeCards(userId: string): Promise<DopeCard[]>;
  getDopeCard(id: string, userId: string): Promise<DopeCard | undefined>;
  createDopeCard(dopeCard: InsertDopeCard, userId: string): Promise<DopeCard>;
  updateDopeCard(id: string, dopeCard: Partial<InsertDopeCard>, userId: string): Promise<DopeCard | undefined>;
  deleteDopeCard(id: string, userId: string): Promise<boolean>;
  
  // DOPE Range methods
  getDopeRanges(dopeCardId: string): Promise<DopeRange[]>;
  createDopeRange(dopeRange: InsertDopeRange, dopeCardId: string): Promise<DopeRange>;
  updateDopeRange(id: string, dopeRange: Partial<InsertDopeRange>): Promise<DopeRange | undefined>;
  deleteDopeRange(id: string): Promise<boolean>;
}

// Calculate score from shots array
function calculateScore(shots: (string | number)[]): { totalScore: number; vCount: number } {
  let totalScore = 0;
  let vCount = 0;
  
  for (const shot of shots) {
    if (shot === 'V' || shot === 'v') {
      totalScore += 5;
      vCount += 1;
    } else if (typeof shot === 'number') {
      totalScore += shot;
    } else if (typeof shot === 'string' && !isNaN(Number(shot))) {
      totalScore += Number(shot);
    }
  }
  
  return { totalScore, vCount };
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  // Session methods
  async getSessions(userId: string): Promise<Session[]> {
    return await db.select().from(sessions).where(eq(sessions.userId, userId))
      .orderBy(sql`${sessions.createdAt} DESC`);
  }

  async getSession(id: string, userId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
    return session || undefined;
  }

  async createSession(insertSession: InsertSession, userId: string): Promise<Session> {
    const { totalScore, vCount } = calculateScore(insertSession.shots);
    
    const [session] = await db
      .insert(sessions)
      .values({
        ...insertSession,
        userId,
        totalScore,
        vCount,
        elevation: insertSession.elevation ?? null,
        windage: insertSession.windage ?? null,
        photoUrl: insertSession.photoUrl ?? null,
        notes: insertSession.notes ?? null,
        shots: insertSession.shots.map(shot => shot.toString()),
      })
      .returning();
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertSession>, userId: string): Promise<Session | undefined> {
    let totalScore: number | undefined;
    let vCount: number | undefined;
    
    if (updateData.shots) {
      const calculated = calculateScore(updateData.shots);
      totalScore = calculated.totalScore;
      vCount = calculated.vCount;
    }

    // Prepare update object, handling explicit null values
    const updateObj: any = { ...updateData };
    
    if (totalScore !== undefined) updateObj.totalScore = totalScore;
    if (vCount !== undefined) updateObj.vCount = vCount;
    
    // Handle null values explicitly
    if (updateData.hasOwnProperty('elevation')) {
      updateObj.elevation = updateData.elevation;
    }
    if (updateData.hasOwnProperty('windage')) {
      updateObj.windage = updateData.windage;
    }
    if (updateData.hasOwnProperty('photoUrl')) {
      updateObj.photoUrl = updateData.photoUrl; // This will be null when explicitly deleting
      console.log("Updating photoUrl to:", updateData.photoUrl);
    }
    if (updateData.hasOwnProperty('notes')) {
      updateObj.notes = updateData.notes;
    }
    if (updateData.shots) {
      updateObj.shots = updateData.shots.map(shot => shot.toString());
    }
    
    const [session] = await db
      .update(sessions)
      .set(updateObj)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getFilteredSessions(filters: {
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    rifle?: string;
    distance?: number;
  }, userId: string): Promise<Session[]> {
    let query = db.select().from(sessions).where(eq(sessions.userId, userId));
    
    const conditions = [eq(sessions.userId, userId)];
    
    if (filters.name) {
      conditions.push(ilike(sessions.name, `%${filters.name}%`));
    }
    
    if (filters.dateFrom) {
      conditions.push(gte(sessions.date, filters.dateFrom));
    }
    
    if (filters.dateTo) {
      conditions.push(lte(sessions.date, filters.dateTo));
    }
    
    if (filters.rifle) {
      conditions.push(ilike(sessions.rifle, `%${filters.rifle}%`));
    }
    
    if (filters.distance) {
      conditions.push(eq(sessions.distance, filters.distance));
    }
    
    return await db.select().from(sessions)
      .where(and(...conditions))
      .orderBy(sql`${sessions.createdAt} DESC`);
  }

  // DOPE Card methods
  async getDopeCards(userId: string): Promise<DopeCard[]> {
    return await db.select().from(dopeCards).where(eq(dopeCards.userId, userId));
  }

  async getDopeCard(id: string, userId: string): Promise<DopeCard | undefined> {
    const [card] = await db.select().from(dopeCards).where(
      and(eq(dopeCards.id, id), eq(dopeCards.userId, userId))
    );
    return card;
  }

  async createDopeCard(dopeCard: InsertDopeCard, userId: string): Promise<DopeCard> {
    const [card] = await db.insert(dopeCards).values({
      ...dopeCard,
      userId,
    }).returning();
    return card;
  }

  async updateDopeCard(id: string, dopeCard: Partial<InsertDopeCard>, userId: string): Promise<DopeCard | undefined> {
    const [card] = await db.update(dopeCards)
      .set(dopeCard)
      .where(and(eq(dopeCards.id, id), eq(dopeCards.userId, userId)))
      .returning();
    return card;
  }

  async deleteDopeCard(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(dopeCards)
      .where(and(eq(dopeCards.id, id), eq(dopeCards.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // DOPE Range methods
  async getDopeRanges(dopeCardId: string): Promise<DopeRange[]> {
    return await db.select().from(dopeRanges).where(eq(dopeRanges.dopeCardId, dopeCardId));
  }

  async createDopeRange(dopeRange: InsertDopeRange, dopeCardId: string): Promise<DopeRange> {
    const [range] = await db.insert(dopeRanges).values({
      ...dopeRange,
      dopeCardId,
    }).returning();
    return range;
  }

  async updateDopeRange(id: string, dopeRange: Partial<InsertDopeRange>): Promise<DopeRange | undefined> {
    const [range] = await db.update(dopeRanges)
      .set(dopeRange)
      .where(eq(dopeRanges.id, id))
      .returning();
    return range;
  }

  async deleteDopeRange(id: string): Promise<boolean> {
    const result = await db.delete(dopeRanges).where(eq(dopeRanges.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
