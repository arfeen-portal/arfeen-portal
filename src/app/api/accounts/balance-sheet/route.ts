import {
  getSupabaseAdmin,
  jsonError,
  jsonOk,
  normalizeDate,
} from "@/lib/api/finance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SectionKey = "assets" | "liabilities" | "equity";

function round2(n: number) {
  return Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;
}

function monthStart(date: string) {
  return `${date.slice(0, 7)}-01`;
}

function normalizeText(v: any) {
  return String(v || "").trim().toLowerCase();
}

function detectSectionFromText(name: string): SectionKey {
  const n = normalizeText(name);

  if (
    n.includes("sales") ||
    n.includes("sale") ||
    n.includes("income") ||
    n.includes("revenue") ||
    n.includes("profit") ||
    n.includes("capital") ||
    n.includes("equity") ||
    n.includes("owner") ||
    n.includes("retained")
  ) {
    return "equity";
  }

  if (
    n.includes("payable") ||
    n.includes("supplier") ||
    n.includes("liability") ||
    n.includes("loan") ||
    n.includes("creditor") ||
    n.includes("due")
  ) {
    return "liabilities";
  }

  if (
    n.includes("cash") ||
    n.includes("bank") ||
    n.includes("receivable") ||
    n.includes("advance") ||
    n.includes("asset") ||
    n.includes("stock") ||
    n.includes("inventory") ||
    n.includes("deposit")
  ) {
    return "assets";
  }

  return "assets";
}

function sectionFromType(type: any, fallbackName: string): SectionKey {
  const t = normalizeText(type);

  if (t === "asset" || t === "assets") return "assets";
  if (t === "liability" || t === "liabilities") return "liabilities";
  if (t === "equity" || t === "capital") return "equity";
  if (t === "income" || t === "revenue" || t === "sales") return "equity";

  return detectSectionFromText(fallbackName);
}

function getAccountType(account: any) {
  return (
    account?.account_type ||
    account?.type ||
    account?.category ||
    account?.account_category ||
    account?.nature ||
    account?.account_nature ||
    ""
  );
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return jsonError("Supabase admin not configured.", 500);

    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenant_id") || "default";
    const asOf = normalizeDate(
      url.searchParams.get("as_of"),
      new Date().toISOString().slice(0, 10)
    );
    const saveSnapshot = url.searchParams.get("save_snapshot") === "true";

    const { data: ledgerRows, error: ledgerError } = await supabase
      .from("v_ledger")
      .select("*");

    if (ledgerError) return jsonError(ledgerError.message, 500);

    const { data: accounts } = await supabase.from("acc_accounts").select("*");

    const accountMap = new Map<string, any>();

    for (const acc of accounts || []) {
      const keys = [
        acc.id,
        acc.account_id,
        acc.code,
        acc.account_code,
        acc.name,
        acc.account_name,
      ];

      for (const key of keys) {
        if (key) accountMap.set(normalizeText(key), acc);
      }
    }

    const maps = {
      assets: new Map<string, any>(),
      liabilities: new Map<string, any>(),
      equity: new Map<string, any>(),
    };

    for (const row of ledgerRows || []) {
      const entryDate =
        row.entry_date ||
        row.voucher_date ||
        row.date ||
        row.created_at ||
        null;

      if (entryDate && asOf && String(entryDate).slice(0, 10) > asOf) continue;
      if (row.tenant_id && String(row.tenant_id) !== tenantId) continue;

      const rawName =
        row.account_name ||
        row.name ||
        row.account ||
        row.party_name ||
        "Unnamed Account";

      const matchedAccount =
        accountMap.get(normalizeText(row.account_id)) ||
        accountMap.get(normalizeText(row.account_code)) ||
        accountMap.get(normalizeText(rawName)) ||
        null;

      if (matchedAccount?.tenant_id && String(matchedAccount.tenant_id) !== tenantId) {
        continue;
      }

      const accountId =
        row.account_id ||
        row.acc_account_id ||
        row.coa_id ||
        matchedAccount?.id ||
        matchedAccount?.account_id ||
        rawName;

      const accountCode =
        row.account_code ||
        matchedAccount?.account_code ||
        matchedAccount?.code ||
        "-";

      const accountName =
        row.account_name ||
        matchedAccount?.account_name ||
        matchedAccount?.name ||
        rawName;

      const section = sectionFromType(
        row.account_type || getAccountType(matchedAccount),
        accountName
      );

      const key = String(accountId || accountName);

      const existing =
        maps[section].get(key) || {
          id: accountId,
          code: accountCode,
          name: accountName,
          type: section,
          debit: 0,
          credit: 0,
          amount: 0,
        };

      existing.debit += Number(row.debit || 0);
      existing.credit += Number(row.credit || 0);

      maps[section].set(key, existing);
    }

    function finalize(section: SectionKey) {
      return Array.from(maps[section].values())
        .map((item: any) => {
          const amount =
            section === "assets"
              ? item.debit - item.credit
              : item.credit - item.debit;

          return {
            ...item,
            debit: round2(item.debit),
            credit: round2(item.credit),
            amount: round2(amount),
            warning:
              amount < 0
                ? "Negative balance detected. Review posting direction."
                : undefined,
          };
        })
        .filter((item: any) => Math.abs(item.amount) > 0.01)
        .sort((a: any, b: any) => Math.abs(b.amount) - Math.abs(a.amount));
    }

    const assets = finalize("assets");
    const liabilities = finalize("liabilities");
    const equity = finalize("equity");

    const totalAssets = round2(assets.reduce((s: number, i: any) => s + i.amount, 0));
    const totalLiabilities = round2(liabilities.reduce((s: number, i: any) => s + i.amount, 0));
    const totalEquity = round2(equity.reduce((s: number, i: any) => s + i.amount, 0));

    const rightSide = round2(totalLiabilities + totalEquity);
    const difference = round2(totalAssets - rightSide);
    const balanced = Math.abs(difference) <= 0.01;

    const assetToLiabilityRatio =
      totalLiabilities > 0
        ? round2(totalAssets / totalLiabilities)
        : totalAssets > 0
        ? 999
        : 0;

    const debtRatio =
      totalAssets > 0 ? round2((totalLiabilities / totalAssets) * 100) : 0;

    const netWorth = round2(totalAssets - totalLiabilities);
    const negativeAccounts = [...assets, ...liabilities, ...equity].filter(
      (x: any) => x.amount < 0
    );

    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    if (!balanced || assetToLiabilityRatio < 1 || debtRatio > 75 || negativeAccounts.length > 0) {
      riskLevel = "HIGH";
    } else if (assetToLiabilityRatio < 1.5 || debtRatio > 55) {
      riskLevel = "MEDIUM";
    }

    const aiNote = balanced
      ? riskLevel === "LOW"
        ? "Financial position looks stable. Balance sheet is balanced with healthy solvency."
        : "Balance sheet is balanced, but solvency indicators need management attention."
      : "Balance sheet is not balanced. Review unposted, duplicate, or wrong-side journal entries.";

    const actionPlan = [
      !balanced
        ? `Fix imbalance of ${difference}. Check journal entries, opening balances, and account type mapping.`
        : null,
      assetToLiabilityRatio < 1
        ? "Liquidity pressure detected. Reduce liabilities or increase cash/bank/current assets."
        : null,
      debtRatio > 75
        ? "High debt concentration. Prioritize supplier payable settlement and reduce short-term obligations."
        : null,
      negativeAccounts.length
        ? "Negative account balances found. Review highlighted accounts."
        : null,
      "Use drill-down on any account row to open its ledger and verify transaction-level movement.",
    ].filter(Boolean);

    const currentMonth = monthStart(asOf!);

    const { data: previousSnapshot } = await supabase
      .from("balance_sheet_snapshots")
      .select("*")
      .eq("tenant_id", tenantId)
      .lt("snapshot_month", currentMonth)
      .order("snapshot_month", { ascending: false })
      .limit(1)
      .maybeSingle();

    let snapshotSaved = false;

    if (saveSnapshot) {
      const { error: snapError } = await supabase
        .from("balance_sheet_snapshots")
        .upsert(
          {
            tenant_id: tenantId,
            snapshot_month: currentMonth,
            as_of: asOf,
            total_assets: totalAssets,
            total_liabilities: totalLiabilities,
            total_equity: totalEquity,
            net_worth: netWorth,
            asset_liability_ratio: assetToLiabilityRatio,
            debt_ratio: debtRatio,
            difference,
            risk_level: riskLevel,
            ai_note: aiNote,
            action_plan: actionPlan,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,snapshot_month" }
        );

      if (snapError) return jsonError(snapError.message, 500);
      snapshotSaved = true;
    }

    const comparison = previousSnapshot
      ? {
          previousMonth: previousSnapshot.snapshot_month,
          assetsChange: round2(totalAssets - Number(previousSnapshot.total_assets || 0)),
          liabilitiesChange: round2(totalLiabilities - Number(previousSnapshot.total_liabilities || 0)),
          equityChange: round2(totalEquity - Number(previousSnapshot.total_equity || 0)),
          netWorthChange: round2(netWorth - Number(previousSnapshot.net_worth || 0)),
          debtRatioChange: round2(debtRatio - Number(previousSnapshot.debt_ratio || 0)),
          previousRiskLevel: previousSnapshot.risk_level,
          aiComparison:
            netWorth > Number(previousSnapshot.net_worth || 0)
              ? "Net worth improved compared to previous saved snapshot."
              : "Net worth declined or remained weak compared to previous saved snapshot.",
        }
      : null;

    return jsonOk({
      asOf,
      snapshotSaved,
      summary: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
        rightSide,
        difference,
        balanced,
        assetToLiabilityRatio,
        debtRatio,
        netWorth,
        riskLevel,
        aiNote,
        actionPlan,
        negativeAccountsCount: negativeAccounts.length,
      },
      comparison,
      assets,
      liabilities,
      equity,
      alerts: {
        negativeAccounts,
        topAssets: assets.slice(0, 5),
        topLiabilities: liabilities.slice(0, 5),
      },
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unexpected balance sheet error.", 500);
  }
}