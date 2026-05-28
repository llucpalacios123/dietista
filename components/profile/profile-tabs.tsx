"use client";

import { useState } from "react";
import type { JSX } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@prisma/client";
import { AccountSection } from "./account-section";
import { BodyGoalsSection } from "./body-goals-section";

// ─── Types ────────────────────────────────────────────────────────────────

type TabKey = "account" | "body";

export interface ProfileTabsProps {
  profile: Profile | null;
  account: { name: string | null; email: string };
}

// ─── ProfileTabs ──────────────────────────────────────────────────────────

export function ProfileTabs({ profile, account }: ProfileTabsProps): JSX.Element {
  const t = useTranslations("Profile");
  const [activeTab, setActiveTab] = useState<TabKey>("account");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "account", label: t("tabs.account") },
    { key: "body", label: t("tabs.bodyGoals") },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div
        className="flex gap-1 rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] p-1"
        role="tablist"
        aria-label="Profile sections"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex-1 rounded-[calc(var(--dietista-r-lg)-2px)] px-2 py-2 text-xs font-semibold tracking-tight transition-colors",
                isActive
                  ? "bg-[var(--dietista-surface)] text-[var(--brand-600)] shadow-sm"
                  : "text-[var(--dietista-text-2)] hover:text-[var(--dietista-text)]",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div
        id="tabpanel-account"
        role="tabpanel"
        aria-labelledby="tab-account"
        hidden={activeTab !== "account"}
      >
        <AccountSection name={account.name} email={account.email} />
      </div>

      <div
        id="tabpanel-body"
        role="tabpanel"
        aria-labelledby="tab-body"
        hidden={activeTab !== "body"}
      >
        <BodyGoalsSection profile={profile} />
      </div>

    </div>
  );
}
