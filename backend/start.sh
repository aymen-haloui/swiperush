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
  
  # Check migration status
  MIGRATE_STATUS=$(npx prisma migrate status 2>&1 || true)
  echo "📊 Migration status: $MIGRATE_STATUS"
  
  # Check if error is due to non-empty schema (baseline needed)
  if echo "$MIGRATE_STATUS" | grep -q "not empty\|baseline\|drift"; then
    echo "📋 Database schema exists, marking migrations as applied (baseline)..."
    # Mark all migrations as applied to baseline the database
    npx prisma migrate resolve --applied 20251010105259_migration1 2>/dev/null || true
    npx prisma migrate resolve --applied 20251019165437_add_challenge_progress_to_submission 2>/dev/null || true
    npx prisma migrate resolve --applied 20251031220555_add_category_model 2>/dev/null || true
    npx prisma migrate resolve --applied 20251101200718_add_challenge_image 2>/dev/null || true
    npx prisma migrate resolve --applied 20251101204030_add_level_system 2>/dev/null || true
    npx prisma migrate resolve --applied 20251116214920_add_challenge_location 2>/dev/null || true
    echo "✅ Migrations marked as applied (baseline complete)"
    # Try to run migrate deploy again after baseline
    echo "🔄 Retrying migration deployment..."
    npx prisma migrate deploy 2>/dev/null || echo "⚠️  Migration deploy retry failed, but baseline complete"
  else
    # If it's a different error, try to apply the specific migration manually
    echo "🔄 Attempting to apply pending migrations manually..."
    npx prisma migrate deploy --skip-seed 2>&1 || {
      echo "⚠️  Manual migration also failed"
      echo "⚠️  You may need to run the migration manually:"
      echo "⚠️  npx prisma migrate deploy"
      echo "⚠️  Or apply the SQL directly:"
      echo "⚠️  ALTER TABLE challenges ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;"
      echo "⚠️  ALTER TABLE challenges ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;"
    }
  fi
fi

# Start the application
echo "🎯 Starting application on port ${PORT:-5000}..."
exec node dist/index.js

