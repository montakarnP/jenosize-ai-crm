import { BackIcon } from "@/components/back-icon";
import { NewLeadForm } from "@/components/new-lead-form";
import { PageFrame } from "@/components/page-frame";
import { listCompaniesAndContacts } from "@/lib/crm";
import { getLocale, sourceText, t } from "@/lib/i18n";
import { cardClass } from "@/lib/ui";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const { companies, contacts } = await listCompaniesAndContacts();
  const message =
    error === "contact" ? t(locale, "lead.contactError") : error === "invalid" ? t(locale, "lead.invalidError") : null;

  return (
    <PageFrame title={t(locale, "pipeline.newLead")} hint={t(locale, "lead.newHint")}>
      <div className="mx-auto w-full max-w-xl">
      <BackIcon href="/leads" label={t(locale, "lead.back")} />
      {message ? <p className="mb-4 text-sm text-red-800">{message}</p> : null}
      <div className={`p-5 ${cardClass}`}>
        {companies.length === 0 ? (
          <p className="text-sm text-muted">{t(locale, "lead.needCompany")}</p>
        ) : (
          <NewLeadForm
            companies={companies}
            contacts={contacts}
            sourceLabels={{
              WEBSITE: sourceText(locale, "WEBSITE"),
              MANUAL: sourceText(locale, "MANUAL"),
              LINE: sourceText(locale, "LINE"),
            }}
            labels={{
              title: t(locale, "form.title"),
              company: t(locale, "form.company"),
              contact: t(locale, "form.contact"),
              value: t(locale, "form.value"),
              source: t(locale, "common.source"),
              create: t(locale, "form.createLead"),
              noContact: t(locale, "form.noContact"),
              addContact: t(locale, "form.addContact"),
              beforeLead: t(locale, "form.beforeLead"),
            }}
          />
        )}
      </div>
      </div>
    </PageFrame>
  );
}
