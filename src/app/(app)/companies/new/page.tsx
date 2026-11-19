import { createCompany } from "@/app/actions";
import { BackIcon } from "@/components/back-icon";
import { PageFrame } from "@/components/page-frame";
import { BlobButton } from "@/components/blob-button";
import { FormPending } from "@/components/form-pending";
import { industries } from "@/lib/industries";
import { getLocale, t } from "@/lib/i18n";
import { cardClass, fieldClass } from "@/lib/ui";

export default async function NewCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const message =
    error === "duplicate" ? t(locale, "companies.duplicate") : error === "invalid" ? t(locale, "companies.invalid") : null;

  return (
    <PageFrame title={t(locale, "companies.new")} hint={t(locale, "companies.newHint")}>
      <div className="mx-auto w-full max-w-xl">
      <BackIcon href="/companies" label={t(locale, "companies.back")} />
      {message ? <p className="mb-4 text-sm text-red-800">{message}</p> : null}
      <form action={createCompany} className={`space-y-4 p-5 ${cardClass}`}>
        <FormPending />
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "companies.name")}</span>
          <input name="name" required minLength={2} maxLength={160} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "companies.industry")}</span>
          <select name="industry" required className={fieldClass} defaultValue="Retail">
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </label>
        <BlobButton tone="action">{t(locale, "companies.save")}</BlobButton>
      </form>
      </div>
    </PageFrame>
  );
}
