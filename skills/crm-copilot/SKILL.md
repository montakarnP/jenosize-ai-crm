# CRM copilot

Reusable skill for a Jenosize salesperson looking at one lead. The runtime in `src/lib/copilot.ts` follows this file. Asking for a suggestion never moves the pipeline and never sends LINE.

## Purpose

Turn the lead record, company, contact, and recent LINE messages into four things a salesperson can review: a short summary, a qualification score with reasons, the next action, and a draft LINE reply.

## Inputs

One lead context object. Do not pass passwords, session secrets, or LINE channel tokens.

- `title`, `stage`, `source`, `valueThb`, `lostReason`
- `companyName`, `industry`
- `contactName`, `ownerName`
- `inboundCount`, `latestInbound` (the newest inbound message body, or null)

## Outputs

JSON with:

- `summary`: facts from the context only
- `score`: integer 0–100
- `reasons`: 1–5 short strings that cite stage, value, conversation, or the lost reason
- `nextAction`: the single next step for the salesperson
- `draftReply`: a LINE message the contact has not received
- `source`: `model` when a configured model returned valid JSON, otherwise `fallback`

## Allowed actions

- Read the lead context.
- Append an `AI_SUGGESTION` activity whose metadata is marked `confirmedWrite: false` and `outbound: false`.
- Return the suggestion to the salesperson.

A later, separate action may save an edited reply as a `DRAFT` message. That action is not part of producing the suggestion.

## Guardrails

- Do not invent meetings, budgets, competitors, or approvals that are not in the context.
- Do not change stage, owner, value, lost reason, or contact records.
- Do not create a message with status `SENT`, `APPROVED`, or `FAILED`.
- Do not call the LINE send API.
- A lost lead’s draft must pause the deal and mention the lost reason.
- The draft is editable before it is saved. The saved row stays `DRAFT` until a person approves a send.

## Failure behavior

- No `OPENAI_API_KEY`: use the deterministic fallback. `source` is `fallback`.
- The model times out, returns a non-200 response, or returns JSON outside the output rules: keep the fallback and set `modelError` to `unavailable` or `invalid_output`.
- Unknown lead: do not write an activity. The API returns `404`.
- The fallback score is `stage base + value adjustment + conversation adjustment`, clamped to 0–100.
  - Stage base: New 40, Qualified 58, Proposal 74, Won 92, Lost 18.
  - Value: +8 at or above 200,000 THB, +4 at or above 100,000 THB, otherwise −4.
  - Conversation: +6 when the source is LINE or the lead has an inbound message.

## Evaluation cases

These use the seeded leads and the fallback rules above.

1. **New, small, no conversation.** Digital service desk (`lead_learning_lms`) is New, manual entry, 70,000 THB, and has no inbound message. Score 36. Reasons include “Stage is New.”, “Deal value is under 100,000 THB.”, and “No LINE conversation is on the lead yet.” Next action is a discovery call. The stage stays New.
2. **Qualified LINE conversation.** Trade promotion workflow (`lead_foods_line`) is Qualified, source LINE, 240,000 THB, with an inbound message. Score 72. Reasons include the open LINE conversation and the value band. Next action is a one-page scope and a decision date. No outbound message is created.
3. **Proposal with an inbound note.** Visitor experience program (`lead_clinic_intake`) is Proposal, 310,000 THB, and has an inbound LINE message. Score 88. Next action asks what is blocking the decision.
4. **Won.** Project sales desk (`lead_stay_booking`) is Won and 150,000 THB, with no inbound message. Score 96. Next action is a kickoff. The draft thanks the contact and does not ask them to buy again.
5. **Lost.** Policy inbox cleanup (`lead_parts_rfq`) is Lost at 80,000 THB because the budget is frozen until next fiscal year. Score 14. The next action says to reopen only if that reason changes. The draft pauses the work and includes the lost reason.
6. **Model missing or broken.** With no API key, or when the model response fails validation, cases 1–5 still return `source: fallback`. The lead stage and message count stay unchanged until the salesperson saves a draft.
