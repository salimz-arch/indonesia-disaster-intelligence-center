import type { ApiEnvelope } from "@/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_ROOT = `${BASE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResult<T> {
  data: T;
  source: string;
  timestamp: string;
}

/** GET envelope-aware: unwrap data, lempar error terstruktur jika gagal. */
export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_ROOT}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new ApiError(
      "Backend tidak terjangkau — pastikan uvicorn berjalan",
      "NETWORK_ERROR",
    );
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // respons bukan JSON (mis. proxy error)
  }

  if (body && body.success === false) {
    throw new ApiError(
      body.error?.message ?? "Unknown error",
      body.error?.code ?? "UNKNOWN",
      res.status,
    );
  }
  if (!res.ok || !body?.success || body.data === undefined) {
    throw new ApiError(`HTTP ${res.status}`, "HTTP_ERROR", res.status);
  }

  return {
    data: body.data,
    source: body.source ?? "unknown",
    timestamp: body.timestamp,
  };
}
