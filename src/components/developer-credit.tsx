export function DeveloperCredit({ light = false }: { light?: boolean }) {
  return (
    <p className={`text-xs leading-5 ${light ? "text-white/80" : "text-muted"}`}>
      Developed by MONTAKARN PRINGPRERD ·{" "}
      <a className="underline-offset-2 hover:underline" href="mailto:m.pringprerd@gmail.com">
        m.pringprerd@gmail.com
      </a>
    </p>
  );
}
