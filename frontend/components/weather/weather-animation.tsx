import type { WeatherCondition } from "@/types/api";

/**
 * Animasi cuaca ringan (§9) — SVG + CSS keyframes murni.
 * GPU-friendly, auto-off saat prefers-reduced-motion.
 * Awan diposisikan di zona kosong kanan-tengah kartu (baris suhu)
 * agar tidak tertutup konten (konten berada di z-[1]).
 */
export function WeatherAnimation({
  condition,
  windSpeed,
}: {
  condition: WeatherCondition;
  windSpeed?: number;
}) {
  const isWindy = (windSpeed ?? 0) >= 30;

  return (
    <div
      className="wx-anim pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {condition === "clear" && <SunRays />}
      {(condition === "partly_cloudy" || condition === "cloudy") && <Clouds />}
      {condition === "cloudy" && <Clouds second />}
      {condition === "fog" && <Fog />}
      {(condition === "drizzle" ||
        condition === "rain" ||
        condition === "heavy_rain" ||
        condition === "thunderstorm" ||
        condition === "extreme") && (
        <Rain heavy={condition === "heavy_rain" || condition === "extreme"} />
      )}
      {(condition === "thunderstorm" || condition === "extreme") && (
        <Lightning />
      )}
      {isWindy && <Wind />}
    </div>
  );
}

/* ── Matahari: sinar berputar, dekoratif samar di pojok kanan-bawah ── */
function SunRays() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="wx-sun-rays absolute right-2 bottom-2 h-6 w-6 text-idic-amber/30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="4" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const x1 = 12 + Math.cos(angle) * 6.5;
        const y1 = 12 + Math.sin(angle) * 6.5;
        const x2 = 12 + Math.cos(angle) * 9.5;
        const y2 = 12 + Math.sin(angle) * 9.5;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

/* ── Awan: putih terang, drift di zona kosong kanan-tengah kartu ── */
function Clouds({ second = false }: { second?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`wx-cloud absolute h-10 w-10 text-slate-200/45 ${
        second ? "right-10 top-[52%] h-7 w-7" : "right-3 top-[40%]"
      }`}
      style={
        second ? { animationDelay: "-4s", animationDuration: "10s" } : undefined
      }
      fill="currentColor"
    >
      <path d="M6 18a4 4 0 1 1 .3-8 5 5 0 0 1 9.4-1.5A4 4 0 1 1 17 18H6z" />
    </svg>
  );
}

/* ── Hujan: tetosan jatuh dengan delay berjenjang ── */
function Rain({ heavy }: { heavy?: boolean }) {
  return (
    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
      {Array.from({ length: heavy ? 7 : 5 }).map((_, i) => (
        <span
          key={i}
          className={`wx-raindrop block w-px rounded-full ${
            heavy ? "h-3 bg-idic-blue/70" : "h-2 bg-idic-blue/50"
          }`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

/* ── Kilat ── */
function Lightning() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="wx-lightning absolute left-1/2 top-4 h-6 w-6 -translate-x-1/2 text-idic-amber"
      fill="currentColor"
    >
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

/* ── Kabut ── */
function Fog() {
  return (
    <div className="absolute bottom-0 left-0 right-0 space-y-1 p-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="wx-fog h-1.5 rounded-full bg-slate-400/40"
          style={{
            width: `${70 - i * 15}%`,
            animationDelay: `${i * -2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Angin ── */
function Wind() {
  return (
    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className="wx-wind block h-px w-6 rounded-full bg-slate-400/60"
          style={{ animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </div>
  );
}
