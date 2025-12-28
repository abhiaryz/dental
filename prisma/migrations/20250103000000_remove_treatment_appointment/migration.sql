-- AlterTable
ALTER TABLE "ClinicalImage" DROP CONSTRAINT IF EXISTS "ClinicalImage_treatmentId_fkey";
ALTER TABLE "ClinicalImage" DROP COLUMN IF EXISTS "treatmentId";

-- DropIndex
DROP INDEX IF EXISTS "ClinicalImage_treatmentId_idx";

-- DropTable
DROP TABLE IF EXISTS "Treatment" CASCADE;

-- DropTable
DROP TABLE IF EXISTS "Appointment" CASCADE;
