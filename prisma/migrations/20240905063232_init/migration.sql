/*
  Warnings:

  - Added the required column `surveyor` to the `Quota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quota" ADD COLUMN     "surveyor" INTEGER NOT NULL;
