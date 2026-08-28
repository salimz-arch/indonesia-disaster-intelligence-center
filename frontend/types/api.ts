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

/** GET /earthquakes/stats */
export interface EarthquakeStats {
  hours: number;
  total: number;
  max_magnitude: Earthquake | null;
  recent: Earthquake | null;
  avg_depth_km: number | null;
  distribution: Partial<Record<MagnitudeCategory, number>>;
}

/** POST /ai/analyze */
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export interface RiskFactor {
  code: string;
  label: string;
  points: number;
}

export interface AIAnalysis {
  risk_score: number;
  risk_level: RiskLevel;
  factors: RiskFactor[];
  generated_at: string;
  provider: string;
  model: string;
  current_situation: string;
  main_factors: string[];
  areas_of_concern: string[];
  recommended_monitoring: string;
  limitations: string;
  data_coverage: {
    earthquakes_24h: number;
    weather_locations: number;
    rainfall_locations: number;
    window_hours: number;
  };
  fallback_used?: boolean;
  provider_error?: string | null;
}
export interface EarthquakeAnalytics {
  days: number;
  timeline: { date: string; count: number; max_magnitude: number | null }[];
  distribution: Partial<Record<MagnitudeCategory, number>>;
  depth_distribution: { shallow: number; intermediate: number; deep: number };
  by_hour: number[];
  summary: {
    total: number;
    avg_per_day: number;
    max_magnitude: number | null;
    max_magnitude_location: string | null;
    most_active_day: string | null;
    most_active_day_count: number;
  };
}
export interface RainfallAnalytics {
  days: number;
  timeline: {
    date: string;
    peak_1h_mm: number | null;
    peak_24h_mm: number | null;
    locations_raining: number;
  }[];
  top_locations: {
    name: string;
    max_1h_mm: number | null;
    max_24h_mm: number | null;
  }[];
}
export interface WeatherAnalytics {
  days: number;
  timeline: {
    date: string;
    avg_temp: number | null;
    min_temp: number | null;
    max_temp: number | null;
  }[];
  condition_counts: Partial<Record<WeatherCondition, number>>;
}
export type AlertSeverity = "normal" | "watch" | "warning" | "critical";

export interface AlertItem {
  id: number;
  event_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  location_text: string | null;
  triggered_at: string;
  expires_at: string | null;
  source: string;
  source_id?: string | null;
  is_active?: boolean;
}
