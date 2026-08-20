/** Envelope response — mirror dari backend (app/api/v1/*) */
export interface ApiEnvelope<T> {
  success: boolean;
  timestamp: string;
  source?: string;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code:
    | "DATA_SOURCE_UNAVAILABLE"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "RATE_LIMITED"
    | "AI_PROVIDER_ERROR";
  message: string;
}

/** GET /api/v1/health */
export interface HealthData {
  status: string;
  app: string;
  environment: string;
  version: string;
}
