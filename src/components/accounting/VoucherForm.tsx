"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VoucherType = "payment" | "receipt" | "cash" | "bank";

type Account = {
  id: string;
  code: string;
  name: string;
  account_type?: string;
};

type Line = {
  account_id: string;
  line_description: string;
  amount: string;
};

type Props = {
  voucherType: VoucherType;
};

function pageMeta(voucherType: VoucherType) {
  switch (voucherType) {
    case "payment":
      return {
        title: "Payment Voucher",
        subtitle: "Outgoing payment posting with full voucher details",
        source: "voucher_payment",
        prefix: "PV",
      };
    case "receipt":
      return {
        title: "Receipt Voucher",
        subtitle: "Incoming receipt posting with counter-party allocation",
        source: "voucher_receipt",
        prefix: "RV",
      };
    case "cash":
      return {
        title: "Cash Voucher",
        subtitle: "Cash movement entry with voucher-grade UI and narration",
        source: "voucher_cash",
        prefix: "CV",
      };
    case "bank":
      return {
        title: "Bank Voucher",
        subtitle: "Bank transaction posting with cheque / bank reference details",
        source: "voucher_bank",
        prefix: "BV",
      };
  }
}

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function VoucherForm({ voucherType }: Props) {
  const meta = pageMeta(voucherType);
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const [entryDate, setEntryDate] = useState(today);
  const [postingDate, setPostingDate] = useState(today);
  const [voucherNo, setVoucherNo] = useState("");
  const [partyName, setPartyName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [controlAccountId, setControlAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(
    voucherType === "bank" ? "bank" : voucherType === "cash" ? "cash" : ""
  );
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [bankDirection, setBankDirection] = useState<"payment" | "receipt">("payment");

  const [lines, setLines] = useState<Line[]>([
    { account_id: "", line_description: "", amount: "" },
  ]);

  useEffect(() => {
    let ignore = false;

    async function loadMeta() {
      try {
        const res = await fetch("/api/accounting/meta", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load accounts");
        if (!ignore) setAccounts(json.accounts || []);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : "Failed to load accounts");
      }
    }

    loadMeta();
    return () => {
      ignore = true;
    };
  }, []);

  const totalAmount = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.amount || 0), 0),
    [lines]
  );

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addLine() {
    setLines((prev) => [...prev, { account_id: "", line_description: "", amount: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      setError("");

      if (!controlAccountId) throw new Error("Please select control account");
      if (!lines.length) throw new Error("At least one voucher line is required");

      const cleanLines = lines.filter((line) => line.account_id && Number(line.amount || 0) > 0);
      if (!cleanLines.length) throw new Error("Please add valid voucher lines");

      const effectiveVoucherType =
        voucherType === "bank" ? "bank" : voucherType;

      const outgoing =
        voucherType === "payment" ||
        voucherType === "cash" ||
        (voucherType === "bank" && bankDirection === "payment");

      const postingLines = [
        ...cleanLines.map((line) => ({
          account_id: line.account_id,
          line_description: line.line_description,
          debit: outgoing ? Number(line.amount) : 0,
          credit: outgoing ? 0 : Number(line.amount),
        })),
        {
          account_id: controlAccountId,
          line_description:
            description || `${meta.title} control account posting`,
          debit: outgoing ? 0 : totalAmount,
          credit: outgoing ? totalAmount : 0,
        },
      ];

      const payload = {
        entry_date: entryDate,
        posting_date: postingDate,
        description,
        reference_no: referenceNo,
        status: "posted",
        source: meta.source,
        voucher_type: effectiveVoucherType,
        voucher_no: voucherNo || null,
        party_name: partyName || null,
        payment_method: paymentMethod || null,
        cheque_no: chequeNo || null,
        cheque_date: chequeDate || null,
        bank_name: bankName || null,
        bank_reference: bankReference || null,
        lines: postingLines,
      };

      const res = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Voucher save failed");

      router.push(`/accounts/journal/${json.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voucher save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Voucher Posting</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{meta.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{meta.subtitle}</p>
          </div>

          <div className="rounded-3xl bg-slate-900 px-5 py-4 text-white shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-300">Voucher Total</div>
            <div className="mt-1 text-2xl font-bold">{money(totalAmount)}</div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Voucher Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Posting Date</label>
            <input
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Voucher No</label>
            <input
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              placeholder={`${meta.prefix}-manual`}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Reference No</label>
            <input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Invoice / bill / receipt ref"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Party Name</label>
            <input
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Customer / supplier / agent / employee"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {voucherType === "receipt"
                ? "Receipt Account"
                : voucherType === "cash"
                ? "Cash Account"
                : voucherType === "bank"
                ? "Bank Account"
                : "Payment Account"}
            </label>
            <select
              value={controlAccountId}
              onChange={(e) => setControlAccountId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Select control account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.code} - {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="">Select method</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="cheque">Cheque</option>
              <option value="online">Online Transfer</option>
            </select>
          </div>
        </div>

        {voucherType === "bank" ? (
          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Bank Direction</label>
            <select
              value={bankDirection}
              onChange={(e) => setBankDirection(e.target.value as "payment" | "receipt")}
              className="w-full max-w-sm rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="payment">Bank Payment</option>
              <option value="receipt">Bank Receipt</option>
            </select>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Cheque No</label>
            <input
              value={chequeNo}
              onChange={(e) => setChequeNo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Cheque Date</label>
            <input
              type="date"
              value={chequeDate}
              onChange={(e) => setChequeDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Bank Name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Bank Reference</label>
            <input
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Narration</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Voucher narration / reason / remarks"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Voucher Lines</h2>
            <p className="text-sm text-slate-500">
              These lines will be auto-balanced against the selected control account.
            </p>
          </div>
          <button
            type="button"
            onClick={addLine}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            + Add Line
          </button>
        </div>

        <div className="space-y-3 p-4 lg:p-6">
          {lines.map((line, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Account
                </label>
                <select
                  value={line.account_id}
                  onChange={(e) => updateLine(index, "account_id", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                >
                  <option value="">Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </label>
                <input
                  value={line.line_description}
                  onChange={(e) => updateLine(index, "line_description", e.target.value)}
                  placeholder="Voucher line description"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.amount}
                  onChange={(e) => updateLine(index, "amount", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="flex items-end justify-end lg:col-span-1">
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-2xl border border-red-200 px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="text-xs uppercase tracking-wide text-slate-500">Total Voucher Amount</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{money(totalAmount)}</div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/accounts/journal")}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : `Create ${meta.title}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}