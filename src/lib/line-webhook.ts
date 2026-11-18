import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LineTextEvent = {
  webhookEventId: string;
  userId: string;
  text: string;
  replyToken: string | null;
  timestamp: number;
};

export function readLineWebhook(payload: unknown): { ok: true; events: LineTextEvent[] } | { ok: false } {
  if (typeof payload !== "object" || payload === null || !("events" in payload)) return { ok: false };
  const eventsField = payload.events;
  if (!Array.isArray(eventsField)) return { ok: false };

  const events: LineTextEvent[] = [];
  for (const event of eventsField) {
    if (typeof event !== "object" || event === null) return { ok: false };
    const record = event as Record<string, unknown>;
    if (record.type !== "message") continue;
    const message = record.message;
    const source = record.source;
    if (typeof message !== "object" || message === null || typeof source !== "object" || source === null) continue;
    const messageRecord = message as Record<string, unknown>;
    const sourceRecord = source as Record<string, unknown>;
    if (messageRecord.type !== "text" || typeof messageRecord.text !== "string") continue;
    if (sourceRecord.type !== "user" || typeof sourceRecord.userId !== "string") continue;
    if (typeof record.webhookEventId !== "string" || record.webhookEventId.length < 8) continue;
    const text = messageRecord.text.trim();
    if (text.length < 1 || text.length > 5000) continue;
    events.push({
      webhookEventId: record.webhookEventId,
      userId: sourceRecord.userId,
      text,
      replyToken: typeof record.replyToken === "string" ? record.replyToken : null,
      timestamp: typeof record.timestamp === "number" ? record.timestamp : Date.now(),
    });
  }
  return { ok: true, events };
}

async function leadForContact(contactId: string) {
  const leads = await prisma.lead.findMany({
    where: { contactId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, stage: true },
  });
  return leads.find((lead) => lead.stage !== "WON" && lead.stage !== "LOST") ?? leads[0] ?? null;
}

export async function ingestLineEvent(
  event: LineTextEvent,
): Promise<{ result: "accepted" | "duplicate" | "unmatched"; leadId: string | null }> {
  const contact = await prisma.contact.findUnique({
    where: { lineUserId: event.userId },
    select: { id: true, name: true },
  });
  const lead = contact ? await leadForContact(contact.id) : null;
  const createdAt = new Date(event.timestamp);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          leadId: lead?.id,
          contactId: contact?.id,
          channel: "LINE",
          direction: "INBOUND",
          status: "RECEIVED",
          body: event.text,
          externalId: event.webhookEventId,
          idempotencyKey: `line-event:${event.webhookEventId}`,
          replyToken: event.replyToken,
          createdAt,
        },
      });
      if (lead) {
        await tx.activity.create({
          data: {
            leadId: lead.id,
            type: "LINE_MESSAGE",
            body: `Received a LINE message from ${contact?.name ?? "the contact"}.`,
            createdAt,
            metadata: { status: "RECEIVED", outbound: false, webhookEventId: event.webhookEventId },
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { result: "duplicate", leadId: lead?.id ?? null };
    }
    throw error;
  }

  return { result: contact ? "accepted" : "unmatched", leadId: lead?.id ?? null };
}
