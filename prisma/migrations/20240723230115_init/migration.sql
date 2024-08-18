/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "Users" (
    "uid" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Voters" (
    "uid" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "purok" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "ageRange" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "precentsId" TEXT NOT NULL,
    "batchYearId" INTEGER NOT NULL,

    CONSTRAINT "Voters_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Municipals" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Municipals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barangays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipalId" INTEGER NOT NULL,

    CONSTRAINT "Barangays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Precents" (
    "id" TEXT NOT NULL,
    "barangayId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,

    CONSTRAINT "Precents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchYear" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "BatchYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewBatchDraft" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "municipalId" INTEGER,
    "barangayId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewBatchDraft_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_precentsId_fkey" FOREIGN KEY ("precentsId") REFERENCES "Precents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_batchYearId_fkey" FOREIGN KEY ("batchYearId") REFERENCES "BatchYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barangays" ADD CONSTRAINT "Barangays_municipalId_fkey" FOREIGN KEY ("municipalId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precents" ADD CONSTRAINT "Precents_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precents" ADD CONSTRAINT "Precents_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewBatchDraft" ADD CONSTRAINT "NewBatchDraft_municipalId_fkey" FOREIGN KEY ("municipalId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewBatchDraft" ADD CONSTRAINT "NewBatchDraft_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
