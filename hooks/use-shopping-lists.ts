"use client";

import useSWRInfinite from "swr/infinite";
import type { ShoppingListSummary } from "@/types/dietista";

interface ShoppingListsPage {
  lists: ShoppingListSummary[];
  hasMore: boolean;
  nextCursor: string | null;
}

const fetcher = (url: string): Promise<ShoppingListsPage> =>
  fetch(url).then((res) => res.json());

export function useShoppingLists(): {
  lists: ShoppingListSummary[];
  isLoading: boolean;
  error: Error | undefined;
  hasMore: boolean;
  loadMore: () => void;
} {
  const getKey = (
    pageIndex: number,
    previousPageData: ShoppingListsPage | null,
  ): string | null => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    if (pageIndex === 0) return "/api/shopping-lists?limit=10";
    return `/api/shopping-lists?limit=10&cursor=${encodeURIComponent(previousPageData!.nextCursor!)}`;
  };

  const { data, error, size, setSize, isLoading } = useSWRInfinite<ShoppingListsPage>(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
      refreshInterval: 0,
    },
  );

  const lists = data ? data.flatMap((page) => page.lists) : [];
  const hasMore = data
    ? data[data.length - 1]?.nextCursor !== null
    : false;

  return {
    lists,
    isLoading,
    error,
    hasMore,
    loadMore: (): void => {
      setSize(size + 1);
    },
  };
}
