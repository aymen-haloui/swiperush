#!/bin/sh

# Exit on error
set -e

echo "🚀 Starting ChallengeQuest Backend..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ ERROR: JWT_SECRET is not set"
  exit 1
fi

echo "✅ Environment variables check passed"

# Generate Prisma client if needed
echo "📦 Generating Prisma client..."
npx prisma generate || echo "⚠️  Warning: Prisma generate failed, continuing..."

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy || echo "⚠️  Warning: Migrations failed, continuing..."

# Start the application
echo "🎯 Starting application on port ${PORT:-5000}..."
exec node dist/index.js

