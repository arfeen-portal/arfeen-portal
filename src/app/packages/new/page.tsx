// src/app/packages/new/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
import SmartCalculator from "./SmartCalculator";

export default function NewPackagePage() {
  // Filhaal sirf calculator dikha rahe hain
  // Baad me yahan aap apna pura package form add kar sakte hain

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Create New Package</h1>

      {/* Yahan aapka future form aa jayega */}
      <div className="border rounded-xl p-4 bg-white">
        <p className="text-sm text-gray-700">
          Yahan baad me full package form ayega. Abhi sirf smart calculator test
          kar rahe hain.
        </p>
      </div>

      {/* Smart Calculator */}
      <SmartCalculator nightsMakkah={12} nightsMadinah={8} />
    </main>
  );
}
