-- ============================================================================
-- MULTI-TENANT CLINIC SYSTEM + RBAC MIGRATION
-- Version: 1.0
-- Date: October 21, 2025
-- ============================================================================
-- This migration adds:
-- 1. Role enum for RBAC
-- 2. ClinicType enum for multi-tenancy
-- 3. Clinic model
-- 4. User model updates (username, clinic relation)
-- 5. Patient model updates (clinic relation)
-- ============================================================================

-- Step 1: Create Role Enum
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLINIC_DOCTOR', 'HYGIENIST', 'RECEPTIONIST', 'EXTERNAL_DOCTOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create ClinicType Enum
DO $$ BEGIN
  CREATE TYPE "ClinicType" AS ENUM ('INDIVIDUAL_PRACTICE', 'CLINIC', 'MULTI_LOCATION_CLINIC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create Clinic Table
CREATE TABLE IF NOT EXISTS "Clinic" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "clinicCode" TEXT NOT NULL,
  "type" "ClinicType" NOT NULL DEFAULT 'CLINIC',
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "logo" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "ownerName" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  "planType" TEXT NOT NULL DEFAULT 'free',
  "maxUsers" INTEGER NOT NULL DEFAULT 5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create unique constraint and index on Clinic
CREATE UNIQUE INDEX IF NOT EXISTS "Clinic_clinicCode_key" ON "Clinic"("clinicCode");
CREATE INDEX IF NOT EXISTS "Clinic_clinicCode_idx" ON "Clinic"("clinicCode");

-- Step 5: Alter User table - Add new columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleTemp" "Role";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;

-- Step 6: Migrate existing role data
-- Convert old string roles to new enum roles
UPDATE "User" SET "roleTemp" = 'CLINIC_DOCTOR' WHERE "role" = 'user' OR "role" IS NULL;
UPDATE "User" SET "roleTemp" = 'ADMIN' WHERE "role" = 'admin';
UPDATE "User" SET "roleTemp" = 'CLINIC_DOCTOR' WHERE "roleTemp" IS NULL;

-- Step 7: Drop old role column and rename temp
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
ALTER TABLE "User" RENAME COLUMN "roleTemp" TO "role";

-- Step 8: Set constraints on User.role
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLINIC_DOCTOR';

-- Step 9: Create unique constraint and indexes on User
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE INDEX IF NOT EXISTS "User_clinicId_idx" ON "User"("clinicId");
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");

-- Step 10: Add foreign key constraint for User.clinicId
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 11: Alter Patient table - Add clinic relation and external flag
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "createdByExternal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "clinicId" TEXT;

-- Step 12: Create index on Patient
CREATE INDEX IF NOT EXISTS "Patient_createdByExternal_idx" ON "Patient"("createdByExternal");
CREATE INDEX IF NOT EXISTS "Patient_clinicId_idx" ON "Patient"("clinicId");

-- Step 13: Add foreign key constraint for Patient.clinicId
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_clinicId_fkey" 
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Verify migration: SELECT * FROM "Clinic" LIMIT 1;
-- 2. Check users: SELECT email, role, "isExternal", "clinicId" FROM "User";
-- 3. Test the application
-- ============================================================================

