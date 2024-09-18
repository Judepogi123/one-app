-- AlterTable
ALTER TABLE "Queries" ADD COLUMN     "order" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "QueryAnswer" (
    "id" TEXT NOT NULL,
    "queriesId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,

    CONSTRAINT "QueryAnswer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_queriesId_fkey" FOREIGN KEY ("queriesId") REFERENCES "Queries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
