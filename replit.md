# Armo Lobby Replit Project

## Overview

Armo Lobby is a full-stack TypeScript web application featuring an Armenian-themed AI chatbot with multiple personality modes ("vibes"). The application combines a React frontend with an Express.js backend, using PostgreSQL for data persistence and supporting both text and voice interactions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Armenian-themed color palette
- **State Management**: TanStack Query (React Query) for server state
- **Animation**: Framer Motion for smooth transitions and interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: In-memory storage with planned PostgreSQL persistence
- **API Design**: RESTful endpoints for chat functionality

### Database Schema
- **Users**: Basic user authentication (id, username, password)
- **Chat Sessions**: Conversation tracking by user and vibe
- **Messages**: Individual chat messages with metadata support

## Key Components

### Vibe System
The application features multiple AI personality modes:
- **Default**: Standard friendly AI chat
- **Roast**: High-energy roasting mode with profanity
- **Call**: Voice chat interface
- **Famous**: Social media content generation

### Chat Interface
- Real-time message streaming simulation
- Multi-modal input support (text, voice, file upload)
- Persistent chat history per vibe
- Armenian language integration

### UI Components
- Sidebar navigation for vibe selection
- Responsive design for mobile and desktop
- Custom neumorphic design elements
- Armenian flag color accents

## Data Flow

1. **User Selection**: User selects a vibe from the sidebar or lobby
2. **Session Creation**: Backend creates or retrieves chat session for the vibe
3. **Message Exchange**: Frontend sends messages via API, backend processes and returns AI responses
4. **State Management**: React Query manages server state and caching
5. **UI Updates**: Components update reactively based on query state

## External Dependencies

### Core Libraries
- **Database**: Supabase PostgreSQL with @neondatabase/serverless driver
- **ORM**: drizzle-orm and drizzle-zod for database operations
- **UI**: Extensive Radix UI component library
- **Validation**: Zod for schema validation
- **Animation**: Framer Motion for interactive animations

### AI Integration (ACTIVE)
- **Chat AI**: Groq API with meta-llama/llama-4-scout-17b-16e-instruct model for all text conversations
- **Vision Analysis**: Groq API with meta-llama/llama-4-scout-17b-16e-instruct for image analysis  
- **Voice Transcription**: Google Gemini API for speech-to-text conversion
- **Text-to-Speech**: ElevenLabs API for high-quality voice synthesis
- **Search**: Tavily API for web search capabilities (configured but not active)

## Deployment Strategy

### Development
- **Environment**: Replit with live reload via Vite
- **Database**: PostgreSQL module in Replit
- **Port Configuration**: Express server on port 5000, external port 80

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles Express server to `dist/index.js`
- **Deployment**: Replit autoscale deployment target
- **Start Command**: `npm run start` runs the production build

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`: Chat and vision AI service authentication (meta-llama/llama-4-scout-17b-16e-instruct)
- `GEMINI_API_KEY`: Voice transcription service authentication (speech-to-text only)
- `ELEVENLABS_API_KEY`: Voice synthesis service authentication
- `TAVILY_API_KEY`: Search service authentication

## Changelog
- June 25, 2025. Initial setup
- June 25, 2025. Added PostgreSQL database with persistent chat storage
- June 25, 2025. Updated color scheme to gray (#bbbbbb background, #9f9f9f/#d7d7d7 shadows)
- June 25, 2025. Added red-blue-orange gradient to main content headers and cards
- June 25, 2025. Updated sidebar to dark theme (#2e2e2e background, #272727/#353535 shadows)
- June 25, 2025. Removed Armenian flag icon from sidebar header
- June 25, 2025. Added Armo Lobby logo image with soft white glow to sidebar header
- June 25, 2025. Replaced "Choose Your Vibe" heading with neumorphic "THE VIBEZ" dropdown button using custom gradient styling
- June 25, 2025. Made sidebar fixed positioned with internal scrolling capability
- June 25, 2025. Added Gallery and Recent Chats buttons below Vibez with matching neumorphic styling and icons
- June 25, 2025. Removed subtitle "Your Armenian AI Hopar" from sidebar header for cleaner appearance
- June 25, 2025. Made navigation buttons section scrollable with invisible scrollbars
- June 25, 2025. Replaced user profile with neumorphic Account and Settings buttons using black color scheme
- June 25, 2025. Added consistent red-blue-orange gradient hover effects to all sidebar buttons
- June 25, 2025. Added sidebar toggle functionality with neumorphic switch and minimized spacing
- June 25, 2025. Made main content area responsive to sidebar state - expands to full width when sidebar is collapsed
- June 25, 2025. Applied dark black color scheme throughout site components using slightly lighter shade (#3a3a3a) than sidebar (#2e2e2e)
- June 25, 2025. Implemented neumorphic button design for input controls with production-ready functionality
- June 25, 2025. Fixed microphone button visual feedback with proper red recording state contained within circular button
- June 25, 2025. Added copy, read aloud, and share action buttons to AI messages with hover animation
- June 25, 2025. Integrated ElevenLabs voice synthesis API for high-quality text-to-speech with fallback to browser speech
- June 25, 2025. Integrated real Groq API with meta-llama/llama-4-scout-17b-16e-instruct model for production chat responses with comprehensive error handling
- June 25, 2025. Implemented real timestamps for messages replacing static "Just now" text
- June 25, 2025. Implemented real-time streaming responses showing actual AI generation instead of fake typing animation
- June 25, 2025. Implemented mobile-first responsive design with mobile sidebar toggle in header and mobile-optimized layouts
- June 25, 2025. Fixed ArrowLeft import error and completed mobile responsive implementation with sidebar overlay functionality
- June 25, 2025. Repositioned action buttons (copy, voice, share) to appear next to timestamp below chat messages with enhanced neumorphic styling and gradient hover effects
- June 25, 2025. Fixed chat input field positioning to be locked at bottom with proper z-index and responsive margins to prevent messages from hiding behind input area
- June 25, 2025. Integrated Supabase database as primary database provider with fallback to existing DATABASE_URL for backward compatibility
- June 25, 2025. Redesigned input area to match ChatGPT style with integrated buttons inside the input field while maintaining neumorphic design and send button functionality
- June 25, 2025. Removed unauthorized "Online" status indicator from chat header
- June 25, 2025. Centered chat header title and subtitle for better visual balance
- June 25, 2025. Added "+" button with Deep Search dropdown in input area as requested (functionality not yet connected)
- June 25, 2025. Redesigned Deep Search button with custom neumorphic styling to match site aesthetics
- June 25, 2025. Repositioned "+" button below file upload button to prevent interference with chat input area
- June 25, 2025. Fixed WebSocket database connection issue preventing chat bubbles from displaying
- June 25, 2025. Added extra bottom padding (pb-40) to chat messages area to prevent AI responses from being hidden behind fixed input field
- June 25, 2025. Fixed AI message bubble visibility issues with explicit styling and z-index positioning
- June 25, 2025. Fixed input field focus problem - textarea now maintains focus after sending messages and auto-focuses on load
- June 25, 2025. Fixed AI response display by immediately adding completed messages to state instead of relying only on cache invalidation
- June 25, 2025. Implemented full file upload functionality with multer backend support for images, audio, video, and documents
- June 25, 2025. Added file attachment display in chat messages with appropriate icons and metadata
- June 25, 2025. Created secure file serving endpoint with 10MB upload limit and type validation
- June 25, 2025. Fixed file upload auto-send behavior - uploads no longer automatically create chat messages
- June 25, 2025. Improved AI chat bubble animation smoothness with better transitions and timing
- June 25, 2025. Enhanced streaming message rendering to reduce jerky motion effects
- June 25, 2025. Implemented ChatGPT-style file staging system - files are held in chat interface before sending
- June 25, 2025. Added database table for attachments with proper schema and types
- June 25, 2025. Created file staging area UI with remove functionality and file icons
- June 25, 2025. Updated send logic to handle multiple attachments per message
- June 25, 2025. Restricted file upload to images only (JPEG, PNG, GIF, WebP) with 5MB size limit
- June 25, 2025. Integrated Groq vision API with meta-llama/llama-4-scout-17b-16e-instruct model for image analysis
- June 25, 2025. Implemented base64 image encoding for vision API requests following Groq documentation
- June 25, 2025. Added personality-aware image analysis for different vibes (roast mode, dating advice, etc.)
- June 25, 2025. Created fallback handlers for vision API errors with proper error messaging
- June 25, 2025. Fixed image attachment data flow from frontend to backend for vision API processing
- June 25, 2025. Added image thumbnail display in chat messages with proper metadata handling
- June 25, 2025. Enhanced StreamingMessage component to show image attachments with neumorphic styling
- June 26, 2025. Implemented speech-to-text (STT) functionality using Web Speech API for voice input
- June 26, 2025. Added real-time voice transcription with interim results display in chat input
- June 26, 2025. Created visual feedback with pulse animation for recording state
- June 26, 2025. Added browser compatibility checks and error handling for speech recognition
- June 26, 2025. Replaced Web Speech API with Google Gemini STT for more accurate transcription
- June 26, 2025. Implemented audio recording with MediaRecorder API and Gemini audio processing
- June 26, 2025. Added visual feedback for recording and transcription states with different colors
- June 26, 2025. Created full-screen VoiceCallInterface component with phone call-like immersive experience
- June 26, 2025. Implemented touchless voice interaction with visual audio waveform and status indicators
- June 26, 2025. Added back button for returning to chat and integrated voice interface popup trigger
- June 26, 2025. Added production-ready database logging system with activity logs, error logs, and temporary storage
- June 26, 2025. Implemented proper session management with database tracking for New Chat functionality
- June 26, 2025. Fixed missing currentSessionId state variable causing application crashes
- June 26, 2025. FIXED: Recent Chats functionality with comprehensive investigation and bulletproof solution
- June 26, 2025. Added missing /api/chat/recent route endpoint that was causing HTML responses
- June 26, 2025. Fixed database query to properly filter sessions with messages using sql import
- June 26, 2025. Enhanced error handling in RecentChatsList with detailed logging and retry functionality
- June 26, 2025. Added personalized welcome message for new chat sessions: "Hi hopar is listening, How is Armo Hopar helping you destroy your ego today?"
- June 26, 2025. MAJOR: Implemented complete modular persona engine with 10 comprehensive database tables
- June 26, 2025. Created 4-level persona system (Polite → Mild → Edgy → Savage) with granular language controls
- June 26, 2025. Built multi-dimensional user detection system tracking gender, mood, emotions, behavior, engagement, and intent
- June 26, 2025. Implemented content learning and reuse system with privacy protection (users never hear their own content back)
- June 26, 2025. Added comprehensive storage layer with 25+ new methods for persona management and user analytics
- June 26, 2025. Database schema supports both chat-based and form-based persona features with word-based IDs throughout
- June 26, 2025. COMPLETE: Built full persona content library with system prompts, language rules, and seed content for all 4 levels
- June 26, 2025. COMPLETE: Implemented REST API endpoints for persona management, user detection, content learning, and analytics
- June 26, 2025. COMPLETE: Integrated AI persona detection system with real-time user behavior analysis and context-aware responses
- June 26, 2025. COMPLETE: Created comprehensive analytics dashboard with mood distribution, emotion trends, and behavior patterns
- June 26, 2025. COMPLETE: Added database seeding system with sample content and language permission matrices
- June 26, 2025. COMPLETE: Implemented user-specified vibe-to-persona level mapping system
- June 26, 2025. ACTIVE: Armo Lobby = Level 1 (Polite), Therapy = Level 2 (Mild), Smoke & Roast = Level 4 (Savage), Call Hopar = Level 4 (Savage)
- June 27, 2025. COMPLETE: Implemented production-ready "Gimmi Alibi Ara" feature with real AI integration
- June 27, 2025. COMPLETE: Fixed all placeholder implementations with real Groq API calls using meta-llama/llama-4-scout-17b-16e-instruct model
- June 27, 2025. COMPLETE: Implemented real ElevenLabs voice synthesis with voice ID pNInz6obpgDQGcFmaJgB
- June 27, 2025. COMPLETE: Added proper session management - alibi sessions save to recent chats as "gimmi-alibi-ara" vibe
- June 27, 2025. COMPLETE: All action buttons functional with real implementations (download, share, copy, expand, read-aloud)
- June 27, 2025. COMPLETE: Fixed mobile header positioning and dynamic page titles - mobile header now shows correct feature names
- June 27, 2025. COMPLETE: Reduced alibi page padding and removed question counter from header (kept only progress bar)
- June 27, 2025. COMPLETE: Fixed "Listen hopar" username references - now uses actual user's name in alibi generation
- June 27, 2025. COMPLETE: Confirmed ElevenLabs voice ID pNInz6obpgDQGcFmaJgB is correctly implemented
- June 27, 2025. COMPLETE: Removed profile, expand, and share buttons from recap page - added ElevenLabs read-aloud with pause functionality
- June 27, 2025. COMPLETE: Restart button properly shows confirmation popup before restarting
- June 27, 2025. COMPLETE: Expand button correctly positioned next to alibi content with show more/less functionality
- June 27, 2025. COMPLETE: Enhanced read-aloud functionality across all features with proper pause/resume controls
- June 27, 2025. COMPLETE: Added audio cleanup effects to prevent memory leaks in all audio-enabled components
- June 27, 2025. COMPLETE: Implemented proper play/pause icon switching (Volume2 for play, Pause for pause state)
- June 27, 2025. COMPLETE: Enhanced both AlibiResultPage and AlibiRecapPage with ElevenLabs TTS and Web Speech API fallback
- June 27, 2025. COMPLETE: Updated README.md with correct AI model information (meta-llama/llama-4-scout-17b-16e-instruct via Groq API)
- June 27, 2025. COMPLETE: Removed all fallback functionality from alibi and resume features as requested
- June 27, 2025. COMPLETE: Added styled error popups matching app aesthetics for voice synthesis failures
- June 27, 2025. COMPLETE: Error popups use neumorphic styling with red accent borders and 4-second auto-dismiss
- June 27, 2025. COMPLETE: Implemented production-ready "Your Hired Ara" resume generation feature with full session management
- June 27, 2025. COMPLETE: Added comprehensive persona system integration for personalized resume content generation
- June 27, 2025. COMPLETE: Fixed critical navigation issues - back button from welcome goes to lobby, not restart
- June 27, 2025. COMPLETE: Implemented session restoration for resume feature matching gimmi-alibi-ara pattern
- June 27, 2025. COMPLETE: Added gamification elements including professionalism scoring and achievement system
- June 27, 2025. COMPLETE: Enhanced mobile responsiveness with proper back button functionality

## Production Implementation Summary

### AI Models & APIs Used:
- **Primary AI Model**: meta-llama/llama-4-scout-17b-16e-instruct via Groq API
- **Voice Synthesis**: ElevenLabs API with voice ID pNInz6obpgDQGcFmaJgB  
- **Streaming Chat**: Real-time Groq API streaming for chat interface
- **Non-streaming AI**: Dedicated fallback function for jokes and alibi generation

### Persona System Integration:
- **Gimmi Alibi Ara Feature**: Uses Edgy Persona (Level 3) with Level 1 profanity restrictions
- **System Prompt**: Edgy Armenian personality with moderate profanity (damn, hell, shit, crap) for creative alibi crafting
- **Profanity Level**: Level 1 (Limited) - moderate swears only, no strong profanity
- **Language Rules**: Armenian-English mix, uses "ախպեր", "Listen hopar", "Inch es anum?", sarcastic but supportive tone

### Database Schema Used:
- **Chat Sessions**: vibe = "gimmi-alibi-ara" for alibi sessions  
- **Messages**: User answers saved as metadata with type 'alibi-request'
- **AI Responses**: Generated alibis saved with type 'alibi-response'
- **Session Tracking**: All alibi generations appear in Recent Chats for return access

### API Endpoints:
- **POST /api/joke**: Real AI joke generation with contextual roasting
- **POST /api/alibi/generate**: Complete alibi story generation with session saving
- **POST /api/resume/generate**: Complete resume generation with session saving
- **POST /api/voice/speak**: ElevenLabs TTS with Armenian-accent voice
- **GET /api/chat/session/:sessionId/messages**: Session restoration for both features
- **All endpoints**: Use production Groq API with proper error handling and fallbacks

## "Your Hired Ara" Resume Generation Feature

### Feature Overview
Professional resume generation tool with Armenian personality, gamification elements, and comprehensive session management. Users answer 6 personalized questions to generate tailored resumes with cultural humor and professional insights.

### Technical Architecture
- **AI Model**: meta-llama/llama-4-scout-17b-16e-instruct via Groq API
- **Persona Integration**: Edgy Persona (Level 3) with Level 1 profanity restrictions
- **Database**: PostgreSQL with vibe "you-are-hired-ara" for session tracking
- **Voice Synthesis**: ElevenLabs API (Voice ID: pNInz6obpgDQGcFmaJgB)

### User Journey Flow
1. **Welcome Screen** (`resume-welcome`) - Armenian-themed introduction with back-to-lobby navigation
2. **Question Cards** (`resume-questions`) - 6 personalized questions with contextual roasting jokes
3. **Recap Page** (`resume-recap`) - Inline answer editing with read-aloud functionality
4. **Result Page** (`resume-result`) - Generated resume with gamification and action buttons

### Database Schema Integration
- **chat_sessions**: Sessions saved with vibe "you-are-hired-ara"
- **messages**: User answers stored as metadata with type 'resume-request'
- **messages**: AI responses stored with type 'resume-response'
- **Persona Tables**: 10+ tables for user behavior analysis and content personalization

### Content Generation Sources
1. **User Answers**: 6 structured career-focused questions
2. **Persona Context**: Mood, emotion, engagement patterns from persona system
3. **Behavioral Analysis**: Professional tone adjustment based on user detection
4. **Cultural Integration**: Armenian-English mix with career-specific humor
5. **Language Rules**: Professional but edgy tone with cultural references

### Visual Design System
- **Background**: Consistent #3a3a3a throughout all screens
- **Neumorphic Cards**: Shadows #323232 (dark) and #484848 (light)
- **Gradient Accents**: Red-blue-orange (from-red-500 via-blue-500 to-orange-500)
- **Typography**: Font Audiowide for headers, gradient text for titles
- **Mobile-First**: Responsive design with mobile navigation optimization

### Interactive Features
- **Gamification**: Professionalism scoring (0-100) with detailed analysis
- **Achievement System**: Career planning badges based on answer quality
- **Progressive Reveal**: Resume content displayed in story chunks
- **Action Buttons**: Copy, download, share, read-aloud with neumorphic styling
- **Session Management**: Full restoration from Recent Chats to result page

### Session Management & Navigation
- **Critical Fix**: Back button from welcome goes to lobby (not restart)
- **Session Restoration**: Users can return to completed resumes via Recent Chats
- **Progress Preservation**: No data loss during navigation
- **Restart Protection**: Confirmation dialog prevents accidental data loss
- **Edit Functionality**: Real-time answer updates in recap page

### Error Handling & UX
- **Styled Error Popups**: Neumorphic design with red accent borders
- **Auto-Dismiss**: 4-second error message timeout
- **Loading States**: Professional animation during resume generation
- **Audio Cleanup**: Memory leak prevention for voice features

### Mobile Responsiveness
- **Design Classes**: mobile-content-padding, lg:flex-row, lg:text-6xl
- **Fixed Positioning**: Back buttons with z-20 for mobile compatibility
- **Responsive Typography**: Scales from mobile to desktop seamlessly

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme preference: Gray backgrounds (#bbbbbb) with neumorphic shadows (#9f9f9f, #d7d7d7).
Main content styling: Red-blue-orange gradients for headers and cards.
Sidebar styling: Dark theme (#2e2e2e background, #272727/#353535 shadows).