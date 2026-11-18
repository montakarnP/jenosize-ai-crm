import { revalidatePath } from "next/cache";
import { apiData, requireSession } from "@/lib/api";
import { prisma } from "@/lib/db";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return apiData({ seen: 0 });

  const result = await prisma.message.updateMany({
    where: { leadId: id, direction: "INBOUND", seenAt: null },
    data: { seenAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/leads");
  return apiData({ seen: result.count });
}
