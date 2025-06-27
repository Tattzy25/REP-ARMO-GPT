# Armo Hopar Database Architecture & ID Mapping

## Overview
Complete database schema for the Armenian AI character platform with comprehensive Phase 2 & Phase 3 features including voice input, templates, rapid mode, cross-session memory, multi-model AI ensemble, believability scoring, achievements, and seasonal events.

## Database Tables Overview (32 Total Tables)

### Core Application Tables (7 tables)
1. **users** - User accounts and authentication
2. **chat_sessions** - Conversation sessions per vibe
3. **messages** - Individual chat messages with metadata
4. **attachments** - File uploads linked to messages
5. **activity_logs** - User activity tracking
6. **error_logs** - Error tracking and debugging
7. **temp_storage** - Temporary key-value storage

### Phase 2 & 3 Feature Tables (14 tables)
8. **alibi_templates** - Pre-built alibi scenarios
9. **user_preferences** - Cross-session user preferences
10. **alibi_generations** - Complete alibi generation tracking
11. **achievements** - Badge/achievement definitions
12. **user_achievements** - User-earned achievements
13. **believability_metrics** - Alibi quality analysis
14. **rapid_alibi_history** - Emergency 30-second alibis
15. **voice_transcriptions** - Speech-to-text logs
16. **template_usage_stats** - Template performance metrics
17. **ai_model_performance** - Multi-model AI tracking
18. **seasonal_events** - Armenian cultural events
19. **user_sessions** - Browser session tracking
20. **feature_errors** - Feature-specific error logs
21. **component_usage** - UI interaction tracking

### Persona System Tables (11 tables)
22. **persona_levels** - 4-level behavioral system
23. **language_permissions** - Profanity control matrix
24. **user_gender_detection** - Gender inference tracking
25. **user_mood_detection** - Sentiment analysis
26. **user_emotion_detection** - Emotional state tracking
27. **user_behavior_detection** - Communication style analysis
28. **user_engagement_detection** - Interaction involvement
29. **user_intent_detection** - Purpose classification
30. **reusable_content_repository** - Community content learning
31. **content_reuse_rules** - Content usage policies
32. **content_usage_tracking** - Content reuse tracking

---

## Primary Keys & ID Schemes

### Serial IDs (Auto-incrementing integers)
```sql
-- Core Tables
users.id: 1, 2, 3...
chat_sessions.id: 1, 2, 3...
messages.id: 1, 2, 3...
attachments.id: 1, 2, 3...
activity_logs.id: 1, 2, 3...
error_logs.id: 1, 2, 3...
temp_storage.id: 1, 2, 3...

-- Feature Tables
user_preferences.id: 1, 2, 3...
alibi_generations.id: 1, 2, 3...
user_achievements.id: 1, 2, 3...
believability_metrics.id: 1, 2, 3...
rapid_alibi_history.id: 1, 2, 3...
voice_transcriptions.id: 1, 2, 3...
template_usage_stats.id: 1, 2, 3...
ai_model_performance.id: 1, 2, 3...
user_sessions.id: UUID strings
feature_errors.id: 1, 2, 3...
component_usage.id: 1, 2, 3...
```

### Text IDs (Human-readable identifiers)
```sql
-- Template IDs
alibi_templates.id:
  - 'work-emergency'
  - 'family-obligation'
  - 'health-concern'
  - 'car-trouble'
  - 'armenian-holiday'
  - 'tech-disaster'
  - 'winter-holiday' (seasonal)
  - 'armenian-genocide-day' (seasonal)

-- Achievement IDs
achievements.id:
  - 'detail-master'
  - 'cultural-authentic'
  - 'edgy-storyteller'
  - 'precision-planner'
  - 'evidence-expert'
  - 'vocabulary-virtuoso'

-- Seasonal Event IDs
seasonal_events.id:
  - 'armenian-genocide-day'
  - 'christmas'
  - 'new-year'
  - 'armenian-christmas'
  - 'easter'
  - 'independence-day'

-- Persona Level IDs
persona_levels.id:
  - 'level_1_polite'
  - 'level_2_mild'
  - 'level_3_edgy'
  - 'level_4_savage'

-- Language Permission IDs
language_permissions.id:
  - 'perm_euphemisms_level_1'
  - 'perm_mild_swears_level_2'
  - 'perm_moderate_profanity_level_3'
  - 'perm_strong_profanity_level_4'

-- Detection System IDs
user_gender_detection.id: 'gender_detect_123'
user_mood_detection.id: 'mood_detect_456'
user_emotion_detection.id: 'emotion_detect_789'
user_behavior_detection.id: 'behavior_detect_101'
user_engagement_detection.id: 'engagement_detect_202'
user_intent_detection.id: 'intent_detect_303'

-- Content System IDs
reusable_content_repository.id: 'content_1001', 'content_1002'...
content_reuse_rules.id: 'rule_jokes', 'rule_roasts'...
content_usage_tracking.id: 'usage_track_404'...
```

---

## Key Relationships & Foreign Keys

### Core Relationships
```sql
chat_sessions.userId -> users.id
messages.sessionId -> chat_sessions.id
attachments.messageId -> messages.id
activity_logs.userId -> users.id
activity_logs.sessionId -> chat_sessions.id
error_logs.userId -> users.id
error_logs.sessionId -> chat_sessions.id
```

### Feature Relationships
```sql
user_preferences.userId -> users.id (UNIQUE)
alibi_generations.userId -> users.id
alibi_generations.sessionId -> chat_sessions.id
alibi_generations.templateId -> alibi_templates.id
user_achievements.userId -> users.id
user_achievements.achievementId -> achievements.id
user_achievements.alibiGenerationId -> alibi_generations.id
believability_metrics.alibiGenerationId -> alibi_generations.id
voice_transcriptions.alibiGenerationId -> alibi_generations.id
template_usage_stats.templateId -> alibi_templates.id
template_usage_stats.userId -> users.id
```

### Persona System Relationships
```sql
language_permissions.personaLevelId -> persona_levels.id
user_gender_detection.userId -> users.id
user_mood_detection.messageId -> messages.id
user_emotion_detection.messageId -> messages.id
user_behavior_detection.messageId -> messages.id
user_engagement_detection.messageId -> messages.id
user_intent_detection.messageId -> messages.id
reusable_content_repository.sourceUserId -> users.id
content_usage_tracking.contentId -> reusable_content_repository.id
content_usage_tracking.targetUserId -> users.id
```

---

## Component ID Mapping for Frontend

### Page Components
```typescript
// Primary pages
AlibiResultPage: 'alibi-result-page'
AlibiRecapPage: 'alibi-recap-page'
AlibiWelcomeScreen: 'alibi-welcome-screen'
AlibiQuestionCards: 'alibi-question-cards'

// Template system
TemplateSelector: 'template-selector'
TemplateCard: 'template-card'
TemplatePreview: 'template-preview'

// Achievement system
AchievementBadge: 'achievement-badge'
AchievementList: 'achievement-list'
BelievabilityScore: 'believability-score'

// Voice features
VoiceInputButton: 'voice-input-button'
VoiceRecordingIndicator: 'voice-recording-indicator'
VoiceCallInterface: 'voice-call-interface'
```

### Interactive Elements
```typescript
// Action buttons
'copy-button'
'share-button'
'download-button'
'expand-button'
'read-aloud-button'
'voice-button'
'rapid-mode-button'
'template-button'

// Form elements
'alibi-question-input'
'template-selector-dropdown'
'preference-slider'
'ensemble-toggle'
'interactive-mode-toggle'

// Navigation
'sidebar-toggle'
'vibe-selector'
'recent-chats-list'
'template-gallery'
```

---

## Data Flow Mapping

### Alibi Generation Flow
```
1. User Input -> alibi_generations table
2. Template Selection -> alibi_templates table
3. Voice Input -> voice_transcriptions table
4. AI Processing -> ai_model_performance table
5. Result Analysis -> believability_metrics table
6. Achievement Check -> user_achievements table
7. Session Save -> chat_sessions/messages tables
```

### Multi-Model Ensemble Flow
```
1. Request -> ai_model_performance (start tracking)
2. OpenAI Call -> ai_model_performance (openai metrics)
3. Groq Call -> ai_model_performance (groq metrics) 
4. Response Selection -> alibi_generations (aiModel: 'ensemble')
5. Performance Logging -> ai_model_performance (final metrics)
```

### User Preference Flow
```
1. Preference Update -> user_preferences table
2. Activity Logging -> activity_logs table
3. Cross-Session Retrieval -> user_preferences lookup
4. Persona Adjustment -> persona system tables
```

---

## API Endpoint to Table Mapping

### Phase 2 & 3 Endpoints
```typescript
// Templates
GET /api/alibi/templates -> alibi_templates
POST /api/alibi/template-usage -> template_usage_stats

// Rapid Mode  
POST /api/alibi/rapid -> rapid_alibi_history

// Voice Input
POST /api/alibi/voice-answer -> voice_transcriptions

// Preferences
GET/POST /api/user/preferences -> user_preferences

// Enhanced Generation
POST /api/alibi/generate -> alibi_generations + believability_metrics

// Achievements
GET /api/achievements -> achievements + user_achievements

// Performance
GET /api/performance/ai-models -> ai_model_performance
```

### Component Tracking
```typescript
// UI Interaction Tracking
POST /api/track/component-usage -> component_usage
POST /api/track/feature-error -> feature_errors
POST /api/track/user-session -> user_sessions
```

---

## Reusable Query Patterns

### Common Queries by Feature
```sql
-- Get user's alibi history
SELECT ag.*, bt.* FROM alibi_generations ag
LEFT JOIN believability_metrics bt ON ag.id = bt.alibiGenerationId
WHERE ag.userId = ? ORDER BY ag.createdAt DESC;

-- Get user achievements
SELECT a.*, ua.earnedAt FROM achievements a
JOIN user_achievements ua ON a.id = ua.achievementId  
WHERE ua.userId = ?;

-- Get active templates for season
SELECT * FROM alibi_templates 
WHERE isActive = true 
AND (isSeasonalApprox = false OR EXTRACT(MONTH FROM NOW()) = ANY(seasonalMonths));

-- Get user preferences with defaults
SELECT * FROM user_preferences WHERE userId = ?
UNION ALL 
SELECT 1, ?, 'balanced', '[]', 'moderate', 2, 'elevenlabs', true, true, true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_preferences WHERE userId = ?);

-- Track AI model performance
INSERT INTO ai_model_performance 
(model, requestType, responseTimeMs, wasSuccessful, believabilityScore)
VALUES (?, ?, ?, ?, ?);
```

---

## Component Reusability Guidelines

### Database Patterns
- Use consistent ID formats across related tables
- Always include createdAt timestamps for tracking
- Use JSONB for flexible metadata storage
- Implement soft deletes with isActive flags
- Use foreign key constraints for data integrity

### Frontend Patterns  
- Prefix component IDs with feature name
- Use kebab-case for all element IDs
- Include data attributes for tracking
- Implement consistent loading states
- Use error boundaries for each major feature

### API Patterns
- Always return consistent response formats
- Include metadata in responses (timing, source)
- Implement proper error handling
- Use appropriate HTTP status codes
- Include correlation IDs for debugging

This database architecture provides a robust foundation for all current and future Armo Hopar features with clear ID schemes and reusable patterns.