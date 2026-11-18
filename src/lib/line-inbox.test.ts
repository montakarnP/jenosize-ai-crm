import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./db";
import { ingestLineEvent } from "./line-webhook";

test("the same LINE webhook event is stored once", async () => {
  const userId = `Udup${Date.now()}`;
  const webhookEventId = `evt-dup-${userId}`;
  const event = {
    webhookEventId,
    userId,
    text: "hello again",
    replyToken: null,
    timestamp: Date.now(),
  };

  try {
    const first = await ingestLineEvent(event);
    const second = await ingestLineEvent(event);
    assert.equal(first.result, "accepted");
    assert.equal(second.result, "duplicate");
    const stored = await prisma.message.count({ where: { idempotencyKey: `line-event:${webhookEventId}` } });
    assert.equal(stored, 1);
  } finally {
    await prisma.message.deleteMany({ where: { lineUserId: userId } });
  }
});

test("I am connects a phone to the mock LINE id", async () => {
  const previousMode = process.env.LINE_MODE;
  process.env.LINE_MODE = "mock";
  const userId = `Utest${Date.now()}`;
  const code = `LK-T${Date.now().toString(36).toUpperCase()}`;
  const contact = await prisma.contact.create({
    data: { name: "Link Test", lineCode: code },
    select: { id: true },
  });
  const lead = await prisma.lead.create({
    data: { title: "Link test lead", contactId: contact.id, source: "LINE", stage: "NEW" },
    select: { id: true },
  });

  try {
    const linked = await ingestLineEvent({
      webhookEventId: `evt-link-${userId}`,
      userId,
      text: `I am ${code}`,
      replyToken: null,
      timestamp: Date.now(),
    });
    assert.equal(linked.result, "accepted");
    assert.equal(linked.leadId, lead.id);
    const saved = await prisma.contact.findUnique({ where: { id: contact.id }, select: { lineUserId: true } });
    assert.equal(saved?.lineUserId, userId);

    const other = await prisma.contact.create({
      data: { name: "Other Test", lineCode: `${code}-2` },
      select: { id: true },
    });
    const refused = await ingestLineEvent({
      webhookEventId: `evt-refuse-${userId}`,
      userId,
      text: `I am ${code}-2`,
      replyToken: null,
      timestamp: Date.now(),
    });
    assert.equal(refused.leadId, lead.id);
    const otherSaved = await prisma.contact.findUnique({ where: { id: other.id }, select: { lineUserId: true } });
    assert.equal(otherSaved?.lineUserId, null);
    const reply = await prisma.message.findFirst({
      where: { externalId: `link-reply:evt-refuse-${userId}` },
      select: { body: true },
    });
    assert.equal(reply?.body, "It's cannot connect because it's connected with other account.");
    await prisma.contact.delete({ where: { id: other.id } });
  } finally {
    process.env.LINE_MODE = previousMode;
    await prisma.message.deleteMany({ where: { lineUserId: userId } });
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.contact.delete({ where: { id: contact.id } });
  }
});
