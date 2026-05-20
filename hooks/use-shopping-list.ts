"use client";

import useSWR, { useSWRConfig } from "swr";
import { ShoppingList } from "@/types/dietista";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useShoppingList(id: string): {
  data: ShoppingList | undefined;
  isLoading: boolean;
  error: Error | undefined;
  toggleItem: (itemId: string) => Promise<void>;
  deleteList: () => Promise<void>;
} {
  const { data, isLoading, error, mutate } = useSWR<ShoppingList>(
    id ? `/api/shopping-lists/${id}` : null,
    fetcher,
    {
      refreshInterval: 30000,
    }
  );

  const toggleItem = async (itemId: string): Promise<void> => {
    // Optimistic update
    const previous = data;
    if (previous) {
      const updatedItems = previous.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      void mutate({ ...previous, items: updatedItems }, false);
    }

    try {
      const { toggleShoppingItem } = await import("@/actions/shopping-list");
      await toggleShoppingItem(itemId);
      void mutate();
    } catch {
      // Rollback on error
      if (previous) {
        void mutate(previous, false);
      }
    }
  };

  const deleteList = async (): Promise<void> => {
    const { deleteShoppingList } = await import("@/actions/shopping-list");
    await deleteShoppingList(id);
    void mutate();
  };

  return {
    data,
    isLoading,
    error,
    toggleItem,
    deleteList,
  };
}
