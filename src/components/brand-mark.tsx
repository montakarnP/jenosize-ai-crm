export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <span className={`font-display text-[1.45rem] leading-none font-medium tracking-tight ${light ? "text-white" : "text-brand"}`}>
      jenosize
      <span className="ml-2 align-middle text-[0.65rem] font-medium tracking-[0.2em] text-cyan uppercase">
        CRM
      </span>
    </span>
  );
}
