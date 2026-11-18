# Jenosize CRM

Working AI CRM MVP for the Jenosize lead-engineer assignment.

## Status

Public demo: https://jenosize-ai-crm-azure.vercel.app

Sign in with `max@jenosize.test` and password `Demo-CRM-2026`. Data is in hosted Postgres, so a refresh keeps the pipeline.

Step 6 is in place. `POST /api/line/webhook` checks the LINE signature and stores each text event once. A known LINE user is attached to the open lead. Approve and send uses the mock adapter while `LINE_MODE=mock`, so nothing is delivered to LINE. Copilot suggestions still do not change the stage. A CRM request without a session gets `401`. The webhook is public and rejects a bad signature with `401`.

## Run the app

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a demo account below.

## API

CRM routes require the `crm_session` cookie from `POST /api/auth/login`. `POST /api/line/webhook` is public and requires a valid `X-Line-Signature`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ "email", "password" }` sets the session cookie |
| POST | `/api/auth/logout` | Clears the session cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/leads?q=&stage=&source=` | Search and filter leads |
| POST | `/api/leads` | Create a lead in New |
| GET | `/api/leads/:id` | Lead, profile, messages, and timeline |
| PATCH | `/api/leads/:id` | `{ "stage", "lostReason?" }` |
| POST | `/api/leads/:id/notes` | `{ "body" }` |
| POST | `/api/leads/:id/copilot` | Summary, score, next action, and LINE draft. Does not send or change stage |
| POST | `/api/leads/:id/drafts` | `{ "body" }` saves an unsent LINE draft |
| POST | `/api/leads/:id/messages/:messageId/send` | Approves one draft. Mock mode does not call LINE |
| POST | `/api/line/webhook` | Signed LINE events. Repeating an event id does not create a second message |
| GET | `/api/companies` | Company list |
| POST | `/api/companies` | `{ "name", "industry" }` using one of the six industries |
| GET | `/api/companies/:id` | Company, contacts, and leads |
| GET | `/api/contacts` | Contact list |
| POST | `/api/contacts` | `{ "name", "companyId", "title?", "email?", "phone?" }` |

Errors use `{ "error": { "code", "message" } }`. A Lost stage without a reason returns `lost_reason`. Responses never include password hashes.

## Database

Homebrew formula: `postgresql@16`. Docker is not used on this machine.

```bash
brew services start postgresql@16
psql -d postgres -c "CREATE ROLE crm LOGIN PASSWORD 'crm';"
psql -d postgres -c "CREATE DATABASE jenosize_crm OWNER crm;"
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
```

`DATABASE_URL` is `postgresql://crm:crm@localhost:5432/jenosize_crm`.

Seeded demo logins all use the password `Demo-CRM-2026`:

- `max@jenosize.test` — Nattasate (Max) Trithipcharoenchai, CEO & Founder
- `aoy@jenosize.test` — Pinyapat (Aoy) Trithipcharoenchai, Director
- `tak@jenosize.test` — Kanchaporn (Tak) Kiatnawin, Managing Director, Digital
- `jom@jenosize.test` — Phiboontapp (Jom) Kongkunchad, Asst. Director, Event
- `zam@jenosize.test` — Patipan (Zam) Plangpattanapanich, Business Development Director
- `lisa@jenosize.test` — Lisa Tham, Head of Product Design & Quality

Synthetic seed counts: 8 users, 20 companies, 20 contacts, 10 leads, 8 activities, and 3 messages. Companies are grouped as Retail, Fashion, Government, FMCG, Banking & Insurance, and Real Estate. Leads cover New, Qualified, Proposal, Won, and Lost.

The migration enforces foreign keys, unique emails, unique LINE user ids, unique message idempotency keys, unique channel plus external id, non-negative deal value, and a lost reason when the stage is Lost.

Do not commit `.env`.
