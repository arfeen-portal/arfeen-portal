type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPriceBase: number; // in base currency (SAR)
};

export function calcInvoiceTotals(
  items: InvoiceItemInput[],
  taxPercent: number
) {
  const subtotalBase = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPriceBase;
    return sum + lineTotal;
  }, 0);

  const taxBase = (subtotalBase * taxPercent) / 100;
  const totalBase = subtotalBase + taxBase;

  return {
    subtotalBase: Number(subtotalBase.toFixed(2)),
    taxBase: Number(taxBase.toFixed(2)),
    totalBase: Number(totalBase.toFixed(2))
  };
}
