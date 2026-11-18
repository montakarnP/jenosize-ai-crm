import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { listLeads } from "@/lib/crm";
import { createLeadRecord } from "@/lib/crm-commands";
import { parseSource, parseStage } from "@/lib/format";

export async function GET(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const url = new URL(request.url);
  const stageParam = url.searchParams.get("stage");
  const sourceParam = url.searchParams.get("source");
  const stage = stageParam ? parseStage(stageParam) : undefined;
  const source = sourceParam ? parseSource(sourceParam) : undefined;
  if (stageParam && !stage) {
    return apiError("invalid", "Stage must be NEW, QUALIFIED, PROPOSAL, WON, or LOST.", 400);
  }
  if (sourceParam && !source) {
    return apiError("invalid", "Source must be WEBSITE, MANUAL, or LINE.", 400);
  }

  const leads = await listLeads({
    q: url.searchParams.get("q") ?? undefined,
    stage: stage ?? undefined,
    source: source ?? undefined,
  });
  return apiData(leads);
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const body = await readJson(request);
  if (!isRecord(body)) return apiError("invalid", "Send a JSON lead.", 400);

  const valueRaw = Number(body.valueThb);
  const result = await createLeadRecord({
    actorId: session.uid,
    title: typeof body.title === "string" ? body.title : "",
    companyId: typeof body.companyId === "string" ? body.companyId : "",
    contactId: typeof body.contactId === "string" ? body.contactId : "",
    source: parseSource(body.source),
    valueThb: Number.isInteger(valueRaw) ? valueRaw : Number.NaN,
  });

  if (!result.ok) {
    if (result.code === "contact") {
      return apiError("contact", "Choose a contact that belongs to the selected company.", 400);
    }
    return apiError("invalid", "Check the title, value, and source.", 400);
  }

  revalidatePath("/");
  revalidatePath("/leads");
  return apiData({ id: result.leadId }, 201);
}
