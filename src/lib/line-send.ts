import { prisma } from "@/lib/db";

type SendFailure = { ok: false; code: "not_found" | "no_line_user" | "not_draft" | "send_failed" };

function lineMode(): "mock" | "live" {
  return process.env.LINE_MODE === "live" ? "live" : "mock";
}

async function postLine(path: "reply" | "push", body: unknown, token: string): Promise<Response> {
  return fetch(`https://api.line.me/v2/bot/message/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
}

async function deliverOnce(input: {
  to: string;
  text: string;
  replyToken: string | null;
  externalId: string;
}): Promise<{ ok: true; externalId: string } | { ok: false; error: string; retryable: boolean }> {
  if (lineMode() === "mock") return { ok: true, externalId: input.externalId };

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) return { ok: false, error: "LINE access token is not configured.", retryable: false };

  try {
    const response = input.replyToken
      ? await postLine("reply", { replyToken: input.replyToken, messages: [{ type: "text", text: input.text }] }, token)
      : await postLine("push", { to: input.to, messages: [{ type: "text", text: input.text }] }, token);
    if (response.ok) return { ok: true, externalId: input.externalId };
    const retryable = response.status === 429 || response.status >= 500;
    return { ok: false, error: `LINE returned ${response.status}.`, retryable };
  } catch {
    return { ok: false, error: "LINE did not respond.", retryable: true };
  }
}

async function deliverLineText(input: {
  to: string;
  text: string;
  replyToken: string | null;
  externalId: string;
}): Promise<{ ok: true; externalId: string } | { ok: false; error: string }> {
  const first = await deliverOnce(input);
  if (first.ok || !first.retryable) return first.ok ? first : { ok: false, error: first.error };
  const second = await deliverOnce(input);
  return second.ok ? second : { ok: false, error: second.error };
}

export async function sendApprovedDraft(input: {
  leadId: string;
  messageId: string;
  actorId: string;
}): Promise<{ ok: true; status: "SENT"; already: boolean } | SendFailure> {
  const message = await prisma.message.findFirst({
    where: { id: input.messageId, leadId: input.leadId, channel: "LINE", direction: "OUTBOUND" },
    include: { lead: { select: { contact: { select: { lineUserId: true, name: true } } } } },
  });
  if (!message) return { ok: false, code: "not_found" };
  if (message.status === "SENT") return { ok: true, status: "SENT", already: true };
  if (message.status !== "DRAFT" && message.status !== "FAILED") return { ok: false, code: "not_draft" };

  const lineUserId = message.lead?.contact?.lineUserId;
  if (!lineUserId) return { ok: false, code: "no_line_user" };

  const claimed = await prisma.message.updateMany({
    where: { id: message.id, status: { in: ["DRAFT", "FAILED"] } },
    data: { status: "APPROVED", error: null },
  });
  if (claimed.count === 0) {
    const current = await prisma.message.findUnique({ where: { id: message.id }, select: { status: true } });
    if (current?.status === "SENT") return { ok: true, status: "SENT", already: true };
    return { ok: false, code: "not_draft" };
  }

  const inbound = await prisma.message.findFirst({
    where: { leadId: input.leadId, direction: "INBOUND", replyToken: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { replyToken: true },
  });
  const externalId = `send:${message.id}`;
  const result = await deliverLineText({
    to: lineUserId,
    text: message.body,
    replyToken: lineMode() === "live" ? (inbound?.replyToken ?? null) : null,
    externalId,
  });

  if (!result.ok) {
    await prisma.message.update({
      where: { id: message.id },
      data: { status: "FAILED", error: result.error },
    });
    await prisma.activity.create({
      data: {
        leadId: input.leadId,
        actorId: input.actorId,
        type: "LINE_MESSAGE",
        body: `LINE send failed. ${result.error}`,
        metadata: { status: "FAILED", outbound: false },
      },
    });
    console.info(JSON.stringify({ event: "line.send", messageId: message.id, mode: lineMode(), status: "FAILED" }));
    return { ok: false, code: "send_failed" };
  }

  await prisma.message.update({
    where: { id: message.id },
    data: { status: "SENT", externalId: result.externalId, error: null },
  });
  await prisma.activity.create({
    data: {
      leadId: input.leadId,
      actorId: input.actorId,
      type: "LINE_MESSAGE",
      body:
        lineMode() === "mock"
          ? "Approved and recorded locally. The mock LINE adapter did not call LINE."
          : "Approved and sent on LINE.",
      metadata: { status: "SENT", outbound: lineMode() === "live", mode: lineMode() },
    },
  });
  console.info(JSON.stringify({ event: "line.send", messageId: message.id, mode: lineMode(), status: "SENT" }));
  return { ok: true, status: "SENT", already: false };
}
