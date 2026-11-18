import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLead } from "@/lib/crm";
import { suggestForLead, type CopilotSuggestion, type LeadContext } from "@/lib/copilot";

function leadContext(lead: NonNullable<Awaited<ReturnType<typeof getLead>>>): LeadContext {
  const inbound = lead.messages.filter((message) => message.direction === "INBOUND");
  const latest = inbound.at(-1);
  return {
    title: lead.title,
    stage: lead.stage,
    source: lead.source,
    valueThb: lead.valueThb,
    lostReason: lead.lostReason,
    companyName: lead.company?.name ?? null,
    industry: lead.company?.industry ?? null,
    contactName: lead.contact?.name ?? null,
    ownerName: lead.owner?.name ?? null,
    inboundCount: inbound.length,
    latestInbound: latest?.body ?? null,
  };
}

export async function recordCopilotSuggestion(input: {
  leadId: string;
  actorId: string;
}): Promise<{ ok: true; suggestion: CopilotSuggestion } | { ok: false; code: "not_found" }> {
  const lead = await getLead(input.leadId);
  if (!lead) return { ok: false, code: "not_found" };

  const suggestion = await suggestForLead(leadContext(lead));
  const metadata: Prisma.InputJsonObject = {
    summary: suggestion.summary,
    score: suggestion.score,
    reasons: suggestion.reasons,
    nextAction: suggestion.nextAction,
    draftReply: suggestion.draftReply,
    source: suggestion.source,
    confirmedWrite: false,
    outbound: false,
    ...(suggestion.modelError ? { modelError: suggestion.modelError } : {}),
  };

  await prisma.activity.create({
    data: {
      leadId: lead.id,
      actorId: input.actorId,
      type: "AI_SUGGESTION",
      body: `Suggestion only (${suggestion.source}): score ${suggestion.score}. ${suggestion.nextAction}`,
      metadata,
    },
  });

  console.info(
    JSON.stringify({
      event: "copilot.suggestion",
      leadId: lead.id,
      source: suggestion.source,
      score: suggestion.score,
      modelError: suggestion.modelError ?? null,
    }),
  );

  return { ok: true, suggestion };
}

export async function saveLineDraft(input: {
  leadId: string;
  actorId: string;
  body: string;
}): Promise<{ ok: true; messageId: string } | { ok: false; code: "invalid" | "not_found" }> {
  const body = input.body.trim();
  if (body.length < 1 || body.length > 1000) return { ok: false, code: "invalid" };

  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, contactId: true },
  });
  if (!lead) return { ok: false, code: "not_found" };

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        leadId: lead.id,
        contactId: lead.contactId,
        channel: "LINE",
        direction: "OUTBOUND",
        status: "DRAFT",
        body,
      },
      select: { id: true },
    }),
    prisma.activity.create({
      data: {
        leadId: lead.id,
        actorId: input.actorId,
        type: "LINE_MESSAGE",
        body: "Saved a LINE draft. It has not been sent.",
        metadata: { status: "DRAFT", outbound: false },
      },
    }),
  ]);

  return { ok: true, messageId: message.id };
}
