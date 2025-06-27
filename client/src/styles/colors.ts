/**
 * ARMO-GPT OFFICIAL COLOR SYSTEM
 * 
 * ⚠️  CRITICAL: USE ONLY THESE COLORS THROUGHOUT THE ENTIRE APPLICATION
 * ⚠️  NO OTHER COLORS ARE PERMITTED WITHOUT EXPLICIT APPROVAL
 * ⚠️  ALL AI AGENTS MUST FOLLOW THIS COLOR SPECIFICATION
 */

export const ARMO_COLORS = {
  // MAIN BACKGROUND COLORS
  SIDEBAR_BG: '#2e2e2e',           // Dark sidebar background
  CONTENT_BG: '#3a3a3a',          // Main content area background
  CARD_BG: '#3a3a3a',             // All card backgrounds (neumorphic)
  
  // NEUMORPHIC SHADOWS (DARK THEME)
  SHADOW_DARK: '#272727',         // Darker shadow for neumorphic effect
  SHADOW_LIGHT: '#464646',        // Lighter shadow for neumorphic effect
  
  // TEXT COLORS
  TEXT_PRIMARY: '#ffffff',        // Primary text (white)
  TEXT_SECONDARY: '#d1d5db',      // Secondary text (gray-300)
  TEXT_MUTED: '#9ca3af',          // Muted text (gray-400)
  
  // ACCENT COLORS
  GRADIENT_PRIMARY: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)', // Red-blue-orange gradient
  ACCENT_RED: '#ff6b6b',          // Red accent
  ACCENT_BLUE: '#4ecdc4',         // Blue accent  
  ACCENT_ORANGE: '#45b7d1',       // Orange accent
  
  // BUTTON COLORS
  BUTTON_PRIMARY: '#3a3a3a',      // Primary button background
  BUTTON_HOVER: '#464646',        // Button hover state
  
  // BORDER COLORS
  BORDER_DEFAULT: '#4a5568',      // Default border color
  BORDER_LIGHT: '#6b7280',        // Light border color
} as const;

/**
 * NEUMORPHIC SHADOW STYLES
 * Use these exact shadow configurations for consistency
 */
export const NEUMORPHIC_SHADOWS = {
  // For cards and main elements
  CARD: `12px 12px 24px ${ARMO_COLORS.SHADOW_DARK}, -12px -12px 24px ${ARMO_COLORS.SHADOW_LIGHT}`,
  
  // For buttons and smaller elements  
  BUTTON: `8px 8px 16px ${ARMO_COLORS.SHADOW_DARK}, -8px -8px 16px ${ARMO_COLORS.SHADOW_LIGHT}`,
  
  // For subtle elements
  SUBTLE: `4px 4px 8px ${ARMO_COLORS.SHADOW_DARK}, -4px -4px 8px ${ARMO_COLORS.SHADOW_LIGHT}`,
} as const;

/**
 * COMMON STYLE OBJECTS
 * Pre-defined style objects for common UI elements
 */
export const COMMON_STYLES = {
  // Standard neumorphic card
  CARD: {
    background: ARMO_COLORS.CARD_BG,
    boxShadow: NEUMORPHIC_SHADOWS.CARD,
  },
  
  // Standard neumorphic button
  BUTTON: {
    background: ARMO_COLORS.BUTTON_PRIMARY,
    boxShadow: NEUMORPHIC_SHADOWS.BUTTON,
  },
  
  // Gradient button (for primary actions)
  GRADIENT_BUTTON: {
    background: ARMO_COLORS.GRADIENT_PRIMARY,
    boxShadow: NEUMORPHIC_SHADOWS.BUTTON,
  },
  
  // Sidebar styling
  SIDEBAR: {
    background: ARMO_COLORS.SIDEBAR_BG,
    boxShadow: NEUMORPHIC_SHADOWS.SUBTLE,
  },
} as const;

/**
 * USAGE EXAMPLES:
 * 
 * // For a card:
 * <div style={COMMON_STYLES.CARD}>
 * 
 * // For a button:
 * <button style={COMMON_STYLES.BUTTON}>
 * 
 * // For custom styling:
 * <div style={{
 *   background: ARMO_COLORS.CONTENT_BG,
 *   boxShadow: NEUMORPHIC_SHADOWS.CARD,
 *   color: ARMO_COLORS.TEXT_PRIMARY
 * }}>
 */