"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────

interface InterpretedFood {
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "high" | "medium" | "low";
}

interface MealLog {
  id: string;
  date: string;
  mealType: string;
  rawInput: string;
  interpretedFoods: InterpretedFood[];
  totalCalories: number | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────────────

export function MealLogList() {
  const t = useTranslations("MealLog");
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(getWeekAgoISO());
  const [endDate, setEndDate] = useState(getTodayISO());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        startDate: new Date(startDate + "T00:00:00.000Z").toISOString(),
        endDate: new Date(endDate + "T23:59:59.999Z").toISOString(),
      });
      const res = await fetch(`/api/meal-logs?${params}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data ?? []);
      } else if (res.status === 404) {
        setLogs([]);
      } else {
        const json = await res.json();
        setError(json.message ?? t("failedToLoad"));
      }
    } catch {
      setError(t("networkError") ?? "Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("loadingMealLogs")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("filterByDateRange")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFilter} className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-start">{t("from")}</Label>
              <input
                type="date"
                id="filter-start"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-end">{t("to")}</Label>
              <input
                type="date"
                id="filter-end"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button type="submit" variant="outline">
              {t("apply")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-4 text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noMealLogsInRange")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-4">
                {/* Header: date, meal type, calories */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatDate(log.date)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {t(`mealTypes.${log.mealType}` as const) ?? log.mealType}
                    </span>
                  </div>
                  {log.totalCalories != null && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {Math.round(log.totalCalories)} kcal
                    </span>
                  )}
                </div>

                {/* Raw input */}
                <p className="text-sm text-muted-foreground mb-2">
                  {log.rawInput}
                </p>

                {/* Interpreted foods breakdown */}
                {log.interpretedFoods && log.interpretedFoods.length > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {log.interpretedFoods.map((food, i) => (
                        <div
                          key={i}
                          className="flex flex-col p-2 rounded bg-muted/50"
                        >
                          <span className="font-medium truncate">
                            {food.foodName}
                          </span>
                          <span className="text-muted-foreground">
                            {food.quantity} {food.unit}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round(food.calories)} kcal
                          </span>
                          {food.confidence === "low" && (
                            <span className="text-amber-600 text-[10px]">
                              {t("lowConfidenceNote")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Macro totals */}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        {t("abbrProtein") ?? "P:"}{" "}
                        {Math.round(
                          log.interpretedFoods.reduce(
                            (s, f) => s + f.protein,
                            0
                          )
                        )}
                        g
                      </span>
                      <span>
                        {t("abbrCarbs") ?? "C:"}{" "}
                        {Math.round(
                          log.interpretedFoods.reduce(
                            (s, f) => s + f.carbs,
                            0
                          )
                        )}
                        g
                      </span>
                      <span>
                        {t("abbrFat") ?? "G:"}{" "}
                        {Math.round(
                          log.interpretedFoods.reduce((s, f) => s + f.fat, 0)
                        )}
                        g
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
