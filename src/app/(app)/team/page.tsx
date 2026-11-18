import { prisma } from "@/lib/db";
import { getLocale, t } from "@/lib/i18n";
import { cardClass } from "@/lib/ui";

export default async function TeamPage() {
  const locale = await getLocale();
  const people = await prisma.user.findMany({
    select: { id: true, name: true, title: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main>
      <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "team.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t(locale, "team.count", { count: people.length })}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {people.map((person) => (
          <article key={person.id} className={`p-4 ${cardClass}`}>
            <p className="font-medium">{person.name}</p>
            <p className="mt-1 text-sm text-brand">{person.title}</p>
            <p className="mt-3 text-sm text-muted">{person.email}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
