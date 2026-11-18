import { revalidatePath } from "next/cache";
import { apiData, apiError, isRecord, readJson, requireSession } from "@/lib/api";
import { listContacts } from "@/lib/crm";
import { createContactRecord } from "@/lib/crm-commands";

export async function GET() {
  const { session, response } = await requireSession();
  if (!session) return response;
  return apiData(await listContacts());
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (!session) return response;
  const body = await readJson(request);
  if (!isRecord(body)) return apiError("invalid", "Send a JSON contact.", 400);

  const result = await createContactRecord({
    name: typeof body.name === "string" ? body.name : "",
    companyId: typeof body.companyId === "string" ? body.companyId : "",
    title: typeof body.title === "string" ? body.title : "",
    email: typeof body.email === "string" ? body.email : "",
    phone: typeof body.phone === "string" ? body.phone : "",
  });
  if (!result.ok) {
    if (result.code === "duplicate") return apiError("duplicate", "That email is already used.", 409);
    if (result.code === "not_found") return apiError("not_found", "Company not found.", 404);
    return apiError("invalid", "Check the name, email, and phone.", 400);
  }
  revalidatePath("/contacts");
  revalidatePath("/companies");
  return apiData({ id: result.contactId }, 201);
}
