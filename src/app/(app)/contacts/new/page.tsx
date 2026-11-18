import { AppLink as Link } from "@/components/app-link";
import { createContact } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import { FormPending } from "@/components/form-pending";
import { listCompanies } from "@/lib/crm";
import { getLocale, t } from "@/lib/i18n";
import { cardClass, fieldClass } from "@/lib/ui";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const locale = await getLocale();
  const companies = await listCompanies();
  const message =
    error === "duplicate"
      ? t(locale, "contacts.duplicate")
      : error === "company"
        ? t(locale, "contacts.companyMissing")
        : error === "invalid"
          ? t(locale, "contacts.invalid")
          : null;

  return (
    <main className="max-w-xl">
      <Link href="/contacts" className="text-sm text-brand">
        {t(locale, "contacts.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t(locale, "contacts.new")}</h1>
      <p className="mt-1 text-sm text-muted">{t(locale, "contacts.newHint")}</p>
      {message ? <p className="mt-4 text-sm text-red-800">{message}</p> : null}
      <form action={createContact} className={`mt-6 space-y-4 p-5 ${cardClass}`}>
        <FormPending />
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "contacts.name")}</span>
          <input name="name" required minLength={2} maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "contacts.position")}</span>
          <input name="title" maxLength={120} className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "form.company")}</span>
          <select name="companyId" required className={fieldClass}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "lead.email")}</span>
          <input name="email" type="email" className={fieldClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t(locale, "lead.phone")}</span>
          <input name="phone" maxLength={40} className={fieldClass} />
        </label>
        <BlobButton tone="action">{t(locale, "contacts.save")}</BlobButton>
      </form>
    </main>
  );
}
