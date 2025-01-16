-- CreateTable
CREATE TABLE "DelistedVoter" (
    "id" TEXT NOT NULL,
    "votersId" TEXT,
    "timstamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "delistedVoterValidatedId" TEXT,

    CONSTRAINT "DelistedVoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelistedVoterValidated" (
    "id" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,
    "timstamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DelistedVoterValidated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UntrackedVoter" (
    "id" TEXT NOT NULL,
    "note" TEXT,
    "votersId" TEXT,
    "timstamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,
    "usersUid" TEXT,
    "barangaysId" TEXT,
    "municipalsId" INTEGER,

    CONSTRAINT "UntrackedVoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointments" (
    "id" TEXT NOT NULL,
    "appointment" TEXT,
    "activity" INTEGER DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "usersUid" TEXT,
    "purokId" TEXT,
    "data" TEXT,
    "votersId" TEXT,

    CONSTRAINT "Appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationTimeInput" (
    "id" TEXT NOT NULL,
    "minutes" INTEGER,
    "name" TEXT,
    "action" INTEGER,
    "usersUid" TEXT,
    "teamId" TEXT,
    "barangaysId" TEXT,
    "municipalsId" INTEGER,

    CONSTRAINT "ValidationTimeInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationNotes" (
    "id" TEXT NOT NULL,
    "action" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "desc" TEXT,
    "contact" TEXT,
    "usersUid" TEXT,

    CONSTRAINT "ValidationNotes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DelistedVoter" ADD CONSTRAINT "DelistedVoter_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelistedVoter" ADD CONSTRAINT "DelistedVoter_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelistedVoter" ADD CONSTRAINT "DelistedVoter_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelistedVoter" ADD CONSTRAINT "DelistedVoter_delistedVoterValidatedId_fkey" FOREIGN KEY ("delistedVoterValidatedId") REFERENCES "DelistedVoterValidated"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelistedVoterValidated" ADD CONSTRAINT "DelistedVoterValidated_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UntrackedVoter" ADD CONSTRAINT "UntrackedVoter_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UntrackedVoter" ADD CONSTRAINT "UntrackedVoter_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UntrackedVoter" ADD CONSTRAINT "UntrackedVoter_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UntrackedVoter" ADD CONSTRAINT "UntrackedVoter_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UntrackedVoter" ADD CONSTRAINT "UntrackedVoter_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointments" ADD CONSTRAINT "Appointments_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationTimeInput" ADD CONSTRAINT "ValidationTimeInput_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationTimeInput" ADD CONSTRAINT "ValidationTimeInput_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationTimeInput" ADD CONSTRAINT "ValidationTimeInput_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationTimeInput" ADD CONSTRAINT "ValidationTimeInput_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationNotes" ADD CONSTRAINT "ValidationNotes_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
