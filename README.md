# Jenosize CRM

Working AI CRM MVP for the Jenosize lead-engineer assignment.

Developed by MONTAKARN PRINGPRERD · m.pringprerd@gmail.com

## Status

Public demo: https://jenosize-ai-crm-azure.vercel.app

Sign in with `admin@jenosize.test` and password `Demo-CRM-2026`. The same password works for every seeded account. Data is in hosted Postgres, so a refresh keeps the pipeline.

`POST /api/line/webhook` checks the LINE signature and stores each text event once. A known LINE user is attached to the open lead. Copilot suggestions do not change the stage and do not send LINE. A CRM request without a session gets `401`. A bad webhook signature gets `401`.

The hosted demo has `LINE_MODE=live`. Approve and send calls LINE. `.env.example` keeps `LINE_MODE=mock` for local tests. Channel secrets stay in the host environment and in the gitignored `.env`. They are not in this file.

## Part 2 — copilot and LINE

The skill contract is `skills/crm-copilot/SKILL.md`: purpose, inputs, outputs, allowed actions, guardrails, failure behavior, and six evaluation cases. The runtime is `src/lib/copilot.ts`. Ask copilot writes an `AI_SUGGESTION` only (`confirmedWrite: false`, `outbound: false`). Saving a draft and approving a send are separate actions.

LINE behavior:

- Signature check and one automatic retry live in `src/lib/line-signature.ts` and `src/lib/line-send.ts`.
- Every contact has a mock LINE id such as `LK-OISHI`. A phone connects by sending `I am LK-OISHI`. If that phone or that mock id is already connected, LINE replies that it cannot connect because it is connected with another account. An admin can disconnect from the Contacts page.
- When someone adds the LINE Official Account, the follow event sends one greeting that explains `I am` plus the LINE id. The same follow event does not send it again. The key is `line-follow:{id}`.
- Repeating `webhookEventId` is a duplicate. The unique key is `line-event:{id}`.
- `.env.example` uses `LINE_MODE=mock`, so `npm test` and a fresh local app do not call LINE. The hosted demo is set to `live` on Vercel. A live send also needs `LINE_CHANNEL_ACCESS_TOKEN` in that environment, never in git.

```bash
npm test
```

`npm test` covers three areas:

- CRM flow: create a company, contact, and lead, reject Lost without a reason, then save Lost with a reason. The rows are removed at the end of the test.
- AI skill: the five fallback scores, including a lost-lead draft that pauses the deal.
- LINE: a bad signature is rejected, the idempotency key is stable, and the mock adapter does not call the network. A live retry is simulated with a fake token.

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
- `admin@jenosize.test` — Admin

Synthetic seed counts: 9 users, 20 companies, 20 contacts, 10 leads, 8 activities, and 3 messages. Companies are grouped as Retail, Fashion, Government, FMCG, Banking & Insurance, and Real Estate. Leads cover New, Qualified, Proposal, Won, and Lost.

The migration enforces foreign keys, unique emails, unique LINE user ids, unique message idempotency keys, unique channel plus external id, non-negative deal value, and a lost reason when the stage is Lost.

Do not commit `.env`.

## Deploy

The hosted app is a Vercel project, `jenosize-ai-crm`, with Neon Postgres. `vercel.json` runs `prisma migrate deploy`, `prisma generate`, and `next build`.

Set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`, `LINE_MODE`, `LINE_CHANNEL_SECRET`, and `LINE_CHANNEL_ACCESS_TOKEN` in the Vercel environment. Leave `OPENAI_API_KEY` empty to use the fallback. Redeploy after changing any variable. Do not put those values in git.

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

The browser signs in and reads the pipeline from Postgres. Ask copilot reads one lead and writes only an `AI_SUGGESTION`. Save draft writes a `DRAFT` message. Approve and send is the only step that calls LINE, and only when `LINE_MODE=live`. LINE posts inbound text to `/api/line/webhook`. The handler checks the signature, stores the event once, and links it when `lineUserId` matches a contact.

## Trade-offs

- The copilot has a deterministic fallback so the demo still scores a lead when no model key is set.
- LINE has a mock adapter so local tests never need a real token. The hosted demo is switched to live for the test Official Account.
- Suggestions, drafts, and sends are separate writes. A suggestion cannot move a stage or mark a message sent.
- Companies and contacts can be created and viewed. Editing and deleting them is left out of this slice.
- Outbound LINE retries once. That covers a short outage without looping.

## Limitations

- Seeded LINE ids `UdemoLineUser0001` and `UdemoLineUser0002` are not real phones. A live send to those ids is rejected by LINE.
- A phone connects only by sending `I am` plus a mock LINE id. An admin disconnects it on the Contacts page. Sales users can see the status and cannot disconnect.
- This LINE account cannot use the followers API, so the id has to come from a webhook event.
- There is no external error tracker. Logs stay in the Vercel function log.
- The walkthrough video is not in the repository. Record it from the deployed site.

## Production next steps

1. Attach the tester's real LINE user id to Oishi Contact, then approve one draft and confirm it arrives on the phone.
2. Reissue the LINE channel access token if it has been pasted into a chat, and update only the Vercel environment.
3. Publish this git repository without `.env`.
4. Record the 3–5 minute walkthrough below.
5. Alert when `line.send` logs `"status":"FAILED"` or `line.webhook` logs `"reason":"signature"`.

## Logging and monitoring

Each operational event is one JSON line on stdout. The line has ids and statuses. It does not include passwords, channel secrets, access tokens, or message text.

| `event` | Fields | When |
| --- | --- | --- |
| `crm.stage` | `leadId`, `from`, `to`, `lostReason` as true or false | A stage change is saved |
| `copilot.suggestion` | `leadId`, `source` (`model` or `fallback`), `score`, `modelError` | A suggestion is stored |
| `line.webhook` | `accepted`, `duplicates`, `lineUserIds` | A signed webhook is processed |
| `line.webhook` | `status: rejected`, `reason: signature` | The signature does not match |
| `line.send` | `messageId`, `mode` (`mock` or `live`), `status` (`SENT` or `FAILED`) | An approved send finishes |

`npm test` covers the three required flows:

- `src/lib/crm-flow.test.ts` creates a company, contact, and lead, rejects Lost with a blank reason, then saves Lost with a reason.
- `src/lib/copilot.test.ts` checks the fallback skill, including a new lead with no model key.
- `src/lib/line-signature.test.ts` rejects a body whose signature does not match. `src/lib/line-inbox.test.ts` stores one webhook event and treats the same event id as a duplicate.

Vercel keeps these lines in the function log. Search for `"event":"line.webhook"` or `"event":"line.send"`. Alert when `line.send` has `"status":"FAILED"`, or when `line.webhook` has `"reason":"signature"`. The hobby plan keeps logs for a short window, so a production follow-up is to ship stdout to a log store with those two alerts.

## LINE test

1. In LINE Developers, set the webhook to `https://jenosize-ai-crm-azure.vercel.app/api/line/webhook`, turn **Use webhook** on, and click **Verify**.
2. In LINE Official Account Manager, open the test account named LK and show its QR code. Leave the manager's own greeting empty so the new friend gets one welcome. Add that account from the phone. LINE sends the greeting that explains `I am` plus the LINE id.
3. On Contacts, copy a mock LINE id such as `LK-OISHI`. From the phone send `I am LK-OISHI`. The contact status becomes Connected, and later messages from that phone appear on that contact's lead.
4. Open Trade promotion workflow, choose **Ask copilot**, **Save draft**, then **Approve and send**.
5. With `LINE_MODE=mock`, the send stays in the CRM. With `live`, LINE receives it only when the contact has the phone's real user id.

## Walkthrough video

Record 3–5 minutes on the deployed site:

1. Sign in as `admin@jenosize.test`.
2. Filter the pipeline and open Trade promotion workflow.
3. Ask the copilot and point out that the stage did not change.
4. Save a LINE draft, then approve it.
5. Show one inbound LINE message on the timeline.
6. Mention the fallback skill, the signature check, and that secrets are not in git.

## AI usage log

The app was built with an AI coding assistant in Cursor. A person checked the running app and the skill text, then kept or rejected the result.

Sample prompts:

- Build the Jenosize CRM from the assignment brief, using the jenosize.com visual direction.
- Restyle buttons to match the navigator, with separate colors for sign-in, header actions, and other actions.
- Show a loading panel on every load, and add a hover border on each pipeline card.
- Connect a LINE Official Account, then map a phone with `I am` plus a mock LINE id.
- Add English/Thai, a chat language on the LINE draft, and a New flag for an unread LINE message.

Reviewed and rejected:

- Pasted button CSS that would have turned the page dark, reset the fonts, or labeled every button "SUBMIT".
- A loading overlay that stayed on screen after the page had finished loading.
- Treating the LINE ID `lkade` as the webhook user id. That string is the display id, not `source.userId`.

One change after inspection: the copilot was allowed 1–5 reasons in the skill file and 2–4 in the model prompt. After that mismatch was pointed out, the skill, the prompt, and the output checker were all set to 2–4 reasons.

## Timebox

The working slice is the deployed CRM, the copilot skill, the LINE webhook, and these tests. The remaining submission items are a public git remote and the walkthrough video.
