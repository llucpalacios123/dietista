"use client";

import { useState, useEffect } from "react";

// ─── useVisualViewport ────────────────────────────────────────────────────────
//
// Tracks the visual viewport dimensions to compensate for the virtual keyboard
// on iOS Safari and Android Chrome, where the visible area shrinks when the
// keyboard appears but `100dvh` may not update reliably.
//
// On desktop (window.innerWidth >= 640) or when the visualViewport API is
// absent, falls back to window.innerHeight to avoid layout regressions.

export interface ViewportState {
  height: number;
  offsetTop: number;
}

function getInitialState(): ViewportState {
  if (typeof window === "undefined") {
    // SSR fallback — values are irrelevant; the hook re-runs after hydration
    return { height: 0, offsetTop: 0 };
  }

  const vv = window.visualViewport;
  if (vv) {
    return { height: vv.height, offsetTop: vv.offsetTop };
  }
  return { height: window.innerHeight, offsetTop: 0 };
}

export function useVisualViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>(getInitialState);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) {
      // No API — state is already set to innerHeight; nothing to subscribe to
      return;
    }

    const update = () => {
      setState({ height: vv.height, offsetTop: vv.offsetTop });
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);

    // Sync immediately in case the viewport has already changed
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return state;
}
