import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { parseChatLanguage, recordCopilotSuggestion } from "@/lib/copilot-lead";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const body = await readJson(request);
  const result = await recordCopilotSuggestion({
    leadId: id,
    actorId: session.uid,
    chatLanguage: parseChatLanguage(isRecord(body) ? body.chatLanguage : null),
  });
  if (!result.ok) return apiError("not_found", "Lead not found.", 404);

  revalidatePath(`/leads/${id}`);
  return apiData(result.suggestion);
}
