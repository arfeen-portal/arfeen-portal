"use client";

import { useState } from "react";

const steps = ["Basic Info", "Company Details"];

export default function AgentRegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    country: "Saudi Arabia",
    city: "",
    adminName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    website: "",
    currency: "SAR",
    volume: "",
    services: {
      umrah: true,
      hajj: false,
      tourism: false,
      flights: false,
    },
    acceptTerms: false,
  });

  // 🔧 FIXED FUNCTION (yahi pe error tha)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value } = target;

    // services.umrah / services.hajj ... waale checkboxes
    if (name.startsWith("services.")) {
      const key = name.split(".")[1] as keyof typeof form.services;
      const checked = (target as HTMLInputElement).checked;
      setForm((prev) => ({
        ...prev,
        services: { ...prev.services, [key]: checked },
      }));
      return;
    }

    // baqi saare checkboxes (acceptTerms waghera)
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    // normal text / email / password / select
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canGoNextStep = () => {
    if (currentStep === 0) {
      return (
        form.companyName.trim() !== "" &&
        form.country.trim() !== "" &&
        form.city.trim() !== "" &&
        form.adminName.trim() !== "" &&
        form.mobile.trim() !== "" &&
        form.email.trim() !== "" &&
        form.password.length >= 6 &&
        form.password === form.confirmPassword &&
        form.acceptTerms
      );
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canGoNextStep()) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGoNextStep()) return;

    setIsSubmitting(true);
    try {
      // Yahan baad mein Supabase / API call lagani hai
      alert("Demo: Agent registration form submit ho gaya (UI only).");
    } catch (error) {
      console.error(error);
      alert("Koi error aa gaya, console check karo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-800 to-blue-600 text-white">
          <div>
            <h1 className="text-xl font-semibold">Register as B2B Agent</h1>
            <p className="text-sm opacity-80">
              60 seconds mein account ready – Arfeen Travel net rates access
              karein.
            </p>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
            Arfeen Portal
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Left: Steps */}
          <div className="md:w-1/3 bg-slate-50 border-r px-6 py-8">
            <ol className="space-y-6">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isDone = index < currentStep;
                return (
                  <li key={step} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                        ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                    >
                      {isDone ? "✓" : index + 1}
                    </div>
                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          isActive ? "text-blue-700" : "text-slate-700"
                        }`}
                      >
                        {step}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {index === 0 &&
                          "Basic info + login details. Email & password set karein."}
                        {index === 1 &&
                          "Company profile complete karein taki reports & limits unlock hon."}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-10 text-xs text-slate-500">
              <p className="font-semibold mb-1">Why register?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Live Umrah & hotel net rates</li>
                <li>Instant vouchers & invoices</li>
                <li>Full ledger & profit reports</li>
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div className="md:w-2/3 px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800 mb-2">
                    Basic Information
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Arfeen Travel"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Country *
                      </label>
                      <select
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Saudi Arabia</option>
                        <option>Pakistan</option>
                        <option>Turkey</option>
                        <option>Malaysia</option>
                        <option>Singapore</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Multan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Admin Full Name *
                      </label>
                      <input
                        type="text"
                        name="adminName"
                        value={form.adminName}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Syed Hassan Jawad"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Mobile / WhatsApp *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 border border-r-0 rounded-l-lg text-xs text-slate-600 bg-slate-50">
                          +{form.country === "Pakistan" ? "92" : "966"}
                        </span>
                        <input
                          type="tel"
                          name="mobile"
                          value={form.mobile}
                          onChange={handleChange}
                          className="w-full rounded-r-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="3331234567"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Password * (min 6 characters)
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {form.confirmPassword &&
                        form.password !== form.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            Password match nahi kar rahe.
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      id="acceptTerms"
                      type="checkbox"
                      name="acceptTerms"
                      checked={form.acceptTerms}
                      onChange={handleChange}
                      className="mt-1 h-4 w-4 rounded border"
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="text-xs text-slate-600"
                    >
                      I agree to the{" "}
                      <span className="text-blue-600 underline cursor-pointer">
                        Terms & Conditions
                      </span>{" "}
                      and{" "}
                      <span className="text-blue-600 underline cursor-pointer">
                        Privacy Policy
                      </span>
                      .
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-800 mb-2">
                    Company Details (Optional but Recommended)
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Office Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Office number, building, area, city"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        name="website"
                        value={form.website}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://arfeentravel.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Preferred Currency
                      </label>
                      <select
                        name="currency"
                        value={form.currency}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SAR">Saudi Riyal (SAR)</option>
                        <option value="PKR">Pakistani Rupee (PKR)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Approx. Monthly Umrah Volume
                      </label>
                      <input
                        type="number"
                        name="volume"
                        value={form.volume}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 50 passengers"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Services you offer
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="services.umrah"
                          checked={form.services.umrah}
                          onChange={handleChange}
                        />
                        Umrah
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="services.hajj"
                          checked={form.services.hajj}
                          onChange={handleChange}
                        />
                        Hajj
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="services.tourism"
                          checked={form.services.tourism}
                          onChange={handleChange}
                        />
                        Tourism
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="services.flights"
                          checked={form.services.flights}
                          onChange={handleChange}
                        />
                        Flights & Tickets
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0 || isSubmitting}
                  className={`text-sm px-4 py-2 rounded-lg border ${
                    currentStep === 0
                      ? "border-slate-200 text-slate-300 cursor-not-allowed"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Back
                </button>

                <div className="flex gap-3">
                  {currentStep < steps.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNextStep() || isSubmitting}
                      className="text-sm px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  )}

                  {currentStep === steps.length - 1 && (
                    <button
                      type="submit"
                      disabled={!canGoNextStep() || isSubmitting}
                      className="text-sm px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Creating account..." : "Create Agent Account"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
