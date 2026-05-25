import { listShoppingLists } from "@/actions/shopping-list";
import { ComprasClient } from "./_components/ComprasClient";
import type { ShoppingListSummary } from "@/types/dietista";

export default async function ComprasPage(): Promise<React.ReactElement> {
  let recentList: ShoppingListSummary | null = null;
  const { lists } = await listShoppingLists(undefined, 1);
  if (lists.length > 0) {
    recentList = lists[0];
  }

  return <ComprasClient recentList={recentList} />;
}
