export type StoredInputType = "typed" | "voice";
export type HistoryEntryType = "typed" | "voiced" | "api";

export interface TranslationRow {
  id: string;
  input_text: string;
  input_type: StoredInputType;
  gloss_tokens: string[] | string;
  exported: boolean;
  created_at: string;
}

export interface HistoryEntry {
  id: string;
  text: string;
  glossTokens: string[];
  type: HistoryEntryType;
  date: string;
  time: string;
  timestamp: number;
  exported?: boolean;
}

export function formatHistoryTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatHistoryDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDay.getTime() === today.getTime()) return "Today";
  if (entryDay.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function normalizeGlossTokens(value: TranslationRow["gloss_tokens"]): string[] {
  if (Array.isArray(value)) {
    return value.filter((token): token is string => typeof token === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((token): token is string => typeof token === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function mapStoredTypeToHistoryType(type: StoredInputType): HistoryEntryType {
  return type === "voice" ? "voiced" : "typed";
}

export function mapHistoryTypeToStoredType(type: HistoryEntryType): StoredInputType {
  return type === "voiced" ? "voice" : "typed";
}

export function toHistoryEntry(row: TranslationRow): HistoryEntry {
  const createdAt = new Date(row.created_at);
  return {
    id: row.id,
    text: row.input_text,
    glossTokens: normalizeGlossTokens(row.gloss_tokens),
    type: mapStoredTypeToHistoryType(row.input_type),
    date: formatHistoryDate(createdAt),
    time: formatHistoryTime(createdAt),
    timestamp: createdAt.getTime(),
    exported: row.exported,
  };
}
