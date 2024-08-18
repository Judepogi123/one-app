/*
  Warnings:

  - Added the required column `zipCode` to the `Municipals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Municipals" ADD COLUMN "zipCode" INTEGER NOT NULL;

