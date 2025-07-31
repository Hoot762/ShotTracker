import { type Session, type InsertSession } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Session methods
  getSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  getFilteredSessions(filters: {
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    rifle?: string;
    distance?: number;
  }): Promise<Session[]>;
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

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();
  }

  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const { totalScore, vCount } = calculateScore(insertSession.shots);
    
    const session: Session = {
      ...insertSession,
      id,
      totalScore,
      vCount,
      elevation: insertSession.elevation ?? null,
      windage: insertSession.windage ?? null,
      photoUrl: insertSession.photoUrl ?? null,
      notes: insertSession.notes ?? null,
      shots: insertSession.shots.map(shot => shot.toString()),
      createdAt: new Date(),
    };
    
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: string, updateData: Partial<InsertSession>): Promise<Session | undefined> {
    const existingSession = this.sessions.get(id);
    if (!existingSession) return undefined;
    
    let totalScore = existingSession.totalScore;
    let vCount = existingSession.vCount;
    
    if (updateData.shots) {
      const calculated = calculateScore(updateData.shots);
      totalScore = calculated.totalScore;
      vCount = calculated.vCount;
    }
    
    const updatedSession: Session = {
      ...existingSession,
      ...updateData,
      totalScore,
      vCount,
      elevation: updateData.elevation ?? existingSession.elevation,
      windage: updateData.windage ?? existingSession.windage,
      photoUrl: updateData.photoUrl ?? existingSession.photoUrl,
      notes: updateData.notes ?? existingSession.notes,
      shots: updateData.shots ? updateData.shots.map(shot => shot.toString()) : existingSession.shots,
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async getFilteredSessions(filters: {
    name?: string;
    dateFrom?: string;
    dateTo?: string;
    rifle?: string;
    distance?: number;
  }): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());
    
    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      sessions = sessions.filter(session => 
        session.name.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.dateFrom) {
      sessions = sessions.filter(session => session.date >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      sessions = sessions.filter(session => session.date <= filters.dateTo!);
    }
    
    if (filters.rifle) {
      sessions = sessions.filter(session => 
        session.rifle.toLowerCase().includes(filters.rifle!.toLowerCase())
      );
    }
    
    if (filters.distance) {
      sessions = sessions.filter(session => session.distance === filters.distance);
    }
    
    return sessions.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

export const storage = new MemStorage();
