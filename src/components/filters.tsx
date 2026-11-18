import { BlobButton } from "@/components/blob-button";
import { FormPending } from "@/components/form-pending";
import { SOURCES, STAGES } from "@/lib/format";
import { getLocale, sourceText, stageText, t } from "@/lib/i18n";
import { fieldClass } from "@/lib/ui";

export async function Filters({
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
  const locale = await getLocale();
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_10rem_10rem_auto]">
      <FormPending />
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t(locale, "common.search")}</span>
        <input name="q" defaultValue={q} placeholder={t(locale, "common.searchPlaceholder")} className={fieldClass} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t(locale, "common.stage")}</span>
        <select name="stage" defaultValue={stage} className={fieldClass}>
          <option value="">{t(locale, "common.allStages")}</option>
          {STAGES.map((item) => (
            <option key={item} value={item}>
              {stageText(locale, item)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">{t(locale, "common.source")}</span>
        <select name="source" defaultValue={source} className={fieldClass}>
          <option value="">{t(locale, "common.allSources")}</option>
          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {sourceText(locale, item)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end">
        <BlobButton tone="action">{t(locale, "common.apply")}</BlobButton>
      </div>
    </form>
  );
}
