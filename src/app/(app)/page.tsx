import { AppLink as Link } from "@/components/app-link";
import { BlobLink } from "@/components/blob-button";
import { Filters } from "@/components/filters";
import { StageBadge } from "@/components/stage-badge";
import { UnreadBadge } from "@/components/unread-badge";
import { listLeads } from "@/lib/crm";
import { readFilters } from "@/lib/filters";
import { STAGES, formatThb } from "@/lib/format";
import { getLocale, sourceText, stageText, t } from "@/lib/i18n";
import { cardClass } from "@/lib/ui";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; source?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const filters = readFilters(params);
  const leads = await listLeads(filters);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "pipeline.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t(locale, "pipeline.count", { count: leads.length })}</p>
        </div>
        <BlobLink href="/leads/new">{t(locale, "pipeline.newLead")}</BlobLink>
      </div>
      <div className="mt-5">
        <Filters action="/" q={params.q ?? ""} stage={params.stage ?? ""} source={params.source ?? ""} />
      </div>
      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const column = leads.filter((lead) => lead.stage === stage);
          return (
            <section key={stage} className="w-72 shrink-0 rounded-2xl border border-line bg-white/75 p-3">
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium">{stageText(locale, stage)}</h2>
                <span className="text-xs text-muted">{column.length}</span>
              </header>
              <div className="space-y-2">
                {column.length === 0 ? <p className="text-sm text-muted">{t(locale, "pipeline.empty")}</p> : null}
                {column.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className={`block p-3 transition-colors hover:border-brand ${cardClass}`}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <StageBadge stage={lead.stage} label={stageText(locale, lead.stage)} />
                      <UnreadBadge count={lead._count.messages} label={t(locale, "common.new")} />
                    </span>
                    <p className="mt-2 text-sm font-medium">{lead.title}</p>
                    <p className="mt-1 text-sm text-muted">{lead.company?.name ?? t(locale, "common.noCompany")}</p>
                    <p className="mt-2 text-xs text-muted">
                      {formatThb(lead.valueThb)} · {sourceText(locale, lead.source)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
