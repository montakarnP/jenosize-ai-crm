import { apiData, apiError, requireSession } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, email: true, name: true, title: true, role: true },
  });
  if (!user) return apiError("unauthorized", "Sign in required.", 401);
  return apiData(user);
}
