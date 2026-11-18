import { apiData, apiError, requireSession } from "@/lib/api";
import { getCompany } from "@/lib/crm";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireSession();
  if (!session) return response;

  const { id } = await context.params;
  const company = await getCompany(id);
  if (!company) return apiError("not_found", "Company not found.", 404);
  return apiData(company);
}
