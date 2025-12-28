-- AlterTable: Remove clinicId from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "clinicId";
DROP INDEX IF EXISTS "User_clinicId_idx";

-- AlterTable: Remove clinicId from Patient
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "clinicId";
DROP INDEX IF EXISTS "Patient_clinicId_idx";

-- DropTable: Remove Clinic table
DROP TABLE IF EXISTS "Clinic" CASCADE;

-- DropEnum: Remove ClinicType enum
DROP TYPE IF EXISTS "ClinicType";
