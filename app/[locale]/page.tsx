import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<never> {
  const { locale } = await params;
  return redirect({ href: "/dashboard", locale });
}
