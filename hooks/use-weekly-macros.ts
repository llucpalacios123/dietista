"use client";

import useSWR from "swr";

export interface WeeklyMacroData {
  days: Array<{
    date: string;
    consumed: { calories: number; protein: number; carbs: number; fat: number };
  }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWeeklyMacros(startDate?: string): {
  data: WeeklyMacroData | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const dateString = startDate ?? new Date().toISOString().split("T")[0];
  const { data, isLoading, error } = useSWR<WeeklyMacroData>(
    `/api/diario/weekly?start=${dateString}`,
    fetcher,
    {
      refreshInterval: 60000,
      dedupingInterval: 120000,
    }
  );

  return { data, isLoading, error };
}
