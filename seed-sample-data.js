// Sample data seeding script for Phase 2 & 3 database tables
// Run with: node seed-sample-data.js

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './shared/schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function seedSampleData() {
  console.log('🌱 Seeding sample data for Phase 2 & 3 features...');

  try {
    // 1. Seed alibi templates
    console.log('📝 Adding alibi templates...');
    await db.insert(schema.alibiTemplates).values([
      {
        id: 'work-emergency',
        category: 'Work',
        title: 'Urgent Work Crisis',
        description: 'Last-minute work emergency requiring immediate attention',
        scenario: 'Your boss just called an emergency meeting about a critical project deadline',
        questions: [
          'What type of work emergency came up?',
          'Who contacted you about it?',
          'How long will you need to handle it?',
          'Can you provide any specific details?'
        ],
        isActive: true,
        culturalRelevance: 'general'
      },
      {
        id: 'armenian-family-gathering',
        category: 'Cultural',
        title: 'Armenian Family Gathering',
        description: 'Traditional Armenian family event or celebration',
        scenario: 'Your Armenian family is having an important gathering you cannot miss',
        questions: [
          'What is the occasion for the gathering?',
          'Which family members will be there?',
          'What Armenian traditions will be observed?',
          'How long is the celebration expected to last?'
        ],
        isActive: true,
        culturalRelevance: 'armenian'
      }
    ]).onConflictDoNothing();

    // 2. Seed achievements
    console.log('🏆 Adding achievement definitions...');
    await db.insert(schema.achievements).values([
      {
        id: 'detail-master',
        name: 'Detail Master',
        description: 'Provided exceptionally detailed and specific information in your alibi',
        category: 'detail',
        badgeIcon: '🔍',
        badgeColor: '#4F46E5',
        criteria: { minWordCount: 100, specificityScore: 0.8 },
        rarity: 'common',
        pointValue: 10
      },
      {
        id: 'cultural-authentic',
        name: 'Cultural Authentic',
        description: 'Successfully incorporated authentic Armenian cultural elements',
        category: 'cultural',
        badgeIcon: '🇦🇲',
        badgeColor: '#DC2626',
        criteria: { culturalReferences: 2, authenticityScore: 0.9 },
        rarity: 'uncommon',
        pointValue: 25
      },
      {
        id: 'edgy-storyteller',
        name: 'Edgy Storyteller',
        description: 'Crafted a believable story with perfect edgy personality balance',
        category: 'creativity',
        badgeIcon: '🎭',
        badgeColor: '#7C3AED',
        criteria: { believabilityScore: 8.5, personalityMatch: 0.95 },
        rarity: 'rare',
        pointValue: 50
      }
    ]).onConflictDoNothing();

    // 3. Seed seasonal events
    console.log('🎉 Adding seasonal events...');
    await db.insert(schema.seasonalEvents).values([
      {
        id: 'armenian-genocide-remembrance-day',
        name: 'Armenian Genocide Remembrance Day',
        description: 'Solemn day of remembrance for the Armenian Genocide (April 24)',
        category: 'armenian',
        startMonth: 3, // April (0-indexed)
        specificDays: [24],
        alibiScenarios: [
          'Attending a memorial service at the local Armenian church',
          'Participating in a community remembrance walk',
          'Visiting the Armenian Genocide memorial with family'
        ],
        culturalImportance: 'high',
        templateSuggestions: ['Use respectful, solemn tone', 'Emphasize family obligation', 'Include cultural significance']
      },
      {
        id: 'armenian-christmas',
        name: 'Armenian Christmas',
        description: 'Traditional Armenian Christmas celebration (January 6)',
        category: 'armenian',
        startMonth: 0, // January
        specificDays: [6],
        alibiScenarios: [
          'Attending Armenian Christmas church service',
          'Preparing traditional Armenian Christmas feast',
          'Visiting Armenian grandparents for Christmas blessing'
        ],
        culturalImportance: 'high',
        templateSuggestions: ['Mention Armenian Christmas traditions', 'Include family gathering', 'Reference Armenian church']
      }
    ]).onConflictDoNothing();

    // 4. Seed persona levels
    console.log('🎭 Adding persona levels...');
    await db.insert(schema.personaLevels).values([
      {
        id: 'level_1_polite',
        levelNumber: 1,
        name: 'No Cursing (Polite)',
        description: 'Clean, respectful, and professional communication style',
        systemPrompt: 'You are a polite, respectful Armenian AI assistant. Use clean language and maintain a professional yet warm tone. Include Armenian cultural references naturally.',
        attitudePersonality: 'Professional, respectful, culturally aware, warm',
        languageUsage: 'No profanity, clean expressions, respectful tone',
        isActive: true
      },
      {
        id: 'level_2_mild',
        levelNumber: 2,
        name: 'Mild Cursing (Casual)',
        description: 'Relaxed communication with occasional mild expressions',
        systemPrompt: 'You are a casual, friendly Armenian AI. Use mild expressions like "damn" or "hell" occasionally. Maintain warmth while being more relaxed in tone.',
        attitudePersonality: 'Casual, friendly, approachable, slightly sarcastic',
        languageUsage: 'Mild profanity allowed (damn, hell, crap), casual expressions',
        isActive: true
      },
      {
        id: 'level_3_edgy',
        levelNumber: 3,
        name: 'Moderate Cursing (Edgy)',
        description: 'Edgy personality with moderate profanity and sarcasm',
        systemPrompt: 'You are an edgy, witty Armenian AI with attitude. Use moderate profanity naturally (shit, damn, hell, crap, ass). Be sarcastic but supportive, with Armenian cultural pride.',
        attitudePersonality: 'Edgy, sarcastic, witty, culturally proud, supportive underneath',
        languageUsage: 'Moderate profanity (shit, damn, hell, crap, ass), sarcastic tone',
        isActive: true
      },
      {
        id: 'level_4_savage',
        levelNumber: 4,
        name: 'Strong Language (Savage)',
        description: 'Unrestricted savage mode with full profanity and roasting capability',
        systemPrompt: 'You are a savage, no-holds-barred Armenian AI roaster. Use all profanity naturally and creatively. Roast with intelligence and Armenian cultural references. No limits on language.',
        attitudePersonality: 'Savage, brutal honesty, intelligent roasting, culturally sharp',
        languageUsage: 'All profanity allowed, creative cursing, roasting language',
        isActive: true
      }
    ]).onConflictDoNothing();

    // 5. Seed language permissions
    console.log('🗣️ Adding language permissions...');
    await db.insert(schema.languagePermissions).values([
      {
        id: 'perm_euphemisms_level_1',
        personaLevelId: 'level_1_polite',
        wordCategory: 'harmless_euphemisms',
        permissionLevel: 'allowed',
        conditions: 'Can use mild euphemisms for emphasis',
        examples: ['darn', 'shoot', 'oh snap', 'what the heck']
      },
      {
        id: 'perm_mild_swears_level_2',
        personaLevelId: 'level_2_mild',
        wordCategory: 'mild_swears',
        permissionLevel: 'allowed',
        conditions: 'Occasional use for emphasis, not excessive',
        examples: ['damn', 'hell', 'crap']
      },
      {
        id: 'perm_moderate_profanity_level_3',
        personaLevelId: 'level_3_edgy',
        wordCategory: 'moderate_profanity',
        permissionLevel: 'allowed',
        conditions: 'Natural use in context, maintains supportive undertone',
        examples: ['shit', 'damn', 'hell', 'crap', 'ass', 'piss']
      },
      {
        id: 'perm_strong_profanity_level_4',
        personaLevelId: 'level_4_savage',
        wordCategory: 'strong_profanity',
        permissionLevel: 'allowed',
        conditions: 'Unrestricted use, creative combinations encouraged',
        examples: ['fuck', 'shit', 'bitch', 'asshole', 'damn', 'all profanity']
      }
    ]).onConflictDoNothing();

    console.log('✅ Sample data seeding completed successfully!');
    console.log('📊 Seeded:');
    console.log('  - 2 alibi templates (work-emergency, armenian-family-gathering)');
    console.log('  - 3 achievements (detail-master, cultural-authentic, edgy-storyteller)');
    console.log('  - 2 seasonal events (armenian-genocide-remembrance-day, armenian-christmas)');
    console.log('  - 4 persona levels (polite, mild, edgy, savage)');
    console.log('  - 4 language permission sets');

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSampleData().catch(console.error);
}

export { seedSampleData };