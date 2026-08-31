/**
 * Parser wilayah dari location_text provider — dipakai Event Detail.
 */

const DIRECTIONS = [
  "utara",
  "timur laut",
  "timur",
  "tenggara",
  "selatan",
  "barat daya",
  "barat",
  "barat laut",
  "tl",
  "tr",
  "tg",
  "sl",
  "bd",
  "bl",
];

const REGIONS = [
  "Nusa Tenggara Timur",
  "Nusa Tenggara Barat",
  "Sumatera Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Timur",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Barat",
  "Gorontalo",
  "Maluku Utara",
  "Maluku",
  "Papua Barat",
  "Papua",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Barat Daya",
  "Bali",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Banten",
  "Bangka Belitung",
  "Kepulauan Riau",
  "Riau",
  "Jambi",
  "Bengkulu",
  "Lampung",
  "Aceh",
  "NTT",
  "NTB",
  "SULUT",
  "SULSEL",
  "SULTENG",
  "SULTRA",
  "SULBAR",
  "SUMUT",
  "SUMBAR",
  "SUMSEL",
  "JABAR",
  "JATENG",
  "JATIM",
  "KALBAR",
  "KALTIM",
  "KALSEL",
  "KALTENG",
  "KALUT",
  "MALUT",
  "DKI",
  "DIY",
];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function isMeaningful(segment: string): boolean {
  const n = normalize(segment);
  if (!n || n.length < 2) return false;
  if (/^\d/.test(n) && n.replace(/[.,]/g, "").length < 4) return false;
  if (DIRECTIONS.some((d) => n === d)) return false;
  if (["di", "dan", "the", "of", "km"].includes(n)) return false;
  return true;
}

function matchRegion(text: string): string | null {
  const n = normalize(text);
  const longs = REGIONS.filter((r) => r.length > 5);
  const shorts = REGIONS.filter((r) => r.length <= 5);

  for (const r of longs) {
    if (n.includes(normalize(r))) {
      return r.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  for (const r of shorts) {
    const pattern = new RegExp(`(^|[-\\s])${r}(\\s|$)`, "i");
    if (pattern.test(n)) return r.toUpperCase();
  }
  return null;
}

export function deriveRegion(
  region: string | null,
  locationText: string | null,
): string {
  // 1. Kolom resmi terisi → langsung pakai
  if (region && region.trim()) return region.trim();
  if (!locationText) return "—";

  // 2. Match provinsi resmi di seluruh teks
  const matched = matchRegion(locationText);
  if (matched) return matched;

  // 3. Pola USGS: "X km DIR of Place, Indonesia" → Place
  // PERBAIKAN: Gunakan [^,]+ agar jika ada negara lain (misal ", Timor Leste"),
  // regex ini gagal match dan dilempar ke logika split koma di bawahnya.
  const usgsMatch = locationText.match(
    /(?:\d+\s*km\s*(?:[A-Za-z]+\s*)?of\s+)([^,]+)(?:,\s*Indonesia)?$/i,
  );
  if (usgsMatch?.[1] && isMeaningful(usgsMatch[1])) {
    return usgsMatch[1].trim();
  }

  // 4. Split: coba koma dulu (USGS "Place, Country"), lalu dash (BMKG)
  const byComma = locationText.split(",").map((s) => s.trim());
  if (byComma.length > 1) {
    for (let i = byComma.length - 1; i >= 0; i--) {
      if (isMeaningful(byComma[i]) && byComma[i] !== "Indonesia") {
        return byComma[i];
      }
    }
  }

  const byDash = locationText
    .split("-")
    .map((s) => s.trim())
    .filter(Boolean);
  if (byDash.length > 1) {
    for (let i = byDash.length - 1; i >= 0; i--) {
      const seg = byDash[i];
      if (matchRegion(seg)) return matchRegion(seg)!;
      if (isMeaningful(seg)) return seg;
    }
  }

  // 5. Teks utuh kalau pendek dan meaningful
  if (isMeaningful(locationText) && locationText.length < 40) {
    return locationText;
  }
  return "Lepas Pantai";
}
