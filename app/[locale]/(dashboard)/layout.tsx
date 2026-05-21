import { auth, signOut } from "@/lib/auth-config";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { MobileShell } from "@/components/dietista/navigation/mobile-shell";

import type { Locale } from "@/i18n/routing";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.userId) {
    redirect({ href: "/login", locale: "es" as Locale });
  }

  const t = await getTranslations("Navigation");

  return (
    <MobileShell>
      {/* Auth-aware header area — kept minimal since nav is in BottomNav */}
      <div className="flex items-center justify-between px-[18px] pt-4 pb-2">
        <Link href="/dashboard" className="text-lg font-bold text-[var(--brand-600)]">
          {t("brand")}
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm font-medium text-[var(--dietista-text-3)] transition-colors hover:text-[var(--dietista-danger)]"
          >
            {t("signOut")}
          </button>
        </form>
      </div>
      {children}
    </MobileShell>
  );
}
