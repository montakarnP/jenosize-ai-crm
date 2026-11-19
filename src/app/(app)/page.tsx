import { AppLink as Link } from "@/components/app-link";
import { Filters } from "@/components/filters";
import { PageFrame } from "@/components/page-frame";
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
    <PageFrame
      title={t(locale, "pipeline.welcome")}
      hint={
        <>
          <p>{t(locale, "pipeline.intro")}</p>
          <p className="mt-1">{t(locale, "pipeline.count", { count: leads.length })}</p>
        </>
      }
      aside={
        <aside className="crm-quick">
          <h2>{t(locale, "pipeline.quickLinks")}</h2>
          <Link href="/leads/new">{t(locale, "pipeline.newLead")}</Link>
          <Link href="/leads">{t(locale, "nav.leads")}</Link>
          <Link href="/contacts">{t(locale, "nav.contacts")}</Link>
        </aside>
      }
    >
      <Filters action="/" q={params.q ?? ""} stage={params.stage ?? ""} source={params.source ?? ""} />
      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3 mt-1">
        {STAGES.map((stage) => {
          const column = leads.filter((lead) => lead.stage === stage);
          return (
            <div className="col" key={stage}>
              <section className="h-full min-w-0 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(32,76,213,0.06)]">
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
                      <p className="mt-2 text-sm font-medium break-words">{lead.title}</p>
                      <p className="mt-1 text-sm break-words text-muted">{lead.company?.name ?? t(locale, "common.noCompany")}</p>
                      <p className="mt-2 text-xs text-muted">
                        {formatThb(lead.valueThb)} · {sourceText(locale, lead.source)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </PageFrame>
  );
}
