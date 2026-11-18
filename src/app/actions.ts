"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { recordCopilotSuggestion, saveLineDraft } from "@/lib/copilot-lead";
import { sendApprovedDraft } from "@/lib/line-send";
import {
  addLeadNote,
  changeLeadStage,
  createCompanyRecord,
  createContactRecord,
  createLeadRecord,
} from "@/lib/crm-commands";
import { parseSource, parseStage } from "@/lib/format";
import { readSession, sessionCookieOptions, SESSION_COOKIE } from "@/lib/session";
import { signIn } from "@/lib/sign-in";

async function requireUser() {
  const jar = await cookies();
  const user = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect("/login");
  return user;
}

function refreshLead(leadId: string) {
  revalidatePath("/");
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/companies");
}

export async function login(formData: FormData) {
  const result = await signIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!result.ok) redirect(result.code === "config" ? "/login?error=config" : "/login?error=invalid");

  const jar = await cookies();
  jar.set(SESSION_COOKIE, result.user.token, sessionCookieOptions());
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  redirect("/login");
}

export async function updateStage(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const result = await changeLeadStage({
    leadId,
    actorId: user.uid,
    stage: parseStage(formData.get("stage")),
    lostReason: String(formData.get("lostReason") ?? ""),
  });

  if (!result.ok) {
    if (result.code === "not_found") redirect("/leads");
    redirect(`/leads/${leadId}?error=${result.code === "lost_reason" ? "lost-reason" : "stage"}`);
  }
  if (result.changed) refreshLead(leadId);
  redirect(`/leads/${leadId}`);
}

export async function addNote(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const result = await addLeadNote({
    leadId,
    actorId: user.uid,
    body: String(formData.get("body") ?? ""),
  });
  if (!result.ok) {
    if (result.code === "not_found") redirect("/leads");
    redirect(`/leads/${leadId}?error=note`);
  }
  refreshLead(leadId);
  redirect(`/leads/${leadId}`);
}

export async function askCopilot(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const result = await recordCopilotSuggestion({ leadId, actorId: user.uid });
  if (!result.ok) redirect("/leads");
  refreshLead(leadId);
  redirect(`/leads/${leadId}`);
}

export async function saveDraft(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const result = await saveLineDraft({
    leadId,
    actorId: user.uid,
    body: String(formData.get("body") ?? ""),
  });
  if (!result.ok) {
    if (result.code === "not_found") redirect("/leads");
    redirect(`/leads/${leadId}?error=draft`);
  }
  refreshLead(leadId);
  redirect(`/leads/${leadId}`);
}

export async function sendLine(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const messageId = String(formData.get("messageId") ?? "");
  const result = await sendApprovedDraft({ leadId, messageId, actorId: user.uid });
  if (!result.ok) {
    if (result.code === "not_found") redirect("/leads");
    const error = result.code === "no_line_user" ? "line-user" : result.code === "send_failed" ? "line-send" : "line-draft";
    redirect(`/leads/${leadId}?error=${error}`);
  }
  refreshLead(leadId);
  redirect(`/leads/${leadId}`);
}

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const valueRaw = Number(formData.get("valueThb"));
  const result = await createLeadRecord({
    actorId: user.uid,
    title: String(formData.get("title") ?? ""),
    companyId: String(formData.get("companyId") ?? ""),
    contactId: String(formData.get("contactId") ?? ""),
    source: parseSource(formData.get("source")),
    valueThb: Number.isInteger(valueRaw) ? valueRaw : Number.NaN,
  });

  if (!result.ok) redirect(result.code === "contact" ? "/leads/new?error=contact" : "/leads/new?error=invalid");
  refreshLead(result.leadId);
  redirect(`/leads/${result.leadId}`);
}

export async function createCompany(formData: FormData) {
  await requireUser();
  const result = await createCompanyRecord({
    name: String(formData.get("name") ?? ""),
    industry: String(formData.get("industry") ?? ""),
  });
  if (!result.ok) {
    redirect(result.code === "duplicate" ? "/companies/new?error=duplicate" : "/companies/new?error=invalid");
  }
  revalidatePath("/companies");
  revalidatePath("/leads/new");
  revalidatePath("/contacts/new");
  redirect(`/companies/${result.companyId}`);
}

export async function createContact(formData: FormData) {
  await requireUser();
  const result = await createContactRecord({
    name: String(formData.get("name") ?? ""),
    companyId: String(formData.get("companyId") ?? ""),
    title: String(formData.get("title") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!result.ok) {
    const error = result.code === "duplicate" ? "duplicate" : result.code === "not_found" ? "company" : "invalid";
    redirect(`/contacts/new?error=${error}`);
  }
  revalidatePath("/contacts");
  revalidatePath("/companies");
  revalidatePath("/leads/new");
  redirect("/contacts");
}
