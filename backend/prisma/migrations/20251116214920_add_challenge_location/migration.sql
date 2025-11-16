-- AlterTable
-- Add latitude and longitude columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'latitude') THEN
        ALTER TABLE "challenges" ADD COLUMN "latitude" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'longitude') THEN
        ALTER TABLE "challenges" ADD COLUMN "longitude" DOUBLE PRECISION;
    END IF;
END $$;
