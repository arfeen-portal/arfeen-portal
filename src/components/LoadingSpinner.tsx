"use client";

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-6 w-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
