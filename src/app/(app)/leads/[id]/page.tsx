import Link from "next/link";
import { notFound } from "next/navigation";
import { addNote, askCopilot, saveDraft, sendLine } from "@/app/actions";
import { StageBadge } from "@/components/stage-badge";
import { StageForm } from "@/components/stage-form";
import { readSuggestion } from "@/lib/copilot";
import { buildTimeline, getLead } from "@/lib/crm";
import { formatThb, formatWhen, sourceLabel } from "@/lib/format";
import { cardClass, primaryButtonClass, textareaClass } from "@/lib/ui";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const lead = await getLead(id);
  if (!lead) notFound();

  const timeline = buildTimeline(lead);

  const errorMessage =
    error === "lost-reason"
      ? "A lost lead needs a reason."
      : error === "note"
        ? "Write a note between 1 and 2000 characters."
        : error === "stage"
          ? "Choose one of the five pipeline stages."
          : error === "draft"
            ? "Write a LINE draft between 1 and 1000 characters."
            : error === "line-user"
              ? "This contact has no LINE user, so the draft was not sent."
              : error === "line-send"
                ? "LINE did not accept the message. The draft can be retried."
                : error === "line-draft"
                  ? "Only an unsent draft can be approved."
                  : null;

  const unsent = lead.messages.filter(
    (message) => message.direction === "OUTBOUND" && (message.status === "DRAFT" || message.status === "FAILED"),
  );

  const suggestion = readSuggestion(
    [...lead.activities].reverse().find((activity) => activity.type === "AI_SUGGESTION")?.metadata,
  );

  return (
    <main>
      <Link href="/leads" className="text-sm text-brand">
        Back to leads
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{lead.title}</h1>
            <StageBadge stage={lead.stage} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {lead.company?.name ?? "No company"} · {sourceLabel(lead.source)} · {formatThb(lead.valueThb)}
          </p>
        </div>
      </div>
      {errorMessage ? <p className="mt-4 text-sm text-red-800">{errorMessage}</p> : null}
      <section className={`mt-6 p-4 ${cardClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">AI copilot</h2>
            <p className="mt-1 text-sm text-muted">
              A suggestion does not change the stage and does not send LINE. Saving a draft keeps it unsent.
            </p>
          </div>
          <form action={askCopilot}>
            <input type="hidden" name="leadId" value={lead.id} />
            <button className={primaryButtonClass}>Ask copilot</button>
          </form>
        </div>
        {suggestion ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              Score {suggestion.score}
              <span className="text-muted"> · {suggestion.source === "model" ? "model" : "fallback"}</span>
            </p>
            {suggestion.modelError ? (
              <p className="text-muted">The model was unavailable, so this is the deterministic fallback.</p>
            ) : null}
            <p className="leading-6">{suggestion.summary}</p>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {suggestion.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p>
              <span className="text-muted">Next action. </span>
              {suggestion.nextAction}
            </p>
            <form action={saveDraft} className="space-y-3 border-t border-line pt-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <label className="block">
                <span className="mb-1 block text-muted">LINE draft</span>
                <textarea
                  name="body"
                  required
                  rows={4}
                  maxLength={1000}
                  defaultValue={suggestion.draftReply}
                  className={textareaClass}
                />
              </label>
              <button className={primaryButtonClass}>Save draft</button>
            </form>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">No suggestion yet.</p>
        )}
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-4">
          <section className={`p-4 ${cardClass}`}>
            <h2 className="text-sm font-medium">Profile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Contact</dt>
                <dd>{lead.contact?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Title</dt>
                <dd>{lead.contact?.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd>{lead.contact?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{lead.contact?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">LINE user</dt>
                <dd className="break-all">{lead.contact?.lineUserId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Owner</dt>
                <dd>
                  {lead.owner?.name ?? "Unassigned"}
                  {lead.owner?.title ? <span className="block text-muted">{lead.owner.title}</span> : null}
                </dd>
              </div>
              {lead.lostReason ? (
                <div>
                  <dt className="text-muted">Lost reason</dt>
                  <dd>{lead.lostReason}</dd>
                </div>
              ) : null}
            </dl>
          </section>
          <section className={`p-4 ${cardClass}`}>
            <h2 className="text-sm font-medium">Move stage</h2>
            <div className="mt-3">
              <StageForm leadId={lead.id} stage={lead.stage} lostReason={lead.lostReason} />
            </div>
          </section>
        </aside>
        <section className={`p-4 ${cardClass}`}>
          <h2 className="text-sm font-medium">Timeline</h2>
          <ol className="mt-4 space-y-4">
            {timeline.length === 0 ? <li className="text-sm text-muted">No activity yet.</li> : null}
            {timeline.map((item) => (
              <li key={item.id} className="border-l-2 border-line pl-4">
                <p className="text-xs text-muted">
                  {item.label} · {item.actor} · {formatWhen(item.at)}
                </p>
                <p className="mt-1 text-sm leading-6">{item.body}</p>
              </li>
            ))}
          </ol>
          {unsent.length > 0 ? (
            <div className="mt-6 space-y-3 border-t border-line pt-4">
              <h3 className="text-sm font-medium">Unsent LINE replies</h3>
              <p className="text-sm text-muted">Approving a draft records it locally while LINE mode is mock.</p>
              {unsent.map((message) => (
                <form key={message.id} action={sendLine} className="space-y-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="messageId" value={message.id} />
                  <p className="text-sm leading-6">{message.body}</p>
                  {message.error ? <p className="text-sm text-red-800">{message.error}</p> : null}
                  <button className={primaryButtonClass}>
                    {message.status === "FAILED" ? "Retry send" : "Approve and send"}
                  </button>
                </form>
              ))}
            </div>
          ) : null}
          <form action={addNote} className="mt-6 space-y-3 border-t border-line pt-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Add a note</span>
              <textarea
                name="body"
                required
                rows={3}
                maxLength={2000}
                className={textareaClass}
              />
            </label>
            <button className={primaryButtonClass}>Save note</button>
          </form>
        </section>
      </div>
    </main>
  );
}
