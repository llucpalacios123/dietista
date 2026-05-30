"use server";

import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { openai } from "@/lib/openai";

const SHOPPING_LIST_INTERPRET_SYSTEM = `Eres un asistente nutricional. Analizá la imagen de una lista de compras y devolvé un JSON con los productos detectados.

Formato de respuesta:
{
  "items": [
    {
      "name": "nombre del producto",
      "quantity": "cantidad (ej: 1kg, 500g, 2 unidades)",
      "category": "frutas_verduras|carnes|lacteos|panaderia|almacen|bebidas|limpieza|otros",
      "confidence": "high|medium|low"
    }
  ]
}

Si no podés detectar un producto, omitilo. No inventes productos.`;

export async function interpretShoppingListImage(
  imageUrl: string
): Promise<{
  success: boolean;
  items?: Array<{
    name: string;
    quantity?: string;
    category?: string;
    confidence: "high" | "medium" | "low";
  }>;
  error?: string;
}> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  // Rate limit check: 10 uploads per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayUploads = await prisma.shoppingList.count({
    where: {
      userId: session.userId,
      createdAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  if (todayUploads >= 10) {
    return {
      success: false,
      error: "Límite diario alcanzado (10 uploads/día)",
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SHOPPING_LIST_INTERPRET_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No se pudo interpretar la imagen" };
    }

    const parsed = JSON.parse(content) as {
      items?: Array<{
        name: string;
        quantity?: string;
        category?: string;
        confidence?: string;
      }>;
    };

    const items = (parsed.items ?? []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      category: item.category,
      confidence: (item.confidence as "high" | "medium" | "low") ?? "medium",
    }));

    return { success: true, items };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function createListFromVision(
  items: Array<{
    name: string;
    quantity?: string;
    category?: string;
    confidence: "high" | "medium" | "low";
  }>,
  imageUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const session = await auth();
  if (!session?.userId) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const list = await prisma.shoppingList.create({
      data: {
        userId: session.userId,
        imageUrl,
        status: "reviewed",
        items: {
          create: items.map((item, i) => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            confidence: item.confidence,
            order: i,
          })),
        },
      },
    });

    revalidatePath("/compras");
    return { success: true, id: list.id };
  } catch {
    return { success: false, error: "Error al crear la lista" };
  }
}
