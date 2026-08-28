import type { WeatherCondition } from "@/types/api";

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
      {(condition === "clear" || condition === "partly_cloudy") && <SunRays />}
      {(condition === "partly_cloudy" || condition === "cloudy") && <Clouds />}
      {/* ✅ PASTIKAN INI 'delay', BUKAN 'second' */}
      {condition === "cloudy" && <Clouds delay />}

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

function SunRays() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="wx-sun-rays absolute right-2 top-2 h-8 w-8 text-idic-amber/50"
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

function Clouds({ delay = false }: { delay?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`wx-cloud absolute h-10 w-10 text-[#9AAAC0]/45 ${
        delay ? "left-1/2 top-6" : "right-4 top-3"
      }`}
      style={delay ? { animationDelay: "-4s" } : undefined}
      fill="currentColor"
    >
      <path d="M6 18a4 4 0 1 1 .3-8 5 5 0 0 1 9.4-1.5A4 4 0 1 1 17 18H6z" />
    </svg>
  );
}

function Rain({ heavy }: { heavy?: boolean }) {
  return (
    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
      {Array.from({ length: heavy ? 7 : 5 }).map((_, i) => (
        <span
          key={i}
          className={`wx-raindrop block w-px rounded-full ${
            heavy ? "h-3 bg-[#2C5F8A]" : "h-2 bg-[#4BAED8]"
          }`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

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
