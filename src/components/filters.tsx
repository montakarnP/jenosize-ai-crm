import { SOURCES, STAGES, sourceLabel, stageLabel } from "@/lib/format";
import { fieldClass, primaryButtonClass } from "@/lib/ui";

export function Filters({
  action,
  q,
  stage,
  source,
}: {
  action: string;
  q: string;
  stage: string;
  source: string;
}) {
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_10rem_10rem_auto]">
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Search</span>
        <input name="q" defaultValue={q} placeholder="Title, company, or contact" className={fieldClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Stage</span>
        <select name="stage" defaultValue={stage} className={fieldClass}>
          <option value="">All stages</option>
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {stageLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Source</span>
        <select name="source" defaultValue={source} className={fieldClass}>
          <option value="">All sources</option>
          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {sourceLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <button className={primaryButtonClass}>Apply</button>
      </div>
    </form>
  );
}
