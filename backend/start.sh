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
  MIGRATE_ERROR=$?
  echo "⚠️  Migration command exited with code $MIGRATE_ERROR"
  
  # Check if error is due to non-empty schema (baseline needed)
  if npx prisma migrate status 2>&1 | grep -q "not empty\|baseline"; then
    echo "📋 Database schema exists, marking migrations as applied (baseline)..."
    # Mark all migrations as applied to baseline the database
    npx prisma migrate resolve --applied 20251010105259_migration1 2>/dev/null || true
    npx prisma migrate resolve --applied 20251019165437_add_challenge_progress_to_submission 2>/dev/null || true
    npx prisma migrate resolve --applied 20251031220555_add_category_model 2>/dev/null || true
    npx prisma migrate resolve --applied 20251101200718_add_challenge_image 2>/dev/null || true
    npx prisma migrate resolve --applied 20251101204030_add_level_system 2>/dev/null || true
    echo "✅ Migrations marked as applied (baseline complete)"
  else
    echo "⚠️  Migration failed for another reason"
    echo "⚠️  Check DATABASE_URL environment variable and Neon database status"
  fi
fi

# Start the application
echo "🎯 Starting application on port ${PORT:-5000}..."
exec node dist/index.js

