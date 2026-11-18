import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { listCompanies } from "@/lib/crm";
import { createCompanyRecord } from "@/lib/crm-commands";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response;
  return apiData(await listCompanies());
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;
  const body = await readJson(request);
  if (!isRecord(body)) return apiError("invalid", "Send a JSON company.", 400);

  const result = await createCompanyRecord({
    name: typeof body.name === "string" ? body.name : "",
    industry: typeof body.industry === "string" ? body.industry : "",
  });
  if (!result.ok) {
    if (result.code === "duplicate") return apiError("duplicate", "That company name already exists.", 409);
    return apiError("invalid", "Enter a company name and one of the six industries.", 400);
  }
  revalidatePath("/companies");
  return apiData({ id: result.companyId }, 201);
}
