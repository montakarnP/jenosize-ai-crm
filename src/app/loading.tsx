import { LoadingPanel } from "@/components/loading-panel";
import { getLocale, t } from "@/lib/i18n";

export default async function Loading() {
  const locale = await getLocale();
  return <LoadingPanel title={t(locale, "common.loading")} hint={t(locale, "common.loadingHint")} />;
}
