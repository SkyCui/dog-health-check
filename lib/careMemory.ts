import type { AssessmentInput } from "./types";

export type DailyRecord = { date: string; appetite: string; energy: string; stool: string; weight: string; note: string; actionDone: boolean };
export type SavedConversation = { role: "user" | "assistant"; content: string; evidenceIds?: string[]; feedback?: "helpful" | "unhelpful" };
export type CareMemory = { version: 1; records: DailyRecord[]; conversation: SavedConversation[] };
export const EMPTY_MEMORY: CareMemory = { version: 1, records: [], conversation: [] };
export const observationChoices = ["和平时相近", "与平时不同", "没有观察"] as const;
const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";

export function petMemoryKey(input: AssessmentInput | null) {
  return "dogcare-companion-v1:" + encodeURIComponent(input ? `${input.dogName?.trim() || "未命名"}:${input.breed.trim()}` : "general");
}
export function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function parseMemory(raw: unknown): CareMemory {
  if (!raw || typeof raw !== "object" || !("version" in raw) || raw.version !== 1) throw new Error("记录文件格式不正确。");
  const data = raw as Record<string, unknown>;
  const records = Array.isArray(data.records) ? data.records.flatMap(value => {
    if (!value || typeof value !== "object" || typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || Number.isNaN(Date.parse(value.date)) || new Date(value.date).toISOString().slice(0, 10) !== value.date) return [];
    const choice = (item: unknown) => observationChoices.includes(item as typeof observationChoices[number]) ? String(item) : "没有观察";
    return [{ date: value.date, appetite: choice(value.appetite), energy: choice(value.energy), stool: choice(value.stool), weight: text(value.weight, 20), note: text(value.note, 600), actionDone: value.actionDone === true }];
  }).slice(-180) : [];
  const conversation: SavedConversation[] = Array.isArray(data.conversation) ? data.conversation.flatMap(value => {
    if (!value || (value.role !== "user" && value.role !== "assistant") || typeof value.content !== "string") return [];
    return [{ role: value.role as SavedConversation["role"], content: text(value.content, 8000), evidenceIds: Array.isArray(value.evidenceIds) ? value.evidenceIds.filter((id: unknown) => typeof id === "string").slice(0, 12) : [], ...(value.feedback === "helpful" || value.feedback === "unhelpful" ? { feedback: value.feedback } : {}) }];
  }).slice(-30) : [];
  return { version: 1, records: [...new Map(records.map(record => [record.date, record])).values()].sort((a,b) => a.date.localeCompare(b.date)), conversation };
}
export function loadMemory(key: string): CareMemory {
  const value = localStorage.getItem(key);
  return value ? parseMemory(JSON.parse(value)) : { ...EMPTY_MEMORY, records: [], conversation: [] };
}
export function saveMemory(key: string, memory: CareMemory) {
  localStorage.setItem(key, JSON.stringify(parseMemory(memory)));
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function weeklyReminder() {
  const next = new Date(); next.setDate(next.getDate() + 7); next.setHours(19, 0, 0, 0);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dogcare//Companion//ZH", "BEGIN:VEVENT", `UID:dogcare-${next.getTime()}@dogcare.cc`, `DTSTAMP:${format(new Date())}`, `DTSTART:${format(next)}`, `DTEND:${format(new Date(next.getTime() + 10 * 60 * 1000))}`, "SUMMARY:和毛孩子一起回顾本周照护", "DESCRIPTION:打开 https://dogcare.cc/companion 查看本机观察记录。", "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:回顾毛孩子本周照护记录", "END:VALARM", "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}
