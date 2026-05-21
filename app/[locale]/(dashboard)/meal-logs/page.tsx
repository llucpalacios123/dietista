import { MealLogForm } from "@/components/meal-logs/meal-log-form";
import { MealLogList } from "@/components/meal-logs/meal-log-list";
import { getTranslations } from "next-intl/server";

export default async function MealLogsPage(): Promise<React.ReactElement> {
  const t = await getTranslations("MealLog");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("generateAndManage")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: New Entry Form */}
        <div>
          <MealLogForm />
        </div>

        {/* Right: Log History */}
        <div>
          <MealLogList />
        </div>
      </div>
    </div>
  );
}
