// Database Seed Script for Persona System

import { storage } from "./storage";
import { PERSONA_LIBRARY } from "./persona-content";

export async function seedPersonaData() {
  console.log("🌱 Seeding persona data...");

  try {
    // Seed the 4 core persona levels
    for (const persona of Object.values(PERSONA_LIBRARY)) {
      try {
        await storage.createPersonaLevel({
          id: persona.id,
          levelNumber: getLevelNumber(persona.id),
          name: persona.name,
          description: persona.description,
          allowedLanguage: persona.languageRules.allowedProfanity,
          forbiddenLanguage: persona.languageRules.forbiddenWords,
          systemPrompt: persona.systemPrompt,
          languageRules: JSON.stringify(persona.languageRules),
          isActive: true
        });
        console.log(`✅ Created persona: ${persona.name}`);
      } catch (error) {
        console.log(`⚠️  Persona ${persona.name} may already exist`);
      }
    }

    // Seed language permissions for each persona
    for (const persona of Object.values(PERSONA_LIBRARY)) {
      const categories = [
        "euphemisms", "mild_swears", "strong_profanity", 
        "insults", "sexual_content", "aggressive_language"
      ];

      for (const category of categories) {
        try {
          await storage.createLanguagePermission({
            id: `${persona.id}_${category}`,
            personaLevelId: persona.id,
            wordCategory: category,
            permissionLevel: getPermissionLevel(persona.id, category),
            exampleWords: getExampleWords(category),
            contextConditions: getContextConditions(persona.id, category),
            isActive: true
          });
        } catch (error) {
          // Permission may already exist
        }
      }
    }

    // Seed sample reusable content
    const sampleContent = [
      {
        id: "joke_001",
        contentCategory: "jokes_humor",
        contentText: "Why did the Armenian computer programmer refuse to use Java? Because they prefer their coffee Turkish! ☕",
        sourceUserId: null,
        qualityScore: 4.2,
        usageCount: 15,
        allowedPersonaLevel: 1,
        tags: ["programming", "coffee", "armenian"],
        isActive: true
      },
      {
        id: "roast_001", 
        contentCategory: "roasts_comebacks",
        contentText: "Your coding skills are like Armenian weather - unpredictable and occasionally harsh, but somehow it works out in the end.",
        sourceUserId: null,
        qualityScore: 3.8,
        usageCount: 8,
        allowedPersonaLevel: 3,
        tags: ["programming", "roast", "weather"],
        isActive: true
      },
      {
        id: "advice_001",
        contentCategory: "advice", 
        contentText: "Remember hopar, like our ancestors who survived 1,700 years of challenges, you too can overcome whatever obstacle you're facing. Take it one step at a time.",
        sourceUserId: null,
        qualityScore: 4.7,
        usageCount: 23,
        allowedPersonaLevel: 1,
        tags: ["motivation", "history", "perseverance"],
        isActive: true
      },
      {
        id: "fact_001",
        contentCategory: "insights_facts",
        contentText: "Did you know Armenia was the first nation to officially adopt Christianity as a state religion in 301 AD? We've been setting trends for over 1,700 years! 🇦🇲",
        sourceUserId: null,
        qualityScore: 4.5,
        usageCount: 31,
        allowedPersonaLevel: 1,
        tags: ["history", "christianity", "armenia", "facts"],
        isActive: true
      }
    ];

    for (const content of sampleContent) {
      try {
        await storage.saveReusableContent(content);
        console.log(`✅ Created sample content: ${content.id}`);
      } catch (error) {
        console.log(`⚠️  Content ${content.id} may already exist`);
      }
    }

    // Seed content reuse rules
    const reuseRules = [
      {
        id: "privacy_rule",
        ruleName: "Privacy Protection",
        ruleDescription: "Users never receive their own contributed content back",
        contentCategory: "all",
        isActive: true,
        ruleLogic: JSON.stringify({
          type: "exclude_source_user",
          condition: "always"
        })
      },
      {
        id: "persona_level_rule",
        ruleName: "Persona Level Filtering", 
        ruleDescription: "Content must match or be below user's current persona level",
        contentCategory: "all",
        isActive: true,
        ruleLogic: JSON.stringify({
          type: "level_filter",
          condition: "content_level <= user_level"
        })
      },
      {
        id: "rotation_rule",
        ruleName: "Content Rotation",
        ruleDescription: "Rotate content to avoid repetition within 24 hours",
        contentCategory: "all", 
        isActive: true,
        ruleLogic: JSON.stringify({
          type: "time_rotation",
          cooldown_hours: 24
        })
      }
    ];

    for (const rule of reuseRules) {
      try {
        // Note: This would use insertContentReuseRulesSchema when storage method is available
        console.log(`✅ Would create reuse rule: ${rule.ruleName}`);
      } catch (error) {
        console.log(`⚠️  Rule ${rule.id} creation failed`);
      }
    }

    console.log("🎉 Persona data seeding completed!");
    
    return {
      success: true,
      seeded: {
        personas: Object.keys(PERSONA_LIBRARY).length,
        languagePermissions: Object.keys(PERSONA_LIBRARY).length * 6,
        sampleContent: sampleContent.length,
        reuseRules: reuseRules.length
      }
    };

  } catch (error) {
    console.error("❌ Persona seeding failed:", error);
    return { success: false, error: error.message };
  }
}

function getLevelNumber(personaId: string): number {
  const levelMap = {
    "level_1_polite": 1,
    "level_2_mild": 2, 
    "level_3_edgy": 3,
    "level_4_savage": 4
  };
  return levelMap[personaId as keyof typeof levelMap] || 1;
}

function getPermissionLevel(personaId: string, category: string): string {
  const levelNumber = getLevelNumber(personaId);
  
  // Define permission levels based on persona level and category
  const permissionMatrix = {
    1: { // Polite
      euphemisms: "forbidden",
      mild_swears: "forbidden", 
      strong_profanity: "forbidden",
      insults: "forbidden",
      sexual_content: "forbidden",
      aggressive_language: "forbidden"
    },
    2: { // Mild
      euphemisms: "allowed",
      mild_swears: "allowed",
      strong_profanity: "forbidden", 
      insults: "conditional",
      sexual_content: "forbidden",
      aggressive_language: "conditional"
    },
    3: { // Edgy
      euphemisms: "allowed",
      mild_swears: "allowed",
      strong_profanity: "conditional",
      insults: "allowed", 
      sexual_content: "conditional",
      aggressive_language: "allowed"
    },
    4: { // Savage
      euphemisms: "allowed",
      mild_swears: "allowed", 
      strong_profanity: "allowed",
      insults: "allowed",
      sexual_content: "allowed",
      aggressive_language: "allowed"
    }
  };

  return permissionMatrix[levelNumber as keyof typeof permissionMatrix]?.[category as keyof typeof permissionMatrix[1]] || "forbidden";
}

function getExampleWords(category: string): string[] {
  const examples = {
    euphemisms: ["darn", "frick", "shoot", "crud"],
    mild_swears: ["damn", "hell", "crap"],
    strong_profanity: ["shit", "fuck", "bitch"],
    insults: ["idiot", "stupid", "dumbass"],
    sexual_content: ["sexy", "hot", "inappropriate"],
    aggressive_language: ["shut up", "piss off", "screw you"]
  };
  
  return examples[category as keyof typeof examples] || [];
}

function getContextConditions(personaId: string, category: string): string {
  const levelNumber = getLevelNumber(personaId);
  
  if (levelNumber === 1) return "Never allowed under any circumstances";
  if (levelNumber === 2) return "Only when user uses similar language first";
  if (levelNumber === 3) return "Allowed for emphasis and humor, avoid when user seems sensitive";
  if (levelNumber === 4) return "Freely allowed except for hate speech";
  
  return "Context-dependent usage";
}