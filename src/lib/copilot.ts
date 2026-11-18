import type { LeadSource, LeadStage } from "@prisma/client";
import { stageLabel } from "@/lib/format";

export type LeadContext = {
  title: string;
  stage: LeadStage;
  source: LeadSource;
  valueThb: number;
  lostReason: string | null;
  companyName: string | null;
  industry: string | null;
  contactName: string | null;
  ownerName: string | null;
  inboundCount: number;
  latestInbound: string | null;
};

export type CopilotSuggestion = {
  summary: string;
  score: number;
  reasons: string[];
  nextAction: string;
  draftReply: string;
  source: "model" | "fallback";
  modelError?: "unavailable" | "invalid_output";
};

const stageBase: Record<LeadStage, number> = {
  NEW: 40,
  QUALIFIED: 58,
  PROPOSAL: 74,
  WON: 92,
  LOST: 18,
};

function contactName(context: LeadContext): string {
  return context.contactName?.trim() || "the contact";
}

function valueReason(valueThb: number): { delta: number; reason: string } {
  if (valueThb >= 200_000) return { delta: 8, reason: "Deal value is at least 200,000 THB." };
  if (valueThb >= 100_000) return { delta: 4, reason: "Deal value is at least 100,000 THB." };
  return { delta: -4, reason: "Deal value is under 100,000 THB." };
}

export type ChatLanguage = "en" | "th";

function thaiDraft(context: LeadContext, name: string): string {
  const reason = context.lostReason?.trim() || "ยังไม่ใช่เวลาที่เหมาะสม";
  if (context.stage === "LOST") {
    return `สวัสดีค่ะ ${name} เราขอพักงาน ${context.title} ไว้ก่อน ${reason} หากมีการเปลี่ยนแปลง ตอบกลับที่แชทนี้ได้เลยค่ะ`;
  }
  if (context.stage === "WON") {
    return `สวัสดีค่ะ ${name} ขอบคุณที่ยืนยันงาน ${context.title} ดิฉันจะนัดเวลาเริ่มงานและแจ้งผู้รับผิดชอบจาก Jenosize ให้ค่ะ`;
  }
  if (context.stage === "PROPOSAL") {
    return `สวัสดีค่ะ ${name} ขอติดตามข้อเสนอของงาน ${context.title} ค่ะ ตอนนี้มีจุดใดที่ยังติดการตัดสินใจอยู่บ้างคะ`;
  }
  if (context.stage === "QUALIFIED") {
    return `สวัสดีค่ะ ${name} ดิฉันส่งสรุปขอบเขตงาน ${context.title} หนึ่งหน้าได้ค่ะ ต้องการตัดสินใจภายในวันไหนคะ`;
  }
  return `สวัสดีค่ะ ${name} ขอบคุณที่สอบถามเกี่ยวกับ ${context.title} ค่ะ สะดวกคุยสั้นๆ เพื่อยืนยันเป้าหมายและผู้รับผิดชอบฝั่งคุณหรือไม่คะ`;
}

export function fallbackSuggestion(context: LeadContext, chatLanguage: ChatLanguage = "en"): CopilotSuggestion {
  const name = contactName(context);
  const company = context.companyName?.trim() || "the company";
  const value = valueReason(context.valueThb);
  const conversation = context.source === "LINE" || context.inboundCount > 0;
  let score = stageBase[context.stage] + value.delta + (conversation ? 6 : 0);
  score = Math.max(0, Math.min(100, score));

  const reasons = [`Stage is ${stageLabel(context.stage)}.`, value.reason];
  reasons.push(
    conversation ? "A LINE conversation is already open." : "No LINE conversation is on the lead yet.",
  );
  if (context.stage === "LOST") {
    reasons.push(`Lost reason: ${context.lostReason?.trim() || "not recorded"}.`);
  }

  const nextAction =
    context.stage === "LOST"
      ? `Park the lead. Reopen only if this changes: ${context.lostReason?.trim() || "the lost reason"}.`
      : context.stage === "WON"
        ? `Schedule the kickoff with ${name} and confirm the delivery owner.`
        : context.stage === "PROPOSAL"
          ? `Follow up with ${name} on the proposal and ask what is blocking a decision.`
          : context.stage === "QUALIFIED"
            ? `Send ${name} a one-page scope and ask for a decision date.`
            : `Confirm ${name} is the right person and book a short discovery call.`;

  const draftReply =
    chatLanguage === "th"
      ? thaiDraft(context, name)
      : context.stage === "LOST"
      ? `Hello ${name}, we will pause ${context.title}. ${context.lostReason?.trim() || "The timing is not right"}. Reply here if that changes.`
      : context.stage === "WON"
        ? `Hello ${name}, thank you for confirming ${context.title}. I will propose a kickoff time and the Jenosize owner.`
        : context.stage === "PROPOSAL"
          ? `Hello ${name}, I am following up on the proposal for ${context.title}. What is still in the way of a decision?`
          : context.stage === "QUALIFIED"
            ? `Hello ${name}, I can send a one-page scope for ${context.title}. What date should we aim to decide?`
            : `Hello ${name}, thank you for the enquiry about ${context.title}. Can we book a short call to confirm the goal and the right owner on your side?`;

  const inbound = context.latestInbound
    ? ` Latest inbound: “${context.latestInbound.slice(0, 180)}”.`
    : " No inbound message yet.";

  return {
    summary: `${company} — ${context.title}. ${name} is the contact. Stage ${stageLabel(context.stage)}, source ${context.source}, value ${context.valueThb} THB.${context.industry ? ` Industry: ${context.industry}.` : ""}${inbound}`,
    score,
    reasons,
    nextAction,
    draftReply,
    source: "fallback",
  };
}

function modelConfig() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return {
    key,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    base: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
  };
}

function asSuggestion(value: unknown): CopilotSuggestion | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";
  const nextAction = typeof record.nextAction === "string" ? record.nextAction.trim() : "";
  const draftReply = typeof record.draftReply === "string" ? record.draftReply.trim() : "";
  const score = record.score;
  const reasons = Array.isArray(record.reasons)
    ? record.reasons.filter((item): item is string => typeof item === "string").map((item) => item.trim())
    : [];
  if (
    summary.length < 20 ||
    summary.length > 600 ||
    nextAction.length < 10 ||
    nextAction.length > 400 ||
    draftReply.length < 10 ||
    draftReply.length > 1000 ||
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    reasons.length < 2 ||
    reasons.length > 4 ||
    reasons.some((reason) => reason.length < 5 || reason.length > 200)
  ) {
    return null;
  }
  return { summary, score, reasons, nextAction, draftReply, source: "model" };
}

async function requestModel(
  config: { key: string; model: string; base: string },
  context: LeadContext,
  chatLanguage: ChatLanguage,
): Promise<CopilotSuggestion | null> {
  const response = await fetch(`${config.base}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You are the Jenosize CRM copilot. Use only the JSON lead context. Do not invent meetings, budgets, or approvals. Return JSON with keys summary, score, reasons, nextAction, and draftReply. score is an integer from 0 to 100. reasons is an array of 2 to 4 short strings. draftReply is a proposed LINE message that has not been sent. Write draftReply in ${chatLanguage === "th" ? "Thai" : "English"}. Keep summary, reasons, and nextAction in English. If stage is LOST, the draft must pause the deal and mention the lost reason. Do not claim a message was sent or a stage was changed.`,
        },
        { role: "user", content: JSON.stringify(context) },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;
  return asSuggestion(JSON.parse(content));
}

export async function suggestForLead(
  context: LeadContext,
  chatLanguage: ChatLanguage = "en",
): Promise<CopilotSuggestion> {
  const fallback = fallbackSuggestion(context, chatLanguage);
  const config = modelConfig();
  if (!config) return fallback;
  try {
    const model = await requestModel(config, context, chatLanguage);
    if (!model) return { ...fallback, modelError: "invalid_output" };
    return model;
  } catch {
    return { ...fallback, modelError: "unavailable" };
  }
}

export function readSuggestion(metadata: unknown): CopilotSuggestion | null {
  const parsed = asSuggestion(metadata);
  if (!parsed || typeof metadata !== "object" || metadata === null) return null;
  const record = metadata as { source?: unknown; modelError?: unknown };
  const modelError =
    record.modelError === "unavailable" || record.modelError === "invalid_output" ? record.modelError : undefined;
  return {
    ...parsed,
    source: record.source === "model" || record.source === "fallback" ? record.source : "fallback",
    modelError,
  };
}
