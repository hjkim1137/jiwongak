const UNKNOWN_COMPANY_NAMES = new Set([
  "",
  "unknown",
  "알 수 없음",
  "미확인",
  "미상",
  "tbd",
  "n/a",
]);

export const COMPANY_FALLBACK_LABEL = "회사명 알 수 없음";

export function displayCompany(name: string | null | undefined): string {
  if (!name) return COMPANY_FALLBACK_LABEL;
  const normalized = name.trim().toLowerCase();
  if (UNKNOWN_COMPANY_NAMES.has(normalized)) return COMPANY_FALLBACK_LABEL;
  return name;
}
