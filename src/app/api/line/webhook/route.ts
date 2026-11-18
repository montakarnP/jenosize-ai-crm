import { revalidatePath } from "next/cache";
import { apiData, apiError } from "@/lib/api";
import { lineSignaturesMatch } from "@/lib/line-signature";
import { ingestLineEvent, readLineWebhook } from "@/lib/line-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET?.trim() ?? "";
  if (!secret) return apiError("config", "LINE channel secret is not configured.", 503);

  const raw = await request.text();
  if (!lineSignaturesMatch(raw, secret, request.headers.get("x-line-signature"))) {
    return apiError("signature", "Invalid LINE signature.", 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return apiError("invalid", "LINE webhook body must be JSON.", 400);
  }

  const parsed = readLineWebhook(payload);
  if (!parsed.ok) return apiError("invalid", "LINE webhook events are missing.", 400);

  const counts = { accepted: 0, duplicates: 0, unmatched: 0 };
  for (const event of parsed.events) {
    const outcome = await ingestLineEvent(event);
    if (outcome.result === "accepted") counts.accepted += 1;
    else if (outcome.result === "duplicate") counts.duplicates += 1;
    else counts.unmatched += 1;
    if (outcome.leadId) revalidatePath(`/leads/${outcome.leadId}`);
  }

  console.info(JSON.stringify({ event: "line.webhook", ...counts }));
  return apiData(counts);
}
