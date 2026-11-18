# Jenosize CRM

Internal AI CRM MVP for a 20-person commercial team. The scenario is about 2,000 contacts and 300 active leads arriving from the website, manual entry, and LINE OA. This slice uses synthetic data at a demo scale: a salesperson can see the lead profile and timeline, move New → Qualified → Proposal → Won or Lost, ask for a summary, score, and next action, and approve a LINE reply without losing the audit trail.

The copilot and LINE stay available when the model or the LINE API is down. Suggestions are stored separately from confirmed writes and from messages that were actually sent.

## Submission

| Item | Where |
| --- | --- |
| Deployed demo | https://jenosize-ai-crm-azure.vercel.app |
| Source repository | https://github.com/montakarnP/jenosize-ai-crm |
| Demo login | `admin@jenosize.test` / `Demo-CRM-2026` |
| LINE test | [LINE OA test](#line-oa-test) |
| Walkthrough video | Record 3–5 minutes from the deployed site. Shot list is below. |
| Secrets | Channel tokens, `SESSION_SECRET`, and `DATABASE_URL` are in the host environment and the gitignored `.env`. `.env.example` has empty placeholders. |

The hosted database is Neon Postgres. A refresh or a new deploy keeps the pipeline. The app does not keep CRM records in memory.

The login page shows the admin account. The same password works for every seeded user. Sales users can use the CRM. Only an admin can disconnect a LINE account.

## Part 1 — Working AI CRM product (50%)

Objectives: Result Oriented and Ownership.

| Requirement | How to see it |
| --- | --- |
| Responsive site and login | The pipeline, lead list, and lead page work on a phone-width screen and on a desktop. A page without a session returns to `/login`. `POST /api/auth/login` sets the `crm_session` cookie. |
| Leads, companies, and contacts | Create and view each record. Companies use one of six industries: Retail, Fashion, Government, FMCG, Banking & Insurance, and Real Estate. |
| Pipeline stages | New, Qualified, Proposal, Won, Lost. Lost requires a reason. The stage change is stored as an activity. |
| Search and filter | Text, stage, and source (Website, Manual, LINE) on the pipeline and on Leads. |
| Lead detail | Profile, owner, value, notes, stage history, copilot suggestions, and the LINE conversation on one timeline. |
| API and relational database | Users, Companies, Contacts, Leads, Activities, and Messages in PostgreSQL. Routes are listed under API notes. |
| Schema, migrations, seed, validation, constraints | `prisma/schema.prisma`, `prisma/migrations`, and `prisma/seed.ts`. Checks include email shape, non-negative deal value, title and name length, a non-blank activity or message body, and a lost reason when the stage is Lost. The API returns `lost_reason` with HTTP 400 when that reason is missing. |
| Deployed demo that survives refresh | https://jenosize-ai-crm-azure.vercel.app reads and writes hosted Postgres. |

Synthetic seed: 9 users, 20 companies, 20 contacts, 10 leads, 8 activities, and 3 messages. The hosted database also keeps LINE events from the test phone. Those events are not part of the seed file.

Walkthrough lead: **Trade promotion workflow** (`lead_foods_line`), company Oishi, contact Oishi Contact, mock LINE id `LK-OISHI`, stage Qualified, value 240,000 THB, source LINE.

## Part 2 — AI CRM skill and LINE OA (30%)

Objectives: Growth & Agile, Think Like an Entrepreneur, and Spot Opportunities.

### Skill

`skills/crm-copilot/SKILL.md` defines the purpose, inputs, outputs, allowed actions, guardrails, failure behavior, and six evaluation cases. The runtime is `src/lib/copilot.ts`.

Ask copilot reads one lead and returns:

- a summary from that lead only
- a qualification score from 0 to 100
- 2–4 reasons
- one next action
- a draft LINE reply

The suggestion is saved as an `AI_SUGGESTION` with `confirmedWrite: false` and `outbound: false`. It does not change the stage and it does not send LINE. Saving a draft and approving a send are later actions, each with its own button and its own database write.

With no `OPENAI_API_KEY`, or when the model response fails the output rules, the deterministic fallback still returns a score. The five seeded fallback scores are 36, 72, 88, 96, and 14. The chat language controls the draft only. The summary, reasons, and next action stay in English.

### LINE Official Account

| Requirement | Behavior |
| --- | --- |
| Signature | `POST /api/line/webhook` checks `X-Line-Signature` with HMAC-SHA256 over the raw body. A missing secret returns 503. A bad signature returns 401 and is logged. |
| Inbound capture | Text events are stored. The same `webhookEventId` is stored once. The idempotency key is `line-event:{webhookEventId}`. |
| Map a user to a contact and lead | Every contact has a mock id such as `LK-OISHI`. The phone sends `I am LK-OISHI`. Later messages from that phone are stored on that contact’s open lead. |
| Already connected | The reply is exactly `It's cannot connect because it's connected with other account.` An admin disconnects the account on Contacts. |
| Approval-based send | Approve and send is the only path that can mark a draft `SENT`. It pushes to the connected LINE user. |
| Retry and idempotency | A 429, 5xx, or network failure is retried once. A repeated webhook does not insert a second message. The send key is `send:{messageId}`. |
| Mock adapter | `LINE_MODE=mock` records the send locally and does not call `api.line.me`. `.env.example` uses mock. The hosted demo uses `LINE_MODE=live`. |
| No secrets in git | `LINE_CHANNEL_SECRET` and `LINE_CHANNEL_ACCESS_TOKEN` are environment variables only. |

The immediate reply to `I am …` tries the reply token once. If LINE rejects that token, the same text is pushed. An approved draft always pushes, because a reply token can be used once and expires quickly.

## Part 3 — Handover (20%)

Objectives: Win Together and Leave Legacy.

### Setup and run

Requirements: Node.js 20+, PostgreSQL 16. This machine uses Homebrew `postgresql@16`. Docker is not required.

```bash
brew services start postgresql@16
psql -d postgres -c "CREATE ROLE crm LOGIN PASSWORD 'crm';"
psql -d postgres -c "CREATE DATABASE jenosize_crm OWNER crm;"
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000. `DATABASE_URL` is `postgresql://crm:crm@localhost:5432/jenosize_crm`.

```bash
npm test
```

Seeded accounts, all with password `Demo-CRM-2026`:

- `max@jenosize.test` — Nattasate (Max) Trithipcharoenchai, CEO & Founder
- `aoy@jenosize.test` — Pinyapat (Aoy) Trithipcharoenchai, Director
- `tak@jenosize.test` — Kanchaporn (Tak) Kiatnawin, Managing Director, Digital
- `jom@jenosize.test` — Phiboontapp (Jom) Kongkunchad, Asst. Director, Event
- `zam@jenosize.test` — Patipan (Zam) Plangpattanapanich, Business Development Director
- `lisa@jenosize.test` — Lisa Tham, Head of Product Design & Quality
- `jenosize.sales@jenosize.test` — Jenosize Sales
- `jenosize.admin@jenosize.test` — Jenosize Admin
- `admin@jenosize.test` — Admin

Do not commit `.env`. Do not run `npm run db:reset` against the hosted database.

### Deploy

The Vercel project is `jenosize-ai-crm`. `vercel.json` runs `prisma migrate deploy`, `prisma generate`, and `next build`. Seed is not part of the build.

Set these in the Vercel environment, then redeploy:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `SESSION_SECRET`
- `LINE_MODE` (`live` on the hosted demo, `mock` in `.env.example`)
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

Leave `OPENAI_API_KEY` empty to keep the fallback. Do not put those values in git.

### Architecture and data flow

```mermaid
flowchart LR
  salesperson[Salesperson]
  lineApp[LINE app]
  nextApp[Next.js app]
  postgres[(Postgres)]
  copilot[Copilot skill]
  lineApi[LINE API]

  salesperson --> nextApp
  nextApp --> postgres
  nextApp --> copilot
  copilot --> postgres
  lineApp --> nextApp
  nextApp --> lineApi
```

The browser signs in and reads the pipeline from Postgres. Ask copilot reads one lead and writes only an `AI_SUGGESTION`. Save draft writes a `DRAFT` message. Approve and send is the only step that calls LINE, and only when `LINE_MODE=live`. It pushes to the connected LINE user. A reply token is used only for the immediate reply to `I am …`, and a rejected reply is pushed instead. LINE posts inbound text to `/api/line/webhook`. The handler checks the signature, stores the event once, and attaches it when the phone is already connected or when the text claims a free mock LINE id.

An open CRM polls `GET /api/inbox/revision` about every two seconds and refreshes when a message or a connection changes. Opening a lead marks its inbound LINE messages seen, and a New flag stays on that visit so the salesperson can see which message just arrived.

### API notes

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
| POST | `/api/leads/:id/copilot` | `{ "chatLanguage"? : "en" or "th" }`. Summary, score, next action, and LINE draft. Does not send or change stage |
| POST | `/api/leads/:id/drafts` | `{ "body", "chatLanguage"? }` saves an unsent LINE draft |
| POST | `/api/leads/:id/messages/:messageId/send` | Approves one draft. Mock mode does not call LINE. Live mode pushes to the connected user |
| POST | `/api/leads/:id/seen` | Marks inbound LINE messages on that lead as seen |
| GET | `/api/inbox/revision` | Changes when a message or a LINE connection changes |
| POST | `/api/line/webhook` | Signed LINE events. Repeating an event id does not create a second message |
| GET | `/api/companies` | Company list |
| POST | `/api/companies` | `{ "name", "industry" }` using one of the six industries |
| GET | `/api/companies/:id` | Company, contacts, and leads |
| GET | `/api/contacts` | Contact list |
| POST | `/api/contacts` | `{ "name", "companyId", "title?", "email?", "phone?" }` |

Errors use `{ "error": { "code", "message" } }`. A Lost stage without a reason returns `lost_reason`. Responses do not include password hashes, channel secrets, or access tokens.

### Environment

`.env.example` documents every variable the app reads:

- `DATABASE_URL`
- `SESSION_SECRET`
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
- `LINE_MODE`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`

The example file uses `LINE_MODE=mock` and empty secrets.

### Trade-offs

- The copilot has a deterministic fallback so a salesperson still gets a score when no model key is set, or when the model output is invalid.
- LINE has a mock adapter so `npm test` and a fresh local app do not need a real token. The hosted demo is switched to live for the test Official Account.
- Suggestions, drafts, and sends are separate writes. A suggestion cannot move a stage or mark a message sent.
- Approved sends push, instead of reusing a reply token. Reply tokens are one-time and expire in seconds, which was returning HTTP 400 on later sends.
- Companies and contacts can be created and viewed. Editing and deleting them is outside this slice.
- The open CRM refreshes by polling, because a Vercel function is not a long-lived socket. The interval is about two seconds.
- Outbound LINE retries once. That covers a short outage without looping.
- The interface can be shown in English or Thai. Pipeline, Leads, Manual, and Apply stay in English in both languages. The copilot draft follows the chat language selected on the lead.

### Limitations

- A live send is refused until the contact is Connected. The visible id, such as `LK-OISHI`, is a mock code, not the LINE user id.
- A phone connects only by sending `I am` plus that mock id. An admin disconnects it on the Contacts page. Sales users can see the status and cannot disconnect.
- This LINE account cannot use the followers API, so the user id arrives only from a webhook event.
- There is no external error tracker. Logs stay in the Vercel function log, and the hobby plan keeps them for a short window.
- The walkthrough video is recorded by the presenter. It is not stored in this repository.

### Production next steps

1. Record the 3–5 minute walkthrough from the deployed site.
2. Reissue the LINE channel access token if it has been pasted into a chat, and update only the Vercel environment.
3. Alert when `line.send` logs `"status":"FAILED"` or `line.webhook` logs `"reason":"signature"`.
4. Ship stdout to a log store. The hobby plan does not keep logs long enough for a 20-person team.
5. Add company and contact editing when the team needs to correct a record without creating a new one.
6. Move from polling to a push channel when the host supports a connection that stays open.

### Automated tests

`npm test` runs the Node test runner. The three required flows are:

| Flow | File | What it proves |
| --- | --- | --- |
| Core CRM | `src/lib/crm-flow.test.ts` | Creates a company, contact, and lead. Rejects Lost with a blank reason. Saves Lost with a reason. Removes the rows at the end. |
| AI skill fallback | `src/lib/copilot.test.ts` | The five fallback scores, a lost-lead draft that includes the lost reason, and a Thai draft that still keeps the English summary. |
| LINE signature and idempotency | `src/lib/line-signature.test.ts`, `src/lib/line-webhook.test.ts`, `src/lib/line-inbox.test.ts` | A bad signature is rejected. The idempotency key is stable. The same webhook event is stored once. `I am` connects a free mock id and refuses an id that is already taken. |

`src/lib/line-send.test.ts` adds the mock adapter, one retry after HTTP 500, and a reply that returns 400 before the push fallback. Tests that send set `LINE_MODE=mock` or a fake token. They do not use the live channel secret.

### Logging and monitoring

Each operational event is one JSON line on stdout. The line has ids and statuses. It does not include passwords, channel secrets, access tokens, or message text.

| `event` | Fields | When |
| --- | --- | --- |
| `crm.stage` | `leadId`, `from`, `to`, `lostReason` as true or false | A stage change is saved |
| `copilot.suggestion` | `leadId`, `source` (`model` or `fallback`), `score`, `modelError` | A suggestion is stored |
| `line.webhook` | `accepted`, `duplicates`, `lineUserIds` | A signed webhook is processed |
| `line.webhook` | `status: rejected`, `reason: signature` | The signature does not match |
| `line.send` | `messageId`, `mode` (`mock` or `live`), `status` (`SENT` or `FAILED`) | An approved send finishes |

On Vercel, search the function log for `"event":"line.webhook"` or `"event":"line.send"`. Alert when `line.send` has `"status":"FAILED"`, or when `line.webhook` has `"reason":"signature"`.

### AI usage log

The app was built with an AI coding assistant in Cursor. A person checked the running app, the tests, and the skill text, then kept or rejected the result.

Sample prompts:

- Build the Jenosize CRM from the assignment brief, using the jenosize.com visual direction, synthetic data, and a Postgres schema for users, companies, contacts, leads, activities, and messages.
- Add the CRM copilot skill with 2–4 reasons, a fallback when no model key is set, and a suggestion that cannot send LINE or change the stage.
- Connect a LINE Official Account: verify the webhook signature, store each event once, and send only after a person approves the draft.
- Map a phone with `I am` plus a mock LINE id, and refuse the connection when that phone or that id is already connected.
- Add English and Thai, a chat language on the LINE draft, and a New flag for an unread LINE message.

Reviewed and rejected:

- Pasted button CSS that would have turned the page dark, reset the fonts, or labeled every button "SUBMIT".
- A loading overlay that stayed on screen after the page had finished loading.
- Treating the LINE ID `lkade` as the webhook user id. That string is the display id, not `source.userId`.
- Auto-creating a contact for every unknown phone. That would lock the phone to a new record and block `I am LK-OISHI`.

One change after inspection: the copilot was allowed 1–5 reasons in the skill file and 2–4 in the model prompt. The skill, the prompt, and the output checker were then all set to 2–4 reasons. A second inspection found approved sends reusing a spent reply token and receiving HTTP 400. Approved sends now push, and that path is covered by `src/lib/line-send.test.ts`.

### LINE OA test

The QR code is shown in LINE Official Account Manager for the test account named LK. It is not committed, because it is an account credential surface and it can be rotated there.

1. In LINE Developers, set the webhook to `https://jenosize-ai-crm-azure.vercel.app/api/line/webhook`, turn **Use webhook** on, and click **Verify**.
2. In LINE Official Account Manager, open the test account named LK and show its QR code. Add that account from the phone.
3. On Contacts, copy a mock LINE id such as `LK-OISHI`. From the phone send `I am LK-OISHI`. The contact status becomes Connected. Later messages from that phone appear on that contact’s lead, and the open pipeline and lead list refresh.
4. Open Trade promotion workflow. Choose the chat language, then **Ask copilot**, **Save draft**, and **Approve and send**.
5. With `LINE_MODE=mock`, the send stays in the CRM and LINE is not called. With `live`, the message is pushed only when the contact is Connected.

### Walkthrough video

Record 3–5 minutes on https://jenosize-ai-crm-azure.vercel.app. Do not show `.env` or a token.

1. Sign in as `admin@jenosize.test`.
2. Filter to Qualified and LINE. Open Trade promotion workflow.
3. Ask the copilot. Point out the score, the reasons, and that the stage did not change.
4. Save the LINE draft, then approve it. The timeline keeps the suggestion, the draft, and the sent message.
5. Show one inbound LINE message, including the New flag when it has not been seen yet.
6. On Contacts, show Connected for `LK-OISHI`.
7. Close on the public repository, `npm test`, and the rule that the copilot cannot send by itself.

If the model is slow, say the fallback still scores the lead and move on. If Approve and send shows a LINE error, say the draft is still unsent and the failure is stored. Do not retry more than once on camera.

### Timebox

Recommended maximum: 16 focused hours across 5 working days. The submitted slice is the deployed CRM, the copilot skill, the LINE webhook and approval-based send, the tests, and this handover. The remaining presenter step is the 3–5 minute video.
