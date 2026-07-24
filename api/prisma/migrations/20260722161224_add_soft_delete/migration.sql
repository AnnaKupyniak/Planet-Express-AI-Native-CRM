-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CrewMember" ADD COLUMN     "fire_reason" TEXT,
ADD COLUMN     "is_fired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Planet" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;
