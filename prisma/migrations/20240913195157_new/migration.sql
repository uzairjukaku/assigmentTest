/*
  Warnings:

  - A unique constraint covering the columns `[registrationId]` on the table `ClassSchedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `registrationId` to the `ClassSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClassSchedule" ADD COLUMN     "registrationId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_registrationId_key" ON "ClassSchedule"("registrationId");
