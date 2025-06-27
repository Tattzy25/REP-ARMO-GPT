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
  createdAt: timestamp("created_at").defaultNow(),
});

// Phase 2 & 3 Feature Tables
export const alibiTemplates = pgTable("alibi_templates", {
  id: text("id").primaryKey(), // e.g., 'work-emergency', 'family-obligation'
  category: text("category").notNull(), // Work, Family, Health, Transportation, Cultural, Technology, Seasonal
  title: text("title").notNull(),
  description: text("description").notNull(),
  scenario: text("scenario").notNull(),
  questions: jsonb("questions").notNull(), // Array of questions
  isActive: boolean("is_active").default(true),
  isseasonal: boolean("is_seasonal").default(false),
  seasonalMonths: jsonb("seasonal_months"), // Array of month numbers [11, 0] for winter
  culturalRelevance: text("cultural_relevance"), // armenian, general, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  humorStyle: text("humor_style").default('balanced'), // savage, edgy, balanced, polite
  preferredTopics: jsonb("preferred_topics").default('[]'), // Array of topics
  profanityLevel: text("profanity_level").default('moderate'), // none, light, moderate, heavy
  preferredPersonaLevel: integer("preferred_persona_level").default(2), // 1-4
  voicePreference: text("voice_preference").default('elevenlabs'), // elevenlabs, browser
  rapidModeEnabled: boolean("rapid_mode_enabled").default(true),
  templatesEnabled: boolean("templates_enabled").default(true),
  achievementsEnabled: boolean("achievements_enabled").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const alibiGenerations = pgTable("alibi_generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  templateId: text("template_id").references(() => alibiTemplates.id),
  generationType: text("generation_type").notNull(), // standard, rapid, template, interactive
  userAnswers: jsonb("user_answers").notNull(), // Array of user responses
  generatedAlibi: text("generated_alibi").notNull(),
  aiModel: text("ai_model").notNull(), // groq, openai, ensemble
  believabilityScore: real("believability_score"), // 1.0 - 10.0
  scoreAnalysis: text("score_analysis"),
  achievements: jsonb("achievements"), // Array of achievement IDs earned
  alternativeEndings: jsonb("alternative_endings"), // Array of alternative story endings
  storyChunks: jsonb("story_chunks"), // For progressive revelation
  processingTimeMs: integer("processing_time_ms"),
  username: text("username"), // User's preferred name for the alibi
  interactiveMode: boolean("interactive_mode").default(false),
  ensembleMode: boolean("ensemble_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(), // detail-master, cultural-authentic, edgy-storyteller
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // creativity, detail, cultural, speed, consistency
  badgeIcon: text("badge_icon"), // Icon name or emoji
  badgeColor: text("badge_color").default('#4F46E5'), // Hex color
  criteria: jsonb("criteria").notNull(), // Conditions for earning
  rarity: text("rarity").default('common'), // common, uncommon, rare, legendary
  pointValue: integer("point_value").default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  achievementId: text("achievement_id").references(() => achievements.id),
  alibiGenerationId: integer("alibi_generation_id").references(() => alibiGenerations.id),
  earnedAt: timestamp("earned_at").defaultNow(),
  context: text("context"), // How they earned it
});

export const belivaibilityMetrics = pgTable("believability_metrics", {
  id: serial("id").primaryKey(),
  alibiGenerationId: integer("alibi_generation_id").references(() => alibiGenerations.id),
  detailScore: real("detail_score"), // Based on answer length and specificity
  consistencyScore: real("consistency_score"), // Cross-reference consistency
  creativityScore: real("creativity_score"), // Uniqueness vs generic responses
  plausibilityScore: real("plausibility_score"), // How realistic it sounds
  evidenceScore: real("evidence_score"), // Quality of supporting evidence
  timelineScore: real("timeline_score"), // Temporal consistency
  overallScore: real("overall_score").notNull(), // Final weighted score
  factorsAnalyzed: jsonb("factors_analyzed"), // Array of analysis factors
  improvementSuggestions: jsonb("improvement_suggestions"), // Array of suggestions
  createdAt: timestamp("created_at").defaultNow(),
});

export const rapidAlibiHistory = pgTable("rapid_alibi_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  situation: text("situation").notNull(), // User's emergency situation
  generatedAlibi: text("generated_alibi").notNull(),
  aiModel: text("ai_model").notNull(), // Which AI model was used
  generationTimeMs: integer("generation_time_ms").notNull(),
  wasSuccessful: boolean("was_successful").default(true),
  fallbackUsed: boolean("fallback_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceTranscriptions = pgTable("voice_transcriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  alibiGenerationId: integer("alibi_generation_id").references(() => alibiGenerations.id),
  audioFilename: text("audio_filename").notNull(),
  transcriptionText: text("transcription_text").notNull(),
  transcriptionMethod: text("transcription_method").notNull(), // gemini, whisper, browser
  confidenceScore: real("confidence_score"), // 0.0 - 1.0
  processingTimeMs: integer("processing_time_ms"),
  questionIndex: integer("question_index"), // Which alibi question this answers
  createdAt: timestamp("created_at").defaultNow(),
});

export const templateUsageStats = pgTable("template_usage_stats", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").references(() => alibiTemplates.id),
  userId: integer("user_id").references(() => users.id),
  usageDate: timestamp("usage_date").defaultNow(),
  completionRate: real("completion_rate"), // How many questions answered
  satisfactionRating: integer("satisfaction_rating"), // 1-5 stars
  timeSpentSeconds: integer("time_spent_seconds"),
  wasSuccessful: boolean("was_successful").default(true),
});

export const aiModelPerformance = pgTable("ai_model_performance", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(), // groq, openai, ensemble
  requestType: text("request_type").notNull(), // alibi, rapid, alternative_endings
  responseTimeMs: integer("response_time_ms").notNull(),
  tokenCount: integer("token_count"),
  wasSuccessful: boolean("was_successful").default(true),
  errorType: text("error_type"),
  userSatisfaction: integer("user_satisfaction"), // 1-5 if provided
  believabilityScore: real("believability_score"), // If applicable
  createdAt: timestamp("created_at").defaultNow(),
});

export const seasonalEvents = pgTable("seasonal_events", {
  id: text("id").primaryKey(), // armenian-genocide-day, christmas, etc.
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // armenian, american, religious, cultural
  startMonth: integer("start_month").notNull(), // 0-11
  endMonth: integer("end_month"), // For multi-month events
  specificDays: jsonb("specific_days"), // Array of specific dates
  alibiScenarios: jsonb("alibi_scenarios"), // Pre-written scenarios for this event
  isRecurring: boolean("is_recurring").default(true),
  culturalImportance: text("cultural_importance").default('medium'), // low, medium, high
  templateSuggestions: jsonb("template_suggestions"), // Suggested template modifications
  createdAt: timestamp("created_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: text("id").primaryKey(), // UUID or session token
  userId: integer("user_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // mobile, desktop, tablet
  browserInfo: text("browser_info"),
  sessionStarted: timestamp("session_started").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  isActive: boolean("is_active").default(true),
  alibiGenerationsCount: integer("alibi_generations_count").default(0),
  achievementsEarned: integer("achievements_earned").default(0),
});

// Error tracking for specific features
export const featureErrors = pgTable("feature_errors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  featureName: text("feature_name").notNull(), // voice_input, rapid_mode, ensemble, etc.
  errorCode: text("error_code"),
  errorMessage: text("error_message").notNull(),
  errorContext: jsonb("error_context"), // Additional error details
  wasResolved: boolean("was_resolved").default(false),
  resolutionNotes: text("resolution_notes"),
  severity: text("severity").default('medium'), // low, medium, high, critical
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Component reusability table for tracking UI elements
export const componentUsage = pgTable("component_usage", {
  id: serial("id").primaryKey(),
  componentName: text("component_name").notNull(), // AlibiResultPage, TemplateSelector, etc.
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  actionType: text("action_type").notNull(), // view, click, interact, share, download
  targetElement: text("target_element"), // button_id, link_id, etc.
  interactionData: jsonb("interaction_data"), // Additional interaction details
  deviceType: text("device_type"), // mobile, desktop
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

// Insert schemas for Phase 2 & 3 feature tables
export const insertAlibiTemplateSchema = createInsertSchema(alibiTemplates).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  lastUpdated: true,
});

export const insertAlibiGenerationSchema = createInsertSchema(alibiGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertBelievabilityMetricsSchema = createInsertSchema(belivaibilityMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertRapidAlibiHistorySchema = createInsertSchema(rapidAlibiHistory).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceTranscriptionSchema = createInsertSchema(voiceTranscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertTemplateUsageStatsSchema = createInsertSchema(templateUsageStats).omit({
  id: true,
  usageDate: true,
});

export const insertAiModelPerformanceSchema = createInsertSchema(aiModelPerformance).omit({
  id: true,
  createdAt: true,
});

export const insertSeasonalEventSchema = createInsertSchema(seasonalEvents).omit({
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  sessionStarted: true,
  lastActivity: true,
});

export const insertFeatureErrorSchema = createInsertSchema(featureErrors).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertComponentUsageSchema = createInsertSchema(componentUsage).omit({
  id: true,
  createdAt: true,
});

// Types for Phase 2 & 3 feature tables  
export type InsertAlibiTemplate = z.infer<typeof insertAlibiTemplateSchema>;
export type AlibiTemplate = typeof alibiTemplates.$inferSelect;

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

export type InsertAlibiGeneration = z.infer<typeof insertAlibiGenerationSchema>;
export type AlibiGeneration = typeof alibiGenerations.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

export type InsertBelievabilityMetrics = z.infer<typeof insertBelievabilityMetricsSchema>;
export type BelievabilityMetrics = typeof belivaibilityMetrics.$inferSelect;

export type InsertRapidAlibiHistory = z.infer<typeof insertRapidAlibiHistorySchema>;
export type RapidAlibiHistory = typeof rapidAlibiHistory.$inferSelect;

export type InsertVoiceTranscription = z.infer<typeof insertVoiceTranscriptionSchema>;
export type VoiceTranscription = typeof voiceTranscriptions.$inferSelect;

export type InsertTemplateUsageStats = z.infer<typeof insertTemplateUsageStatsSchema>;
export type TemplateUsageStats = typeof templateUsageStats.$inferSelect;

export type InsertAiModelPerformance = z.infer<typeof insertAiModelPerformanceSchema>;
export type AiModelPerformance = typeof aiModelPerformance.$inferSelect;

export type InsertSeasonalEvent = z.infer<typeof insertSeasonalEventSchema>;
export type SeasonalEvent = typeof seasonalEvents.$inferSelect;

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

export type InsertFeatureError = z.infer<typeof insertFeatureErrorSchema>;
export type FeatureError = typeof featureErrors.$inferSelect;

export type InsertComponentUsage = z.infer<typeof insertComponentUsageSchema>;
export type ComponentUsage = typeof componentUsage.$inferSelect;

// Social & Sharing Feature Tables
export const alibiGallery = pgTable("alibi_gallery", {
  id: serial("id").primaryKey(),
  alibiGenerationId: integer("alibi_generation_id").references(() => alibiGenerations.id),
  anonymizedContent: text("anonymized_content").notNull(), // Privacy-protected version
  category: text("category").notNull(), // work, family, health, cultural, etc.
  believabilityScore: real("believability_score").notNull(),
  funnyScore: real("funny_score").default(0.0).notNull(), // Community rating
  reactionCount: integer("reaction_count").default(0).notNull(),
  shareCount: integer("share_count").default(0).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  moderationStatus: text("moderation_status").default('pending').notNull(), // pending, approved, rejected
  tags: text("tags").array(), // Array of tags for searchability
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alibiReactions = pgTable("alibi_reactions", {
  id: serial("id").primaryKey(),
  galleryItemId: integer("gallery_item_id").references(() => alibiGallery.id),
  userId: integer("user_id").references(() => users.id),
  reactionType: text("reaction_type").notNull(), // 😂, 😱, 🤯, 👏, 🔥, 💯
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shareTemplates = pgTable("share_templates", {
  id: text("id").primaryKey(), // share_twitter_highlight, share_instagram_story
  platform: text("platform").notNull(), // twitter, instagram, facebook, tiktok
  templateName: text("template_name").notNull(),
  templateContent: text("template_content").notNull(), // Template with placeholders
  placeholders: jsonb("placeholders").notNull(), // Array of placeholder definitions
  isActive: boolean("is_active").default(true).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  alibiGenerationId: integer("alibi_generation_id").references(() => alibiGenerations.id),
  shareTemplateId: text("share_template_id").references(() => shareTemplates.id),
  platform: text("platform").notNull(),
  shareContent: text("share_content").notNull(), // Final formatted content
  shareUrl: text("share_url"), // If platform provides URL
  isSuccessful: boolean("is_successful").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Advanced Persona Learning Tables
export const userPersonaProfiles = pgTable("user_persona_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique(),
  humorStylePreference: text("humor_style_preference").default('balanced').notNull(), // savage, edgy, balanced, polite
  topicPreferences: jsonb("topic_preferences").default('[]').notNull(), // Array of preferred topics
  languageMixRatio: real("language_mix_ratio").default(0.5).notNull(), // 0-1, Armenian to English ratio
  complexityLevel: integer("complexity_level").default(3).notNull(), // 1-5, alibi sophistication
  responsePattern: text("response_pattern").default('detailed').notNull(), // detailed, concise, creative
  timeOfDayPreferences: jsonb("time_of_day_preferences").default('{}').notNull(), // Object with time-based preferences
  frequencyPattern: text("frequency_pattern").default('occasional').notNull(), // frequent, occasional, rare
  recentTopics: jsonb("recent_topics").default('[]').notNull(), // Array of recent topics to avoid repetition
  adaptationScore: real("adaptation_score").default(0.0).notNull(), // How well we understand this user
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const contextualFactors = pgTable("contextual_factors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: integer("session_id").references(() => chatSessions.id),
  timeOfDay: text("time_of_day").notNull(), // morning, afternoon, evening, late_night
  dayOfWeek: text("day_of_week").notNull(), // monday, tuesday, etc.
  seasonalContext: text("seasonal_context"), // holiday_season, summer, etc.
  userMoodContext: text("user_mood_context"), // stressed, relaxed, playful, serious
  usageFrequency: text("usage_frequency").notNull(), // daily, weekly, monthly, first_time
  deviceType: text("device_type").notNull(), // mobile, desktop, tablet
  locationContext: text("location_context"), // home, work, public, travel
  socialContext: text("social_context"), // alone, with_friends, family_present
  urgencyLevel: text("urgency_level").default('normal').notNull(), // low, normal, high, emergency
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adaptiveLearning = pgTable("adaptive_learning", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  learningType: text("learning_type").notNull(), // humor_style, complexity, timing, topics
  previousValue: text("previous_value").notNull(), // What it was before
  newValue: text("new_value").notNull(), // What it changed to
  triggerEvent: text("trigger_event").notNull(), // user_feedback, pattern_detection, performance_data
  confidenceScore: real("confidence_score").notNull(), // 0-1, how confident we are in this adaptation
  impactScore: real("impact_score"), // Measured improvement after change
  adaptationReason: text("adaptation_reason").notNull(), // Why this change was made
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crossSessionMemory = pgTable("cross_session_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  memoryType: text("memory_type").notNull(), // preference, pattern, success_factor, failure_point
  memoryKey: text("memory_key").notNull(), // Specific identifier for this memory
  memoryValue: jsonb("memory_value").notNull(), // The actual data
  contextTags: text("context_tags").array(), // Situational context for this memory
  reinforcementCount: integer("reinforcement_count").default(1).notNull(), // How many times this has been reinforced
  lastReinforced: timestamp("last_reinforced").defaultNow().notNull(),
  decayScore: real("decay_score").default(1.0).notNull(), // 1.0 = fresh, approaches 0 as it gets stale
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for Social & Sharing tables
export const insertAlibiGallerySchema = createInsertSchema(alibiGallery).omit({
  id: true,
  createdAt: true,
});

export const insertAlibiReactionSchema = createInsertSchema(alibiReactions).omit({
  id: true,
  createdAt: true,
});

export const insertShareTemplateSchema = createInsertSchema(shareTemplates).omit({
  createdAt: true,
});

export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for Advanced Persona Learning tables
export const insertUserPersonaProfileSchema = createInsertSchema(userPersonaProfiles).omit({
  id: true,
  lastUpdated: true,
});

export const insertContextualFactorSchema = createInsertSchema(contextualFactors).omit({
  id: true,
  createdAt: true,
});

export const insertAdaptiveLearningSchema = createInsertSchema(adaptiveLearning).omit({
  id: true,
  createdAt: true,
});

export const insertCrossSessionMemorySchema = createInsertSchema(crossSessionMemory).omit({
  id: true,
  lastReinforced: true,
  createdAt: true,
});

// Types for Social & Sharing tables
export type InsertAlibiGallery = z.infer<typeof insertAlibiGallerySchema>;
export type AlibiGallery = typeof alibiGallery.$inferSelect;

export type InsertAlibiReaction = z.infer<typeof insertAlibiReactionSchema>;
export type AlibiReaction = typeof alibiReactions.$inferSelect;

export type InsertShareTemplate = z.infer<typeof insertShareTemplateSchema>;
export type ShareTemplate = typeof shareTemplates.$inferSelect;

export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type SocialShare = typeof socialShares.$inferSelect;

// Types for Advanced Persona Learning tables
export type InsertUserPersonaProfile = z.infer<typeof insertUserPersonaProfileSchema>;
export type UserPersonaProfile = typeof userPersonaProfiles.$inferSelect;

export type InsertContextualFactor = z.infer<typeof insertContextualFactorSchema>;
export type ContextualFactor = typeof contextualFactors.$inferSelect;

export type InsertAdaptiveLearning = z.infer<typeof insertAdaptiveLearningSchema>;
export type AdaptiveLearning = typeof adaptiveLearning.$inferSelect;

export type InsertCrossSessionMemory = z.infer<typeof insertCrossSessionMemorySchema>;
export type CrossSessionMemory = typeof crossSessionMemory.$inferSelect;
