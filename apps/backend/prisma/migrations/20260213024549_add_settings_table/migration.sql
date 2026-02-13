-- AlterTable
ALTER TABLE "vps_instances" ALTER COLUMN "suspension_reason" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);
