import { login } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "invalid"
      ? "That email or password does not match a demo user."
      : error === "config"
        ? "The server is missing a session secret of at least 32 characters."
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-md rounded-3xl border border-line bg-white/90 p-8 shadow-[0_24px_70px_rgba(32,76,213,0.1)]">
        <BrandMark />
        <h1 className="mt-8 text-3xl font-medium text-brand">Sign in to the commercial pipeline.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          A working desk for leads that arrive from the website, the team, and LINE.
        </p>
        <form action={login} className="mt-8 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input name="email" type="email" autoComplete="username" required className={fieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={fieldClass}
            />
          </label>
          {message ? <p className="text-sm text-red-700">{message}</p> : null}
          <button className={`${primaryButtonClass} w-full`}>Sign in</button>
        </form>
        <div className="mt-6 text-sm leading-6 text-muted">
          <p>Password for every account: Demo-CRM-2026</p>
          <ul className="mt-2 space-y-1">
            <li>max@jenosize.test · CEO & Founder</li>
            <li>aoy@jenosize.test · Director</li>
            <li>tak@jenosize.test · Managing Director, Digital</li>
            <li>jom@jenosize.test · Asst. Director, Event</li>
            <li>zam@jenosize.test · Business Development Director</li>
            <li>lisa@jenosize.test · Head of Product Design & Quality</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
