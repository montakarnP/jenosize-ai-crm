import { PageFrame } from "@/components/page-frame";
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
    <PageFrame title={t(locale, "team.title")} hint={t(locale, "team.count", { count: people.length })}>
      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3">
        {people.map((person) => (
          <div className="col" key={person.id}>
          <article className={`h-full p-4 ${cardClass}`}>
            <p className="font-medium">{person.name}</p>
            <p className="mt-1 text-sm text-brand">{person.title}</p>
            <p className="mt-3 text-sm text-muted">{person.email}</p>
          </article>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}
