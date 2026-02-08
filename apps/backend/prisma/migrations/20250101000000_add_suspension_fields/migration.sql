-- AlterTable
ALTER TABLE "vps_instances" ADD COLUMN "suspended_at" TIMESTAMP(3),
ADD COLUMN "suspension_reason" VARCHAR(255);
