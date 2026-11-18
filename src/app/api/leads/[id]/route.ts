import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { buildTimeline, getLead } from "@/lib/crm";
import { changeLeadStage } from "@/lib/crm-commands";
import { parseStage } from "@/lib/format";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const lead = await getLead(id);
  if (!lead) return apiError("not_found", "Lead not found.", 404);
  return apiData({ ...lead, timeline: buildTimeline(lead) });
}

export async function PATCH(request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const body = await readJson(request);
  if (!isRecord(body)) return apiError("invalid", "Send a JSON stage change.", 400);

  const result = await changeLeadStage({
    leadId: id,
    actorId: session.uid,
    stage: parseStage(body.stage),
    lostReason: typeof body.lostReason === "string" ? body.lostReason : "",
  });

  if (!result.ok) {
    if (result.code === "not_found") return apiError("not_found", "Lead not found.", 404);
    if (result.code === "lost_reason") return apiError("lost_reason", "A lost lead needs a reason.", 400);
    return apiError("invalid", "Choose one of the five pipeline stages.", 400);
  }

  if (result.changed) {
    revalidatePath("/");
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
  }

  const lead = await getLead(id);
  return apiData(lead ? { ...lead, timeline: buildTimeline(lead), changed: result.changed } : { changed: result.changed });
}
