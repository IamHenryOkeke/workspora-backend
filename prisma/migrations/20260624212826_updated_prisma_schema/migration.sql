/*
  Warnings:

  - You are about to drop the column `google` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "google",
ADD COLUMN     "googleId" TEXT;
