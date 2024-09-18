-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_genderId_fkey";

-- AlterTable
ALTER TABLE "Quota" ALTER COLUMN "barangaysId" DROP NOT NULL,
ALTER COLUMN "population" DROP NOT NULL,
ALTER COLUMN "sampleSize" DROP NOT NULL,
ALTER COLUMN "genderId" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE SET NULL ON UPDATE CASCADE;
