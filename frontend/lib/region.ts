/**
 * Parser wilayah dari location_text provider — dipakai Event Detail.
 *
 * Menangani 3 format riil:
 * 1. BMKG dash:  "di laut 38 km TimurLaut RUTENG-MANGGARAI-NTT" → NTT
 * 2. BMKG spasi: "di darat 35 km Timur Laut Luwu Utara" → Luwu Utara (kabupaten)
 * 3. USGS:       "27 km S of Labuan Bajo, Indonesia" → Labuan Bajo
 *
 * Arah BMKG bisa menempel (TimurLaut) atau berjarak (Timur Laut).
 */

// Provinsi Indonesia — diurut LONGEST-FIRST agar match paling spesifik
// ("maluku barat daya" sebelum "maluku", "papua barat daya" sebelum "papua").
const PROVINCE_LIST = [
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
  "Maluku Barat Daya",
  "Maluku",
  "Papua Barat Daya",
  "Papua Barat",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua",
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
];

const SHORT_CODES = [
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

const SORTED_PROVINCES = [...PROVINCE_LIST].sort((a, b) => b.length - a.length);

/** Prefix + jarak BMKG: "Pusat gempa berada di darat 35 km " */
const BMKG_PREFIX =
  /(?:pusat\s*gempa\s*)?(?:berada\s+)?(?:di\s+)?(?:darat|laut)\s+\d+(?:[.,]\d+)?\s*km\s*/i;

/** Arah BMKG — menempel ATAU berjarak: TimurLaut / Timur Laut */
const BMKG_DIRECTION =
  /^(?:timur[\s-]*laut|barat[\s-]*daya|barat[\s-]*laut|tenggara|timur|barat|utara|selatan)\s*/i;

/** USGS: "27 km S of Place, Country" — Country bebas (Indonesia/Timor Leste/...) */
const USGS_PLACE = /\d+\s*km\s*[A-Za-z]+\s*of\s+([^,]+?)(?:\s*,\s*(.+))?$/i;

function matchProvince(text: string): string | null {
  const lower = text.toLowerCase();
  // Bentuk panjang — longest-first
  for (const p of SORTED_PROVINCES) {
    if (lower.includes(p.toLowerCase())) {
      return p;
    }
  }
  // Kode singkat — harus segmen berdiri sendiri
  for (const code of SHORT_CODES) {
    if (new RegExp(`(^|[-\\s])${code}(\\s|$)`, "i").test(lower)) {
      return code;
    }
  }
  return null;
}

/** Strip prefix BMKG + arah → sisa = nama lokasi inti. */
function stripBmkg(text: string): string | null {
  const stripped = text.replace(BMKG_PREFIX, "");
  if (stripped === text) return null; // bukan format BMKG

  let core = stripped.trim();
  // Strip arah di depan (bisa 2x untuk pola langka "Tenggara Barat")
  core = core.replace(BMKG_DIRECTION, "").replace(BMKG_DIRECTION, "").trim();
  return core || null;
}

function meaningful(s: string): boolean {
  const n = s.toLowerCase().trim();
  if (!n || n.length < 3) return false;
  if (/^\d/.test(n)) return false;
  if (["di", "dan", "the", "of", "km", "darat", "laut"].includes(n))
    return false;
  return true;
}

/** Ekstrak wilayah tampilan dari location_text. */
export function deriveRegion(
  region: string | null,
  locationText: string | null,
): string {
  // 1. Kolom resmi terisi → langsung pakai
  if (region && region.trim()) return region.trim();
  if (!locationText) return "—";

  // 2. Format BMKG (di darat/laut X km ...) — handle SEMUA varian
  const core = stripBmkg(locationText);
  if (core) {
    // 2a. Ada dash → segmen terakhir sering kode provinsi
    const segs = core
      .split("-")
      .map((s) => s.trim())
      .filter(Boolean);
    if (segs.length > 1) {
      for (let i = segs.length - 1; i >= 0; i--) {
        const prov = matchProvince(segs[i]);
        if (prov) return prov;
        if (meaningful(segs[i])) return segs[i];
      }
    }
    // 2b. Tanpa dash → core = nama lokasi (kabupaten/kota)
    //     Cek province dulu ("Maluku Barat Daya"), else pakai apa adanya
    const prov = matchProvince(core);
    return prov ?? core;
  }

  // 3. Match provinsi di teks utuh ("Selatan Jawa Barat")
  const prov = matchProvince(locationText);
  if (prov) return prov;

  // 4. USGS "X km DIR of Place, Country?" — pisahkan place vs country
  const usgs = locationText.match(USGS_PLACE);
  if (usgs) {
    const place = usgs[1]?.trim();
    const country = usgs[2]?.trim();
    // Negara selain Indonesia = konteks wilayah lebih luas → tampilkan negara
    if (country && country !== "Indonesia") {
      return country;
    }
    if (place && meaningful(place)) {
      return place;
    }
  }

  // 5. Comma split — segmen terakhir yang meaningful
  const byComma = locationText.split(",").map((s) => s.trim());
  if (byComma.length > 1) {
    for (let i = byComma.length - 1; i >= 0; i--) {
      if (meaningful(byComma[i]) && byComma[i] !== "Indonesia") {
        return byComma[i];
      }
    }
  }

  // 6. Teks pendek → utuh
  if (meaningful(locationText) && locationText.length < 40) {
    return locationText;
  }
  return "Lepas Pantai";
}
