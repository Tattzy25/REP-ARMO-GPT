# Armo-GPT Replit Project

## Overview

Armo-GPT is a full-stack TypeScript web application featuring an Armenian-themed AI chatbot with multiple personality modes ("vibes"). The application combines a React frontend with an Express.js backend, using PostgreSQL for data persistence and supporting both text and voice interactions.

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

### Planned Integrations
- **AI Services**: GROQ API for chat completions
- **Voice**: ElevenLabs API for text-to-speech
- **Search**: Tavily API for web search capabilities

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
- `SUPABASE_DATABASE_URL`: Supabase PostgreSQL connection string (primary)
- `DATABASE_URL`: Fallback PostgreSQL connection string
- `GROQ_API_KEY`: AI service authentication
- `ELEVENLABS_API_KEY`: Voice service authentication
- `TAVILY_API_KEY`: Search service authentication

## Changelog
- June 25, 2025. Initial setup
- June 25, 2025. Added PostgreSQL database with persistent chat storage
- June 25, 2025. Updated color scheme to gray (#bbbbbb background, #9f9f9f/#d7d7d7 shadows)
- June 25, 2025. Added red-blue-orange gradient to main content headers and cards
- June 25, 2025. Updated sidebar to dark theme (#2e2e2e background, #272727/#353535 shadows)
- June 25, 2025. Removed Armenian flag icon from sidebar header
- June 25, 2025. Added Armo-GPT logo image with soft white glow to sidebar header
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

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme preference: Gray backgrounds (#bbbbbb) with neumorphic shadows (#9f9f9f, #d7d7d7).
Main content styling: Red-blue-orange gradients for headers and cards.
Sidebar styling: Dark theme (#2e2e2e background, #272727/#353535 shadows).