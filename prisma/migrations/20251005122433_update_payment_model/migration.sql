/*
  Warnings:

  - You are about to drop the column `providerPaymentId` on the `payments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."payments_providerPaymentId_idx";

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "providerPaymentId",
ADD COLUMN     "providerTransactionId" TEXT;

-- CreateIndex
CREATE INDEX "payments_providerTransactionId_idx" ON "public"."payments"("providerTransactionId");
