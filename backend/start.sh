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
if npx prisma migrate deploy; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Warning: Migrations failed, continuing..."
  echo "⚠️  This might indicate a database connection issue with Neon"
  echo "⚠️  Check DATABASE_URL environment variable"
fi

# Test database connection
echo "🔍 Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Database connection test passed"
else
  echo "⚠️  Database connection test failed"
  echo "⚠️  Check Neon database status and DATABASE_URL"
fi

# Start the application
echo "🎯 Starting application on port ${PORT:-5000}..."
exec node dist/index.js

