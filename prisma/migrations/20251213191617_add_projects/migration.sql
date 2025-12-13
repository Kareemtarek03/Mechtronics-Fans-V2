-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProjectMotorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectMotorAction" AS ENUM ('ADD', 'DELETE');

-- CreateEnum
CREATE TYPE "ProjectPermissionRole" AS ENUM ('OWNER', 'COLLABORATOR', 'VIEWER');

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "creatorId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_motors" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "fanId" INTEGER NOT NULL,
    "motorId" INTEGER NOT NULL,
    "action" "ProjectMotorAction" NOT NULL,
    "status" "ProjectMotorStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "requestedById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "project_motors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_user_permissions" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "ProjectPermissionRole" NOT NULL,
    "canEditMeta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "project_user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_creatorId_name_key" ON "projects"("creatorId", "name");

-- CreateIndex
CREATE INDEX "project_motors_projectId_idx" ON "project_motors"("projectId");

-- CreateIndex
CREATE INDEX "project_motors_status_idx" ON "project_motors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "project_user_permissions_projectId_userId_key" ON "project_user_permissions"("projectId", "userId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_motors" ADD CONSTRAINT "project_motors_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_motors" ADD CONSTRAINT "project_motors_fanId_fkey" FOREIGN KEY ("fanId") REFERENCES "fan_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_motors" ADD CONSTRAINT "project_motors_motorId_fkey" FOREIGN KEY ("motorId") REFERENCES "motor_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_motors" ADD CONSTRAINT "project_motors_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_motors" ADD CONSTRAINT "project_motors_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_user_permissions" ADD CONSTRAINT "project_user_permissions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_user_permissions" ADD CONSTRAINT "project_user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
