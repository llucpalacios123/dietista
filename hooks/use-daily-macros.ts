"use client";

import useSWR from "swr";

export interface DailyMacroData {
  date: string;
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  meals: Array<{
    id: string;
    mealType: string;
    rawInput: string;
    totalCalories: number | null;
    createdAt: Date;
  }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDailyMacros(date?: string): {
  data: DailyMacroData | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => void;
} {
  const dateString = date ?? new Date().toISOString().split("T")[0];
  const { data, isLoading, error, mutate } = useSWR<DailyMacroData>(
    `/api/diario/daily?date=${dateString}`,
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate: () => mutate(),
  };
}
