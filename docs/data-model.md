# Data Model

`prisma/schema.prisma` is the source of truth. SQLite is used locally; workflow states are scalar strings to keep the schema portable to PostgreSQL.

| Area | Models |
| --- | --- |
| Identity and organization | `User`, `Role`, `BusinessProfile`, `Promoter`, `Location`, `Sector`, `Department` |
| Regulatory catalog | `Approval`, `ApprovalRule`, `ApprovalDependency` |
| Application lifecycle | `Application`, `SubApplication`, `ApplicationStatusHistory`, `Query`, `QueryResponse`, `AuditLog` |
| Documents and verification | `Document`, `DocumentVersion`, `VerificationRecord` |
| Compliance | `Inspection`, `InspectionChecklist`, `InspectionReport`, `Certificate`, `Renewal`, `SLAClock`, `Notification` |
| Benefits and support | `Scheme`, `SchemeEligibilityRule`, `SchemeApplication`, `Grievance`, `GrievanceEscalation` |
| Guidance and chat | `KnowledgeArticle`, `ChatSession`, `ChatMessage` |

Approval, scheme, and article names/descriptions have English, Marathi, and Hindi fields. Catalog content is illustrative. The seed creates four role accounts, 25 approvals, 10 schemes, 15 guides, and 30 applications.