export function formatPrice(n: number, locale: "th" | "en" = "th"): string {
  return `฿${n.toLocaleString(locale === "th" ? "th-TH" : "en-US", { maximumFractionDigits: 0 })}`;
}
