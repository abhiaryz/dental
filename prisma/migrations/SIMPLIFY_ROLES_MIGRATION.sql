-- ============================================================================
-- SIMPLIFY ROLES MIGRATION
-- Version: 2.0
-- Date: 2025
-- ============================================================================
-- This migration simplifies the Role enum from 5 roles to 2 roles:
-- - Removes: CLINIC_DOCTOR, HYGIENIST, RECEPTIONIST, EXTERNAL_DOCTOR
-- - Keeps: ADMIN, USER
-- ============================================================================

-- Step 1: Update existing users to USER role (except admins)
UPDATE "User" 
SET "role" = 'USER' 
WHERE "role" IN ('CLINIC_DOCTOR', 'HYGIENIST', 'RECEPTIONIST', 'EXTERNAL_DOCTOR');

-- Step 2: Drop the old enum and create new one
-- Note: PostgreSQL doesn't support ALTER TYPE to remove values directly
-- We need to create a new type and migrate

-- Create new Role enum type
DO $$ BEGIN
  CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Alter User table to use new enum
ALTER TABLE "User" 
  ALTER COLUMN "role" TYPE "Role_new" 
  USING CASE 
    WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role_new"
    ELSE 'USER'::"Role_new"
  END;

-- Step 4: Drop old enum and rename new one
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 5: Update default value
ALTER TABLE "User" 
  ALTER COLUMN "role" SET DEFAULT 'USER';

-- Step 6: Update Invitation table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Invitation') THEN
    ALTER TABLE "Invitation" 
      ALTER COLUMN "role" TYPE "Role" 
      USING CASE 
        WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"Role"
        ELSE 'USER'::"Role"
      END;
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
