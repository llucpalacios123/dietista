import { getShoppingList } from "@/actions/shopping-list";
import { ShoppingDetail } from "../_components/ShoppingDetail";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function ComprasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const list = await getShoppingList(id);

  if (!list) {
    notFound();
  }

  const t = await getTranslations("Shopping");

  return (
    <div className="space-y-4 px-1 pb-4">
      <div className="flex items-center gap-3 px-[18px] pt-4">
        <Link
          href="/compras"
          className="rounded-lg p-2 text-[var(--dietista-text-2)] hover:bg-[var(--dietista-surface-2)]"
          aria-label={t("back")}
        >
          ←
        </Link>
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("shoppingList")}
        </h1>
      </div>
      <ShoppingDetail list={list} />
    </div>
  );
}
