export type AddOn = { name: string; price: number };

export function parseAddOns(json: string | null | undefined): AddOn[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is AddOn => a && typeof a.name === "string" && typeof a.price === "number"
    );
  } catch {
    return [];
  }
}

export function serializeAddOns(addOns: AddOn[]): string {
  return JSON.stringify(addOns);
}

export function addOnsToText(json: string | null | undefined): string {
  return parseAddOns(json)
    .map((a) => `${a.name}=${a.price}`)
    .join("\n");
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export const TAG_LABELS: Record<string, { label: string; color: string }> = {
  調: { label: "調理氣血", color: "#b45309" },
  強: { label: "顧筋骨、增強免疫力", color: "#0d9488" },
  孕: { label: "孕期媽咪", color: "#db2777" },
  產: { label: "坐月子媽咪", color: "#92400e" },
  復: { label: "術後病後", color: "#7c3aed" },
};

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "時價";
  return `$${price}`;
}

// Name markers used to give certain add-ons special UI treatment without a schema change.
export const STAPLE_SWAP_ADDON_NAME = "換麵線";
export const DAILY_SOUP_ADDON_MARKER = "限定雞湯";

export function parseDailySoupOptions(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function dailySoupOptionsToText(options: string[]): string {
  return options.join("\n");
}
