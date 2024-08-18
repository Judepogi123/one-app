/*
  Warnings:

  - You are about to drop the `Query` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_queryId_fkey";

-- DropForeignKey
ALTER TABLE "Query" DROP CONSTRAINT "Query_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_queryId_fkey";

-- DropTable
DROP TABLE "Query";

-- CreateTable
CREATE TABLE "Queries" (
    "id" TEXT NOT NULL,
    "queries" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "type" TEXT DEFAULT 'regular',
    "componentType" TEXT DEFAULT 'regular',

    CONSTRAINT "Queries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Queries" ADD CONSTRAINT "Queries_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Queries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Queries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
