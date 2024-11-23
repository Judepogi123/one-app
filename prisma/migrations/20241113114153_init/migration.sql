-- CreateTable
CREATE TABLE "Validation" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "percent" DOUBLE PRECISION NOT NULL,
    "totalVoters" INTEGER NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,

    CONSTRAINT "Validation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Validation" ADD CONSTRAINT "Validation_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;
