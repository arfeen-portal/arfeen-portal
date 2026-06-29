const AGENT_PUBLIC_FIELDS = [
  "id",
  "agent_name",
  "guest_name",
  "city",
  "hotel",
  "check_in",
  "check_out",
  "nights",
  "room_type",
  "rooms",
  "pax",
  "meal_plan",
  "budget",
  "urgency",
  "status",
  "quote_status",
  "final_offer_sar",
  "final_selling_rate",
  "public_note",
  "hcn_status",
  "hcn_reference",
  "hcn",
  "voucher_status",
  "created_at",
  "updated_at",
] as const;

export function sanitizeDemandForAgent(row: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};

  for (const key of AGENT_PUBLIC_FIELDS) {
    if (key in row) {
      sanitized[key] = row[key];
    }
  }

  if (sanitized.final_offer_sar == null && sanitized.final_selling_rate != null) {
    sanitized.final_offer_sar = sanitized.final_selling_rate;
  }

  if (sanitized.hcn_reference == null && sanitized.hcn != null) {
    sanitized.hcn_reference = sanitized.hcn;
  }

  delete sanitized.expected_market_price;
  delete sanitized.duplicate_score;
  delete sanitized.risk_level;
  delete sanitized.crowd_pressure;
  delete sanitized.supplier_rate;
  delete sanitized.profit_amount;
  delete sanitized.internal_note;

  return sanitized;
}

export function sanitizeDemandsForAgent(rows: Record<string, unknown>[]) {
  return rows.map((row) => sanitizeDemandForAgent(row));
}
