import { useTranslations } from "next-intl";

/* ---------- color map ---------- */

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  purchased: "bg-green-100 text-green-800",
};

const statusKey: Record<string, string> = {
  draft: "status.draft",
  reviewed: "status.reviewed",
  purchased: "status.purchased",
};

/* ---------- props ---------- */

interface StatusBadgeProps {
  status: "draft" | "reviewed" | "purchased";
}

/* ---------- component ---------- */

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const t = useTranslations("Shopping");

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status] ?? statusColors.draft}`}
    >
      {t(statusKey[status] ?? statusKey.draft)}
    </span>
  );
}
