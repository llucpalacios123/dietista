import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";
import { interpretShoppingListImage, createListFromVision } from "@/actions/vision";

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { imageUrl } = body as { imageUrl: string };

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl es requerido" }, { status: 400 });
  }

  const result = await interpretShoppingListImage(imageUrl);

  if (!result.success || !result.items) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  // Auto-create the shopping list from vision results
  const listResult = await createListFromVision(result.items, imageUrl);

  if (!listResult.success || !listResult.id) {
    return NextResponse.json({ error: listResult.error }, { status: 500 });
  }

  return NextResponse.json({
    listId: listResult.id,
    items: result.items,
  });
}
