import { describe, expect, it } from "vitest";
import { deriveRegion } from "@/lib/region";

describe("deriveRegion — provider real-world patterns", () => {
  it("BMKG: kode provinsi di segmen terakhir", () => {
    expect(deriveRegion(null, "38 km TimurLaut RUTENG-MANGGARAI-NTT")).toBe(
      "NTT",
    );
    expect(
      deriveRegion(null, "108 km BaratDaya TAHUNA-KEP.SANGIHE-SULUT"),
    ).toBe("SULUT");
  });

  it("BMKG: bentuk panjang provinsi di teks", () => {
    expect(deriveRegion(null, "Pusat gempa di laut Selatan Jawa Barat")).toBe(
      "Jawa Barat",
    );
  });

  it("USGS: Place sebelum , Indonesia", () => {
    expect(deriveRegion(null, "142 km NW of Ternate, Indonesia")).toBe(
      "Ternate",
    );
  });

  it("USGS: negara non-Indonesia dipertahankan", () => {
    expect(deriveRegion(null, "25 km ESE of Lospalos, Timor Leste")).toBe(
      "Timor Leste",
    );
  });

  it("kolom region resmi menang atas heuristik", () => {
    expect(deriveRegion("Sumatera Utara", "apapun teksnya")).toBe(
      "Sumatera Utara",
    );
  });

  it("teks laut pendek dipertahankan", () => {
    expect(deriveRegion(null, "Laut Banda")).toBe("Laut Banda");
  });

  it("null semua → placeholder", () => {
    expect(deriveRegion(null, null)).toBe("—");
  });
});
