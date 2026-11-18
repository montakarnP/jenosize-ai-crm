import assert from "node:assert/strict";
import test from "node:test";
import { fallbackSuggestion, type LeadContext } from "./copilot";

function context(overrides: Partial<LeadContext>): LeadContext {
  return {
    title: "Digital service desk",
    stage: "NEW",
    source: "MANUAL",
    valueThb: 70_000,
    lostReason: null,
    companyName: "Electronic Transactions Development Agency (ETDA)",
    industry: "Government",
    contactName: "ETDA Contact",
    ownerName: "Jenosize Sales",
    inboundCount: 0,
    latestInbound: null,
    ...overrides,
  };
}

test("new lead with no conversation scores 36 and stays a suggestion", () => {
  const suggestion = fallbackSuggestion(context({}));
  assert.equal(suggestion.score, 36);
  assert.equal(suggestion.source, "fallback");
  assert.ok(suggestion.reasons.includes("Stage is New."));
  assert.ok(suggestion.reasons.includes("Deal value is under 100,000 THB."));
  assert.ok(suggestion.reasons.includes("No LINE conversation is on the lead yet."));
  assert.match(suggestion.nextAction, /discovery call/i);
});

test("qualified LINE lead scores 72 without creating an outbound message", () => {
  const suggestion = fallbackSuggestion(
    context({
      title: "Trade promotion workflow",
      stage: "QUALIFIED",
      source: "LINE",
      valueThb: 240_000,
      contactName: "Oishi Contact",
      inboundCount: 1,
      latestInbound: "Can you send a short plan for the promotion workflow?",
    }),
  );
  assert.equal(suggestion.score, 72);
  assert.ok(suggestion.reasons.includes("A LINE conversation is already open."));
  assert.match(suggestion.nextAction, /one-page scope/i);
  assert.equal(suggestion.source, "fallback");
});

test("proposal with an inbound message scores 88", () => {
  const suggestion = fallbackSuggestion(
    context({
      title: "Visitor experience program",
      stage: "PROPOSAL",
      source: "WEBSITE",
      valueThb: 310_000,
      contactName: "TAT Contact",
      inboundCount: 1,
      latestInbound: "A workflow summary is enough.",
    }),
  );
  assert.equal(suggestion.score, 88);
  assert.match(suggestion.nextAction, /blocking a decision/i);
});

test("won lead scores 96 and the draft does not ask for another sale", () => {
  const suggestion = fallbackSuggestion(
    context({
      title: "Project sales desk",
      stage: "WON",
      source: "WEBSITE",
      valueThb: 150_000,
      contactName: "SCAsset Contact",
    }),
  );
  assert.equal(suggestion.score, 96);
  assert.match(suggestion.nextAction, /kickoff/i);
  assert.match(suggestion.draftReply, /thank you/i);
  assert.doesNotMatch(suggestion.draftReply, /buy/i);
});

test("a Thai chat language writes the LINE draft in Thai and keeps the lost reason", () => {
  const suggestion = fallbackSuggestion(
    context({ stage: "LOST", lostReason: "Budget frozen until next fiscal year", valueThb: 80_000 }),
    "th",
  );
  assert.match(suggestion.draftReply, /พักงาน/);
  assert.match(suggestion.draftReply, /Budget frozen until next fiscal year/);
  assert.match(suggestion.summary, /Stage Lost/);
});

test("lost lead scores 14 and the draft pauses with the lost reason", () => {
  const suggestion = fallbackSuggestion(
    context({
      title: "Policy inbox cleanup",
      stage: "LOST",
      source: "MANUAL",
      valueThb: 80_000,
      lostReason: "Budget frozen until next fiscal year",
      contactName: "BangkokInsurance Contact",
    }),
  );
  assert.equal(suggestion.score, 14);
  assert.match(suggestion.nextAction, /Reopen only if this changes/i);
  assert.match(suggestion.draftReply, /pause/i);
  assert.match(suggestion.draftReply, /Budget frozen until next fiscal year/);
});
