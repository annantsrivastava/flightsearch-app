#!/bin/bash

# FlightFinder Quick Deployment Script
# This script helps you deploy your app quickly

echo "🚀 FlightFinder Deployment Helper"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node -v)"
echo ""

# Ask user which deployment method they want
echo "Choose your deployment method:"
echo "1) Vercel (Recommended - Easiest)"
echo "2) Netlify"
echo "3) Build only (manual deployment)"
echo "4) Test locally first"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "📦 Installing dependencies..."
        npm install
        
        echo ""
        echo "🔧 Installing Vercel CLI..."
        npm install -g vercel
        
        echo ""
        echo "🚀 Deploying to Vercel..."
        echo "Follow the prompts to login and deploy!"
        vercel
        ;;
    2)
        echo ""
        echo "📦 Installing dependencies..."
        npm install
        
        echo ""
        echo "🔧 Building application..."
        npm run build
        
        echo ""
        echo "🔧 Installing Netlify CLI..."
        npm install -g netlify-cli
        
        echo ""
        echo "🚀 Deploying to Netlify..."
        netlify deploy --prod
        ;;
    3)
        echo ""
        echo "📦 Installing dependencies..."
        npm install
        
        echo ""
        echo "🔧 Building application..."
        npm run build
        
        echo ""
        echo "✅ Build complete! Your files are in the 'dist' folder."
        echo "Upload the 'dist' folder to your hosting provider."
        ;;
    4)
        echo ""
        echo "📦 Installing dependencies..."
        npm install
        
        echo ""
        echo "🚀 Starting local development server..."
        echo "Visit http://localhost:3000 in your browser"
        npm run dev
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
