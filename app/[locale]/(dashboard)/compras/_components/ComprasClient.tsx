"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useVisionUpload } from "@/hooks/use-vision-upload";
import { UploadWidget } from "./UploadWidget";
import { RecentListPreview } from "./RecentListPreview";
import { HistoryList } from "./HistoryList";
import type { ShoppingListSummary } from "@/types/dietista";

export function ComprasClient({
  recentList,
}: {
  recentList: ShoppingListSummary | null;
}): React.ReactElement {
  const t = useTranslations("Shopping");
  const router = useRouter();
  const { state, uploadImage, reset } = useVisionUpload();
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);

  /* ---- show success banner when returning from a list deletion ---- */
  useEffect(() => {
    if (window.location.search.includes("deleted=1")) {
      setShowDeletedBanner(true);
      // Clean the URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("deleted");
      window.history.replaceState({}, "", url.toString());
      const timer = setTimeout(() => setShowDeletedBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ---- when an upload just created a list → redirect to detail ---- */
  useEffect(() => {
    if (state.status === "done" && state.listId) {
      router.push(`/compras/${state.listId}`);
    }
  }, [state.status, state.listId, router]);

  /* ---- main view: header + upload + recent + history ---- */
  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          {t("subtitle")}
        </p>
      </div>

      {/* Success banner */}
      {showDeletedBanner && (
        <div className="mx-[var(--dietista-pad-card)] rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          {t("listDeleted")}
        </div>
      )}

      <UploadWidget state={state} onUpload={uploadImage} onReset={reset} />

      <RecentListPreview list={recentList} />

      <HistoryList excludeId={recentList?.id} />
    </div>
  );
}
