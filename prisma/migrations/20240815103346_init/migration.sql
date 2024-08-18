-- AlterTable
ALTER TABLE "Query" ADD COLUMN     "componentType" TEXT DEFAULT 'regular',
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'regular';

-- AlterTable
ALTER TABLE "Survey" ALTER COLUMN "drafted" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;
