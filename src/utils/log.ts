export function logInfo(message: string, meta?: any) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[INFO]", message, meta || "");
  }
}

export function logError(message: string, meta?: any) {
  // eslint-disable-next-line no-console
  console.error("[ERROR]", message, meta || "");
}
