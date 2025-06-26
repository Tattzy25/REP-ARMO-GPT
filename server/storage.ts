import { 
  users, chatSessions, messages, activityLogs, errorLogs, tempStorage,
  type User, type InsertUser, type ChatSession, type InsertChatSession, 
  type Message, type InsertMessage, type InsertActivityLog, type ActivityLog,
  type InsertErrorLog, type ErrorLog, type InsertTempStorage, type TempStorage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc, lt, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getChatSessionsByUserAndVibe(userId: number | null, vibe: string): Promise<ChatSession[]>;
  getRecentChatSessions(userId: number | null, limit?: number): Promise<ChatSession[]>;
  deleteChatSession(id: number): Promise<void>;
  extendChatSession(id: number): Promise<void>;
  updateChatSessionTitle(id: number, title: string): Promise<void>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBySession(sessionId: number): Promise<Message[]>;
  
  // Logging methods
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  logError(log: InsertErrorLog): Promise<ErrorLog>;
  
  // Temporary storage methods
  setTempData(key: string, value: any, expiresInMinutes?: number): Promise<TempStorage>;
  getTempData(key: string): Promise<any | null>;
  deleteTempData(key: string): Promise<void>;
  cleanupExpiredTempData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getRecentChatSessions(userId: number | null, limit = 10): Promise<ChatSession[]> {
    try {
      // Get sessions that have messages
      const sessions = await db
        .select()
        .from(chatSessions)
        .where(
          userId ? eq(chatSessions.userId, userId) : isNull(chatSessions.userId)
        )
        .orderBy(desc(chatSessions.createdAt))
        .limit(limit);
      
      // Filter sessions that have messages
      const sessionsWithMessages = [];
      for (const session of sessions) {
        const messageCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(eq(messages.sessionId, session.id));
        
        if (messageCount[0].count > 0) {
          sessionsWithMessages.push(session);
        }
      }
      
      console.log('Total sessions:', sessions.length, 'With messages:', sessionsWithMessages.length);
      return sessionsWithMessages;
    } catch (error) {
      console.error('Error in getRecentChatSessions:', error);
      return [];
    }
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async getChatSessionsByUserAndVibe(userId: number | null, vibe: string): Promise<ChatSession[]> {
    return await db.select().from(chatSessions).where(
      eq(chatSessions.vibe, vibe)
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesBySession(sessionId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId));
  }

  async logActivity(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async logError(insertLog: InsertErrorLog): Promise<ErrorLog> {
    const [log] = await db
      .insert(errorLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async setTempData(key: string, value: any, expiresInMinutes = 60): Promise<TempStorage> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    await db.delete(tempStorage).where(eq(tempStorage.key, key));

    const [data] = await db
      .insert(tempStorage)
      .values({
        key,
        value: JSON.stringify(value),
        expiresAt,
      })
      .returning();
    return data;
  }

  async getTempData(key: string): Promise<any | null> {
    const [data] = await db
      .select()
      .from(tempStorage)
      .where(eq(tempStorage.key, key))
      .limit(1);

    if (!data) return null;

    if (data.expiresAt && new Date() > data.expiresAt) {
      await db.delete(tempStorage).where(eq(tempStorage.id, data.id));
      return null;
    }

    try {
      return JSON.parse(data.value);
    } catch {
      return data.value;
    }
  }

  async deleteTempData(key: string): Promise<void> {
    await db.delete(tempStorage).where(eq(tempStorage.key, key));
  }

  async cleanupExpiredTempData(): Promise<void> {
    await db
      .delete(tempStorage)
      .where(lt(tempStorage.expiresAt, new Date()));
  }
}

export const storage = new DatabaseStorage();
