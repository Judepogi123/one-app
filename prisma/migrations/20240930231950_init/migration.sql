-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "accessLevel" TEXT DEFAULT 'regular',
ADD COLUMN     "areaAccess" INTEGER[],
ADD COLUMN     "expire" TEXT DEFAULT 'none',
ADD COLUMN     "platform" TEXT DEFAULT 'portal';

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "inlcuded" BOOLEAN DEFAULT false,
ALTER COLUMN "onTop" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Queries" ADD COLUMN     "access" TEXT DEFAULT 'regular',
ADD COLUMN     "responseType" TEXT DEFAULT 'multiple',
ADD COLUMN     "selectionType" TEXT DEFAULT 'select';
