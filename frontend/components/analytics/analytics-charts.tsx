"use client";
import type { EChartsOption } from "echarts";
import { EChart } from "@/components/charts/echart";
import {
  AXIS,
  LEGEND,
  SPLIT_LINE,
  TOOLTIP,
  buildDateRange,
  labelInterval,
} from "@/lib/chart-theme";
import { CATEGORY_COLOR } from "@/lib/severity";
import type {
  EarthquakeAnalytics,
  MagnitudeCategory,
  RainfallAnalytics,
  WeatherAnalytics,
} from "@/types/api";

const BAND_ORDER: MagnitudeCategory[] = [
  "low",
  "moderate",
  "significant",
  "strong",
  "major",
  "severe",
];

export function EarthquakeTimelineChart({
  data,
}: {
  data: EarthquakeAnalytics;
}) {
  const dates = buildDateRange(data.days);
  const map = new Map(data.timeline.map((t) => [t.date, t]));
  const counts = dates.map((d) => map.get(d)?.count ?? 0);
  const maxMags = dates.map((d) => map.get(d)?.max_magnitude ?? null);
  const option: EChartsOption = {
    backgroundColor: "transparent",
    grid: { top: 36, right: 44, bottom: 26, left: 40 },
    tooltip: { trigger: "axis", ...TOOLTIP, axisPointer: { type: "shadow" } },
    legend: LEGEND,
    xAxis: {
      type: "category",
      data: dates,
      ...AXIS,
      axisLabel: {
        ...AXIS.axisLabel,
        interval: labelInterval(dates.length),
        formatter: (v: string) => v.slice(5),
      },
    },
    yAxis: [
      {
        type: "value",
        name: "Gempa",
        nameTextStyle: { color: "#94A3B8" },
        splitLine: SPLIT_LINE,
        ...AXIS,
      },
      {
        type: "value",
        name: "Maks M",
        max: 10,
        min: 0,
        nameTextStyle: { color: "#94A3B8" },
        splitLine: { show: false },
        ...AXIS,
      },
    ],
    series: [
      {
        name: "Jumlah gempa",
        type: "bar",
        data: counts,
        itemStyle: { color: "#22D3EE", borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 18,
      },
      {
        name: "Magnitudo maks",
        type: "line",
        yAxisIndex: 1,
        data: maxMags,
        smooth: true,
        symbolSize: 4,
        connectNulls: true,
        lineStyle: { color: "#F59E0B", width: 2 },
        itemStyle: { color: "#F59E0B" },
      },
    ],
  };
  return <EChart option={option} height={280} ariaLabel="Tren gempa harian" />;
}

export function MagnitudeDistributionChart({
  data,
}: {
  data: EarthquakeAnalytics;
}) {
  const labels = ["<3", "3–4", "4–5", "5–6", "6–7", "7+"];
  const option: EChartsOption = {
    backgroundColor: "transparent",
    grid: { top: 24, right: 16, bottom: 26, left: 36 },
    tooltip: { trigger: "axis", ...TOOLTIP, axisPointer: { type: "shadow" } },
    xAxis: { type: "category", data: labels, ...AXIS },
    yAxis: { type: "value", splitLine: SPLIT_LINE, ...AXIS },
    series: [
      {
        type: "bar",
        data: BAND_ORDER.map((k) => ({
          value: data.distribution[k] ?? 0,
          itemStyle: { color: CATEGORY_COLOR[k], borderRadius: [3, 3, 0, 0] },
        })),
        barMaxWidth: 32,
      },
    ],
  };
  return (
    <EChart option={option} height={220} ariaLabel="Distribusi magnitudo" />
  );
}

export function DepthDistributionChart({
  data,
}: {
  data: EarthquakeAnalytics;
}) {
  const d = data.depth_distribution;
  const rows = [
    { name: "Dangkal (<70 km)", value: d.shallow, color: "#22C55E" },
    { name: "Menengah (70–300)", value: d.intermediate, color: "#F59E0B" },
    { name: "Dalam (>300 km)", value: d.deep, color: "#EF4444" },
  ];
  const option: EChartsOption = {
    backgroundColor: "transparent",
    grid: { top: 16, right: 30, bottom: 26, left: 110 },
    tooltip: { trigger: "axis", ...TOOLTIP, axisPointer: { type: "shadow" } },
    xAxis: { type: "value", splitLine: SPLIT_LINE, ...AXIS },
    yAxis: { type: "category", data: rows.map((r) => r.name), ...AXIS },
    series: [
      {
        type: "bar",
        data: rows.map((r) => ({
          value: r.value,
          itemStyle: { color: r.color, borderRadius: [0, 3, 3, 0] },
        })),
        barMaxWidth: 22,
      },
    ],
  };
  return (
    <EChart option={option} height={220} ariaLabel="Distribusi kedalaman" />
  );
}

export function HourlyChart({ data }: { data: EarthquakeAnalytics }) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}`.padStart(2, "0"));
  const max = Math.max(...data.by_hour);
  const option: EChartsOption = {
    backgroundColor: "transparent",
    grid: { top: 16, right: 12, bottom: 26, left: 32 },
    tooltip: { trigger: "axis", ...TOOLTIP, axisPointer: { type: "shadow" } },
    xAxis: { type: "category", data: hours, ...AXIS },
    yAxis: { type: "value", splitLine: SPLIT_LINE, ...AXIS },
    series: [
      {
        type: "bar",
        data: data.by_hour.map((v) => ({
          value: v,
          itemStyle: {
            color: v === max && max > 0 ? "#F59E0B" : "#38BDF8",
            borderRadius: [2, 2, 0, 0],
          },
        })),
        barMaxWidth: 14,
      },
    ],
  };
  return (
    <EChart option={option} height={220} ariaLabel="Aktivitas per jam WIB" />
  );
}

export function RainfallTrendChart({ data }: { data: RainfallAnalytics }) {
  const dates = buildDateRange(data.days);
  const map = new Map(data.timeline.map((t) => [t.date, t]));
  const peaks = dates.map((d) => map.get(d)?.peak_1h_mm ?? 0);
  const option: EChartsOption = {
    backgroundColor: "transparent",
    grid: { top: 24, right: 16, bottom: 26, left: 40 },
    tooltip: {
      trigger: "axis",
      ...TOOLTIP,
      valueFormatter: (v) => `${Number(v).toFixed(1)} mm/jam`,
    },
    xAxis: {
      type: "category",
      data: dates,
      ...AXIS,
      axisLabel: {
        ...AXIS.axisLabel,
        interval: labelInterval(dates.length),
        formatter: (v: string) => v.slice(5),
      },
    },
    yAxis: {
      type: "value",
      name: "mm/jam",
      nameTextStyle: { color: "#94A3B8" },
      splitLine: SPLIT_LINE,
      ...AXIS,
    },
    series: [
      {
        name: "Puncak intensitas",
        type: "line",
        data: peaks,
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#38BDF8", width: 2 },
        areaStyle: { color: "rgba(56, 189, 248, 0.15)" },
      },
    ],
  };
  return <EChart option={option} height={240} ariaLabel="Tren curah hujan" />;
}

export function TemperatureTrendChart({ data }: { data: WeatherAnalytics }) {
  const dates = buildDateRange(data.days);
  const map = new Map(data.timeline.map((t) => [t.date, t]));
  const get = (k: "avg_temp" | "min_temp" | "max_temp") =>
    dates.map((d) => map.get(d)?.[k] ?? null);
  const option: EChartsOption = {
    backgroundColor: "transparent",
    grid: { top: 36, right: 16, bottom: 26, left: 40 },
    tooltip: { trigger: "axis", ...TOOLTIP, valueFormatter: (v) => `${v}°C` },
    legend: LEGEND,
    xAxis: {
      type: "category",
      data: dates,
      ...AXIS,
      axisLabel: {
        ...AXIS.axisLabel,
        interval: labelInterval(dates.length),
        formatter: (v: string) => v.slice(5),
      },
    },
    yAxis: {
      type: "value",
      name: "°C",
      nameTextStyle: { color: "#94A3B8" },
      scale: true,
      splitLine: SPLIT_LINE,
      ...AXIS,
    },
    series: [
      {
        name: "Rata-rata",
        type: "line",
        data: get("avg_temp"),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#22D3EE", width: 2 },
      },
      {
        name: "Minimum",
        type: "line",
        data: get("min_temp"),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#38BDF8", width: 1.5, type: "dashed" },
      },
      {
        name: "Maksimum",
        type: "line",
        data: get("max_temp"),
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#F97316", width: 1.5, type: "dashed" },
      },
    ],
  };
  return <EChart option={option} height={240} ariaLabel="Tren suhu" />;
}

const CONDITION_META: Partial<
  Record<string, { label: string; color: string }>
> = {
  clear: { label: "Cerah", color: "#F59E0B" },
  partly_cloudy: { label: "Berawan Sebagian", color: "#94A3B8" },
  cloudy: { label: "Berawan", color: "#64748B" },
  fog: { label: "Kabut", color: "#8B9DC3" },
  drizzle: { label: "Gerimis", color: "#38BDF8" },
  rain: { label: "Hujan", color: "#22D3EE" },
  heavy_rain: { label: "Hujan Lebat", color: "#F97316" },
  thunderstorm: { label: "Badai Petir", color: "#F43F5E" },
  extreme: { label: "Ekstrem", color: "#EF4444" },
  unknown: { label: "Tidak Diketahui", color: "#475569" },
};

export function ConditionDonutChart({ data }: { data: WeatherAnalytics }) {
  const entries = Object.entries(data.condition_counts)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([code, count]) => {
      const meta = CONDITION_META[code] ?? { label: code, color: "#475569" };
      return {
        value: count ?? 0,
        name: meta.label,
        itemStyle: { color: meta.color },
      };
    });
  const option: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: { trigger: "item", ...TOOLTIP },
    series: [
      {
        type: "pie",
        radius: ["48%", "72%"],
        center: ["50%", "52%"],
        data: entries,
        label: { color: "#94A3B8", fontSize: 10, formatter: "{b}" },
        labelLine: { lineStyle: { color: "#203B56" } },
        itemStyle: { borderColor: "#13263A", borderWidth: 2 },
        emphasis: { scaleSize: 4 },
      },
    ],
  };
  return (
    <EChart option={option} height={240} ariaLabel="Distribusi kondisi cuaca" />
  );
}
