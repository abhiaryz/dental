#!/bin/bash

# Super Admin Creation Script
echo "🚀 Running Super Admin Setup..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules not found. Please run 'npm install' first."
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please create it with DATABASE_URL."
    exit 1
fi

# Run the TypeScript seed script
npx tsx scripts/seed-super-admin.ts

echo ""
echo "✨ Done!"

