// ────────────── Dietista — Design Tokens ──────────────
// Translated from docs/Dietista/styles.css for use in Tailwind + components.

export const brand = {
  50: "#ecfdf5",
  100: "#d1fae5",
  200: "#a7f3d0",
  300: "#6ee7b7",
  400: "#34d399",
  500: "#10b981",
  600: "#059669",
  700: "#047857",
  800: "#065f46",
  900: "#064e3b",
} as const;

export const macro = {
  cal: { fg: "#10b981", bg: "#d1fae5" },
  pro: { fg: "#2563eb", bg: "#dbeafe" },
  carb: { fg: "#f59e0b", bg: "#fef3c7" },
  fat: { fg: "#f43f5e", bg: "#ffe4e6" },
} as const;

export const semantic = {
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
} as const;

export const light = {
  bg: "#f5f7f6",
  surface: "#ffffff",
  surface2: "#f9faf9",
  elev: "#ffffff",
  border: "rgba(15, 23, 42, 0.07)",
  borderStrong: "rgba(15, 23, 42, 0.12)",
  hairline: "rgba(15, 23, 42, 0.06)",
  text: "#0b1411",
  text2: "#5b6b66",
  text3: "#8a9a94",
  textOnBrand: "#ffffff",
} as const;

export const dark = {
  bg: "#0a0f0d",
  surface: "#131816",
  surface2: "#181d1b",
  elev: "#1b211f",
  border: "rgba(255, 255, 255, 0.06)",
  borderStrong: "rgba(255, 255, 255, 0.1)",
  hairline: "rgba(255, 255, 255, 0.05)",
  text: "#ecf3ef",
  text2: "#98a8a2",
  text3: "#6a7a74",
  ringCalBg: "rgba(16, 185, 129, 0.16)",
  ringProBg: "rgba(37, 99, 235, 0.18)",
  ringCarbBg: "rgba(245, 158, 11, 0.16)",
  ringFatBg: "rgba(244, 63, 94, 0.16)",
} as const;

export const radius = {
  sm: "10px",
  md: "14px",
  lg: "20px",
  xl: "28px",
} as const;

export const spacing = {
  padCard: "16px",
  gapCard: "12px",
} as const;

export const density = {
  cozy: { padCard: "18px", gapCard: "14px" },
  comfortable: { padCard: "14px", gapCard: "10px" },
  compact: { padCard: "11px", gapCard: "7px" },
} as const;

export const accent = {
  emerald: {
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    ringCal: "#10b981",
  },
  lime: {
    400: "#a3e635",
    500: "#84cc16",
    600: "#65a30d",
    700: "#4d7c0f",
    ringCal: "#84cc16",
  },
  forest: {
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    ringCal: "#22c55e",
  },
  teal: {
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    ringCal: "#14b8a6",
  },
} as const;

export type AccentName = keyof typeof accent;
export type DensityName = keyof typeof density;
