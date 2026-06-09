"use client";

import React from "react";

type CellValue = string | number | null | undefined;

type SimpleTableProps = {
  title?: string;
  columns?: string[];
  rows?: CellValue[][] | Array<Record<string, CellValue>>;
};

function getCellValue(
  row: CellValue[] | Record<string, CellValue>,
  column: string,
  index: number
) {
  if (Array.isArray(row)) {
    return row[index] ?? "—";
  }

  return row[column] ?? "—";
}

export default function SimpleTable({
  title,
  columns = [],
  rows = [],
}: SimpleTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title ? (
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-slate-100 text-sm"
                >
                  {columns.map((column, columnIndex) => (
                    <td key={column} className="px-4 py-3 text-slate-700">
                      {getCellValue(row, column, columnIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}