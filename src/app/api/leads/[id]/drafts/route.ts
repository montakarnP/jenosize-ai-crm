import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { saveLineDraft } from "@/lib/copilot-lead";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const body = await readJson(request);
  if (!isRecord(body) || typeof body.body !== "string") {
    return apiError("invalid", "Send a draft body.", 400);
  }

  const result = await saveLineDraft({ leadId: id, actorId: session.uid, body: body.body });
  if (!result.ok) {
    if (result.code === "not_found") return apiError("not_found", "Lead not found.", 404);
    return apiError("invalid", "Write a draft between 1 and 1000 characters.", 400);
  }

  revalidatePath(`/leads/${id}`);
  return apiData({ id: result.messageId, status: "DRAFT" }, 201);
}
