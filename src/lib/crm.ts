import type { LeadSource, LeadStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LeadFilters = {
  q?: string;
  stage?: LeadStage;
  source?: LeadSource;
};

export function leadWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  const q = filters.q?.trim();
  return {
    stage: filters.stage,
    source: filters.source,
    OR: q
      ? [
          { title: { contains: q, mode: "insensitive" } },
          { company: { name: { contains: q, mode: "insensitive" } } },
          { contact: { name: { contains: q, mode: "insensitive" } } },
        ]
      : undefined,
  };
}

const publicOwner = {
  select: { id: true, name: true, title: true, email: true, role: true },
} as const;

const leadCard = {
  company: true,
  contact: true,
  owner: publicOwner,
  _count: {
    select: {
      messages: { where: { channel: "LINE", direction: "INBOUND", seenAt: null } },
    },
  },
} satisfies Prisma.LeadInclude;

export type TimelineItem = {
  id: string;
  at: Date;
  kind: "stage" | "note" | "ai" | "line" | "system" | "inbound" | "outbound";
  status: string | null;
  actor: string;
  body: string;
  fresh: boolean;
  messageId: string | null;
};

export function buildTimeline(lead: {
  contact: { name: string } | null;
  activities: Array<{
    id: string;
    createdAt: Date;
    type: string;
    body: string;
    actor: { name: string } | null;
  }>;
  messages: Array<{
    id: string;
    createdAt: Date;
    direction: string;
    status: string;
    body: string;
    seenAt: Date | null;
  }>;
}): TimelineItem[] {
  return [
    ...lead.activities.map((activity) => ({
      id: `activity-${activity.id}`,
      at: activity.createdAt,
      kind: (activity.type === "STAGE_CHANGE"
        ? "stage"
        : activity.type === "NOTE"
          ? "note"
          : activity.type === "AI_SUGGESTION"
            ? "ai"
            : activity.type === "LINE_MESSAGE"
              ? "line"
              : "system") as TimelineItem["kind"],
      status: null,
      actor: activity.actor?.name ?? "System",
      body: activity.body,
      fresh: false,
      messageId: null,
    })),
    ...lead.messages.map((message) => ({
      id: `message-${message.id}`,
      at: message.createdAt,
      kind: (message.direction === "INBOUND" ? "inbound" : "outbound") as TimelineItem["kind"],
      status: message.status,
      actor: message.direction === "INBOUND" ? (lead.contact?.name ?? "Contact") : "CRM",
      body: message.body,
      fresh: message.direction === "INBOUND" && message.seenAt == null,
      messageId: message.id,
    })),
  ].sort((left, right) => left.at.getTime() - right.at.getTime());
}

export async function listLeads(filters: LeadFilters) {
  return prisma.lead.findMany({
    where: leadWhere(filters),
    include: leadCard,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLead(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      ...leadCard,
      activities: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function listCompanies() {
  return prisma.company.findMany({
    include: { _count: { select: { contacts: true, leads: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCompany(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { name: "asc" } },
      leads: {
        include: { contact: true, owner: publicOwner },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function listContacts() {
  return prisma.contact.findMany({
    include: { company: true, _count: { select: { leads: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listCompaniesAndContacts() {
  const [companies, contacts] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.contact.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, title: true, companyId: true },
    }),
  ]);
  return { companies, contacts };
}
