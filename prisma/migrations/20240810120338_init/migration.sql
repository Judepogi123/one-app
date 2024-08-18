/*
  Warnings:

  - You are about to drop the column `year` on the `Voters` table. All the data in the column will be lost.
  - Added the required column `birthYear` to the `Voters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Voters" DROP COLUMN "year",
ADD COLUMN     "birthYear" TEXT NOT NULL;
