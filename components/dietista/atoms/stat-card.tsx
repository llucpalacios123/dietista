import React from "react";

export interface StatCardProps {
  /** Icon element or emoji */
  icon: React.ReactNode;
  /** Primary value to display */
  value: string;
  /** Label below the value */
  label: string;
  /** Optional subtitle or trend indicator */
  subtitle?: string;
  /** Optional CSS class for the card container */
  className?: string;
}

export function StatCard({
  icon,
  value,
  label,
  subtitle,
  className = "",
}: StatCardProps): React.ReactElement {
  return (
    <div
      className={`rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)] ${className}`}
    >
      <div className="flex items-center gap-2 text-[var(--dietista-text-3)]">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--dietista-text)] tnum">
        {value}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--dietista-text-2)]">{subtitle}</p>
      )}
    </div>
  );
}
