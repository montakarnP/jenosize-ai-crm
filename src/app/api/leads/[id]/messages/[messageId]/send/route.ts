import { revalidatePath } from "next/cache";
import { apiData, apiError, requireSession } from "@/lib/api";
import { sendApprovedDraft } from "@/lib/line-send";

type Context = { params: Promise<{ id: string; messageId: string }> };

export async function POST(_request: Request, context: Context) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id, messageId } = await context.params;
  const result = await sendApprovedDraft({ leadId: id, messageId, actorId: session.uid });
  if (!result.ok) {
    if (result.code === "not_found") return apiError("not_found", "Draft not found.", 404);
    if (result.code === "no_line_user") return apiError("no_line_user", "This contact has no LINE user.", 400);
    if (result.code === "not_draft") return apiError("not_draft", "Only an unsent draft can be approved.", 409);
    return apiError("send_failed", "The LINE send failed. Retry the draft.", 502);
  }

  revalidatePath(`/leads/${id}`);
  return apiData({ status: result.status, already: result.already });
}
