/*
  Warnings:

  - Added the required column `purokId` to the `PurokCoor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purokId` to the `TeamLeader` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurokCoor" ADD COLUMN     "purokId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamLeader" ADD COLUMN     "handle" INTEGER DEFAULT 0,
ADD COLUMN     "purokId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
