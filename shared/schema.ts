import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  vibe: text("vibe").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id),
  sender: text("sender").notNull(), // 'user' | 'armo'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // for storing additional data like voice, images, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id),
  originalName: text("original_name").notNull(),
  filename: text("filename").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  requestData: text("request_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tempStorage = pgTable("temp_storage", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTempStorageSchema = createInsertSchema(tempStorage).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertTempStorage = z.infer<typeof insertTempStorageSchema>;
export type TempStorage = typeof tempStorage.$inferSelect;

// Persona system tables
export const personaLevels = pgTable("persona_levels", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., "level_1_chill", "level_2_snarky", etc.
  levelNumber: integer("level_number").notNull(), // 1, 2, 3, 4
  name: varchar("name", { length: 100 }).notNull(), // "On meds", "Meds wearing off", etc.
  description: text("description").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const welcomeMessages = pgTable("welcome_messages", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., "wm_1_chill", "wm_1_alt", etc.
  personaLevelId: varchar("persona_level_id", { length: 50 }).notNull()
    .references(() => personaLevels.id),
  message: text("message").notNull(),
  isDefault: boolean("is_default").default(false).notNull(), // primary vs alt message
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wordLists = pgTable("word_lists", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., "whitelist_level_1", "blacklist_level_4", etc.
  personaLevelId: varchar("persona_level_id", { length: 50 }).notNull()
    .references(() => personaLevels.id),
  listType: varchar("list_type", { length: 20 }).notNull(), // "whitelist" or "blacklist"
  language: varchar("language", { length: 10 }).notNull(), // "english" or "armenian"
  words: text("words").array().notNull(), // Array of words
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPersonaSettings = pgTable("user_persona_settings", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., "user_persona_123"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  currentPersonaLevel: varchar("current_persona_level", { length: 50 }).notNull()
    .references(() => personaLevels.id),
  languagePreference: varchar("language_preference", { length: 20 }).default("english").notNull(), // "english" or "armenian"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userBehaviorTracking = pgTable("user_behavior_tracking", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., "behavior_track_456"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  messageId: integer("message_id").references(() => messages.id),
  sentimentScore: real("sentiment_score"), // -1.0 to 1.0
  emotionalState: varchar("emotional_state", { length: 50 }), // "frustrated", "happy", "confused", etc.
  engagementLevel: varchar("engagement_level", { length: 20 }), // "active", "passive", "disengaged"
  conversationTopic: varchar("conversation_topic", { length: 100 }),
  responseTime: integer("response_time"), // seconds between messages
  messageLength: integer("message_length"), // character count
  detectedMood: varchar("detected_mood", { length: 50 }), // "flirty", "savage", "emotional", "annoyed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodTriggers = pgTable("mood_triggers", {
  id: varchar("id", { length: 50 }).primaryKey(), // e.g., "trigger_flirty_1", "trigger_savage_2"
  moodType: varchar("mood_type", { length: 50 }).notNull(), // "flirty", "savage", "emotional", "annoyed"
  language: varchar("language", { length: 20 }).notNull(), // "english", "armenian"
  triggerWord: varchar("trigger_word", { length: 100 }).notNull(),
  translation: varchar("translation", { length: 100 }), // English translation for Armenian words
  weight: real("weight").default(1.0).notNull(), // How strong this trigger is (0.1 to 2.0)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for persona tables
export const insertPersonaLevelSchema = createInsertSchema(personaLevels).omit({
  createdAt: true,
});

export const insertWelcomeMessageSchema = createInsertSchema(welcomeMessages).omit({
  createdAt: true,
});

export const insertWordListSchema = createInsertSchema(wordLists).omit({
  createdAt: true,
});

export const insertUserPersonaSettingsSchema = createInsertSchema(userPersonaSettings).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUserBehaviorTrackingSchema = createInsertSchema(userBehaviorTracking).omit({
  id: true,
  createdAt: true,
});

export const insertMoodTriggerSchema = createInsertSchema(moodTriggers).omit({
  createdAt: true,
});

// Types for persona tables
export type InsertPersonaLevel = z.infer<typeof insertPersonaLevelSchema>;
export type PersonaLevel = typeof personaLevels.$inferSelect;
export type InsertWelcomeMessage = z.infer<typeof insertWelcomeMessageSchema>;
export type WelcomeMessage = typeof welcomeMessages.$inferSelect;
export type InsertWordList = z.infer<typeof insertWordListSchema>;
export type WordList = typeof wordLists.$inferSelect;
export type InsertUserPersonaSettings = z.infer<typeof insertUserPersonaSettingsSchema>;
export type UserPersonaSettings = typeof userPersonaSettings.$inferSelect;
export type InsertUserBehaviorTracking = z.infer<typeof insertUserBehaviorTrackingSchema>;
export type UserBehaviorTracking = typeof userBehaviorTracking.$inferSelect;
export type InsertMoodTrigger = z.infer<typeof insertMoodTriggerSchema>;
export type MoodTrigger = typeof moodTriggers.$inferSelect;
