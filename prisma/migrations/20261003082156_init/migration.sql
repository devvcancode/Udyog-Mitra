-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "departmentId" TEXT,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "pan" TEXT,
    "gstin" TEXT,
    "activity" TEXT NOT NULL,
    "investmentLakhs" REAL NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "sectorId" TEXT,
    "locationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessProfile_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BusinessProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promoter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "category" TEXT,
    CONSTRAINT "Promoter_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "district" TEXT NOT NULL,
    "taluka" TEXT,
    "industrialArea" TEXT,
    "areaType" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nicCode" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "pollutionCategory" TEXT NOT NULL DEFAULT 'Green'
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionMr" TEXT NOT NULL,
    "descriptionHi" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "slaDays" INTEGER NOT NULL,
    "fee" REAL NOT NULL DEFAULT 0,
    "riskCategory" TEXT NOT NULL DEFAULT 'Low',
    "renewalMonths" INTEGER,
    "deemedEligible" BOOLEAN NOT NULL DEFAULT false,
    "illustrative" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT NOT NULL,
    CONSTRAINT "Approval_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalId" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "ApprovalRule_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approvalId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    CONSTRAINT "ApprovalDependency_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Approval" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "projectName" TEXT NOT NULL,
    "projectStage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    CONSTRAINT "Application_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "BusinessProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "officerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "dueAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SubApplication_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubApplication_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubApplication_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "subApplicationId" TEXT,
    "actorId" TEXT,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApplicationStatusHistory_subApplicationId_fkey" FOREIGN KEY ("subApplicationId") REFERENCES "SubApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ApplicationStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Query" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "subApplicationId" TEXT,
    "officerId" TEXT,
    "title" TEXT NOT NULL,
    "deficiencies" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Query_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Query_subApplicationId_fkey" FOREIGN KEY ("subApplicationId") REFERENCES "SubApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Query_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QueryResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queryId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QueryResponse_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT,
    "ownerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending verification',
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationRecord_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "officerId" TEXT,
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Proposed',
    CONSTRAINT "Inspection_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inspection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inspection_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionChecklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    CONSTRAINT "InspectionChecklist_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inspectionId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InspectionReport_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "Inspection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "approvalName" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "Certificate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Renewal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    CONSTRAINT "Renewal_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SLAClock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subApplicationId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" DATETIME,
    "pausedDays" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'On time',
    CONSTRAINT "SLAClock_subApplicationId_fkey" FOREIGN KEY ("subApplicationId") REFERENCES "SubApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameEn" TEXT NOT NULL,
    "nameMr" TEXT NOT NULL,
    "nameHi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionMr" TEXT NOT NULL,
    "descriptionHi" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "illustrative" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "SchemeEligibilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schemeId" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    CONSTRAINT "SchemeEligibilityRule_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchemeApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schemeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchemeApplication_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "departmentId" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Grievance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Grievance_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Grievance_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrievanceEscalation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "grievanceId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "escalatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "GrievanceEscalation_grievanceId_fkey" FOREIGN KEY ("grievanceId") REFERENCES "Grievance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleMr" TEXT NOT NULL,
    "titleHi" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentMr" TEXT NOT NULL,
    "contentHi" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "illustrative" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "feedback" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_nicCode_key" ON "Sector"("nicCode");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalDependency_approvalId_dependsOnId_key" ON "ApprovalDependency"("approvalId", "dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "SubApplication_applicationId_approvalId_key" ON "SubApplication"("applicationId", "approvalId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "InspectionReport_inspectionId_key" ON "InspectionReport"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SLAClock_subApplicationId_key" ON "SLAClock"("subApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");
