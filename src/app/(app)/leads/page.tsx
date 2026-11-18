import { AppLink as Link } from "@/components/app-link";
import { BlobLink } from "@/components/blob-button";
import { Filters } from "@/components/filters";
import { StageBadge } from "@/components/stage-badge";
import { UnreadBadge } from "@/components/unread-badge";
import { listLeads } from "@/lib/crm";
import { readFilters } from "@/lib/filters";
import { formatThb } from "@/lib/format";
import { getLocale, sourceText, stageText, t } from "@/lib/i18n";
import { cardClass } from "@/lib/ui";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; source?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const leads = await listLeads(readFilters(params));

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "leads.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t(locale, "leads.count", { count: leads.length })}</p>
        </div>
        <BlobLink href="/leads/new">{t(locale, "pipeline.newLead")}</BlobLink>
      </div>
      <div className="mt-5">
        <Filters action="/leads" q={params.q ?? ""} stage={params.stage ?? ""} source={params.source ?? ""} />
      </div>
      <div className="mt-6 space-y-3 md:hidden">
        {leads.length === 0 ? <p className="text-sm text-muted">{t(locale, "leads.empty")}</p> : null}
        {leads.map((lead) => (
          <Link key={lead.id} href={`/leads/${lead.id}`} className={`block p-4 ${cardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{lead.title}</p>
              <span className="flex flex-wrap items-center justify-end gap-2">
                <UnreadBadge count={lead._count.messages} label={t(locale, "common.new")} />
                <StageBadge stage={lead.stage} label={stageText(locale, lead.stage)} />
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {lead.company?.name ?? t(locale, "common.noCompany")} · {lead.contact?.name ?? t(locale, "common.noContact")}
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatThb(lead.valueThb)} · {sourceText(locale, lead.source)} · {lead.owner?.name ?? t(locale, "common.unassigned")}
            </p>
          </Link>
        ))}
      </div>
      <div className={`mt-6 hidden overflow-x-auto md:block ${cardClass}`}>
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-mist text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t(locale, "leads.lead")}</th>
              <th className="px-4 py-3 font-medium">{t(locale, "leads.company")}</th>
              <th className="px-4 py-3 font-medium">{t(locale, "leads.contact")}</th>
              <th className="min-w-48 whitespace-nowrap px-4 py-3 font-medium">{t(locale, "common.stage")}</th>
              <th className="px-4 py-3 font-medium">{t(locale, "leads.value")}</th>
              <th className="px-4 py-3 font-medium">{t(locale, "leads.owner")}</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted">
                  {t(locale, "leads.empty")}
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium underline-offset-2 hover:underline">
                    {lead.title}
                  </Link>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{sourceText(locale, lead.source)}</span>
                    <UnreadBadge count={lead._count.messages} label={t(locale, "common.new")} />
                  </p>
                </td>
                <td className="px-4 py-3">{lead.company?.name ?? "—"}</td>
                <td className="px-4 py-3">{lead.contact?.name ?? "—"}</td>
                <td className="min-w-48 whitespace-nowrap px-4 py-3">
                  <StageBadge stage={lead.stage} label={stageText(locale, lead.stage)} />
                </td>
                <td className="px-4 py-3">{formatThb(lead.valueThb)}</td>
                <td className="px-4 py-3">{lead.owner?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
