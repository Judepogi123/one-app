-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "onExit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Queries" ALTER COLUMN "type" SET DEFAULT 'single';
