import VoucherForm from "@/components/accounting/VoucherForm";

export const dynamic = "force-dynamic";

export default function BankVoucherPage() {
  return <VoucherForm voucherType="bank" />;
}