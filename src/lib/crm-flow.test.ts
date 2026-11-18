import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "./db";
import { changeLeadStage, createContactRecord, createCompanyRecord, createLeadRecord } from "./crm-commands";
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
