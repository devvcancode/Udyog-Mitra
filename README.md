# Udyog Mitra

Udyog Mitra is a multilingual prototype of a Maharashtra single-window portal for industrial approvals, applications, compliance, and incentives. This is a demonstration project; approvals, fees, timelines, schemes, and records are illustrative. It is not an official government website.

## Run locally

Requirements: Node.js 20 or newer and npm. From the repository root:

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/en`; Marathi and Hindi are at `/mr` and `/hi`. Replace the example `NEXTAUTH_SECRET` before any shared deployment. Development scripts use a private SWC native-binding cache for Codespaces.

## Demo accounts

Use password `demo123` with the relevant account:

| Role | Demo email |
| --- | --- |
| Applicant | `applicant@udyogmitra.demo` |
| Applicant (components) | `foundry@udyogmitra.demo` |
| Applicant (textiles) | `textiles@udyogmitra.demo` |
| Department Officer (MPCB) | `officer@udyogmitra.demo` |
| Nodal Officer | `nodal@udyogmitra.demo` |
| Administrator | `admin@udyogmitra.demo` |

## Five-minute demo

1. Start at `/en`, then switch to Marathi and Hindi to see the localized portal and home content.
2. Open **Know Your Approvals**, choose activity, pollution category, project size and utilities, then generate the illustrative stage-grouped checklist.
3. Start the common application, review the pre-validation fields, and submit after adding a sample document.
4. Sign in as the MPCB officer, open the officer dashboard, search for an application, then approve it or raise a consolidated query. The applicant dashboard shows the changed demo status.
5. Explore Incentives, Knowledge Centre, Inspections, Grievance, and Udyam Saathi. Ask about Fire NOC or a sample timeline; the assistant cites a guide and identifies demo data.

## Checks

```bash
npm test
npm run typecheck
npm run build
npm run --silent eval:training-jsonl > /tmp/udyog-mitra-l1.jsonl
```

## Prototype status

The catalog and seeded records are illustrative. Interactive page actions are persisted in the browser for the demo; authenticated REST application records use SQLite. Do not enter real personal or business information. Identity verification, OCR, DigiLocker, government source checks, WhatsApp messaging, payment, and official approval rules require provider onboarding and configuration before production use. Phase A consent/audit/review stores are in-memory. Without `GEMINI_API_KEY` and explicit per-user consent, Saathi uses local rule-based language; L2 facts remain the only source of figures. The WhatsApp guide works without keys and reports mock mode until configured. The hero uses the image URL supplied with the project request; confirm image licensing before publishing.