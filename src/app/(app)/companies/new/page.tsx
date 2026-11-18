import { AppLink as Link } from "@/components/app-link";
import { createCompany } from "@/app/actions";
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
    <main className="max-w-xl">
      <Link href="/companies" className="text-sm text-brand">
        {t(locale, "companies.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t(locale, "companies.new")}</h1>
      <p className="mt-1 text-sm text-muted">{t(locale, "companies.newHint")}</p>
      {message ? <p className="mt-4 text-sm text-red-800">{message}</p> : null}
      <form action={createCompany} className={`mt-6 space-y-4 p-5 ${cardClass}`}>
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
    </main>
  );
}
