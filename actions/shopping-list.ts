"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { openai } from "@/lib/openai";

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

// ─── Generate Shopping List from Meal Plan ────────────────────────────────

const CATEGORIES = [
  "frutas_verduras",
  "carnes",
  "lacteos",
  "panaderia",
  "almacen",
  "bebidas",
  "limpieza",
  "otros",
] as const;

export async function generateShoppingListFromMealPlan(
  mealPlanId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  // Fetch meal plan with meals
  const mealPlan = await prisma.mealPlan.findFirst({
    where: { id: mealPlanId, userId: session.userId },
    include: { meals: true },
  });

  if (!mealPlan) {
    return { success: false, error: "Plan de comidas no encontrado" };
  }

  // Build meal descriptions for AI
  const mealDescriptions = mealPlan.meals
    .map((m) => `- ${m.name}: ${m.description}`)
    .join("\n");

  // Use AI to extract and categorize ingredients
  const prompt = `Eres un asistente de compra. Extrae todos los ingredientes necesarios para preparar estas comidas de la semana y agrúpalos por categoría.

Comidas del plan:
${mealDescriptions}

Devuelve SOLO un JSON válido con este formato exacto (sin markdown, sin explicación):
{
  "items": [
    { "name": "nombre del ingrediente", "quantity": "cantidad estimada (ej: 500g, 2 unidades)", "category": "categoría" }
  ]
}

Categorías válidas: frutas_verduras, carnes, lacteos, panaderia, almacen, bebidas, limpieza, otros.
Usa cantidades razonables para una semana. Agrupa ingredientes similares (ej: no pongas "cebolla" tres veces, pon "cebolla" con cantidad total).`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "La IA no ha devuelto una respuesta" };
    }

    const parsed = JSON.parse(content) as {
      items: Array<{ name: string; quantity?: string; category: string }>;
    };

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return { success: false, error: "Formato de respuesta no válido" };
    }

    // Create shopping list
    const result = await prisma.shoppingList.create({
      data: {
        userId: session.userId,
        mealPlanId: mealPlan.id,
        status: "draft",
        items: {
          create: parsed.items.map((item, index) => ({
            name: item.name,
            quantity: item.quantity || null,
            category: CATEGORIES.includes(item.category as (typeof CATEGORIES)[number])
              ? item.category
              : "otros",
            order: index,
            matchedToPlan: true,
          })),
        },
      },
    });

    revalidatePath("/compras");
    return { success: true, id: result.id };
  } catch (error) {
    console.error("[generateShoppingList] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al generar la lista",
    };
  }
}
