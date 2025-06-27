# Armo Lobby

An advanced bilingual Armenian-American AI character platform featuring "Armo Hopar" with enterprise-level intelligent features including predictive caching, seamless cross-platform experiences, and adaptive persona learning.

## Core Features

### 🎭 4-Level Persona System
- **Polite** → **Mild** → **Edgy** → **Savage**: Dynamic personality adjustment
- Multi-dimensional user detection (mood, emotions, behavior, engagement)
- Cross-session memory and contextual awareness
- Adaptive complexity and language preferences

### 🤖 "Gimmi Alibi Ara" - AI Alibi Generation
- Real-time alibi story creation with believability scoring
- Voice input for natural question answering
- Template library with Armenian cultural events
- Emergency rapid mode for urgent situations
- Achievement system with gamification elements

### 🧠 Smart Caching & Performance Intelligence
- **Predictive Loading**: Pre-generates common scenarios during idle time
- **Intelligent Audio Caching**: Voice clips cached locally for instant playback
- **Background Processing**: Early alibi generation starts automatically after 4+ questions
- **Cache Analytics**: Hit rates tracked for optimization and performance monitoring

### ✨ Seamless Experience & Contextual Intelligence
- **Auto-Complete Suggestions**: AI-powered suggestions that improve over time based on user acceptance
- **Contradiction Detection**: Real-time analysis prevents logical inconsistencies in answers
- **Plausibility Hints**: Contextual guidance for more believable responses
- **Cross-Device Continuity**: Secure session handoff between mobile and desktop
- **Smart Bookmarking**: Auto-save at optimal points (25%, 50%, 75% completion)
- **Quick Resume**: One-tap continuation of interrupted sessions

### 🌐 Social & Community Features
- **Anonymized Gallery**: Community alibi sharing with privacy protection
- **Reaction System**: Community feedback and engagement tracking
- **Content Learning**: Reusable content repository with privacy filters
- **Social Analytics**: Usage patterns and community insights

### 🎯 Multi-Modal Interaction
- **Text Chat**: Real-time streaming responses with persona context
- **Voice Interface**: Speech-to-text with Google Gemini + ElevenLabs TTS
- **Image Analysis**: Vision AI with Groq meta-llama model for image understanding
- **File Support**: Upload and analyze images with contextual feedback

## Technology Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Shadcn/ui** + **Tailwind CSS** with neumorphic design
- **TanStack Query** for intelligent state management
- **Framer Motion** for smooth animations

### Backend
- **Node.js** + **Express.js** with TypeScript
- **PostgreSQL** with **Drizzle ORM** (48 comprehensive tables)
- **Real-time streaming** with intelligent caching
- **Background processing** with priority queues

### AI & APIs
- **Primary AI**: Groq API with meta-llama/llama-4-scout-17b-16e-instruct
- **Voice Synthesis**: ElevenLabs TTS (voice ID: pNInz6obpgDQGcFmaJgB)
- **Speech Recognition**: Google Gemini API for transcription
- **Vision Analysis**: Groq meta-llama for image understanding

### Database Architecture (48 Tables)
- **Core Tables (7)**: Users, sessions, messages, attachments, activity logs
- **Persona System (11)**: Multi-level personality engine with language controls
- **Phase 2 & 3 Features (14)**: Alibi templates, user preferences, achievements
- **Social & Sharing (7)**: Community gallery, reactions, content repository
- **Advanced Learning (6)**: Cross-session memory, contextual adaptation
- **Smart Caching (3)**: Predictive cache, voice cache, background processing
- **Seamless Experience (6)**: Auto-complete, contradictions, session handoff, bookmarks

## Key Intelligence Features

### Performance Intelligence
- Background alibi generation starts automatically when user answers 4+ questions
- Voice clips are cached locally for instant playback
- Common scenarios pre-loaded during idle time
- Cache hit rates tracked for optimization

### User Experience Intelligence
- Auto-complete suggestions improve over time based on user acceptance
- Contradiction detection prevents logical inconsistencies
- Optimal save points detected automatically (25%, 50%, 75% completion)
- Cross-device continuity with secure handoff tokens

### Adaptive Learning
- Success rates tracked for all suggestions and hints
- Effectiveness metrics guide future recommendations
- Device-specific optimizations and preferences
- Time-based context awareness for better suggestions

## Quick Start

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd armo-lobby
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your API keys:
     - `GROQ_API_KEY` - For AI chat and vision
     - `GEMINI_API_KEY` - For speech recognition  
     - `ELEVENLABS_API_KEY` - For voice synthesis
     - `DATABASE_URL` - PostgreSQL connection

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Core Features
- `/api/chat/*` - Real-time chat with persona context
- `/api/alibi/*` - AI alibi generation system
- `/api/voice/*` - Speech recognition and synthesis

### Smart Features  
- `/api/smart/cache/*` - Predictive caching and performance
- `/api/smart/autocomplete` - Intelligent suggestions
- `/api/smart/contradictions/*` - Logic validation
- `/api/smart/handoff/*` - Cross-device session transfer
- `/api/smart/bookmarks/*` - Smart save points

### Social Features
- `/api/social/gallery/*` - Community content sharing
- `/api/social/reactions/*` - Engagement tracking
- `/api/personas/*` - Persona management and analytics

## Development

### Project Structure
```
├── client/               # React frontend
├── server/               # Express backend
├── shared/               # Shared TypeScript schemas
├── uploads/              # File storage
└── database-mapping.md   # Database documentation
```

### Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run db:push` - Update database schema

## Contributing

This is a personal project showcasing advanced AI integration and intelligent user experience design. Feedback and suggestions are welcome.

## License

Private project - All rights reserved.
