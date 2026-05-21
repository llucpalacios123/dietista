"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface BottomNavProps {
  /** Override default nav items */
  items?: NavItem[];
}

export function BottomNav({ items }: BottomNavProps): React.ReactElement {
  const t = useTranslations("Navigation");
  const pathname = usePathname();

  const defaultItems: NavItem[] = [
    {
      label: t("home"),
      href: "/dashboard",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: t("journal"),
      href: "/diario",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: t("plans"),
      href: "/planes",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const navItems = items ?? defaultItems;

  return (
    <nav
      className="fixed bottom-4 left-2 right-2 z-50 rounded-[28px] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-1.5 py-2 shadow-lg backdrop-blur-xl"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 gap-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-colors ${
                isActive
                  ? "text-[var(--brand-600)]"
                  : "text-[var(--dietista-text-3)] hover:text-[var(--dietista-text-2)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span className="text-[10px] font-semibold tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
