import { z } from "zod";
import { validationError } from "@/lib/api/errors";

export const uuidSchema = z.string().uuid("Invalid UUID");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const roleSchema = z.enum(["admin", "agent", "driver", "accountant"]);

export const securityCheckQuerySchema = z.object({
  tenant_id: uuidSchema.optional(),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw validationError("Validation failed", result.error.flatten());
  }

  return result.data;
}

export function parseQuery<T>(
  schema: z.ZodSchema<T>,
  query: Record<string, unknown>
): T {
  const result = schema.safeParse(query);

  if (!result.success) {
    throw validationError("Validation failed", result.error.flatten());
  }

  return result.data;
}