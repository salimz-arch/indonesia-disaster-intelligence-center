/** ═══ Kontrak API IDIC — mirror Pydantic schemas backend ═══ */

export interface ApiEnvelope<T> {
  success: boolean;
  timestamp: string;
  source?: string;
  data?: T;
  error?: ApiErrorBody;
}

export interface ApiErrorBody {
  code:
    | "DATA_SOURCE_UNAVAILABLE"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "AI_PROVIDER_ERROR"
    | string; // network/http errors dari client
  message: string;
}

// ── Health ──
export interface HealthComponents {
  database: "ok" | "unavailable";
  cache: "ok" | "unavailable";
}
export interface HealthData {
  status: "ok" | "degraded";
  app: string;
  environment: string;
  version: string;
  components: HealthComponents;
}

// ── Earthquake ──
export type MagnitudeCategory =
  | "low"
  | "moderate"
  | "significant"
  | "strong"
  | "major"
  | "severe";
export type Severity = "low" | "moderate" | "high" | "critical";

export interface Earthquake {
  id: number;
  provider: string;
  source_id: string;
  magnitude: number;
  depth_km: number;
  latitude: number;
  longitude: number;
  location_text: string | null;
  region: string | null;
  event_time: string;
  potential_tsunami: boolean;
  category: MagnitudeCategory;
  severity: Severity;
}

// ── Weather ──
export type WeatherCondition =
  | "clear"
  | "partly_cloudy"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy_rain"
  | "thunderstorm"
  | "extreme"
  | "unknown";

export interface WeatherObservation {
  id: number;
  location_id: number;
  temperature_c: number;
  feels_like_c: number | null;
  humidity_pct: number;
  pressure_hpa: number;
  wind_speed_kmh: number;
  wind_direction_deg: number | null;
  visibility_km: number | null;
  cloud_cover_pct: number | null;
  precipitation_mm: number;
  condition_code: WeatherCondition;
  condition_text: string;
  uv_index: number | null;
  observed_at: string;
  source: string;
}

// ── Rainfall ──
export type RainfallIntensity =
  | "none"
  | "light"
  | "moderate"
  | "heavy"
  | "very_heavy"
  | "extreme";

export interface RainfallObservation {
  id: number;
  location_id: number;
  rainfall_1h_mm: number;
  rainfall_6h_mm: number | null;
  rainfall_24h_mm: number | null;
  observed_at: string;
  source: string;
  intensity: RainfallIntensity;
}

// ── Location ──
export interface LocationItem {
  id: number;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
  is_primary: boolean;
}

// ── Data sources ──
export type SourceStatus = "online" | "degraded" | "offline" | "unknown";

export interface DataSourceItem {
  id: number;
  name: string;
  category: string;
  status: SourceStatus;
  description: string | null;
  last_success_at: string | null;
  last_error: string | null;
  refresh_seconds: number;
  latency_ms: number | null;
}

// ── Radar ──
export interface RadarFrame {
  time: number;
  path: string;
  kind: "past" | "nowcast";
}
export interface RadarData {
  host: string;
  frames: RadarFrame[];
}

// ── List wrapper semua endpoint ──
export interface ListData<T> {
  items: T[];
  total: number;
}
