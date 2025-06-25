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
- **Database**: @neondatabase/serverless for PostgreSQL connection
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
- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`: AI service authentication
- `ELEVENLABS_API_KEY`: Voice service authentication
- `TAVILY_API_KEY`: Search service authentication

## Changelog
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.