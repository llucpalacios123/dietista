"use client";

import React, { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useVisionUpload } from "@/hooks/use-vision-upload";
import { useShoppingList } from "@/hooks/use-shopping-list";

export default function ComprasPage(): React.ReactElement {
  const t = useTranslations("Shopping");
  const { state, uploadImage, reset } = useVisionUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedListId, setGeneratedListId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadImage(file);
    }
  };

  const handleGenerateFromPlan = async (): Promise<void> => {
    setGenerating(true);
    setGenerateError(null);
    try {
      // Fetch active meal plan
      const planRes = await fetch("/api/meal-plans");
      if (!planRes.ok) {
        setGenerateError("No tienes un plan de comidas activo");
        return;
      }
      const planData = await planRes.json();
      const mealPlanId = planData.data?.id;

      if (!mealPlanId) {
        setGenerateError("No se ha encontrado el plan de comidas");
        return;
      }

      // Generate shopping list
      const res = await fetch("/api/shopping-lists/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealPlanId }),
      });

      if (!res.ok) {
        const error = await res.json();
        setGenerateError(error.error ?? "Error al generar la lista");
        return;
      }

      const data = await res.json();
      setGeneratedListId(data.id);
    } catch {
      setGenerateError("Error de conexión al generar la lista");
    } finally {
      setGenerating(false);
    }
  };

  // Show generated list view
  if (generatedListId) {
    return <ShoppingListView id={generatedListId} onBack={() => setGeneratedListId(null)} />;
  }

  // Show vision upload list view
  if (state.status === "done" && state.listId) {
    return <ShoppingListView id={state.listId} onBack={reset} />;
  }

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

      {/* Generate from Meal Plan */}
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🛒</div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-[var(--dietista-text)]">
                Generar desde el plan de comidas
              </h2>
              <p className="mt-1 text-xs text-[var(--dietista-text-2)]">
                La IA extraerá todos los ingredientes de tu plan semanal
              </p>
            </div>
          </div>

          {generateError && (
            <div className="mt-3 rounded-lg bg-[var(--dietista-surface-2)] p-3">
              <p className="text-xs text-[var(--dietista-danger)]">{generateError}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateFromPlan}
            disabled={generating}
            className="mt-4 w-full rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-50"
          >
            {generating ? "Generando..." : "Generar lista de la compra"}
          </button>
        </div>
      </div>

      {/* Upload Area */}
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
              <p className="mt-2 text-xs text-[var(--dietista-text-2)]">{t("uploading")}</p>
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
              <p className="mt-2 text-xs text-[var(--dietista-text-2)]">{t("processing")}</p>
            </div>
          )}

          {state.status === "error" && (
            <div className="mt-4 rounded-lg bg-[var(--dietista-surface-2)] p-3">
              <p className="text-xs text-[var(--dietista-danger)]">{state.error}</p>
              <button
                type="button"
                onClick={reset}
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
            disabled={state.status === "uploading" || state.status === "processing"}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={state.status === "uploading" || state.status === "processing"}
            className="mt-4 rounded-lg bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-50"
          >
            {t("choosePhoto")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShoppingListView({ id, onBack }: { id: string; onBack: () => void }): React.ReactElement {
  const t = useTranslations("Shopping");
  const { data, isLoading, toggleItem } = useShoppingList(id);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-[var(--dietista-text-3)]">{t("loadingList")}</p>
      </div>
    );
  }

  // Group items by category
  const grouped = data.items.reduce<Record<string, typeof data.items>>((acc, item) => {
    const cat = item.category ?? "otros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    frutas_verduras: t("categories.frutas_verduras"),
    carnes: t("categories.carnes"),
    lacteos: t("categories.lacteos"),
    panaderia: t("categories.panaderia"),
    almacen: t("categories.almacen"),
    bebidas: t("categories.bebidas"),
    limpieza: t("categories.limpieza"),
    otros: t("categories.otros"),
  };

  return (
    <div className="space-y-4 px-1 pb-4">
      <div className="flex items-center gap-3 px-[18px] pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-[var(--dietista-text-2)] hover:bg-[var(--dietista-surface-2)]"
          aria-label={t("back")}
        >
          ←
        </button>
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("shoppingList")}
        </h1>
      </div>

      {/* Budget bar */}
      {data.budget && (
        <div className="mx-[var(--dietista-pad-card)]">
          <div className="rounded-[var(--dietista-r-md)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--dietista-text-2)]">{t("budget")}</span>
              <span className="text-sm font-semibold tnum text-[var(--dietista-text)]">
                ${data.totalEstimate?.toFixed(2) ?? "0.00"} / ${data.budget.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-[var(--dietista-surface-2)]">
              <div
                className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                style={{
                  width: `${Math.min(((data.totalEstimate ?? 0) / data.budget) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Checklist by category */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="mx-[var(--dietista-pad-card)]">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dietista-text-3)]">
            {categoryLabels[category] ?? category}
          </h3>
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void toggleItem(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                  item.checked
                    ? "bg-[var(--dietista-surface-2)] opacity-60"
                    : "bg-[var(--dietista-surface)] hover:bg-[var(--dietista-surface-2)]"
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    item.checked
                      ? "border-[var(--brand-500)] bg-[var(--brand-500)]"
                      : "border-[var(--dietista-border)]"
                  }`}
                >
                  {item.checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={`text-sm ${item.checked ? "line-through text-[var(--dietista-text-3)]" : "text-[var(--dietista-text)]"}`}
                  >
                    {item.name}
                  </span>
                  {item.quantity && (
                    <span className="ml-2 text-xs text-[var(--dietista-text-3)]">{item.quantity}</span>
                  )}
                </div>
                {item.price && (
                  <span className="text-xs font-medium tnum text-[var(--dietista-text-2)]">
                    ${item.price.toFixed(2)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
