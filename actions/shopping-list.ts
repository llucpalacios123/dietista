"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { openai } from "@/lib/openai";
import type { ShoppingList, ShoppingListSummary } from "@/types/dietista";

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

export async function getShoppingList(id: string): Promise<ShoppingList | null> {
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
    mealPlanId: list.mealPlanId ?? undefined,
    status: list.status as ShoppingList["status"],
    budget: list.budget ?? undefined,
    totalEstimate: list.totalEstimate ?? undefined,
    imageUrl: list.imageUrl ?? undefined,
    items: list.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity ?? undefined,
      price: item.price ?? undefined,
      confidence: item.confidence as ShoppingList["items"][number]["confidence"],
      checked: item.checked,
      matchedToPlan: item.matchedToPlan,
      category: item.category ?? undefined,
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

// ─── Generate Shopping List from Meal Plan (AI-based) ──────────────────────

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

const LIST_DEFAULT_LIMIT = 10;
const LIST_MAX_LIMIT = 50;

export async function listShoppingLists(
  cursor?: string,
  limit?: number
): Promise<{ lists: ShoppingListSummary[]; nextCursor: string | null }> {
  const session = await auth();
  if (!session?.userId) {
    return { lists: [], nextCursor: null };
  }

  let take = LIST_DEFAULT_LIMIT;
  if (limit !== undefined && limit > 0) {
    take = Math.min(limit, LIST_MAX_LIMIT);
  }

  // Resolve ISO timestamp cursor to a Prisma-compatible id cursor.
  // Prisma findMany cursor requires a unique field; createdAt is not unique.
  let cursorId: string | undefined;
  if (cursor) {
    const cursorRecord = await prisma.shoppingList.findFirst({
      where: { userId: session.userId, createdAt: new Date(cursor) },
      select: { id: true },
    });
    cursorId = cursorRecord?.id;
  }

  const lists = await prisma.shoppingList.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      mealPlanId: true,
      status: true,
      budget: true,
      totalEstimate: true,
      imageUrl: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  const hasMore = lists.length > take;
  const result = lists.slice(0, take);

  return {
    lists: result.map((l) => ({
      id: l.id,
      mealPlanId: l.mealPlanId ?? undefined,
      status: l.status,
      budget: l.budget ?? undefined,
      totalEstimate: l.totalEstimate ?? undefined,
      imageUrl: l.imageUrl ?? undefined,
      itemCount: l._count.items,
      createdAt: l.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? result[result.length - 1].createdAt.toISOString() : null,
  };
}

// ─── Phase 4: Item Editing ───────────────────────────────────────────────

const updateShoppingItemSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").optional(),
  quantity: z.string().optional(),
  price: z
    .number()
    .min(0, "El precio no puede ser negativo")
    .max(99999.99)
    .optional(),
  category: z
    .enum([
      "frutas_verduras",
      "carnes",
      "lacteos",
      "panaderia",
      "almacen",
      "bebidas",
      "limpieza",
      "otros",
    ])
    .optional(),
  order: z.number().int().min(0).optional(),
});

export type UpdateShoppingItemData = z.infer<typeof updateShoppingItemSchema>;

export async function updateShoppingItem(
  itemId: string,
  data: UpdateShoppingItemData,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  // Verify ownership through parent list
  const item = await prisma.shoppingItem.findFirst({
    where: { id: itemId },
    include: { shoppingList: { select: { id: true, userId: true } } },
  });

  if (!item || item.shoppingList.userId !== session.userId) {
    return { success: false, error: "No autorizado" };
  }

  try {
    await prisma.shoppingItem.update({
      where: { id: itemId },
      data,
    });

    // Recompute totalEstimate if price changed
    if (data.price !== undefined) {
      await computeTotalEstimate(item.shoppingList.id);
    }

    revalidatePath("/compras");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el item" };
  }
}

// ─── Phase 4: Item Deletion ───────────────────────────────────────────────

export async function deleteShoppingItem(
  itemId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  const item = await prisma.shoppingItem.findFirst({
    where: { id: itemId },
    include: { shoppingList: { select: { id: true, userId: true } } },
  });

  if (!item || item.shoppingList.userId !== session.userId) {
    return { success: false, error: "No autorizado" };
  }

  try {
    const listId = item.shoppingList.id;

    await prisma.shoppingItem.delete({
      where: { id: itemId },
    });

    // Recompute totalEstimate after deletion
    await computeTotalEstimate(listId);

    revalidatePath("/compras");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar el item" };
  }
}

// ─── Phase 5: Status Transitions ──────────────────────────────────────────

export async function updateShoppingListStatus(
  listId: string,
  status: "draft" | "reviewed" | "purchased",
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  const list = await prisma.shoppingList.findFirst({
    where: { id: listId, userId: session.userId },
  });

  if (!list) {
    return { success: false, error: "Lista no encontrada" };
  }

  // Validate transition
  const validTransitions: Record<string, string[]> = {
    draft: ["reviewed", "purchased"],
    reviewed: ["purchased"],
    purchased: [], // immutable
  };

  const allowed = validTransitions[list.status];
  if (!allowed || !allowed.includes(status)) {
    return {
      success: false,
      error: `No se puede cambiar de "${list.status}" a "${status}"`,
    };
  }

  try {
    await prisma.shoppingList.update({
      where: { id: listId },
      data: { status },
    });

    revalidatePath("/compras");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el estado" };
  }
}

// ─── Phase 4: Internal Helper ─────────────────────────────────────────────

async function computeTotalEstimate(listId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const items = await tx.shoppingItem.findMany({
      where: { shoppingListId: listId, price: { not: null } },
      select: { price: true },
    });

    const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

    await tx.shoppingList.update({
      where: { id: listId },
      data: { totalEstimate: total },
    });
  });
}

// ─── Phase 7: Generate from Meal Plan ─────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  frutas_verduras: [
    "fruta", "verdura", "manzana", "pera", "plátano", "platano",
    "naranja", "tomate", "lechuga", "cebolla", "ajo", "pimiento",
    "zanahoria", "calabacín", "calabacin", "brócoli", "brocoli",
    "espinaca", "pepino", "berenjena", "aguacate", "limón", "limon",
    "fresa", "sandía", "sandia", "melón", "melon", "kiwi", "mango",
    "piña", "pina", "uva", "cereza", "ensalada", "verduras",
    "vegetales", "frutas",
  ],
  carnes: [
    "pollo", "carne", "ternera", "cerdo", "cordero", "pavo",
    "conejo", "jamón", "jamon", "chorizo", "salchicha", "beicon",
    "bacon", "panceta", "filete", "chuleta", "costilla",
    "hamburguesa", "albóndiga", "albondiga", "pescado", "salmón",
    "salmon", "atún", "atun", "merluza", "bacalao", "sardina",
    "gamba", "langostino", "calamar", "pulpo", "marisco", "proteína",
    "proteina",
  ],
  lacteos: [
    "leche", "queso", "yogur", "mantequilla", "nata", "crema",
    "requesón", "requeson", "mozzarella", "cheddar", "parmesano",
    "ricotta", "kéfir", "kefir",
  ],
  panaderia: [
    "pan", "tostada", "bollo", "croissant", "magdalena", "bizcocho",
    "galleta", "cereal", "avena", "harina", "masa", "pasta",
    "macarrón", "macarron", "espagueti", "fideo", "arroz", "cuscús",
    "cuscus", "quinoa", "trigo", "maíz", "maiz", "tortilla",
    "panecillo",
  ],
  almacen: [
    "aceite", "vinagre", "sal", "azúcar", "azucar", "especia",
    "pimienta", "orégano", "oregano", "comino", "cúrcuma", "curcuma",
    "pimentón", "pimenton", "canela", "conserva", "lata", "salsa",
    "tomate frito", "caldo", "legumbre", "lenteja", "garbanzo",
    "judía", "judia", "alubia", "fruto seco", "almendra", "nuez",
    "cacahuete", "pistacho", "semilla", "chía", "chia", "miel",
    "chocolate", "café", "cafe", "té", "te",
  ],
  bebidas: [
    "agua", "zumo", "refresco", "cerveza", "vino", "batido",
    "licuado", "infusión", "infusion", "bebida",
  ],
  limpieza: [
    "jabón", "jabon", "detergente", "limpia", "lavavajillas",
    "esponja", "papel", "servilleta", "bolsa", "film", "aluminio",
  ],
};

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "otros";
}

export async function generateFromMealPlan(): Promise<{
  success: boolean;
  listId?: string;
  error?: string;
  isExisting?: boolean;
}> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  // Find the active meal plan
  const activePlan = await prisma.mealPlan.findFirst({
    where: { userId: session.userId, status: "active" },
    include: { meals: true },
    orderBy: { createdAt: "desc" },
  });

  if (!activePlan) {
    return {
      success: false,
      error:
        "No tenés un plan de comidas activo. Generá un plan primero.",
    };
  }

  if (activePlan.meals.length === 0) {
    return { success: false, error: "El plan activo no tiene comidas." };
  }

  // Check for existing draft list
  const existingList = await prisma.shoppingList.findFirst({
    where: {
      mealPlanId: activePlan.id,
      userId: session.userId,
      status: "draft",
    },
  });

  if (existingList) {
    return { success: true, listId: existingList.id, isExisting: true };
  }

  // Extract ingredients from meals
  const ingredientMap = new Map<
    string,
    { quantity: string | null; count: number }
  >();

  for (const meal of activePlan.meals) {
    // Extract from meal name — split by common delimiters
    const nameWords = meal.name
      .split(/[,;]| y | con /)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const word of nameWords) {
      if (word.length > 2) {
        const existing = ingredientMap.get(word.toLowerCase());
        if (existing) {
          existing.count++;
        } else {
          ingredientMap.set(word.toLowerCase(), { quantity: null, count: 1 });
        }
      }
    }

    // Try to parse selectedOptions JSON for additional ingredients
    if (meal.selectedOptions) {
      try {
        const options =
          typeof meal.selectedOptions === "string"
            ? (JSON.parse(meal.selectedOptions) as unknown)
            : meal.selectedOptions;

        if (Array.isArray(options)) {
          for (const opt of options) {
            if (typeof opt === "object" && opt !== null) {
              const optRecord = opt as Record<string, unknown>;
              const name =
                typeof optRecord.name === "string"
                  ? optRecord.name.trim()
                  : "";
              if (name.length > 2) {
                const qty =
                  typeof optRecord.quantity === "number" ||
                  typeof optRecord.quantity === "string"
                    ? String(optRecord.quantity)
                    : null;
                const existing = ingredientMap.get(name.toLowerCase());
                if (existing) {
                  existing.count++;
                  if (qty && !existing.quantity) existing.quantity = qty;
                } else {
                  ingredientMap.set(name.toLowerCase(), {
                    quantity: qty,
                    count: 1,
                  });
                }
              }
            }
          }
        }
      } catch {
        // Skip malformed JSON — best-effort extraction
      }
    }

    // Try translations JSON for localized ingredient names
    if (meal.translations) {
      try {
        const translations =
          typeof meal.translations === "string"
            ? (JSON.parse(meal.translations) as unknown)
            : meal.translations;

        if (typeof translations === "object" && translations !== null) {
          const t = translations as Record<string, unknown>;
          // Look for ingredient lists in translation values
          for (const val of Object.values(t)) {
            if (typeof val === "string" && val.includes(",")) {
              for (const item of val.split(",")) {
                const trimmed = item.trim();
                if (trimmed.length > 2) {
                  const existing = ingredientMap.get(trimmed.toLowerCase());
                  if (existing) {
                    existing.count++;
                  } else {
                    ingredientMap.set(trimmed.toLowerCase(), {
                      quantity: null,
                      count: 1,
                    });
                  }
                }
              }
            }
          }
        }
      } catch {
        // Skip malformed translations JSON
      }
    }
  }

  // Create the shopping list items from extracted ingredients
  const items = Array.from(ingredientMap.entries()).map(
    ([name, data], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: data.quantity,
      category: categorizeIngredient(name),
      confidence: "medium" as const,
      matchedToPlan: true,
      order: index,
    }),
  );

  if (items.length === 0) {
    return {
      success: false,
      error:
        "No se pudieron extraer ingredientes del plan activo.",
    };
  }

  try {
    const result = await prisma.shoppingList.create({
      data: {
        userId: session.userId,
        mealPlanId: activePlan.id,
        status: "draft",
        items: { create: items },
      },
    });

    revalidatePath("/compras");
    return { success: true, listId: result.id };
  } catch {
    return {
      success: false,
      error: "Error al generar la lista desde el plan.",
    };
  }
}

// ─── Phase 10: Cleanup & Polish ───────────────────────────────────────────

export async function cleanupOrphanLists(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.shoppingList.deleteMany({
      where: {
        userId: session.userId,
        status: "draft",
        createdAt: { lt: twentyFourHoursAgo },
        items: { none: {} },
      },
    });

    return { success: true, deletedCount: result.count };
  } catch {
    return {
      success: false,
      error: "Error al limpiar listas huérfanas.",
    };
  }
}
