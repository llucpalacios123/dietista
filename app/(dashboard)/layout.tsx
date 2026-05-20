import { auth, signOut } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MobileShell } from "@/components/dietista/navigation/mobile-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  return (
    <MobileShell>
      {/* Auth-aware header area — kept minimal since nav is in BottomNav */}
      <div className="flex items-center justify-between px-[18px] pt-4 pb-2">
        <Link href="/dashboard" className="text-lg font-bold text-[var(--brand-600)]">
          Dietista
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
            Salir
          </button>
        </form>
      </div>
      {children}
    </MobileShell>
  );
}
