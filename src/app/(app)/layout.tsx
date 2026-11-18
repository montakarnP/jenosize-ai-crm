import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { NavLinks } from "@/components/nav-links";
import { prisma } from "@/lib/db";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");
  const profile = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { name: true, title: true },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <form action={logout} className="flex items-center gap-3 text-sm">
              <span className="hidden text-right sm:block">
                <span className="block text-sm text-ink">{profile?.name ?? session.name}</span>
                {profile?.title ? <span className="block text-xs text-muted">{profile.title}</span> : null}
              </span>
              <button className="rounded-full border border-brand px-4 py-1.5 text-brand">Log out</button>
            </form>
          </div>
          <NavLinks />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
