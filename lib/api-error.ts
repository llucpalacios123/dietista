import { NextResponse } from "next/server";

/**
 * Standard API error response format.
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * Create a standardized API error response.
 */
export function apiError(
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  const errorType = getErrorType(statusCode);
  return NextResponse.json(
    { error: errorType, message, statusCode, details },
    { status: statusCode }
  );
}

/**
 * Create a standardized API success response.
 */
export function apiSuccess<T>(data: T, statusCode: number = 200): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status: statusCode });
}

function getErrorType(statusCode: number): string {
  if (statusCode >= 500) return "INTERNAL_ERROR";
  if (statusCode === 401) return "UNAUTHORIZED";
  if (statusCode === 403) return "FORBIDDEN";
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 409) return "CONFLICT";
  if (statusCode === 429) return "RATE_LIMITED";
  return "BAD_REQUEST";
}
