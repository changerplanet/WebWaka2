-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_USER');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantBranding" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "appName" TEXT NOT NULL DEFAULT 'SaaS App',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',

    CONSTRAINT "TenantBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TENANT_USER',
    "tenantId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_customDomain_idx" ON "Tenant"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "TenantBranding_tenantId_key" ON "TenantBranding"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_userId_idx" ON "MagicLink"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "TenantBranding" ADD CONSTRAINT "TenantBranding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
