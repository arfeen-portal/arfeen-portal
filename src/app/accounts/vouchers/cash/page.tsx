import VoucherForm from "@/components/accounting/VoucherForm";

export const dynamic = "force-dynamic";

export default function CashVoucherPage() {
  return <VoucherForm voucherType="cash" />;
}