"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destructive">
          {t("serverError")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {t("defaultError")}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
