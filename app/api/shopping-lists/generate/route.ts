import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";

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

/**
 * POST /api/shopping-lists/generate
 * Generates a shopping list from a meal plan using AI to extract ingredients.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { mealPlanId } = body as { mealPlanId?: string };

  if (!mealPlanId) {
    return NextResponse.json(
      { error: "mealPlanId es obligatorio" },
      { status: 400 }
    );
  }

  // Fetch meal plan with meals
  const mealPlan = await prisma.mealPlan.findFirst({
    where: { id: mealPlanId, userId: session.userId },
    include: { meals: true },
  });

  if (!mealPlan) {
    return NextResponse.json(
      { error: "Plan de comidas no encontrado" },
      { status: 404 }
    );
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
      model: "gpt-5-nano",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "La IA no ha devuelto una respuesta" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as {
      items: Array<{ name: string; quantity?: string; category: string }>;
    };

    if (!parsed.items || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: "Formato de respuesta no válido" },
        { status: 500 }
      );
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
      include: { items: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({
      id: result.id,
      status: result.status,
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        order: item.order,
        matchedToPlan: item.matchedToPlan,
      })),
    });
  } catch (error) {
    console.error("[generate-shopping-list] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar la lista" },
      { status: 500 }
    );
  }
}
