// src/lib/safeJson.ts
export function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw || raw.trim() === "") return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("safeParseJSON error, returning fallback", err);
    return fallback;
  }
}
