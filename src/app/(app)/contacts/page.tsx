import Link from "next/link";
import { listContacts } from "@/lib/crm";
import { countLabel } from "@/lib/format";
import { cardClass, primaryButtonClass } from "@/lib/ui";

export default async function ContactsPage() {
  const contacts = await listContacts();

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="mt-1 text-sm text-muted">{contacts.length} contacts</p>
        </div>
        <Link href="/contacts/new" className={primaryButtonClass}>
          Add contact
        </Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {contacts.map((contact) => (
          <article key={contact.id} className={`p-4 ${cardClass}`}>
            <p className="font-medium">{contact.name}</p>
            <p className="mt-1 text-sm text-muted">
              {contact.title ?? "No title"} · {contact.company?.name ?? "No company"}
            </p>
            <p className="mt-3 text-sm text-muted">{contact.email ?? "No email"}</p>
            <p className="text-sm text-muted">{contact.phone ?? "No phone"}</p>
            <p className="mt-2 break-all text-xs text-muted">
              {contact.lineUserId ? `LINE ${contact.lineUserId}` : "No LINE user"} · {countLabel(contact._count.leads, "lead")}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
