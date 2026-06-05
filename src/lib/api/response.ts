import { NextResponse } from "next/server";
import { AppError, normalizeUnknownError } from "./errors";

export function ok<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function fail(error: unknown) {
  const err: AppError = normalizeUnknownError(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
    },
    { status: err.status }
  );
}