/**
 * Mapping between vibes and persona levels
 * Level 1: Polite - Clean, respectful language
 * Level 2: Mild - Occasional casual language
 * Level 3: Edgy - More aggressive, some profanity
 * Level 4: Savage - Full profanity, roasting mode
 */

export interface VibePersonaMapping {
  vibe: string;
  personaLevel: number;
  personaId: string;
  description: string;
}

export const VIBE_PERSONA_MAPPINGS: VibePersonaMapping[] = [
  {
    vibe: 'default',
    personaLevel: 1,
    personaId: 'polite',
    description: 'Clean, respectful AI assistant'
  },
  {
    vibe: 'therapy',
    personaLevel: 2,
    personaId: 'mild',
    description: 'Supportive with occasional casual language'
  },
  {
    vibe: 'roast',
    personaLevel: 4,
    personaId: 'savage',
    description: 'Full roasting mode with profanity'
  },
  {
    vibe: 'call',
    personaLevel: 4,
    personaId: 'savage',
    description: 'Aggressive voice chat personality'
  },
  // Default mappings for other vibes
  {
    vibe: 'dating',
    personaLevel: 3,
    personaId: 'edgy',
    description: 'Flirty with some edge'
  },
  {
    vibe: 'famous',
    personaLevel: 2,
    personaId: 'mild',
    description: 'Creative social media personality'
  },
  {
    vibe: 'alibi',
    personaLevel: 3,
    personaId: 'edgy',
    description: 'Sneaky storyteller with attitude'
  }
];

/**
 * Get persona level for a given vibe
 */
export function getPersonaLevelForVibe(vibe: string): number {
  const mapping = VIBE_PERSONA_MAPPINGS.find(m => m.vibe === vibe);
  return mapping?.personaLevel || 1; // Default to polite level
}

/**
 * Get persona ID for a given vibe
 */
export function getPersonaIdForVibe(vibe: string): string {
  const mapping = VIBE_PERSONA_MAPPINGS.find(m => m.vibe === vibe);
  return mapping?.personaId || 'polite'; // Default to polite
}

/**
 * Get all persona mappings
 */
export function getAllVibePersonaMappings(): VibePersonaMapping[] {
  return VIBE_PERSONA_MAPPINGS;
}