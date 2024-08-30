-- AlterTable
ALTER TABLE "Queries" ADD COLUMN     "default" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DefaultQuery" (
    "id" TEXT NOT NULL,
    "queriesId" TEXT NOT NULL,

    CONSTRAINT "DefaultQuery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DefaultQuery" ADD CONSTRAINT "DefaultQuery_queriesId_fkey" FOREIGN KEY ("queriesId") REFERENCES "Queries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
