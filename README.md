# Jenosize CRM

Internal CRM for a commercial team whose leads arrive from the website, from a salesperson, and from LINE. A salesperson opens one lead, sees the company and the conversation, moves it through the pipeline, and asks for a summary, a score, and a reply. The reply stays a draft until a person sends it. The suggestion, the draft, and the sent message all remain on the timeline.

The demo uses synthetic companies and contacts. Nothing in the seed is a real customer.

## Demo

https://jenosize-ai-crm-azure.vercel.app

Source: https://github.com/montakarnP/jenosize-ai-crm

Sign in with `admin@jenosize.test` and password `Demo-CRM-2026`. The same password works for every seeded account. The login page shows the admin account. Sales users can run the pipeline. Only an admin can disconnect a LINE account.

The hosted app uses Neon Postgres. Refresh the page and the pipeline is still there. Records are not kept in memory.

A useful lead to open first is **Trade promotion workflow**: Oishi, Qualified, 240,000 THB, source LINE, mock LINE id `LK-OISHI`.

## What the product does

- Responsive pipeline, lead list, and lead page.
- Session login. A page without a session returns to the login screen.
- Companies, contacts, and leads can be created and opened. Companies belong to Retail, Fashion, Government, FMCG, Banking & Insurance, or Real Estate.
- Stages are New, Qualified, Proposal, Won, and Lost. Lost requires a reason, and that change is stored as an activity.
- Search and filter by text, stage, and source: Website, Manual, or LINE.
- The lead page shows the profile, notes, stage history, copilot suggestions, and the LINE conversation on one timeline.
- English and Thai. The words Pipeline, Leads, Manual, and Apply stay in English. The LINE draft follows the chat language chosen on the lead.
- A new inbound LINE message is marked New on the timeline, and the pipeline and lead list show that the lead has an unread message. An open page refreshes when a message arrives.

## Run locally

Node.js 20+ and PostgreSQL 16. This project was run with Homebrew `postgresql@16`.

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

Open http://localhost:3000. The local database URL is `postgresql://crm:crm@localhost:5432/jenosize_crm`.

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

## Deploy

The Vercel project is `jenosize-ai-crm`. `vercel.json` runs `prisma migrate deploy`, `prisma generate`, and `next build`. The seed is not part of the build, so a deploy does not wipe the live pipeline.

Set these in the Vercel environment, then redeploy:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `SESSION_SECRET`
- `LINE_MODE` (`live` on the hosted demo, `mock` in `.env.example`)
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

Leave `OPENAI_API_KEY` empty to use the built-in scoring rules. Channel tokens, the session secret, and the database URL stay in the host environment and in the gitignored `.env`. They are not in this repository. `.env.example` lists every variable and leaves the secrets empty.

## Data

Schema, migrations, and seed live in `prisma/schema.prisma`, `prisma/migrations`, and `prisma/seed.ts`.

Tables: Users, Companies, Contacts, Leads, Activities, Messages. Leads are the deals. Foreign keys link a lead to its company, contact, and owner, and link activities and messages back to the lead.

The database checks:

- email shape on users and contacts
- contact name length, lead title length, and a non-blank activity or message body
- employee count and deal value cannot be negative
- unique emails, unique LINE user ids, unique message idempotency keys, and a unique channel plus external id
- a Lost lead must have a lost reason

The API returns `lost_reason` with HTTP 400 when that reason is missing. Responses never include password hashes, channel secrets, or access tokens.

The seed creates 9 users, 20 companies, 20 contacts, 10 leads, 8 activities, and 3 messages. The hosted database also keeps LINE events from the test phone. Those events are real traffic on the test account, not rows in the seed file.

## Architecture

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

An open CRM polls `GET /api/inbox/revision` about every two seconds and refreshes when a message or a connection changes. Opening a lead marks its inbound LINE messages seen. The New flag stays for that visit, so the salesperson can still see which message just arrived.

## Workflow

A lead stays on one timeline. The salesperson moves the stage and approves the reply. LINE only adds a message after the signature check, and only sends after a person approves.

```mermaid
flowchart TD
  arrive[Website, manual entry, or LINE] --> board[Pipeline]
  board --> lead[Open the lead]
  lead --> stage[Move the stage]
  stage --> lost{Lost?}
  lost -->|Yes| reason[Save the lost reason]
  lost -->|No| timeline[Timeline]
  reason --> timeline
  lead --> ask[Ask copilot]
  ask --> suggestion[Store the suggestion only]
  suggestion --> draft[Save the LINE draft]
  draft --> approve[Approve and send]
  approve --> linked{Phone connected?}
  linked -->|Yes| sent[Push and mark sent]
  linked -->|No| held[Keep the draft unsent]
  sent --> timeline
  phone[Phone messages the account] --> signature[Check the signature]
  signature -->|Invalid| reject[Reject the event]
  signature -->|Valid| once[Store the event once]
  once --> claim{I am plus a mock id?}
  claim -->|Free id| connect[Connect the contact]
  claim -->|Already taken| blocked[Reply that another account holds it]
  claim -->|No| known{Phone already connected?}
  connect --> known
  known -->|Yes| inbound[Add the message to the open lead]
  known -->|No| unmatched[Store it without a contact]
  inbound --> timeline
  timeline --> refresh[Refresh the open CRM]
```

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

Errors use `{ "error": { "code", "message" } }`.

## Copilot

The skill contract is `skills/crm-copilot/SKILL.md`: purpose, inputs, outputs, allowed actions, guardrails, failure behavior, and six evaluation cases. The runtime is `src/lib/copilot.ts`.

Ask copilot reads one lead and returns a summary, a score from 0 to 100, 2–4 reasons, one next action, and a draft LINE reply. The summary uses only facts on that lead. The saved activity is marked `confirmedWrite: false` and `outbound: false`. Saving the draft and approving the send are separate actions.

With no `OPENAI_API_KEY`, or when the model response fails the output rules, the deterministic fallback still returns a score. Stage, value, and whether a LINE conversation exists each move the score. A lost lead’s draft pauses the work and includes the lost reason. The five seeded examples score 36, 72, 88, 96, and 14. The chat language changes the draft only. The summary, the reasons, and the next action stay in English.

## LINE

Every contact has a mock id such as `LK-OISHI`. That id is not the LINE user id. The phone connects by sending `I am LK-OISHI`. If that phone or that mock id is already connected, LINE replies:

`It's cannot connect because it's connected with other account.`

An admin disconnects the account on the Contacts page. Each contact shows Connected or Not connected. Later messages from a connected phone are stored on that contact’s open lead.

`POST /api/line/webhook` checks `X-Line-Signature` with HMAC-SHA256 over the raw body. A missing secret returns 503. A bad signature returns 401. The idempotency key is `line-event:{webhookEventId}`, so a repeated event does not create a second message.

Approve and send pushes to the connected user. The send key is `send:{messageId}`. A 429, 5xx, or network failure is retried once. A send with no connected user is refused and does not call LINE. `LINE_MODE=mock` records the send locally. The hosted demo is `live`.

The immediate reply to `I am …` tries the reply token once, then pushes if LINE rejects that token. An approved draft always pushes, because a reply token works once and expires in seconds.

### Try it from a phone

The QR code is in LINE Official Account Manager for the test account named LK.

1. In LINE Developers, set the webhook to `https://jenosize-ai-crm-azure.vercel.app/api/line/webhook`, turn **Use webhook** on, and click **Verify**.
2. In LINE Official Account Manager, open the test account named LK and show its QR code. Add that account from the phone.
3. On Contacts, copy a mock LINE id such as `LK-OISHI`. From the phone send `I am LK-OISHI`. The contact becomes Connected, and later messages from that phone appear on its lead. The open pipeline and lead list refresh.
4. Open Trade promotion workflow. Choose the chat language, then **Ask copilot**, **Save draft**, and **Approve and send**.
5. With `LINE_MODE=mock`, the send stays in the CRM. With `live`, the message is pushed when the contact is Connected.

## Tests

`npm test` runs the Node test runner.

| Area | File | What it covers |
| --- | --- | --- |
| CRM flow | `src/lib/crm-flow.test.ts` | Creates a company, contact, and lead. Rejects Lost with a blank reason. Saves Lost with a reason. Removes the rows at the end. |
| Copilot fallback | `src/lib/copilot.test.ts` | The five fallback scores, a lost-lead draft that includes the lost reason, and a Thai draft that still keeps the English summary. |
| LINE signature and idempotency | `src/lib/line-signature.test.ts`, `src/lib/line-webhook.test.ts`, `src/lib/line-inbox.test.ts` | A bad signature is rejected. The idempotency key is stable. The same webhook event is stored once. `I am` connects a free mock id and refuses an id that is already taken. |
| LINE send | `src/lib/line-send.test.ts` | The mock adapter, one retry after HTTP 500, and a reply that returns 400 before the push fallback. |

Tests that send set `LINE_MODE=mock` or a fake token. They do not use the live channel secret.

## Logging and monitoring

Each operational event is one JSON line on stdout. The line has ids and statuses. It does not include passwords, channel secrets, access tokens, or message text.

| `event` | Fields | When |
| --- | --- | --- |
| `crm.stage` | `leadId`, `from`, `to`, `lostReason` as true or false | A stage change is saved |
| `copilot.suggestion` | `leadId`, `source` (`model` or `fallback`), `score`, `modelError` | A suggestion is stored |
| `line.webhook` | `accepted`, `duplicates`, `lineUserIds` | A signed webhook is processed |
| `line.webhook` | `status: rejected`, `reason: signature` | The signature does not match |
| `line.send` | `messageId`, `mode` (`mock` or `live`), `status` (`SENT` or `FAILED`) | An approved send finishes |

On Vercel, search the function log for `"event":"line.webhook"` or `"event":"line.send"`. Alert when `line.send` has `"status":"FAILED"`, or when `line.webhook` has `"reason":"signature"`. The hobby plan keeps logs for a short window, so a production follow-up is to ship stdout to a log store with those two alerts.

## Trade-offs

- The copilot has a deterministic fallback so a salesperson still gets a score when no model key is set, or when the model output is invalid.
- LINE has a mock adapter so local tests never need a real token. The hosted demo is switched to live for the test Official Account.
- Suggestions, drafts, and sends are separate writes. A suggestion cannot move a stage or mark a message sent.
- Approved sends push. Reply tokens are one-time and expire in seconds, and reusing one was returning HTTP 400 on later sends.
- Companies and contacts can be created and viewed. Editing and deleting them is outside this slice.
- The open CRM refreshes by polling, because a Vercel function is not a long-lived socket. The interval is about two seconds.
- Outbound LINE retries once. That covers a short outage without looping.

## Limitations

- A live send is refused until the contact is Connected. The visible id, such as `LK-OISHI`, is a mock code, not the LINE user id.
- A phone connects by sending `I am` plus that mock id. An admin disconnects it on Contacts. Sales users can see the status and cannot disconnect.
- This LINE account cannot use the followers API, so the user id arrives from a webhook event.
- There is no external error tracker. Logs stay in the Vercel function log.

## Production next steps

1. Reissue the LINE channel access token if it has been pasted into a chat, and update only the Vercel environment.
2. Alert when `line.send` logs `"status":"FAILED"` or `line.webhook` logs `"reason":"signature"`.
3. Ship stdout to a log store. The hobby plan does not keep logs long enough for a 20-person team.
4. Add company and contact editing when the team needs to correct a record without creating a new one.
5. Move from polling to a push channel when the host supports a connection that stays open.

## How this was built

The app was built with an AI coding assistant in Cursor. A person checked the running app, the tests, and the skill text, then kept or rejected the result.

Sample prompts:

- Build the Jenosize CRM for a commercial team, using the jenosize.com visual direction, synthetic data, and a Postgres schema for users, companies, contacts, leads, activities, and messages.
- Add a CRM copilot skill with 2–4 reasons, a fallback when no model key is set, and a suggestion that cannot send LINE or change the stage.
- Connect a LINE Official Account: verify the webhook signature, store each event once, and send only after a person approves the draft.
- Map a phone with `I am` plus a mock LINE id, and refuse the connection when that phone or that id is already connected.
- Add English and Thai, a chat language on the LINE draft, and a New flag for an unread LINE message.
