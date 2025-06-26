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

// TABLE 1: Persona Levels - Core 4-level behavioral system
export const personaLevels = pgTable("persona_levels", {
  id: varchar("id", { length: 50 }).primaryKey(), // "level_1_polite", "level_2_mild", "level_3_edgy", "level_4_savage"
  levelNumber: integer("level_number").notNull(), // 1, 2, 3, 4
  name: varchar("name", { length: 100 }).notNull(), // "No Cursing (Polite)", "Mild Cursing (Casual)", etc.
  description: text("description").notNull(), // Detailed behavioral description
  systemPrompt: text("system_prompt").notNull(), // AI instructions for this level
  attitudePersonality: text("attitude_personality").notNull(), // Personality traits
  languageUsage: text("language_usage").notNull(), // Language constraints
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 2: Language Permissions - Granular profanity control per level
export const languagePermissions = pgTable("language_permissions", {
  id: varchar("id", { length: 50 }).primaryKey(), // "perm_euphemisms_level_1", etc.
  personaLevelId: varchar("persona_level_id", { length: 50 }).notNull()
    .references(() => personaLevels.id),
  wordCategory: varchar("word_category", { length: 100 }).notNull(), // "harmless_euphemisms", "mild_swears", "strong_profanity", etc.
  permissionLevel: varchar("permission_level", { length: 20 }).notNull(), // "allowed", "forbidden", "conditional"
  conditions: text("conditions"), // Context when conditional permission applies
  examples: text("examples").array(), // Example words for this category
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 3: User Gender Detection - Inference tracking
export const userGenderDetection = pgTable("user_gender_detection", {
  id: varchar("id", { length: 50 }).primaryKey(), // "gender_detect_123"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  detectedGender: varchar("detected_gender", { length: 20 }).default("unknown").notNull(), // "male", "female", "unknown"
  confidenceScore: real("confidence_score").default(0.0).notNull(), // 0.0 to 1.0
  detectionMethod: varchar("detection_method", { length: 50 }).notNull(), // "explicit_mention", "username", "pronouns", "writing_style"
  sourceData: text("source_data"), // The text that led to this inference
  isUserConfirmed: boolean("is_user_confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 4: User Mood Detection - Sentiment analysis
export const userMoodDetection = pgTable("user_mood_detection", {
  id: varchar("id", { length: 50 }).primaryKey(), // "mood_detect_456"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  messageId: integer("message_id").references(() => messages.id),
  detectedMood: varchar("detected_mood", { length: 20 }).notNull(), // "positive", "neutral", "negative"
  sentimentScore: real("sentiment_score").notNull(), // -1.0 to 1.0
  indicators: text("indicators").array(), // Words/phrases that indicated this mood
  aiResponseAdjustment: text("ai_response_adjustment"), // How AI should adjust
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 5: User Emotion Detection - Fine-grained emotional states
export const userEmotionDetection = pgTable("user_emotion_detection", {
  id: varchar("id", { length: 50 }).primaryKey(), // "emotion_detect_789"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  messageId: integer("message_id").references(() => messages.id),
  primaryEmotion: varchar("primary_emotion", { length: 30 }).notNull(), // "joy", "sadness", "anger", "fear", "surprise", "disgust"
  secondaryEmotion: varchar("secondary_emotion", { length: 30 }), // Optional secondary emotion
  emotionIntensity: real("emotion_intensity").notNull(), // 0.0 to 1.0
  indicators: text("indicators").array(), // Specific text indicators
  adaptationStrategy: text("adaptation_strategy"), // How AI should respond
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 6: User Behavior/Tone Detection - Communication style analysis
export const userBehaviorDetection = pgTable("user_behavior_detection", {
  id: varchar("id", { length: 50 }).primaryKey(), // "behavior_detect_101"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  messageId: integer("message_id").references(() => messages.id),
  behaviorStyle: varchar("behavior_style", { length: 30 }).notNull(), // "polite_formal", "casual_friendly", "sarcastic", "humorous", "rude_hostile", "flirtatious", "confused"
  confidenceScore: real("confidence_score").notNull(), // 0.0 to 1.0
  indicators: text("indicators").array(), // Text patterns that indicated this behavior
  aiAdjustment: text("ai_adjustment"), // How AI should mirror or respond
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 7: User Engagement Detection - Interaction involvement tracking
export const userEngagementDetection = pgTable("user_engagement_detection", {
  id: varchar("id", { length: 50 }).primaryKey(), // "engagement_detect_202"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  messageId: integer("message_id").references(() => messages.id),
  engagementLevel: varchar("engagement_level", { length: 30 }).notNull(), // "high", "moderate", "low", "negative"
  messageLength: integer("message_length").notNull(),
  responseTime: integer("response_time"), // Seconds since last message
  questionCount: integer("question_count").default(0).notNull(),
  emojiCount: integer("emoji_count").default(0).notNull(),
  enthusiasmScore: real("enthusiasm_score").default(0.0).notNull(), // 0.0 to 1.0
  aiTactics: text("ai_tactics"), // Recommended AI response tactics
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 8: User Intent Detection - Purpose classification
export const userIntentDetection = pgTable("user_intent_detection", {
  id: varchar("id", { length: 50 }).primaryKey(), // "intent_detect_303"
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  messageId: integer("message_id").references(() => messages.id),
  intentType: varchar("intent_type", { length: 30 }).notNull(), // "small_talk", "information_query", "instruction_task", "complaint_feedback", "emotional_support", "other"
  confidenceScore: real("confidence_score").notNull(), // 0.0 to 1.0
  intentDescription: text("intent_description"), // What user is trying to accomplish
  responseApproach: text("response_approach"), // How AI should respond
  requiresPersonaAdjustment: boolean("requires_persona_adjustment").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 9: Reusable Content Repository - Learning system for community content
export const reusableContentRepository = pgTable("reusable_content_repository", {
  id: varchar("id", { length: 50 }).primaryKey(), // "content_1001", "content_1002", etc.
  contentText: text("content_text").notNull(), // The actual content to reuse
  contentCategory: varchar("content_category", { length: 30 }).notNull(), // "joke_humor", "comeback_roast", "insight_fact", "advice", "story_anecdote", "qa_pair"
  sourceUserId: integer("source_user_id").references(() => users.id), // Original contributor
  sourceSessionId: integer("source_session_id").references(() => chatSessions.id),
  sourceMessageId: integer("source_message_id").references(() => messages.id),
  allowedPersonaLevel: integer("allowed_persona_level").notNull(), // Minimum level required (1, 2, 3, 4)
  qualityScore: real("quality_score").default(0.0).notNull(), // 0.0 to 1.0 based on user reactions
  usageCount: integer("usage_count").default(0).notNull(), // How many times it's been reused
  usageNotes: text("usage_notes"), // Special instructions for usage
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// TABLE 10: Content Reuse Rules - Usage policies and tracking
export const contentReuseRules = pgTable("content_reuse_rules", {
  id: varchar("id", { length: 50 }).primaryKey(), // "rule_jokes", "rule_roasts", etc.
  contentType: varchar("content_type", { length: 30 }).notNull(), // "jokes_witticisms", "roasts_insults", "advice_insights", "stories_anecdotes", "qa_pairs"
  reusePolicy: text("reuse_policy").notNull(), // Detailed rules for this content type
  specialRules: text("special_rules").array(), // Array of special conditions
  personaLevelRestrictions: text("persona_level_restrictions"), // Which levels can use this
  rotationStrategy: varchar("rotation_strategy", { length: 50 }).default("random").notNull(), // "random", "quality_based", "least_recent"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Content Usage Tracking - Track what content is used with which users
export const contentUsageTracking = pgTable("content_usage_tracking", {
  id: varchar("id", { length: 50 }).primaryKey(), // "usage_track_404"
  contentId: varchar("content_id", { length: 50 }).notNull()
    .references(() => reusableContentRepository.id),
  targetUserId: integer("target_user_id").references(() => users.id), // Who received the content
  targetSessionId: integer("target_session_id").references(() => chatSessions.id),
  targetMessageId: integer("target_message_id").references(() => messages.id),
  usageContext: varchar("usage_context", { length: 50 }), // "joke_request", "roast_battle", "advice_giving", etc.
  userReaction: varchar("user_reaction", { length: 30 }), // "positive", "negative", "neutral", "no_reaction"
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// Insert schemas for all persona system tables
export const insertPersonaLevelSchema = createInsertSchema(personaLevels).omit({
  createdAt: true,
});

export const insertLanguagePermissionSchema = createInsertSchema(languagePermissions).omit({
  createdAt: true,
});

export const insertUserGenderDetectionSchema = createInsertSchema(userGenderDetection).omit({
  createdAt: true,
});

export const insertUserMoodDetectionSchema = createInsertSchema(userMoodDetection).omit({
  createdAt: true,
});

export const insertUserEmotionDetectionSchema = createInsertSchema(userEmotionDetection).omit({
  createdAt: true,
});

export const insertUserBehaviorDetectionSchema = createInsertSchema(userBehaviorDetection).omit({
  createdAt: true,
});

export const insertUserEngagementDetectionSchema = createInsertSchema(userEngagementDetection).omit({
  createdAt: true,
});

export const insertUserIntentDetectionSchema = createInsertSchema(userIntentDetection).omit({
  createdAt: true,
});

export const insertReusableContentRepositorySchema = createInsertSchema(reusableContentRepository).omit({
  createdAt: true,
});

export const insertContentReuseRulesSchema = createInsertSchema(contentReuseRules).omit({
  createdAt: true,
});

export const insertContentUsageTrackingSchema = createInsertSchema(contentUsageTracking).omit({
  usedAt: true,
});

// Types for all persona system tables
export type InsertPersonaLevel = z.infer<typeof insertPersonaLevelSchema>;
export type PersonaLevel = typeof personaLevels.$inferSelect;

export type InsertLanguagePermission = z.infer<typeof insertLanguagePermissionSchema>;
export type LanguagePermission = typeof languagePermissions.$inferSelect;

export type InsertUserGenderDetection = z.infer<typeof insertUserGenderDetectionSchema>;
export type UserGenderDetection = typeof userGenderDetection.$inferSelect;

export type InsertUserMoodDetection = z.infer<typeof insertUserMoodDetectionSchema>;
export type UserMoodDetection = typeof userMoodDetection.$inferSelect;

export type InsertUserEmotionDetection = z.infer<typeof insertUserEmotionDetectionSchema>;
export type UserEmotionDetection = typeof userEmotionDetection.$inferSelect;

export type InsertUserBehaviorDetection = z.infer<typeof insertUserBehaviorDetectionSchema>;
export type UserBehaviorDetection = typeof userBehaviorDetection.$inferSelect;

export type InsertUserEngagementDetection = z.infer<typeof insertUserEngagementDetectionSchema>;
export type UserEngagementDetection = typeof userEngagementDetection.$inferSelect;

export type InsertUserIntentDetection = z.infer<typeof insertUserIntentDetectionSchema>;
export type UserIntentDetection = typeof userIntentDetection.$inferSelect;

export type InsertReusableContentRepository = z.infer<typeof insertReusableContentRepositorySchema>;
export type ReusableContentRepository = typeof reusableContentRepository.$inferSelect;

export type InsertContentReuseRules = z.infer<typeof insertContentReuseRulesSchema>;
export type ContentReuseRules = typeof contentReuseRules.$inferSelect;

export type InsertContentUsageTracking = z.infer<typeof insertContentUsageTrackingSchema>;
export type ContentUsageTracking = typeof contentUsageTracking.$inferSelect;
