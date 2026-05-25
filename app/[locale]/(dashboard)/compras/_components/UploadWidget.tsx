"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { VisionUploadState } from "@/hooks/use-vision-upload";

interface UploadWidgetProps {
  state: VisionUploadState;
  onUpload: (file: File) => void;
  onReset: () => void;
}

export function UploadWidget({
  state,
  onUpload,
  onReset,
}: UploadWidgetProps): React.ReactElement {
  const t = useTranslations("Shopping");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="mx-[var(--dietista-pad-card)]">
      <div className="rounded-[var(--dietista-r-lg)] border-2 border-dashed border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-8 text-center">
        <div className="text-4xl">📷</div>
        <p className="mt-3 text-sm font-semibold text-[var(--dietista-text)]">
          {t("uploadTitle")}
        </p>
        <p className="mt-1 text-xs text-[var(--dietista-text-2)]">
          {t("uploadSubtitle")}
        </p>

        {state.status === "uploading" && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-[var(--dietista-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--brand-500)] transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--dietista-text-2)]">
              {t("uploading")}
            </p>
          </div>
        )}

        {state.status === "processing" && (
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-[var(--dietista-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--brand-500)] animate-pulse"
                style={{ width: `${state.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--dietista-text-2)]">
              {t("processing")}
            </p>
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-4 rounded-lg bg-[var(--dietista-surface-2)] p-3">
            <p className="text-xs text-[var(--dietista-danger)]">
              {state.error}
            </p>
            <button
              type="button"
              onClick={onReset}
              className="mt-2 text-xs font-medium text-[var(--brand-600)]"
            >
              {t("retry")}
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          disabled={
            state.status === "uploading" || state.status === "processing"
          }
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            state.status === "uploading" || state.status === "processing"
          }
          className="mt-4 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-50"
        >
          {t("choosePhoto")}
        </button>
      </div>
    </div>
  );
}
