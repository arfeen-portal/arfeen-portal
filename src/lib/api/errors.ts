export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: AppErrorCode;
  status: number;
  details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function unauthorized(message = "Unauthorized") {
  return new AppError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "Forbidden") {
  return new AppError("FORBIDDEN", message, 403);
}

export function notFound(message = "Not found") {
  return new AppError("NOT_FOUND", message, 404);
}

export function badRequest(message = "Bad request", details?: unknown) {
  return new AppError("BAD_REQUEST", message, 400, details);
}

export function validationError(message = "Validation failed", details?: unknown) {
  return new AppError("VALIDATION_ERROR", message, 422, details);
}

export function conflict(message = "Conflict", details?: unknown) {
  return new AppError("CONFLICT", message, 409, details);
}

export function internalError(message = "Internal server error", details?: unknown) {
  return new AppError("INTERNAL_ERROR", message, 500, details);
}

export function normalizeUnknownError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error) {
    return new AppError("INTERNAL_ERROR", error.message || "Internal server error", 500);
  }

  return new AppError("INTERNAL_ERROR", "Internal server error", 500);
}