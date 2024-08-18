/*
  Warnings:

  - The primary key for the `Purok` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "HouseHold" DROP CONSTRAINT "HouseHold_purokId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_purokId_fkey";

-- AlterTable
ALTER TABLE "HouseHold" ALTER COLUMN "purokId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Purok" DROP CONSTRAINT "Purok_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Purok_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Purok_id_seq";

-- AlterTable
ALTER TABLE "Voters" ALTER COLUMN "purokId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
