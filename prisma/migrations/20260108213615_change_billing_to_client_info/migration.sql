/*
  Warnings:

  - You are about to drop the column `amount` on the `Billing` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Billing` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Billing` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Billing` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Billing` table. All the data in the column will be lost.
  - Added the required column `company` to the `Billing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `Billing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Billing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vatNumber` to the `Billing` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Billing` DROP COLUMN `amount`,
    DROP COLUMN `category`,
    DROP COLUMN `description`,
    DROP COLUMN `dueDate`,
    DROP COLUMN `status`,
    ADD COLUMN `company` VARCHAR(191) NOT NULL,
    ADD COLUMN `email` VARCHAR(191) NOT NULL,
    ADD COLUMN `fullName` VARCHAR(191) NOT NULL,
    ADD COLUMN `vatNumber` VARCHAR(191) NOT NULL;
