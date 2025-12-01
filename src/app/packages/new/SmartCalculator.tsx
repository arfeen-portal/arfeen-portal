"use client";

import { useState, useEffect } from "react";

type Props = {
  nightsMakkah: number;
  nightsMadinah: number;
  defaultTicketPrice?: number;
  defaultConversionRate?: number;
};

export default function SmartCalculator({
  nightsMakkah,
  nightsMadinah,
  defaultTicketPrice = 166000,
  defaultConversionRate = 77.5,
}: Props) {
  const [basePriceWithoutTicket, setBasePriceWithoutTicket] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(defaultTicketPrice);
  const [discountPerNight, setDiscountPerNight] = useState(5); // SAR
  const [profitPerPerson, setProfitPerPerson] = useState(15000);
  const [conversionRate, setConversionRate] = useState(defaultConversionRate);

  const totalNights = nightsMakkah + nightsMadinah;

  const priceAfterDiscount =
    basePriceWithoutTicket - totalNights * discountPerNight;

  const priceWithTicketSAR = priceAfterDiscount + ticketPrice;
  const priceWithTicketPKR = priceWithTicketSAR * conversionRate;
  const finalSalePricePKR = priceWithTicketPKR + profitPerPerson;

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm mt-4">
      <h3 className="font-semibold text-sm mb-3">Smart Price Calculator</h3>

      <div className="grid md:grid-cols-2 gap-3 text-xs">
        <div className="space-y-2">
          <div>
            <label className="block mb-1">Base (without ticket) – SAR</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={basePriceWithoutTicket}
              onChange={(e) =>
                setBasePriceWithoutTicket(Number(e.target.value || 0))
              }
            />
          </div>
          <div>
            <label className="block mb-1">Ticket Price – SAR</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={ticketPrice}
              onChange={(e) => setTicketPrice(Number(e.target.value || 0))}
            />
          </div>
          <div>
            <label className="block mb-1">Discount per Night – SAR</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={discountPerNight}
              onChange={(e) =>
                setDiscountPerNight(Number(e.target.value || 0))
              }
            />
            <p className="text-[10px] text-gray-500">
              Total nights: {totalNights} → total discount ={" "}
              {totalNights * discountPerNight} SAR
            </p>
          </div>
          <div>
            <label className="block mb-1">Profit per Person – PKR</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={profitPerPerson}
              onChange={(e) =>
                setProfitPerPerson(Number(e.target.value || 0))
              }
            />
          </div>
          <div>
            <label className="block mb-1">Conversion Rate (1 SAR → PKR)</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={conversionRate}
              onChange={(e) =>
                setConversionRate(Number(e.target.value || 0))
              }
            />
          </div>
        </div>

        <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
          <div className="flex justify-between">
            <span>Price after discount (SAR)</span>
            <span>{priceAfterDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>With ticket (SAR)</span>
            <span>{priceWithTicketSAR.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>With ticket (PKR)</span>
            <span>{priceWithTicketPKR.toFixed(0)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Final Sale Price (PKR)</span>
            <span>{finalSalePricePKR.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
