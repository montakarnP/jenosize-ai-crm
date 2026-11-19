import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./db";
import { changeLeadStage, createContactRecord, createCompanyRecord, createLeadRecord, disconnectContactLine } from "./crm-commands";
import { readFilters } from "./filters";

test("core CRM flow creates a lead and requires a reason before Lost", async () => {
  const filters = readFilters({ q: "  pipeline  ", stage: "QUALIFIED", source: "NOT_A_SOURCE" });
  assert.equal(filters.q, "pipeline");
  assert.equal(filters.stage, "QUALIFIED");
  assert.equal(filters.source, undefined);

  const suffix = Date.now().toString();
  const company = await createCompanyRecord({ name: `Test Pipeline ${suffix}`, industry: "Retail" });
  assert.equal(company.ok, true);
  if (!company.ok) return;

  const contact = await createContactRecord({
    name: `Test Contact ${suffix}`,
    companyId: company.companyId,
    title: "Buyer",
    email: `test-${suffix}@example.test`,
    phone: "",
  });
  assert.equal(contact.ok, true);
  if (!contact.ok) return;

  try {
    const lead = await createLeadRecord({
      actorId: "user_anna",
      title: `Test lead ${suffix}`,
      companyId: company.companyId,
      contactId: contact.contactId,
      source: "MANUAL",
      valueThb: 1000,
    });
    assert.equal(lead.ok, true);
    if (!lead.ok) return;

    const created = await prisma.lead.findUnique({ where: { id: lead.leadId }, select: { stage: true } });
    assert.equal(created?.stage, "NEW");

    const blocked = await changeLeadStage({
      leadId: lead.leadId,
      actorId: "user_anna",
      stage: "LOST",
      lostReason: "   ",
    });
    assert.deepEqual(blocked, { ok: false, code: "lost_reason" });

    const stillNew = await prisma.lead.findUnique({ where: { id: lead.leadId }, select: { stage: true } });
    assert.equal(stillNew?.stage, "NEW");

    const lost = await changeLeadStage({
      leadId: lead.leadId,
      actorId: "user_anna",
      stage: "LOST",
      lostReason: "Test budget frozen",
    });
    assert.deepEqual(lost, { ok: true, changed: true });
  } finally {
    await prisma.activity.deleteMany({ where: { lead: { companyId: company.companyId } } });
    await prisma.lead.deleteMany({ where: { companyId: company.companyId } });
    await prisma.contact.deleteMany({ where: { companyId: company.companyId } });
    await prisma.company.delete({ where: { id: company.companyId } });
  }
});

test("disconnect tells LINE before the account link is removed", async () => {
  const previousMode = process.env.LINE_MODE;
  process.env.LINE_MODE = "mock";
  const suffix = Date.now().toString();
  const company = await createCompanyRecord({ name: `Test Disconnect ${suffix}`, industry: "Retail" });
  assert.equal(company.ok, true);
  if (!company.ok) return;
  const contact = await createContactRecord({
    name: `Disconnect Contact ${suffix}`,
    companyId: company.companyId,
    title: "Buyer",
    email: `disconnect-${suffix}@example.test`,
    phone: "",
  });
  assert.equal(contact.ok, true);
  if (!contact.ok) return;

  try {
    await prisma.contact.update({
      where: { id: contact.contactId },
      data: { lineUserId: `Udisconnect${suffix}` },
    });
    const lead = await createLeadRecord({
      actorId: "user_anna",
      title: `Disconnect lead ${suffix}`,
      companyId: company.companyId,
      contactId: contact.contactId,
      source: "LINE",
      valueThb: 1000,
    });
    assert.equal(lead.ok, true);
    if (!lead.ok) return;

    const result = await disconnectContactLine(contact.contactId, "user_anna");
    assert.deepEqual(result, { ok: true });

    const saved = await prisma.contact.findUnique({
      where: { id: contact.contactId },
      select: { lineUserId: true, lineCode: true, name: true },
    });
    assert.equal(saved?.lineUserId, null);
    const notice = await prisma.message.findFirst({
      where: { contactId: contact.contactId, direction: "OUTBOUND" },
      select: { status: true, body: true, leadId: true },
    });
    assert.equal(notice?.status, "SENT");
    assert.equal(notice?.leadId, lead.leadId);
    assert.match(notice?.body ?? "", new RegExp(`no longer connected to ${saved?.name}`));
    assert.match(notice?.body ?? "", new RegExp(`I am ${saved?.lineCode}`));

    const previousToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    process.env.LINE_MODE = "live";
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token-not-a-secret";
    await prisma.contact.update({
      where: { id: contact.contactId },
      data: { lineUserId: `Udisconnect${suffix}` },
    });
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(null, { status: 400 });
    try {
      const blocked = await disconnectContactLine(contact.contactId, "user_anna");
      assert.deepEqual(blocked, { ok: false, code: "line_send" });
      const still = await prisma.contact.findUnique({
        where: { id: contact.contactId },
        select: { lineUserId: true },
      });
      assert.equal(still?.lineUserId, `Udisconnect${suffix}`);
    } finally {
      globalThis.fetch = original;
      process.env.LINE_CHANNEL_ACCESS_TOKEN = previousToken;
    }
  } finally {
    process.env.LINE_MODE = previousMode;
    await prisma.message.deleteMany({ where: { contactId: contact.contactId } });
    await prisma.activity.deleteMany({ where: { lead: { companyId: company.companyId } } });
    await prisma.lead.deleteMany({ where: { companyId: company.companyId } });
    await prisma.contact.deleteMany({ where: { companyId: company.companyId } });
    await prisma.company.delete({ where: { id: company.companyId } });
  }
});
