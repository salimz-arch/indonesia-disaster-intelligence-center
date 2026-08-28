export const AXIS = {
  axisLine: { lineStyle: { color: "#203B56" } },
  axisTick: { show: false },
  axisLabel: { color: "#94A3B8", fontSize: 10 },
};
export const SPLIT_LINE = { lineStyle: { color: "rgba(32, 59, 86, 0.45)" } };
export const TOOLTIP = {
  backgroundColor: "#13263A",
  borderColor: "#203B56",
  borderWidth: 1,
  textStyle: { color: "#F8FAFC", fontSize: 12 },
};
export const LEGEND = {
  textStyle: { color: "#94A3B8", fontSize: 11 },
  itemWidth: 12,
  itemHeight: 8,
  top: 0,
};

export function buildDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
export function labelInterval(total: number): number {
  return Math.max(0, Math.ceil(total / 10) - 1);
}
