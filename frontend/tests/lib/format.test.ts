import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatDateTime,
  formatDepth,
  formatTime,
  timeAgo,
  windDirectionLabel,
} from "@/lib/format";

describe("formatTime — konversi UTC → zona Indonesia", () => {
  it("00:00 UTC = 07:00 WIB (Jakarta)", () => {
    expect(formatTime("2026-08-29T00:00:00Z")).toBe("07:00:00 WIB");
  });

  it("WITA (Makassar) = UTC+8", () => {
    expect(formatTime("2026-08-29T00:00:00Z", "Asia/Makassar")).toBe(
      "08:00:00 WITA",
    );
  });

  it("WIT (Jayapura) = UTC+9", () => {
    expect(formatTime("2026-08-29T00:00:00Z", "Asia/Jayapura")).toBe(
      "09:00:00 WIT",
    );
  });
});

describe("formatDateTime", () => {
  it("berisi tanggal Indonesia + jam WIB", () => {
    const result = formatDateTime("2026-08-29T00:00:00Z");
    expect(result).toContain("2026");
    expect(result).toContain("07:00 WIB");
  });
});

describe("timeAgo — relative time", () => {
  afterEach(() => vi.useRealTimers());

  it("menit, jam, hari", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T12:00:00Z"));

    expect(timeAgo("2026-08-29T11:59:40Z")).toBe("baru saja");
    expect(timeAgo("2026-08-29T11:50:00Z")).toBe("10 mnt lalu");
    expect(timeAgo("2026-08-29T09:00:00Z")).toBe("3 jam lalu");
    expect(timeAgo("2026-08-27T12:00:00Z")).toBe("2 hari lalu");
  });
});

describe("helpers kecil", () => {
  it("windDirectionLabel", () => {
    expect(windDirectionLabel(0)).toBe("N");
    expect(windDirectionLabel(210)).toBe("SW");
    expect(windDirectionLabel(null)).toBe("");
  });

  it("formatDepth membulatkan", () => {
    expect(formatDepth(18.4)).toBe("18 km");
    expect(formatDepth(140.9)).toBe("141 km");
  });
});
