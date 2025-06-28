export interface VibeConfig {
  id: string;
  title: string;
  subtitle: string;
  personality: string;
  icon: string;
  emoji: string;
  welcomeMessage?: string;
  glowColor: 'cyan' | 'coral' | 'teal';
}

export const vibeConfigs: Record<string, VibeConfig> = {
  lobby: {
    id: 'lobby',
    title: 'Armo Lobby',
    subtitle: 'Welcome home',
    personality: 'Friendly and welcoming',
    icon: 'fas fa-home',
    emoji: '🏠',
    glowColor: 'cyan',
    welcomeMessage: 'Welcome back to the Armo Lobby! Choose your vibe and let\'s get started.'
  },
  default: {
    id: 'default',
    title: 'Armo-GPT',
    subtitle: 'Traditional AI Chat',
    personality: 'friendly',
    icon: 'fas fa-robot',
    emoji: '🤖',
    welcomeMessage: 'Բարév ախպեր! Ready to chat about anything? I\'m here to help with whatever you need! 🤖',
    glowColor: 'cyan'
  },

  call: {
    id: 'call',
    title: 'Call Hopar Ara',
    subtitle: 'Voice Chat Active',
    personality: 'conversational',
    icon: 'fas fa-phone',
    emoji: '📞',
    glowColor: 'teal'
  },
  famous: {
    id: 'famous',
    title: 'Make Me Famous Ara',
    subtitle: 'Social Media Captions & Hashtags',
    personality: 'creative',
    icon: 'fab fa-instagram',
    emoji: '📸',
    welcomeMessage: 'Բարև my future influencer! Ready to become Instagram famous? Send me your pics and I\'ll make you go viral! 📸✨',
    glowColor: 'cyan'
  },
  alibi: {
    id: 'alibi',
    title: 'Gimmi Alibi Ara',
    subtitle: 'Story Builder for Trouble',
    personality: 'sneaky',
    icon: 'fas fa-mask',
    emoji: '🎭',
    welcomeMessage: 'Shhh... you came to the right guy, ախպեր. Tell me what happened and I\'ll craft you the perfect alibi story! 🎭',
    glowColor: 'coral'
  },
  therapy: {
    id: 'therapy',
    title: 'Therapy Session',
    subtitle: 'Pseudo-Therapy Mode',
    personality: 'therapeutic',
    icon: 'fas fa-couch',
    emoji: '🛋️',
    welcomeMessage: 'Բարև, welcome to our safe space. I\'m here to listen and help you work through whatever is on your mind. How are you feeling today? 🛋️',
    glowColor: 'teal'
  },
  hired: {
    id: 'hired',
    title: 'You Are Hired Ara',
    subtitle: 'Resume Builder & Career Coach',
    personality: 'career-focused',
    icon: 'fas fa-briefcase',
    emoji: '💼',
    welcomeMessage: 'Ey ախպեր, ready to land that dream job? Tell me about your skills and I\'ll build you a killer resume that gets you hired! 💼',
    glowColor: 'teal'
  },
  dating: {
    id: 'dating',
    title: 'Find Me Soulmate',
    subtitle: 'Dating Assistance',
    personality: 'matchmaker',
    icon: 'fas fa-heart',
    emoji: '💕',
    welcomeMessage: 'Ey ախպեր, looking for love? I got you covered! Tell me about yourself and what you\'re looking for, and I\'ll help you find your Armenian queen/king! 💕',
    glowColor: 'cyan'
  },
  gallery: {
    id: 'gallery',
    title: 'Gallery',
    subtitle: 'View your images',
    personality: 'helpful',
    icon: 'fas fa-images',
    emoji: '🖼️',
    welcomeMessage: 'Welcome to your gallery! Here you can view all your shared images and memories.',
    glowColor: 'teal'
  },
  recent: {
    id: 'recent',
    title: 'Recent Chats',
    subtitle: 'Your chat history',
    personality: 'helpful',
    icon: 'fas fa-comments',
    emoji: '💬',
    welcomeMessage: 'Here are your recent conversations. Click on any to continue where you left off.',
    glowColor: 'cyan'
  }
};
