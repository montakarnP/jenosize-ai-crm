import { cookies } from "next/headers";
import { disconnectLine } from "@/app/actions";
import { BlobButton, BlobLink } from "@/components/blob-button";
import { LineStatus } from "@/components/line-status";
import { FormPending } from "@/components/form-pending";
import { listContacts } from "@/lib/crm";
import { countText, getLocale, t } from "@/lib/i18n";
import { readSession, SESSION_COOKIE } from "@/lib/session";
import { cardClass } from "@/lib/ui";

export default async function ContactsPage() {
  const contacts = await listContacts();
  const locale = await getLocale();
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  const isAdmin = session?.role === "ADMIN";

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "contacts.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t(locale, "contacts.count", { count: contacts.length })}</p>
          <p className="mt-2 text-sm text-muted">{t(locale, "contacts.hint")}</p>
        </div>
        <BlobLink href="/contacts/new">{t(locale, "contacts.add")}</BlobLink>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {contacts.map((contact) => (
          <article key={contact.id} className={`p-4 ${cardClass}`}>
            <p className="font-medium">{contact.name}</p>
            <p className="mt-1 text-sm text-muted">
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
        ))}
      </div>
    </main>
  );
}
