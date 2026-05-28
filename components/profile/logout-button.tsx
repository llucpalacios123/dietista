"use client";

import type { JSX } from "react";
import { useTranslations } from "next-intl";
import { logoutAction } from "@/actions/account";

// ─── LogoutButton ─────────────────────────────────────────────────────────

/**
 * Client component that renders a form wrapping the logoutAction server action.
 * Using a form (not onClick) ensures the server action works without JavaScript.
 * Does NOT require SessionProvider to be mounted.
 */
export function LogoutButton(): JSX.Element {
  const t = useTranslations("Profile");

  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="w-full rounded-[var(--dietista-r)] border border-[var(--dietista-danger)] px-4 py-2 text-sm font-semibold text-[var(--dietista-danger)] transition-colors hover:bg-[var(--dietista-danger)] hover:text-white"
      >
        {t("Account.signOut")}
      </button>
    </form>
  );
}
