import React from "react";

export interface ScreenHeaderProps {
  /** Main title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Right-side action element (button, icon, etc.) */
  action?: React.ReactNode;
}

export function ScreenHeader({
  title,
  subtitle,
  action,
}: ScreenHeaderProps): React.ReactElement {
  return (
    <div className="flex items-end justify-between px-[18px] pt-14 pb-2">
      <div>
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
