"use client";

// Lazy-loaded chart wrappers using next/dynamic to avoid SSR issues with Recharts.
import dynamic from "next/dynamic";

export const WeightChart = dynamic(
  () =>
    import("./weight-chart").then((mod) => ({
      default: mod.WeightChartInner,
    })),
  { ssr: false, loading: () => <ChartSkeleton label="Peso" /> }
);

export const MacroStackChart = dynamic(
  () =>
    import("./macro-stack-chart").then((mod) => ({
      default: mod.MacroStackChartInner,
    })),
  { ssr: false, loading: () => <ChartSkeleton label="Macros" /> }
);

export const AdherenceHeatMap = dynamic(
  () =>
    import("./adherence-heatmap").then((mod) => ({
      default: mod.AdherenceHeatMapInner,
    })),
  { ssr: false, loading: () => <ChartSkeleton label="Adherencia" /> }
);

function ChartSkeleton({ label }: { label: string }): React.ReactElement {
  return (
    <div
      className="flex h-60 items-center justify-center text-sm text-[var(--dietista-text-3)]"
      role="status"
      aria-label={`Loading ${label} chart`}
    >
      Cargando {label}...
    </div>
  );
}
