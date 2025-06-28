import { 
  users, chatSessions, messages, activityLogs, errorLogs, tempStorage,
  personaLevels, languagePermissions, userGenderDetection, userMoodDetection,
  userEmotionDetection, userBehaviorDetection, userEngagementDetection,
  userIntentDetection, reusableContentRepository, contentReuseRules, contentUsageTracking,
  type User, type InsertUser, type ChatSession, type InsertChatSession, 
  type Message, type InsertMessage, type InsertActivityLog, type ActivityLog,
  type InsertErrorLog, type ErrorLog, type InsertTempStorage, type TempStorage,
  type PersonaLevel, type InsertPersonaLevel, type LanguagePermission, type InsertLanguagePermission,
  type UserGenderDetection, type InsertUserGenderDetection, type UserMoodDetection, type InsertUserMoodDetection,
  type UserEmotionDetection, type InsertUserEmotionDetection, type UserBehaviorDetection, type InsertUserBehaviorDetection,
  type UserEngagementDetection, type InsertUserEngagementDetection, type UserIntentDetection, type InsertUserIntentDetection,
  type ReusableContentRepository, type InsertReusableContentRepository, type ContentReuseRules, type InsertContentReuseRules,
  type ContentUsageTracking, type InsertContentUsageTracking
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

  // Persona system methods
  getPersonaLevel(id: string): Promise<PersonaLevel | undefined>;
  getAllPersonaLevels(): Promise<PersonaLevel[]>;
  createPersonaLevel(level: InsertPersonaLevel): Promise<PersonaLevel>;
  
  getLanguagePermissions(personaLevelId: string): Promise<LanguagePermission[]>;
  createLanguagePermission(permission: InsertLanguagePermission): Promise<LanguagePermission>;
  
  // User detection methods
  recordGenderDetection(detection: InsertUserGenderDetection): Promise<UserGenderDetection>;
  getLatestGenderDetection(userId: number): Promise<UserGenderDetection | undefined>;
  
  recordMoodDetection(detection: InsertUserMoodDetection): Promise<UserMoodDetection>;
  getMoodHistory(userId: number, sessionId: number, limit?: number): Promise<UserMoodDetection[]>;
  getRecentMoodDetections(userId: number, limit?: number): Promise<UserMoodDetection[]>;
  
  recordEmotionDetection(detection: InsertUserEmotionDetection): Promise<UserEmotionDetection>;
  getEmotionHistory(userId: number, sessionId: number, limit?: number): Promise<UserEmotionDetection[]>;
  getRecentEmotionDetections(userId: number, limit?: number): Promise<UserEmotionDetection[]>;
  
  recordBehaviorDetection(detection: InsertUserBehaviorDetection): Promise<UserBehaviorDetection>;
  getBehaviorHistory(userId: number, sessionId: number, limit?: number): Promise<UserBehaviorDetection[]>;
  getRecentBehaviorDetections(userId: number, limit?: number): Promise<UserBehaviorDetection[]>;
  
  recordEngagementDetection(detection: InsertUserEngagementDetection): Promise<UserEngagementDetection>;
  getEngagementHistory(userId: number, sessionId: number, limit?: number): Promise<UserEngagementDetection[]>;
  getRecentEngagementDetections(userId: number, limit?: number): Promise<UserEngagementDetection[]>;
  
  recordIntentDetection(detection: InsertUserIntentDetection): Promise<UserIntentDetection>;
  getIntentHistory(userId: number, sessionId: number, limit?: number): Promise<UserIntentDetection[]>;
  getRecentIntentDetections(userId: number, limit?: number): Promise<UserIntentDetection[]>;
  
  // Content learning methods
  saveReusableContent(content: InsertReusableContentRepository): Promise<ReusableContentRepository>;
  getReusableContent(category: string, personaLevel: number, excludeUserId?: number): Promise<ReusableContentRepository[]>;
  getReusableContentForUser(userId: number, limit?: number): Promise<ReusableContentRepository[]>;
  recordContentUsage(usage: InsertContentUsageTracking): Promise<ContentUsageTracking>;
  getContentReuseRules(): Promise<ContentReuseRules[]>;
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

  // Missing chat session methods
  async deleteChatSession(id: number): Promise<void> {
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  async extendChatSession(id: number): Promise<void> {
    // Update the session's updated timestamp or extend expiry
    // For now, this is a placeholder - implement based on your session expiry logic
  }

  async updateChatSessionTitle(id: number, title: string): Promise<void> {
    // Add title field to chatSessions table if needed, or store in metadata
    // For now, this is a placeholder
  }

  // Persona system implementation
  async getPersonaLevel(id: string): Promise<PersonaLevel | undefined> {
    const [level] = await db.select().from(personaLevels).where(eq(personaLevels.id, id));
    return level || undefined;
  }

  async getAllPersonaLevels(): Promise<PersonaLevel[]> {
    return await db.select().from(personaLevels);
  }

  async createPersonaLevel(level: InsertPersonaLevel): Promise<PersonaLevel> {
    const [newLevel] = await db.insert(personaLevels).values(level).returning();
    return newLevel;
  }

  async getLanguagePermissions(personaLevelId: string): Promise<LanguagePermission[]> {
    return await db.select().from(languagePermissions)
      .where(eq(languagePermissions.personaLevelId, personaLevelId));
  }

  async createLanguagePermission(permission: InsertLanguagePermission): Promise<LanguagePermission> {
    const [newPermission] = await db.insert(languagePermissions).values(permission).returning();
    return newPermission;
  }

  // User detection methods
  async recordGenderDetection(detection: InsertUserGenderDetection): Promise<UserGenderDetection> {
    const [result] = await db.insert(userGenderDetection).values(detection).returning();
    return result;
  }

  async getLatestGenderDetection(userId: number): Promise<UserGenderDetection | undefined> {
    const [result] = await db.select().from(userGenderDetection)
      .where(eq(userGenderDetection.userId, userId))
      .orderBy(desc(userGenderDetection.createdAt))
      .limit(1);
    return result || undefined;
  }

  async recordMoodDetection(detection: InsertUserMoodDetection): Promise<UserMoodDetection> {
    const [result] = await db.insert(userMoodDetection).values(detection).returning();
    return result;
  }

  async getMoodHistory(userId: number, sessionId: number, limit = 10): Promise<UserMoodDetection[]> {
    return await db.select().from(userMoodDetection)
      .where(and(
        eq(userMoodDetection.userId, userId),
        eq(userMoodDetection.sessionId, sessionId)
      ))
      .orderBy(desc(userMoodDetection.createdAt))
      .limit(limit);
  }

  async getRecentMoodDetections(userId: number, limit = 10): Promise<UserMoodDetection[]> {
    return await db.select().from(userMoodDetection)
      .where(eq(userMoodDetection.userId, userId))
      .orderBy(desc(userMoodDetection.createdAt))
      .limit(limit);
  }

  async recordEmotionDetection(detection: InsertUserEmotionDetection): Promise<UserEmotionDetection> {
    const [result] = await db.insert(userEmotionDetection).values(detection).returning();
    return result;
  }

  async getEmotionHistory(userId: number, sessionId: number, limit = 10): Promise<UserEmotionDetection[]> {
    return await db.select().from(userEmotionDetection)
      .where(and(
        eq(userEmotionDetection.userId, userId),
        eq(userEmotionDetection.sessionId, sessionId)
      ))
      .orderBy(desc(userEmotionDetection.createdAt))
      .limit(limit);
  }

  async getRecentEmotionDetections(userId: number, limit = 10): Promise<UserEmotionDetection[]> {
    return await db.select().from(userEmotionDetection)
      .where(eq(userEmotionDetection.userId, userId))
      .orderBy(desc(userEmotionDetection.createdAt))
      .limit(limit);
  }

  async recordBehaviorDetection(detection: InsertUserBehaviorDetection): Promise<UserBehaviorDetection> {
    const [result] = await db.insert(userBehaviorDetection).values(detection).returning();
    return result;
  }

  async getBehaviorHistory(userId: number, sessionId: number, limit = 10): Promise<UserBehaviorDetection[]> {
    return await db.select().from(userBehaviorDetection)
      .where(and(
        eq(userBehaviorDetection.userId, userId),
        eq(userBehaviorDetection.sessionId, sessionId)
      ))
      .orderBy(desc(userBehaviorDetection.createdAt))
      .limit(limit);
  }

  async getRecentBehaviorDetections(userId: number, limit = 10): Promise<UserBehaviorDetection[]> {
    return await db.select().from(userBehaviorDetection)
      .where(eq(userBehaviorDetection.userId, userId))
      .orderBy(desc(userBehaviorDetection.createdAt))
      .limit(limit);
  }

  async recordEngagementDetection(detection: InsertUserEngagementDetection): Promise<UserEngagementDetection> {
    const [result] = await db.insert(userEngagementDetection).values(detection).returning();
    return result;
  }

  async getEngagementHistory(userId: number, sessionId: number, limit = 10): Promise<UserEngagementDetection[]> {
    return await db.select().from(userEngagementDetection)
      .where(and(
        eq(userEngagementDetection.userId, userId),
        eq(userEngagementDetection.sessionId, sessionId)
      ))
      .orderBy(desc(userEngagementDetection.createdAt))
      .limit(limit);
  }

  async getRecentEngagementDetections(userId: number, limit = 10): Promise<UserEngagementDetection[]> {
    return await db.select().from(userEngagementDetection)
      .where(eq(userEngagementDetection.userId, userId))
      .orderBy(desc(userEngagementDetection.createdAt))
      .limit(limit);
  }

  async recordIntentDetection(detection: InsertUserIntentDetection): Promise<UserIntentDetection> {
    const [result] = await db.insert(userIntentDetection).values(detection).returning();
    return result;
  }

  async getIntentHistory(userId: number, sessionId: number, limit = 10): Promise<UserIntentDetection[]> {
    return await db.select().from(userIntentDetection)
      .where(and(
        eq(userIntentDetection.userId, userId),
        eq(userIntentDetection.sessionId, sessionId)
      ))
      .orderBy(desc(userIntentDetection.createdAt))
      .limit(limit);
  }

  async getRecentIntentDetections(userId: number, limit = 10): Promise<UserIntentDetection[]> {
    return await db.select().from(userIntentDetection)
      .where(eq(userIntentDetection.userId, userId))
      .orderBy(desc(userIntentDetection.createdAt))
      .limit(limit);
  }

  // Content learning methods
  async saveReusableContent(content: InsertReusableContentRepository): Promise<ReusableContentRepository> {
    const [result] = await db.insert(reusableContentRepository).values(content).returning();
    return result;
  }

  async getReusableContent(category: string, personaLevel: number, excludeUserId?: number): Promise<ReusableContentRepository[]> {
    const conditions = [
      eq(reusableContentRepository.contentCategory, category),
      sql`${reusableContentRepository.allowedPersonaLevel} <= ${personaLevel}`,
      eq(reusableContentRepository.isActive, true)
    ];

    if (excludeUserId) {
      conditions.push(sql`${reusableContentRepository.sourceUserId} != ${excludeUserId}`);
    }

    const query = db.select().from(reusableContentRepository)
      .where(and(...conditions));

    return await query.orderBy(desc(reusableContentRepository.qualityScore));
  }

  async recordContentUsage(usage: InsertContentUsageTracking): Promise<ContentUsageTracking> {
    const [result] = await db.insert(contentUsageTracking).values(usage).returning();
    return result;
  }

  async getReusableContentForUser(userId: number, limit = 10): Promise<ReusableContentRepository[]> {
    return await db.select().from(reusableContentRepository)
      .where(and(
        eq(reusableContentRepository.sourceUserId, userId),
        eq(reusableContentRepository.isActive, true)
      ))
      .orderBy(desc(reusableContentRepository.createdAt))
      .limit(limit);
  }

  async getContentReuseRules(): Promise<ContentReuseRules[]> {
    return await db.select().from(contentReuseRules)
      .where(eq(contentReuseRules.isActive, true));
  }
}

export const storage = new DatabaseStorage();
