# Armo Hopar - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code needs to be on GitHub for Vercel deployment
3. **PostgreSQL Database**: Set up a production database (Neon, Supabase, or Vercel Postgres)

## Required API Keys

Before deployment, obtain these API keys:

- **GROQ_API_KEY**: Get from [console.groq.com](https://console.groq.com)
- **GEMINI_API_KEY**: Get from [ai.google.dev](https://ai.google.dev)
- **ELEVENLABS_API_KEY**: Get from [elevenlabs.io](https://elevenlabs.io)
- **DATABASE_URL**: PostgreSQL connection string

## Step 1: Push to GitHub

Since Git operations are restricted in Replit, you'll need to manually create a GitHub repository:

1. Create a new repository on GitHub
2. Download your project files from Replit
3. Upload to your GitHub repository

### Files to Include:
```
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Shared schemas
├── package.json
├── vercel.json            # Vercel configuration
├── .env.example           # Environment template
├── .gitignore
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── README.md
```

## Step 2: Database Setup

### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the connection string

### Option B: Neon Database
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string

### Option C: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Get the connection string from Settings > Database

## Step 3: Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository

2. **Configure Environment Variables**:
   In Vercel dashboard, add these environment variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   PGHOST=extracted_from_database_url
   PGPORT=5432
   PGUSER=extracted_from_database_url
   PGPASSWORD=extracted_from_database_url
   PGDATABASE=extracted_from_database_url
   ```

3. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

## Step 4: Initialize Database

After deployment, run database migrations:

1. In Vercel dashboard, go to Functions tab
2. Or use Vercel CLI: `vercel dev` then `npm run db:push`

## Project Structure

### Frontend (Client)
- React 18 with TypeScript
- Vite build system
- Tailwind CSS + Shadcn/ui
- TanStack Query for state management

### Backend (Server)
- Express.js with TypeScript
- Drizzle ORM with PostgreSQL
- ElevenLabs voice synthesis
- Groq AI integration

### Features
- **Gimmi Alibi Ara**: Creative alibi story generation
- **Your Hired Ara**: Professional resume generation
- **Voice Chat**: Real-time voice interactions
- **Persona System**: 18-table behavioral analysis

## Environment Variables Explained

- **DATABASE_URL**: Full PostgreSQL connection string
- **GROQ_API_KEY**: For AI chat responses using meta-llama/llama-4-scout-17b-16e-instruct
- **GEMINI_API_KEY**: For voice transcription (speech-to-text)
- **ELEVENLABS_API_KEY**: For voice synthesis (text-to-speech, Voice ID: pNInz6obpgDQGcFmaJgB)
- **PG*** variables**: Individual PostgreSQL connection components

## Troubleshooting

### Build Errors
- Ensure all dependencies are in package.json
- Check TypeScript errors with `npm run check`
- Verify environment variables are set

### Database Issues
- Confirm DATABASE_URL is correct
- Run `npm run db:push` to sync schema
- Check database permissions

### API Errors
- Verify all API keys are valid
- Check API rate limits
- Monitor Vercel function logs

## Performance Optimization

1. **Database**: Use connection pooling
2. **Images**: Optimize with Vercel Image Optimization
3. **Caching**: Implement Redis for session storage
4. **CDN**: Vercel automatically provides global CDN

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Error Tracking**: Integrate Sentry for error monitoring
- **Database**: Monitor connection usage and query performance

## Custom Domain

1. Go to your Vercel project settings
2. Add your custom domain
3. Configure DNS records as shown
4. SSL certificates are automatic

---

For support, check the [Vercel documentation](https://vercel.com/docs) or create an issue in your GitHub repository.