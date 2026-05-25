"use client";

import useSWR from "swr";
import { useRouter } from "@/i18n/navigation";
import type { ShoppingList } from "@/types/dietista";
import type { UpdateShoppingItemData } from "@/actions/shopping-list";

const fetcher = (url: string): Promise<ShoppingList> =>
  fetch(url).then((res) => res.json());

export function useShoppingList(id: string): {
  data: ShoppingList | undefined;
  isLoading: boolean;
  error: Error | undefined;
  toggleItem: (itemId: string) => Promise<void>;
  editItem: (itemId: string, data: UpdateShoppingItemData) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  updateStatus: (status: "draft" | "reviewed" | "purchased") => Promise<void>;
  deleteList: () => Promise<void>;
} {
  const { data, isLoading, error, mutate } = useSWR<ShoppingList>(
    id ? `/api/shopping-lists/${id}` : null,
    fetcher,
    {
      refreshInterval: 30000,
    },
  );

  const router = useRouter();

  const toggleItem = async (itemId: string): Promise<void> => {
    // Optimistic update
    const previous = data;
    if (previous) {
      const updatedItems = previous.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
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

  const editItem = async (
    itemId: string,
    editData: UpdateShoppingItemData,
  ): Promise<void> => {
    const previous = data;
    if (previous) {
      const updatedItems = previous.items.map((item) =>
        item.id === itemId ? { ...item, ...editData } : item,
      );
      void mutate({ ...previous, items: updatedItems }, false);
    }

    try {
      const { updateShoppingItem } = await import("@/actions/shopping-list");
      const result = await updateShoppingItem(itemId, editData);
      if (!result.success) throw new Error(result.error);
      void mutate();
    } catch {
      if (previous) {
        void mutate(previous, false);
      }
    }
  };

  const deleteItem = async (itemId: string): Promise<void> => {
    // Optimistic: filter out the item
    const previous = data;
    if (previous) {
      void mutate(
        {
          ...previous,
          items: previous.items.filter((item) => item.id !== itemId),
        },
        false,
      );
    }

    try {
      const { deleteShoppingItem } = await import("@/actions/shopping-list");
      const result = await deleteShoppingItem(itemId);
      if (!result.success) throw new Error(result.error);
      void mutate();
    } catch {
      if (previous) {
        void mutate(previous, false);
      }
    }
  };

  const updateStatus = async (
    status: "draft" | "reviewed" | "purchased",
  ): Promise<void> => {
    const previous = data;
    if (previous) {
      void mutate({ ...previous, status }, false);
    }

    try {
      const { updateShoppingListStatus } = await import(
        "@/actions/shopping-list"
      );
      const result = await updateShoppingListStatus(id, status);
      if (!result.success) throw new Error(result.error);
      void mutate();
    } catch {
      if (previous) {
        void mutate(previous, false);
      }
    }
  };

  const deleteList = async (): Promise<void> => {
    const { deleteShoppingList } = await import("@/actions/shopping-list");
    const result = await deleteShoppingList(id);
    if (result.success) {
      router.push("/compras?deleted=1");
    }
  };

  return {
    data,
    isLoading,
    error,
    toggleItem,
    editItem,
    deleteItem,
    updateStatus,
    deleteList,
  };
}
