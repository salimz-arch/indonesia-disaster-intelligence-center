import { describe, expect, it } from "vitest";

import { deriveRegion } from "@/lib/region";

describe("deriveRegion — BMKG tanpa dash (kasus gagal sebelumnya)", () => {
  it("di darat + arah berjarak → kabupaten", () => {
    expect(
      deriveRegion(
        null,
        "Pusat gempa berada di darat 35 km Timur Laut Luwu Utara",
      ),
    ).toBe("Luwu Utara");
  });

  it("di laut + arah menempel + dash → kode provinsi", () => {
    expect(
      deriveRegion(
        null,
        "Pusat gempa berada di laut 38 km TimurLaut RUTENG-MANGGARAI-NTT",
      ),
    ).toBe("NTT");
    expect(
      deriveRegion(
        null,
        "Pusat gempa berada di laut 108 km BaratDaya TAHUNA-KEP.SANGIHE-SULUT",
      ),
    ).toBe("SULUT");
  });

  it("di laut tanpa dash → nama lokasi utuh", () => {
    expect(
      deriveRegion(
        null,
        "Pusat gempa berada di laut 241 km BaratLaut Saumlaki",
      ),
    ).toBe("Saumlaki");
  });
});

describe("deriveRegion — USGS", () => {
  it("Place sebelum , Indonesia", () => {
    expect(deriveRegion(null, "27 km S of Labuan Bajo, Indonesia")).toBe(
      "Labuan Bajo",
    );
    expect(deriveRegion(null, "142 km NW of Ternate, Indonesia")).toBe(
      "Ternate",
    );
  });

  it("negara non-Indonesia dipertahankan", () => {
    expect(deriveRegion(null, "25 km ESE of Lospalos, Timor Leste")).toBe(
      "Timor Leste",
    );
  });
});

describe("deriveRegion — kolom resmi & fallback", () => {
  it("kolom region resmi menang", () => {
    expect(deriveRegion("Sumatera Utara", "apapun")).toBe("Sumatera Utara");
  });

  it("provinsi di teks polos", () => {
    expect(deriveRegion(null, "Selatan Jawa Barat")).toBe("Jawa Barat");
  });

  it("teks pendek dipertahankan", () => {
    expect(deriveRegion(null, "Laut Banda")).toBe("Laut Banda");
  });

  it("null semua → placeholder", () => {
    expect(deriveRegion(null, null)).toBe("—");
  });
});
describe("deriveRegion — kolom region terkontaminasi teks penuh", () => {
  it("region berisi teks lokasi utuh → diabaikan, derive dari location_text", () => {
    const loc = "Pusat gempa berada di darat 35 km Timur Laut Luwu Utara";
    expect(deriveRegion(loc, loc)).toBe("Luwu Utara");
  });

  it("region mengandung angka (km) → diabaikan", () => {
    expect(deriveRegion("38 km TimurLaut", "apapun")).not.toBe(
      "38 km TimurLaut",
    );
  });

  it("region bersih tetap dipercaya", () => {
    expect(deriveRegion("Luwu Utara", "teks panjang apapun")).toBe(
      "Luwu Utara",
    );
  });
});
