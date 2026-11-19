import { randomBytes } from "crypto";
import { Prisma, type LeadSource, type LeadStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { industries } from "@/lib/industries";
import { deliverLineText } from "@/lib/line-send";
import { lineDisconnectText } from "@/lib/line-webhook";

type Failure = {
  ok: false;
  code: "invalid" | "not_found" | "lost_reason" | "contact" | "duplicate" | "line_send";
};

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function changeLeadStage(input: {
  leadId: string;
  actorId: string;
  stage: LeadStage | null;
  lostReason: string;
}): Promise<{ ok: true; changed: boolean } | Failure> {
  if (!input.stage) return { ok: false, code: "invalid" };
  const lostReason = input.lostReason.trim();
  if (input.stage === "LOST" && lostReason.length === 0) return { ok: false, code: "lost_reason" };
  if (lostReason.length > 500) return { ok: false, code: "invalid" };

  const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) return { ok: false, code: "not_found" };
  if (lead.stage === input.stage && (input.stage !== "LOST" || lead.lostReason === lostReason)) {
    return { ok: true, changed: false };
  }

  const from = lead.stage;
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: input.leadId },
      data: { stage: input.stage, lostReason: input.stage === "LOST" ? lostReason : null },
    }),
    prisma.activity.create({
      data: {
        leadId: input.leadId,
        actorId: input.actorId,
        type: "STAGE_CHANGE",
        body:
          input.stage === "LOST"
            ? `Stage changed from ${from} to Lost. ${lostReason}`
            : `Stage changed from ${from} to ${input.stage}.`,
        metadata: { from, to: input.stage, lostReason: input.stage === "LOST" ? lostReason : null },
      },
    }),
  ]);

  console.info(
    JSON.stringify({
      event: "crm.stage",
      leadId: input.leadId,
      from,
      to: input.stage,
      lostReason: input.stage === "LOST",
    }),
  );
  return { ok: true, changed: true };
}

export async function addLeadNote(input: {
  leadId: string;
  actorId: string;
  body: string;
}): Promise<{ ok: true; activityId: string } | Failure> {
  const body = input.body.trim();
  if (body.length < 1 || body.length > 2000) return { ok: false, code: "invalid" };

  const lead = await prisma.lead.findUnique({ where: { id: input.leadId }, select: { id: true } });
  if (!lead) return { ok: false, code: "not_found" };

  const activity = await prisma.activity.create({
    data: { leadId: input.leadId, actorId: input.actorId, type: "NOTE", body },
    select: { id: true },
  });
  return { ok: true, activityId: activity.id };
}

export async function createLeadRecord(input: {
  actorId: string;
  title: string;
  companyId: string;
  contactId: string;
  source: LeadSource | null;
  valueThb: number;
}): Promise<{ ok: true; leadId: string } | Failure> {
  const title = input.title.trim();
  if (
    title.length < 2 ||
    title.length > 160 ||
    !input.source ||
    !Number.isInteger(input.valueThb) ||
    input.valueThb < 0
  ) {
    return { ok: false, code: "invalid" };
  }

  const contact = await prisma.contact.findUnique({ where: { id: input.contactId } });
  if (!contact || contact.companyId !== input.companyId) return { ok: false, code: "contact" };

  const lead = await prisma.lead.create({
    data: {
      title,
      companyId: input.companyId,
      contactId: input.contactId,
      ownerId: input.actorId,
      source: input.source,
      valueThb: input.valueThb,
      stage: "NEW",
      activities: {
        create: {
          actorId: input.actorId,
          type: "SYSTEM",
          body: "Lead created from the CRM.",
        },
      },
    },
    select: { id: true },
  });

  return { ok: true, leadId: lead.id };
}

export async function disconnectContactLine(contactId: string, actorId: string): Promise<{ ok: true } | Failure> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true, name: true, lineCode: true, lineUserId: true },
  });
  if (!contact) return { ok: false, code: "not_found" };
  if (!contact.lineUserId) return { ok: true };

  const body = lineDisconnectText(contact.name, contact.lineCode);
  const externalId = `disconnect:${contact.id}:${Date.now()}`;
  const result = await deliverLineText({
    to: contact.lineUserId,
    text: body,
    replyToken: null,
    externalId,
  });
  if (!result.ok) return { ok: false, code: "line_send" };

  const leads = await prisma.lead.findMany({
    where: { contactId: contact.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, stage: true },
  });
  const leadId = (leads.find((lead) => lead.stage !== "WON" && lead.stage !== "LOST") ?? leads[0])?.id ?? null;
  await prisma.message.create({
    data: {
      leadId,
      contactId: contact.id,
      channel: "LINE",
      direction: "OUTBOUND",
      status: "SENT",
      body,
      externalId: result.externalId,
      lineUserId: contact.lineUserId,
    },
  });
  if (leadId) {
    await prisma.activity.create({
      data: {
        leadId,
        actorId,
        type: "LINE_MESSAGE",
        body: `Told ${contact.name} on LINE that this account was disconnected.`,
        metadata: { status: "SENT", outbound: true },
      },
    });
  }
  await prisma.contact.update({ where: { id: contact.id }, data: { lineUserId: null } });
  return { ok: true };
}

export async function createCompanyRecord(input: {
  name: string;
  industry: string;
}): Promise<{ ok: true; companyId: string } | Failure> {
  const name = input.name.trim();
  const industry = input.industry.trim();
  if (name.length < 2 || name.length > 160) return { ok: false, code: "invalid" };
  if (!industries.includes(industry as (typeof industries)[number])) return { ok: false, code: "invalid" };

  const existing = await prisma.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return { ok: false, code: "duplicate" };

  const company = await prisma.company.create({
    data: { name, industry },
    select: { id: true },
  });
  return { ok: true, companyId: company.id };
}

export async function createContactRecord(input: {
  name: string;
  companyId: string;
  title: string;
  email: string;
  phone: string;
}): Promise<{ ok: true; contactId: string } | Failure> {
  const name = input.name.trim();
  const title = input.title.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (name.length < 2 || name.length > 120) return { ok: false, code: "invalid" };
  if (title.length > 120) return { ok: false, code: "invalid" };
  if (email && !emailPattern.test(email)) return { ok: false, code: "invalid" };
  if (phone.length > 40) return { ok: false, code: "invalid" };

  const company = await prisma.company.findUnique({ where: { id: input.companyId }, select: { id: true } });
  if (!company) return { ok: false, code: "not_found" };

  try {
    const contact = await prisma.contact.create({
      data: {
        name,
        companyId: input.companyId,
        title: title || null,
        email: email || null,
        phone: phone || null,
        lineCode: `LK-${randomBytes(3).toString("hex").toUpperCase()}`,
      },
      select: { id: true },
    });
    return { ok: true, contactId: contact.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, code: "duplicate" };
    }
    throw error;
  }
}
