"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import type { NavItem } from "./bottom-nav";

export interface SidebarProps {
  /** Override default nav items */
  items?: NavItem[];
}

export function Sidebar({ items }: SidebarProps): React.ReactElement {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  const defaultItems: Array<{ label: string; href: string; icon: React.ReactNode }> = [
    {
      label: t("home"),
      href: "/dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: t("journal"),
      href: "/diario",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      label: t("plans"),
      href: "/planes",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: t("shopping"),
      href: "/compras",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      label: t("profile"),
      href: "/perfil",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const navItems = items ?? defaultItems;

  return (
    <aside className="hidden w-64 flex-col border-r border-[var(--dietista-border)] bg-[var(--dietista-surface)] md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--dietista-border)] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-500)] text-white font-bold">
          D
        </div>
        <span className="text-lg font-bold text-[var(--dietista-text)]">{t("brand")}</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--brand-50)] text-[var(--brand-700)]"
                  : "text-[var(--dietista-text-2)] hover:bg-[var(--dietista-surface-2)] hover:text-[var(--dietista-text)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
