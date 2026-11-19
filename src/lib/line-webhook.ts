import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LineTextEvent = {
  webhookEventId: string;
  userId: string;
  text: string;
  replyToken: string | null;
  timestamp: number;
};

export type LineFollowEvent = {
  webhookEventId: string;
  userId: string;
  replyToken: string | null;
  timestamp: number;
};

export function lineDisconnectText(contactName: string, lineCode: string): string {
  return [
    `This LINE account is no longer connected to ${contactName}.`,
    "Send I am and the LINE id to connect again.",
    `Example: I am ${lineCode}`,
    "",
    `บัญชี LINE นี้ไม่ได้เชื่อมกับ ${contactName} แล้ว`,
    "หากต้องการเชื่อมอีกครั้ง ให้ส่ง I am ตามด้วยรหัส LINE",
    `ตัวอย่าง: I am ${lineCode}`,
  ].join("\n");
}

export function lineGreetingText(): string {
  return [
    "Welcome to Jenosize.",
    "Send I am and your LINE id to connect this account to a contact.",
    "Example: I am LK-OISHI",
    "",
    "ยินดีต้อนรับสู่ Jenosize",
    "ส่ง I am ตามด้วย LINE id เพื่อเชื่อมบัญชีนี้กับผู้ติดต่อ",
    "ตัวอย่าง: I am LK-OISHI",
  ].join("\n");
}

export function lineEventIdempotencyKey(webhookEventId: string): string {
  return `line-event:${webhookEventId}`;
}

export function lineFollowIdempotencyKey(webhookEventId: string): string {
  return `line-follow:${webhookEventId}`;
}

export function readLineLinkClaim(text: string): string | null {
  const match = text.trim().match(/^i am\s+(.+)$/i);
  if (!match) return null;
  const code = match[1].trim();
  return code.length > 0 ? code : null;
}

export function decideLineLink(input: {
  senderUserId: string;
  senderContactId: string | null;
  target: { id: string; lineUserId: string | null } | null;
}): "missing" | "already_self" | "taken" | "connect" {
  if (!input.target) return "missing";
  if (input.senderContactId && input.senderContactId !== input.target.id) return "taken";
  if (input.target.lineUserId && input.target.lineUserId !== input.senderUserId) return "taken";
  if (input.target.lineUserId === input.senderUserId) return "already_self";
  return "connect";
}

export function lineLinkReply(decision: "missing" | "already_self" | "taken" | "connect", contactName: string): string {
  if (decision === "taken") return "It's cannot connect because it's connected with other account.";
  if (decision === "missing") return "That LINE id was not found.";
  if (decision === "already_self") return `This LINE account is already connected to ${contactName}.`;
  return `Connected to ${contactName}. Messages for this contact will come to this LINE account.`;
}

function readLineUser(record: Record<string, unknown>): LineFollowEvent | null {
  const source = record.source;
  if (typeof source !== "object" || source === null) return null;
  const sourceRecord = source as Record<string, unknown>;
  if (sourceRecord.type !== "user" || typeof sourceRecord.userId !== "string") return null;
  if (typeof record.webhookEventId !== "string" || record.webhookEventId.length < 8) return null;
  return {
    webhookEventId: record.webhookEventId,
    userId: sourceRecord.userId,
    replyToken: typeof record.replyToken === "string" ? record.replyToken : null,
    timestamp: typeof record.timestamp === "number" ? record.timestamp : Date.now(),
  };
}

export function readLineWebhook(
  payload: unknown,
): { ok: true; events: LineTextEvent[]; follows: LineFollowEvent[] } | { ok: false } {
  if (typeof payload !== "object" || payload === null || !("events" in payload)) return { ok: false };
  const eventsField = payload.events;
  if (!Array.isArray(eventsField)) return { ok: false };

  const events: LineTextEvent[] = [];
  const follows: LineFollowEvent[] = [];
  for (const event of eventsField) {
    if (typeof event !== "object" || event === null) return { ok: false };
    const record = event as Record<string, unknown>;
    if (record.type === "follow") {
      const follow = readLineUser(record);
      if (follow) follows.push(follow);
      continue;
    }
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
  return { ok: true, events, follows };
}

async function openLeadId(contactId: string): Promise<string | null> {
  const leads = await prisma.lead.findMany({
    where: { contactId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, stage: true },
  });
  return (leads.find((lead) => lead.stage !== "WON" && lead.stage !== "LOST") ?? leads[0])?.id ?? null;
}

async function storeInbound(input: {
  event: LineTextEvent;
  contactId: string | null;
  leadId: string | null;
  activityBody: string | null;
}) {
  const createdAt = new Date(input.event.timestamp);
  await prisma.message.create({
    data: {
      leadId: input.leadId,
      contactId: input.contactId,
      channel: "LINE",
      direction: "INBOUND",
      status: "RECEIVED",
      body: input.event.text,
      externalId: input.event.webhookEventId,
      lineUserId: input.event.userId,
      idempotencyKey: lineEventIdempotencyKey(input.event.webhookEventId),
      replyToken: input.event.replyToken,
      createdAt,
    },
  });
  if (input.leadId && input.activityBody) {
    await prisma.activity.create({
      data: {
        leadId: input.leadId,
        type: "LINE_MESSAGE",
        body: input.activityBody,
        createdAt,
        metadata: { status: "RECEIVED", outbound: false, webhookEventId: input.event.webhookEventId },
      },
    });
  }
}

async function sendLineNotice(event: LineTextEvent, contactId: string | null, leadId: string | null, body: string) {
  const { deliverLineText } = await import("@/lib/line-send");
  const result = await deliverLineText({
    to: event.userId,
    text: body,
    replyToken: event.replyToken,
    externalId: `link-reply:${event.webhookEventId}`,
  });
  await prisma.message.create({
    data: {
      leadId,
      contactId,
      channel: "LINE",
      direction: "OUTBOUND",
      status: result.ok ? "SENT" : "FAILED",
      body,
      externalId: `link-reply:${event.webhookEventId}`,
      lineUserId: event.userId,
      error: result.ok ? null : result.error,
    },
  });
}

export async function ingestLineEvent(
  event: LineTextEvent,
): Promise<{ result: "accepted" | "duplicate"; leadId: string | null }> {
  const claim = readLineLinkClaim(event.text);
  try {
    if (claim) return await ingestLineClaim(event, claim);
    return await ingestLineChat(event);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.message.findUnique({
        where: { idempotencyKey: lineEventIdempotencyKey(event.webhookEventId) },
        select: { leadId: true },
      });
      if (existing) return { result: "duplicate", leadId: existing.leadId };
    }
    throw error;
  }
}

async function ingestLineClaim(
  event: LineTextEvent,
  claim: string,
): Promise<{ result: "accepted"; leadId: string | null }> {
  const target = await prisma.contact.findFirst({
    where: { lineCode: { equals: claim, mode: "insensitive" } },
    select: { id: true, name: true, lineUserId: true },
  });
  const sender = await prisma.contact.findUnique({
    where: { lineUserId: event.userId },
    select: { id: true, name: true },
  });
  const decision = decideLineLink({
    senderUserId: event.userId,
    senderContactId: sender?.id ?? null,
    target: target ? { id: target.id, lineUserId: target.lineUserId } : null,
  });
  const contactName = target?.name ?? sender?.name ?? "this contact";
  const reply = lineLinkReply(decision, contactName);

  if (decision === "connect" && target) {
    await prisma.contact.update({ where: { id: target.id }, data: { lineUserId: event.userId } });
  }

  const contactId = decision === "connect" || decision === "already_self" ? target?.id ?? null : sender?.id ?? null;
  const leadId = contactId ? await openLeadId(contactId) : null;
  await storeInbound({
    event,
    contactId,
    leadId,
    activityBody: leadId ? `Received a LINE message from ${contactName}.` : null,
  });
  await sendLineNotice(event, contactId, leadId, reply);
  return { result: "accepted", leadId };
}

export async function ingestLineFollow(
  event: LineFollowEvent,
): Promise<{ result: "accepted" | "duplicate"; leadId: string | null }> {
  const contact = await prisma.contact.findUnique({
    where: { lineUserId: event.userId },
    select: { id: true, name: true },
  });
  const leadId = contact ? await openLeadId(contact.id) : null;
  const body = lineGreetingText();
  const externalId = `follow-greeting:${event.webhookEventId}`;

  let messageId: string;
  try {
    const message = await prisma.message.create({
      data: {
        leadId,
        contactId: contact?.id ?? null,
        channel: "LINE",
        direction: "OUTBOUND",
        status: "APPROVED",
        body,
        externalId,
        lineUserId: event.userId,
        idempotencyKey: lineFollowIdempotencyKey(event.webhookEventId),
        replyToken: event.replyToken,
        createdAt: new Date(event.timestamp),
      },
      select: { id: true },
    });
    messageId = message.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.message.findUnique({
        where: { idempotencyKey: lineFollowIdempotencyKey(event.webhookEventId) },
        select: { leadId: true },
      });
      return { result: "duplicate", leadId: existing?.leadId ?? leadId };
    }
    throw error;
  }

  const { deliverLineText } = await import("@/lib/line-send");
  const result = await deliverLineText({
    to: event.userId,
    text: body,
    replyToken: event.replyToken,
    externalId,
  });
  await prisma.message.update({
    where: { id: messageId },
    data: { status: result.ok ? "SENT" : "FAILED", error: result.ok ? null : result.error },
  });
  if (leadId) {
    await prisma.activity.create({
      data: {
        leadId,
        type: "LINE_MESSAGE",
        body: `Sent a LINE greeting to ${contact?.name ?? "the contact"}.`,
        createdAt: new Date(event.timestamp),
        metadata: { status: result.ok ? "SENT" : "FAILED", outbound: true, webhookEventId: event.webhookEventId },
      },
    });
  }
  console.info(
    JSON.stringify({
      event: "line.send",
      messageId,
      mode: process.env.LINE_MODE === "live" ? "live" : "mock",
      status: result.ok ? "SENT" : "FAILED",
      kind: "greeting",
    }),
  );
  return { result: "accepted", leadId };
}

async function ingestLineChat(event: LineTextEvent): Promise<{ result: "accepted"; leadId: string | null }> {
  const contact = await prisma.contact.findUnique({
    where: { lineUserId: event.userId },
    select: { id: true, name: true },
  });
  const leadId = contact ? await openLeadId(contact.id) : null;
  await storeInbound({
    event,
    contactId: contact?.id ?? null,
    leadId,
    activityBody: contact ? `Received a LINE message from ${contact.name}.` : null,
  });
  return { result: "accepted", leadId };
}
