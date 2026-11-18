// Normalise common price formats without silently discarding ambiguous punctuation.
export function parseAmount(input) {
  if (/[A-Za-z+*/=()]/.test(String(input))) return null;
  let s = String(input)
    .trim()
    .replace(/[\s\u00a0\u202f'’]/g, "")
    .replace(/[^\d.,-]/g, "");
  if (!s || s.includes("-") || !/\d/.test(s)) return null;
  const comma = s.lastIndexOf(","),
    dot = s.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    const group = decimal === "," ? "." : ",";
    s = s.split(group).join("");
    if (s.split(decimal).length > 2) return null;
    s = s.replace(decimal, ".");
  } else if (comma >= 0 || dot >= 0) {
    const sep = comma >= 0 ? "," : ".";
    const parts = s.split(sep);
    if (parts.length === 2) {
      if (parts[1].length === 3 && parts[0] !== "0") s = parts.join("");
      else if (parts[1].length <= 2 && parts[1].length > 0) s = parts.join(".");
      else return null;
    } else {
      if (
        !parts.slice(1).every((x) => x.length === 3) &&
        !/^\d{1,3}(?:,\d{2})*,\d{3}$/.test(s)
      )
        return null;
      s = parts.join("");
    }
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 1e12 ? n : null;
}
export function extractPrices(text) {
  const matches =
    String(text).match(/\d+(?:[.,\u00a0\u202f ]\d{3})*(?:[.,]\d{1,2})?/g) || [];
  const out = [];
  for (const raw of matches) {
    const value = parseAmount(raw);
    if (value !== null && value > 0 && !out.some((x) => x.value === value))
      out.push({ raw: raw.trim(), value });
  }
  return out.slice(0, 16);
}
export function convert(amount, rate) {
  return Number.isFinite(amount) && Number.isFinite(rate) && rate > 0
    ? amount * rate
    : null;
}
