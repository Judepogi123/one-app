/*
  Warnings:

  - Added the required column `precintNumber` to the `Precents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Precents" ADD COLUMN     "precintNumber" TEXT NOT NULL;
