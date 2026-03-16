export function formatNumberWithCommas(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined) return "";

  const raw =
    typeof value === "string" ? value.replace(/,/g, "").trim() : String(value);

  if (raw === "") return "";

  const num = Number(raw);
  if (Number.isNaN(num)) return raw;

  return num.toLocaleString("en-IN");
}

export function formatCurrencyDisplay(
  value: number | string | null | undefined,
  options?: { prefix?: string },
): string {
  const formatted = formatNumberWithCommas(value);
  if (!formatted) return "";

  const prefix = options?.prefix ?? "";
  return prefix ? `${prefix}${formatted}` : formatted;
}

