/*
  Warnings:

  - You are about to drop the column `badge` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `component` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `isAffix` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `isCache` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `meta` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `permission` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `redirect` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `menus` table. All the data in the column will be lost.
  - You are about to drop the column `dataScope` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `isSystem` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `assignedAt` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `assignedBy` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `_AbilityToRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MenuToRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `abilities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_templates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AbilityToRole" DROP CONSTRAINT "_AbilityToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_AbilityToRole" DROP CONSTRAINT "_AbilityToRole_B_fkey";

-- DropForeignKey
ALTER TABLE "_MenuToRole" DROP CONSTRAINT "_MenuToRole_A_fkey";

-- DropForeignKey
ALTER TABLE "_MenuToRole" DROP CONSTRAINT "_MenuToRole_B_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_parentId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_departmentId_fkey";

-- DropIndex
DROP INDEX "menus_code_idx";

-- DropIndex
DROP INDEX "menus_code_key";

-- DropIndex
DROP INDEX "menus_isDeleted_idx";

-- DropIndex
DROP INDEX "menus_level_idx";

-- DropIndex
DROP INDEX "roles_isDeleted_idx";

-- DropIndex
DROP INDEX "roles_level_idx";

-- DropIndex
DROP INDEX "roles_type_idx";

-- DropIndex
DROP INDEX "user_roles_expiresAt_idx";

-- DropIndex
DROP INDEX "user_roles_isActive_idx";

-- DropIndex
DROP INDEX "users_departmentId_idx";

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "badge",
DROP COLUMN "code",
DROP COLUMN "component",
DROP COLUMN "deletedAt",
DROP COLUMN "isAffix",
DROP COLUMN "isCache",
DROP COLUMN "isDeleted",
DROP COLUMN "level",
DROP COLUMN "meta",
DROP COLUMN "permission",
DROP COLUMN "redirect",
DROP COLUMN "title",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "dataScope",
DROP COLUMN "deletedAt",
DROP COLUMN "isDefault",
DROP COLUMN "isDeleted",
DROP COLUMN "isSystem",
DROP COLUMN "level",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "user_roles" DROP COLUMN "assignedAt",
DROP COLUMN "assignedBy",
DROP COLUMN "expiresAt",
DROP COLUMN "isActive";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "departmentId";

-- DropTable
DROP TABLE "_AbilityToRole";

-- DropTable
DROP TABLE "_MenuToRole";

-- DropTable
DROP TABLE "abilities";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "departments";

-- DropTable
DROP TABLE "role_templates";

-- DropEnum
DROP TYPE "DataScope";

-- DropEnum
DROP TYPE "MenuType";

-- DropEnum
DROP TYPE "RoleType";

-- CreateTable
CREATE TABLE "role_menus" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_menus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_menus_roleId_idx" ON "role_menus"("roleId");

-- CreateIndex
CREATE INDEX "role_menus_menuId_idx" ON "role_menus"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "role_menus_roleId_menuId_key" ON "role_menus"("roleId", "menuId");

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "role_menus_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menus" ADD CONSTRAINT "role_menus_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
