import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { addLeadNote } from "@/lib/crm-commands";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const body = await readJson(request);
  if (!isRecord(body) || typeof body.body !== "string") {
    return apiError("invalid", "Send a note body.", 400);
  }

  const result = await addLeadNote({ leadId: id, actorId: session.uid, body: body.body });
  if (!result.ok) {
    if (result.code === "not_found") return apiError("not_found", "Lead not found.", 404);
    return apiError("invalid", "Write a note between 1 and 2000 characters.", 400);
  }

  revalidatePath(`/leads/${id}`);
  return apiData({ id: result.activityId }, 201);
}
