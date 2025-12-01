// src/app/reports/export.ts
// PDF / CSV export helpers

import jsPDF from "jspdf";

export type ReportRow = {
  name: string;
  amount: number;
};

export function exportPDF(rows: ReportRow[]) {
  const doc = new jsPDF();
  doc.text("Report Export", 10, 10);

  let y = 20;
  rows.forEach((r) => {
    doc.text(`${r.name} - ${r.amount} SAR`, 10, y);
    y += 8;
  });

  doc.save("report.pdf");
}

export function exportCSV(rows: ReportRow[]) {
  const csv =
    "Name,Amount\n" +
    rows.map((r) => `${r.name},${r.amount}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "report.csv";
  a.click();
}
