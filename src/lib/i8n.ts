export type Dict = Record<string, string>;

const dicts: Record<string, Dict> = {
  en: { transport_title: "Book Transport", offer_of_the_day: "Offer of the day" },
  ar: { transport_title: "احجز النقل", offer_of_the_day: "عرض اليوم" },
  ur: { transport_title: "ٹرانسپورٹ بک کریں", offer_of_the_day: "آج کی آفر" },
  tr: { transport_title: "Ulaşım Rezervasyonu", offer_of_the_day: "Günün fırsatı" }
};

export function t(locale: string, key: string) {
  const d = dicts[locale] || dicts.en;
  return d[key] || key;
}
