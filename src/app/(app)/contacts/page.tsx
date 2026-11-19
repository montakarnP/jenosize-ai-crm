import { cookies } from "next/headers";
import { disconnectLine } from "@/app/actions";
import { AppLink as Link } from "@/components/app-link";
import { PageFrame } from "@/components/page-frame";
import { BlobButton, BlobLink } from "@/components/blob-button";
import { LineStatus } from "@/components/line-status";
import { FormPending } from "@/components/form-pending";
import { listContacts } from "@/lib/crm";
import { countText, getLocale, t } from "@/lib/i18n";
import { readSession, SESSION_COOKIE } from "@/lib/session";
import { cardClass, fieldClass } from "@/lib/ui";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const needle = query.toLowerCase();
  const contacts = (await listContacts()).filter((contact) => {
    if (!needle) return true;
    return [contact.name, contact.title, contact.email, contact.phone, contact.lineCode, contact.company?.name]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(needle));
  });
  const locale = await getLocale();
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const isAdmin = session?.role === "ADMIN";

  return (
    <PageFrame
      title={t(locale, "contacts.title")}
      hint={
        <>
          <p>{t(locale, "contacts.count", { count: contacts.length })}</p>
          <p className="mt-1">{t(locale, "contacts.hint")}</p>
        </>
      }
    >
      <section className="crm-panel">
        {params.error === "line" ? (
          <p className="mb-4 text-sm text-red-800">{t(locale, "contacts.disconnectError")}</p>
        ) : null}
        <form action="/contacts" className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <FormPending />
          <input
            name="q"
            defaultValue={query}
            placeholder={t(locale, "contacts.filter")}
            aria-label={t(locale, "contacts.filter")}
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <BlobButton tone="action">{t(locale, "common.apply")}</BlobButton>
            {query ? (
              <Link href="/contacts" className="crm-clear">
                {t(locale, "common.clear")}
              </Link>
            ) : null}
            <BlobLink href="/contacts/new">{t(locale, "contacts.add")}</BlobLink>
          </div>
        </form>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
        {contacts.length === 0 ? <p className="col text-sm text-muted">{t(locale, "contacts.empty")}</p> : null}
        {contacts.map((contact) => (
          <div className="col" key={contact.id}>
          <article className={`h-full p-4 ${cardClass}`}>
            <p className="font-medium break-words">{contact.name}</p>
            <p className="mt-1 text-sm break-words text-muted">
              {contact.title ?? t(locale, "contacts.noTitle")} · {contact.company?.name ?? t(locale, "common.noCompany")}
            </p>
            <p className="mt-3 text-sm text-muted">{contact.email ?? t(locale, "contacts.noEmail")}</p>
            <p className="text-sm text-muted">{contact.phone ?? t(locale, "contacts.noPhone")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <p>
                <span className="text-muted">{t(locale, "contacts.mockId")} </span>
                <span className="font-medium">{contact.lineCode}</span>
              </p>
              <LineStatus
                connected={Boolean(contact.lineUserId)}
                connectedLabel={t(locale, "lead.connected")}
                disconnectedLabel={t(locale, "lead.notConnected")}
              />
              <span className="text-muted">{countText(locale, "lead", contact._count.leads)}</span>
            </div>
            {isAdmin && contact.lineUserId ? (
              <form action={disconnectLine} className="mt-3">
                <FormPending />
                <input type="hidden" name="contactId" value={contact.id} />
                <BlobButton tone="action">{t(locale, "contacts.disconnect")}</BlobButton>
              </form>
            ) : null}
          </article>
          </div>
        ))}
      </div>
      </section>
    </PageFrame>
  );
}
