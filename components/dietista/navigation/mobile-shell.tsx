import React from "react";
import { BottomNav } from "./bottom-nav";

export interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps): React.ReactElement {
  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--dietista-bg)]">
      <main className="flex-1 overflow-x-hidden pb-[92px]">
        <div className="animate-fade-up min-h-0 flex-1 overflow-y-auto px-4">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
