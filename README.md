# Armo-GPT

An advanced bilingual Armenian-American AI character platform that goes far beyond a simple ChatGPT clone. Featuring "Armo Hopar" with a sophisticated 4-level persona system, specialized interactive features, and comprehensive user analytics.

## 🚀 Key Features

### Revolutionary 4-Level Persona System
- **Level 1 - Polite Armo Hopar**: Respectful, no profanity, formal Armenian hospitality
- **Level 2 - Casual Armo Hopar**: Relaxed friend with mild language (damn, hell, crap)
- **Level 3 - Edgy Armo Hopar**: Sassy with moderate profanity, street-smart attitude
- **Level 4 - Savage Armo Hopar**: Unfiltered, roasting capability, maximum authenticity

### Specialized Interactive Features
- **"Gimmi Alibi Ara"**: AI-powered story generation with believability scoring and achievements
- **"Your Hired Ara"**: Professional resume generation with structured interview process
- **"Make Me Famous"**: Viral social media caption generation with image analysis
- **Voice Call Interface**: Real-time voice conversations with persona-aware responses

### Advanced User Detection Systems
- **Gender Detection**: Infers user gender from writing patterns, usernames, pronouns
- **Mood Analysis**: Real-time sentiment analysis with AI response adjustment
- **Emotion Recognition**: Fine-grained emotional state detection (joy, sadness, anger, etc.)
- **Behavior Pattern Analysis**: Communication style detection (polite, sarcastic, humorous, etc.)
- **Engagement Tracking**: Measures involvement through message length, response time, emoji usage
- **Intent Classification**: Categorizes user purposes (small talk, information query, emotional support, etc.)

### Multi-Modal Interaction
- **Text Chat**: Streaming responses with persona-aware conversations
- **Voice Integration**: Speech-to-text input and text-to-speech output
- **File Uploads**: Support for images, audio, video, documents (10MB limit)
- **Vision Capabilities**: AI can analyze and discuss uploaded images
- **Session Management**: Persistent chat history with restoration capabilities

### Content Learning System
- **Reusable Content Repository**: AI learns from successful interactions
- **Quality Scoring**: Content rated based on user reactions
- **Usage Tracking**: Prevents repetitive responses to same users
- **Rotation Strategies**: Smart content distribution (random, quality-based, least-recent)

## 🛠 Technology Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Shadcn/ui** components
- **Neumorphic Design** with responsive layouts
- **React Query** for state management

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **PostgreSQL** with **Drizzle ORM**
- **Multer** for file upload handling
- **WebSocket** support for real-time features

### AI Integration
- **Groq API** (`meta-llama/llama-4-scout-17b-16e-instruct`) for chat and vision
- **Google Gemini API** for speech-to-text and advanced processing
- **ElevenLabs API** for high-quality text-to-speech
- **Tavily API** for web search capabilities

### Database Architecture (18 Tables)
- **Core Tables**: Users, chat sessions, messages, attachments, activity logs, error logs, temp storage
- **Persona System Tables** (10 tables): Persona levels, language permissions, user detection systems, content repository, usage tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- API keys for Groq, Google Gemini, ElevenLabs, and Tavily

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Armo-GPT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database URL
   ```

4. **Initialize database**
   ```bash
   npm run db:push
   ```

5. **Seed persona data** (optional)
   ```bash
   # After starting the server, call:
   # POST /api/seed-personas
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/armo_gpt
SUPABASE_DATABASE_URL=your_supabase_url (optional)

# AI APIs
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_google_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
TAVILY_API_KEY=your_tavily_key

# PostgreSQL (if using separate connection)
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=armo_gpt
```

## 🏗 Architecture Overview

### Database Schema
The application uses a sophisticated 18-table PostgreSQL schema:

**Core Application Tables:**
- `users` - User accounts and authentication
- `chat_sessions` - Conversation sessions with vibe categorization
- `messages` - Individual messages with metadata
- `attachments` - File uploads and media
- `activity_logs` - User action tracking
- `error_logs` - Error monitoring and debugging
- `temp_storage` - Temporary data with expiration

**Persona System Tables (10 tables):**
- `persona_levels` - 4-level behavioral system definitions
- `language_permissions` - Granular profanity control per level
- `user_gender_detection` - Gender inference tracking
- `user_mood_detection` - Sentiment analysis results
- `user_emotion_detection` - Fine-grained emotional states
- `user_behavior_detection` - Communication style analysis
- `user_engagement_detection` - Interaction involvement tracking
- `user_intent_detection` - Purpose classification
- `reusable_content_repository` - Community content learning
- `content_reuse_rules` - Usage policies and tracking
- `content_usage_tracking` - Content distribution monitoring

### API Endpoints

**Chat & Sessions:**
- `GET /api/chat/:vibe/history` - Fetch chat history for specific vibe
- `POST /api/chat/session` - Create new chat session
- `GET /api/chat/session/:id/messages` - Get session messages
- `POST /api/chat/message` - Send message with AI response
- `POST /api/chat/upload` - File upload with vision analysis

**Specialized Features:**
- `POST /api/generate-joke` - Joke generation
- `POST /api/generate-alibi` - Alibi story creation
- `POST /api/generate-resume` - Resume generation
- `POST /api/synthesize-speech` - Text-to-speech conversion
- `POST /api/transcribe-audio` - Speech-to-text conversion

**Persona Management:**
- `POST /api/persona-levels` - Create persona level
- `GET /api/persona-levels` - List persona levels
- `POST /api/language-permissions` - Set language rules
- `POST /api/user-detections/*` - Various detection endpoints
- `POST /api/seed-personas` - Initialize persona data

## 🎨 User Experience Features

### Design System
- **Neumorphic Design**: Modern, tactile interface elements
- **Responsive Layout**: Mobile-first design with adaptive components
- **Dark/Light Themes**: User preference support
- **Smooth Animations**: Polished interaction feedback
- **Accessibility**: Screen reader support and keyboard navigation

### Navigation & Organization
- **Collapsible Sidebar**: Recent chats, feature access, settings
- **Vibe-Based Organization**: Sessions categorized by feature type
- **Search Functionality**: Find previous conversations
- **Quick Actions**: One-click access to major features

## 🔒 Security & Performance

### Security Features
- **Input Validation**: Zod schema validation throughout
- **File Type Restrictions**: Safe upload filtering
- **Session Security**: Secure session management
- **Data Encryption**: Protected sensitive information

### Performance Optimizations
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: On-demand component loading
- **Caching Strategies**: Optimized data retrieval
- **File Upload Optimization**: Efficient media handling

## 🚀 Deployment

### Production Ready
- **Vercel Compatible**: Optimized for Vercel deployment
- **Neon Database**: Cloud PostgreSQL integration
- **Supabase Support**: Alternative database provider
- **Environment Flexibility**: Multiple hosting options

### Build Commands
```bash
npm run build    # Build for production
npm run start    # Start production server
npm run check    # Type checking
npm run db:push  # Database schema sync
```

## 🌟 Cultural Integration

### Armenian Heritage
- **Language Mixing**: Natural Armenian-English code-switching
- **Cultural References**: Authentic Armenian context
- **Community Values**: Hospitality and family-oriented responses
- **Historical Awareness**: Armenian history and traditions

## 🤝 Contributing

This is a personal project showcasing advanced AI integration and persona psychology. While it's not open for direct contributions, feedback and suggestions are welcome.

### Development Guidelines
- Follow TypeScript best practices
- Maintain database schema consistency
- Test persona system changes thoroughly
- Respect cultural authenticity in Armenian content

## 📄 License

Private project - All rights reserved.

---

**Armo-GPT** represents a sophisticated evolution of AI chat applications, combining advanced persona psychology, multi-modal interaction, specialized features, and deep cultural integration. It's not just an "Armenian ChatGPT" but a comprehensive AI companion platform that adapts to users, learns from interactions, and provides specialized tools for creativity, professional development, and entertainment.
