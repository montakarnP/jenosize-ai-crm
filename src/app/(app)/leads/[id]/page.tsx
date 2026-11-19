import { PageFrame } from "@/components/page-frame";
import { notFound } from "next/navigation";
import { addNote, askCopilot, saveDraft, sendLine } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import { FormPending } from "@/components/form-pending";
import { LineStatus } from "@/components/line-status";
import { MarkSeen, NewFlag } from "@/components/new-flag";
import { StageBadge } from "@/components/stage-badge";
import { StageForm } from "@/components/stage-form";
import { readSuggestion } from "@/lib/copilot";
import { buildTimeline, type TimelineItem, getLead } from "@/lib/crm";
import { formatThb, formatWhen, sourceLabel } from "@/lib/format";
import { getLocale, stageText, t, type CopyKey, type Locale } from "@/lib/i18n";
import { cardClass, fieldClass, textareaClass } from "@/lib/ui";

function timelineLabel(locale: Locale, item: TimelineItem): string {
  if (item.kind === "inbound") return t(locale, "timeline.inbound");
  if (item.kind === "outbound") {
    const key = `status.${item.status ?? "SENT"}` as CopyKey;
    return t(locale, key);
  }
  if (item.kind === "stage") return t(locale, "timeline.stage");
  if (item.kind === "note") return t(locale, "timeline.note");
  if (item.kind === "ai") return t(locale, "timeline.ai");
  if (item.kind === "line") return t(locale, "timeline.line");
  return t(locale, "timeline.system");
}

function ChatLanguageField({ locale, value }: { locale: Locale; value: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{t(locale, "lead.chatLanguage")}</span>
      <select name="chatLanguage" defaultValue={value === "th" ? "th" : "en"} className={fieldClass}>
        <option value="en">{t(locale, "lang.en")}</option>
        <option value="th">{t(locale, "lang.th")}</option>
      </select>
      <span className="mt-1 block text-xs text-muted">{t(locale, "lead.chatLanguageHint")}</span>
    </label>
  );
}

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const locale = await getLocale();
  const lead = await getLead(id);
  if (!lead) notFound();

  const timeline = buildTimeline(lead);
  const chatLanguage = lead.contact?.chatLanguage === "th" ? "th" : "en";
  const stageLabels = {
    NEW: stageText(locale, "NEW"),
    QUALIFIED: stageText(locale, "QUALIFIED"),
    PROPOSAL: stageText(locale, "PROPOSAL"),
    WON: stageText(locale, "WON"),
    LOST: stageText(locale, "LOST"),
  } as const;

  const errorMessage =
    error === "lost-reason"
      ? t(locale, "lead.lostReasonError")
      : error === "note"
        ? t(locale, "lead.noteError")
        : error === "stage"
          ? t(locale, "lead.stageError")
          : error === "draft"
            ? t(locale, "lead.draftError")
            : error === "line-user"
              ? t(locale, "lead.lineUserError")
              : error === "line-send"
                ? t(locale, "lead.lineSendError")
                : error === "line-draft"
                  ? t(locale, "lead.lineDraftError")
                  : null;

  const unsent = lead.messages.filter(
    (message) => message.direction === "OUTBOUND" && (message.status === "DRAFT" || message.status === "FAILED"),
  );

  const suggestion = readSuggestion(
    [...lead.activities].reverse().find((activity) => activity.type === "AI_SUGGESTION")?.metadata,
  );

  return (
    <PageFrame
      back={{ href: "/leads", label: t(locale, "lead.back") }}
      title={
        <span className="inline-flex flex-wrap items-center gap-2">
          {lead.title}
          <StageBadge stage={lead.stage} label={stageText(locale, lead.stage)} />
        </span>
      }
      hint={`${lead.company?.name ?? t(locale, "common.noCompany")} · ${sourceLabel(lead.source)} · ${formatThb(lead.valueThb)}`}
    >
      <MarkSeen leadId={lead.id} enabled={timeline.some((item) => item.fresh)} />
      {errorMessage ? <p className="mb-4 text-sm text-red-800">{errorMessage}</p> : null}
      <section className={`mt-6 p-4 ${cardClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">{t(locale, "lead.copilot")}</h2>
            <p className="mt-1 text-sm text-muted">{t(locale, "lead.copilotHint")}</p>
          </div>
          <form action={askCopilot} className="w-full max-w-xs space-y-3">
            <FormPending />
            <input type="hidden" name="leadId" value={lead.id} />
            <ChatLanguageField locale={locale} value={chatLanguage} />
            <BlobButton tone="action">{t(locale, "lead.ask")}</BlobButton>
          </form>
        </div>
        {suggestion ? (
          <div className="mt-4 space-y-3 text-sm">
            <p>
              {t(locale, "lead.score")} {suggestion.score}
              <span className="text-muted"> · {suggestion.source === "model" ? t(locale, "lead.model") : t(locale, "lead.fallback")}</span>
            </p>
            {suggestion.modelError ? <p className="text-muted">{t(locale, "lead.modelError")}</p> : null}
            <p className="leading-6">{suggestion.summary}</p>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {suggestion.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p>
              <span className="text-muted">{t(locale, "lead.next")} </span>
              {suggestion.nextAction}
            </p>
            <form action={saveDraft} className="space-y-3 border-t border-line pt-4">
              <FormPending />
              <input type="hidden" name="leadId" value={lead.id} />
              <ChatLanguageField locale={locale} value={chatLanguage} />
              <label className="block">
                <span className="mb-1 block text-muted">{t(locale, "lead.draft")}</span>
                <textarea
                  name="body"
                  required
                  rows={4}
                  maxLength={1000}
                  defaultValue={suggestion.draftReply}
                  className={textareaClass}
                />
              </label>
              <BlobButton tone="action">{t(locale, "lead.saveDraft")}</BlobButton>
            </form>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">{t(locale, "lead.noSuggestion")}</p>
        )}
      </section>
      <div className="mt-6">
      <div className="row g-4">
        <div className="col-lg-4">
        <aside className="space-y-4">
          <section className={`p-4 ${cardClass}`}>
            <h2 className="text-sm font-medium">{t(locale, "lead.profile")}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">{t(locale, "lead.contact")}</dt>
                <dd>{lead.contact?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "lead.position")}</dt>
                <dd>{lead.contact?.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "lead.email")}</dt>
                <dd>{lead.contact?.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "lead.phone")}</dt>
                <dd>{lead.contact?.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "lead.line")}</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  <span>{lead.contact?.lineCode ?? "—"}</span>
                  <LineStatus
                    connected={Boolean(lead.contact?.lineUserId)}
                    connectedLabel={t(locale, "lead.connected")}
                    disconnectedLabel={t(locale, "lead.notConnected")}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "lead.owner")}</dt>
                <dd>
                  {lead.owner?.name ?? t(locale, "common.unassigned")}
                  {lead.owner?.title ? <span className="block text-muted">{lead.owner.title}</span> : null}
                </dd>
              </div>
              {lead.lostReason ? (
                <div>
                  <dt className="text-muted">{t(locale, "lead.lostReason")}</dt>
                  <dd>{lead.lostReason}</dd>
                </div>
              ) : null}
            </dl>
          </section>
          <section className={`p-4 ${cardClass}`}>
            <h2 className="text-sm font-medium">{t(locale, "lead.moveStage")}</h2>
            <div className="mt-3">
              <StageForm
                leadId={lead.id}
                stage={lead.stage}
                lostReason={lead.lostReason}
                labels={{
                  stage: t(locale, "common.stage"),
                  whyLost: t(locale, "lead.whyLost"),
                  save: t(locale, "lead.saveStage"),
                }}
                stageLabels={stageLabels}
              />
            </div>
          </section>
        </aside>
        </div>
        <div className="col-lg-8">
        <section className={`p-4 ${cardClass}`}>
          <h2 className="text-sm font-medium">{t(locale, "lead.timeline")}</h2>
          <ol className="mt-4 space-y-4">
            {timeline.length === 0 ? <li className="text-sm text-muted">{t(locale, "lead.noActivity")}</li> : null}
            {timeline.map((item) => (
              <li key={item.id} className="min-w-0 border-l-2 border-line pl-4">
                <p className="text-xs break-words text-muted">
                  {timelineLabel(locale, item)} · {item.actor === "System" ? t(locale, "timeline.system") : item.actor === "Contact" ? t(locale, "timeline.contact") : item.actor} · {formatWhen(item.at, locale)}
                  {item.messageId ? <NewFlag messageId={item.messageId} unseen={item.fresh} label={t(locale, "common.new")} /> : null}
                </p>
                <p className="mt-1 text-sm leading-6 break-words">{item.body}</p>
              </li>
            ))}
          </ol>
          {unsent.length > 0 ? (
            <div className="mt-6 space-y-3 border-t border-line pt-4">
              <h3 className="text-sm font-medium">{t(locale, "lead.unsent")}</h3>
              <p className="text-sm text-muted">{t(locale, "lead.unsentHint")}</p>
              {unsent.map((message) => (
                <form key={message.id} action={sendLine} className="space-y-2">
                  <FormPending />
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="messageId" value={message.id} />
                  <p className="text-sm leading-6">{message.body}</p>
                  {message.error ? <p className="text-sm text-red-800">{message.error}</p> : null}
                  <BlobButton tone="action">
                    {message.status === "FAILED" ? t(locale, "lead.retry") : t(locale, "lead.approve")}
                  </BlobButton>
                </form>
              ))}
            </div>
          ) : null}
          <form action={addNote} className="mt-6 space-y-3 border-t border-line pt-4">
            <FormPending />
            <input type="hidden" name="leadId" value={lead.id} />
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t(locale, "lead.addNote")}</span>
              <textarea
                name="body"
                required
                rows={3}
                maxLength={2000}
                className={textareaClass}
              />
            </label>
            <BlobButton tone="action">{t(locale, "lead.saveNote")}</BlobButton>
          </form>
        </section>
        </div>
      </div>
      </div>
    </PageFrame>
  );
}
