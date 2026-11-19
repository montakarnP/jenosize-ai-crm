import { createContact } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";
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
    <PageFrame
      back={{ href: "/contacts", label: t(locale, "contacts.back") }}
      title={t(locale, "contacts.new")}
      hint={t(locale, "contacts.newHint")}
    >
      {message ? <p className="mb-4 text-sm text-red-800">{message}</p> : null}
      <div className="row">
        <div className="col-lg-6">
      <form action={createContact} className={`space-y-4 p-5 ${cardClass}`}>
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
        </div>
      </div>
    </PageFrame>
  );
}
