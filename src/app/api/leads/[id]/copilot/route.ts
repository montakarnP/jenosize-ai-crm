import { revalidatePath } from "next/cache";
import { apiData, apiError, requireSession } from "@/lib/api";
import { recordCopilotSuggestion } from "@/lib/copilot-lead";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const result = await recordCopilotSuggestion({ leadId: id, actorId: session.uid });
  if (!result.ok) return apiError("not_found", "Lead not found.", 404);

  revalidatePath(`/leads/${id}`);
  return apiData(result.suggestion);
}
