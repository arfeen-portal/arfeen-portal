import VoucherForm from "@/components/accounting/VoucherForm";

export const dynamic = "force-dynamic";

export default function ReceiptVoucherPage() {
  return <VoucherForm voucherType="receipt" />;
}