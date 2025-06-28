#!/bin/bash

# Armo Hopar Project Export Script
# This script helps prepare your project for GitHub/Vercel deployment

echo "🚀 Preparing Armo Hopar for Vercel deployment..."

# Create export directory
mkdir -p ./export-armo-hopar

# Copy essential project files
echo "📁 Copying project files..."

# Frontend
cp -r ./client ./export-armo-hopar/
# Backend  
cp -r ./server ./export-armo-hopar/
# Shared schemas
cp -r ./shared ./export-armo-hopar/

# Configuration files
cp package.json ./export-armo-hopar/
cp package-lock.json ./export-armo-hopar/
cp tsconfig.json ./export-armo-hopar/
cp vite.config.ts ./export-armo-hopar/
cp tailwind.config.ts ./export-armo-hopar/
cp postcss.config.js ./export-armo-hopar/
cp components.json ./export-armo-hopar/
cp drizzle.config.ts ./export-armo-hopar/

# Deployment files
cp vercel.json ./export-armo-hopar/
cp .env.example ./export-armo-hopar/
cp .gitignore ./export-armo-hopar/
cp DEPLOYMENT.md ./export-armo-hopar/
cp replit.md ./export-armo-hopar/README.md

echo "✅ Project exported to ./export-armo-hopar/"
echo ""
echo "📋 Next steps:"
echo "1. Download the ./export-armo-hopar/ folder"
echo "2. Create a new GitHub repository"  
echo "3. Upload files to GitHub"
echo "4. Deploy on Vercel using DEPLOYMENT.md guide"
echo ""
echo "🔑 Required API Keys:"
echo "- GROQ_API_KEY (for AI responses)"
echo "- GEMINI_API_KEY (for voice transcription)"  
echo "- ELEVENLABS_API_KEY (for voice synthesis)"
echo "- DATABASE_URL (PostgreSQL database)"