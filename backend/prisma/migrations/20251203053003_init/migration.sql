/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,voucherNumber]` on the table `Voucher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Voucher_voucherNumber_key` ON `Voucher`;

-- AlterTable
ALTER TABLE `Account` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `LedgerEntry` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `googleId` VARCHAR(191) NULL,
    MODIFY `passwordHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Voucher` ADD COLUMN `title` VARCHAR(191) NULL,
    ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_googleId_key` ON `User`(`googleId`);

-- CreateIndex
CREATE UNIQUE INDEX `Voucher_userId_voucherNumber_key` ON `Voucher`(`userId`, `voucherNumber`);

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Voucher` ADD CONSTRAINT `Voucher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LedgerEntry` ADD CONSTRAINT `LedgerEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
