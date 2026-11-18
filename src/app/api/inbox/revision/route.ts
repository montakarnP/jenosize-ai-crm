import { apiData, requireSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response;

  const [messages, contacts, unseen] = await Promise.all([
    prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, status: true, leadId: true },
    }),
    prisma.contact.findMany({
      where: { lineUserId: { not: null } },
      select: { id: true },
      orderBy: { id: "asc" },
    }),
    prisma.message.findMany({
      where: { direction: "INBOUND", seenAt: null },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: { id: true, leadId: true },
    }),
  ]);

  const stream = [
    messages.map((message) => `${message.id}:${message.status}:${message.leadId ?? ""}`).join(","),
    contacts.map((contact) => contact.id).join(","),
  ].join("|");
  const unread = unseen.map((message) => `${message.leadId ?? ""}:${message.id}`).join(",");

  return apiData({ stream, unread });
}
