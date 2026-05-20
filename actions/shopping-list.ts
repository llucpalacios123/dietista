"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createShoppingListSchema = z.object({
  mealPlanId: z.string().optional(),
  budget: z.number().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.string().optional(),
      price: z.number().optional(),
      category: z.string().optional(),
      order: z.number().default(0),
    })
  ),
});

export async function createShoppingList(
  data: z.infer<typeof createShoppingListSchema>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const result = await prisma.shoppingList.create({
      data: {
        userId: session.userId,
        mealPlanId: data.mealPlanId,
        budget: data.budget,
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: item.category,
            order: item.order,
          })),
        },
      },
    });

    revalidatePath("/compras");
    return { success: true, id: result.id };
  } catch {
    return { success: false, error: "Error al crear la lista" };
  }
}

export async function getShoppingList(id: string): Promise<{
  id: string;
  status: string;
  budget: number | null;
  totalEstimate: number | null;
  items: Array<{
    id: string;
    name: string;
    quantity: string | null;
    price: number | null;
    confidence: string;
    checked: boolean;
    matchedToPlan: boolean;
    category: string | null;
    order: number;
  }>;
} | null> {
  const session = await auth();
  if (!session?.userId) {
    return null;
  }

  const list = await prisma.shoppingList.findFirst({
    where: { id, userId: session.userId },
    include: { items: { orderBy: { order: "asc" } } },
  });

  if (!list) return null;

  return {
    id: list.id,
    status: list.status,
    budget: list.budget,
    totalEstimate: list.totalEstimate,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      confidence: item.confidence,
      checked: item.checked,
      matchedToPlan: item.matchedToPlan,
      category: item.category,
      order: item.order,
    })),
  };
}

export async function toggleShoppingItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const item = await prisma.shoppingItem.findFirst({
      where: { id: itemId },
      include: { shoppingList: true },
    });

    if (!item || item.shoppingList.userId !== session.userId) {
      return { success: false, error: "Item no encontrado" };
    }

    await prisma.shoppingItem.update({
      where: { id: itemId },
      data: { checked: !item.checked },
    });

    revalidatePath("/compras");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el item" };
  }
}

export async function deleteShoppingList(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const list = await prisma.shoppingList.findFirst({
      where: { id, userId: session.userId },
    });

    if (!list) {
      return { success: false, error: "Lista no encontrada" };
    }

    await prisma.shoppingList.delete({
      where: { id },
    });

    revalidatePath("/compras");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar la lista" };
  }
}
