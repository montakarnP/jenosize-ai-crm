import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { BlobButton } from "@/components/blob-button";
import { BrandMark } from "@/components/brand-mark";
import { DeveloperCredit } from "@/components/developer-credit";
import { FormPending } from "@/components/form-pending";
import { LanguageSwitch } from "@/components/language-switch";
import { LiveRefresh } from "@/components/live-refresh";
import { NavLinks } from "@/components/nav-links";
import { getLocale, t } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = await readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");
  const locale = await getLocale();
  const profile = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { name: true, title: true },
  });

  return (
    <div className="min-h-screen">
      <LiveRefresh />
      <header className="border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-right sm:block">
                <span className="block text-sm text-ink">{profile?.name ?? session.name}</span>
                {profile?.title ? <span className="block text-xs text-muted">{profile.title}</span> : null}
              </span>
              <Suspense fallback={null}>
                <LanguageSwitch locale={locale} />
              </Suspense>
              <form action={logout}>
                <FormPending />
                <BlobButton tone="auth">{t(locale, "auth.logout")}</BlobButton>
              </form>
            </div>
          </div>
          <NavLinks
            links={[
              { href: "/", label: t(locale, "nav.pipeline") },
              { href: "/leads", label: t(locale, "nav.leads") },
              { href: "/companies", label: t(locale, "nav.companies") },
              { href: "/contacts", label: t(locale, "nav.contacts") },
              { href: "/team", label: t(locale, "nav.team") },
            ]}
          />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
      <footer className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <DeveloperCredit />
      </footer>
    </div>
  );
}
