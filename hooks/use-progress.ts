"use client";

import useSWR from "swr";

export interface ProgressData {
  weights: Array<{
    id: string;
    date: string;
    weight: number;
    notes?: string;
  }>;
  snapshots: Array<{
    date: string;
    totalCalories?: number;
    totalProtein?: number;
    totalCarbs?: number;
    totalFat?: number;
    adherenceScore?: number;
    mealsLogged: number;
  }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProgress(days = 30): {
  data: ProgressData | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => void;
} {
  const { data, isLoading, error, mutate } = useSWR<ProgressData>(
    `/api/progress?days=${days}`,
    fetcher,
    {
      refreshInterval: 60000,
      dedupingInterval: 120000,
    }
  );

  return {
    data,
    isLoading,
    error,
    mutate: () => mutate(),
  };
}
