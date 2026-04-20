export function sanitizeQueryParams(params?: Record<string, unknown>) {
  if (!params) return undefined;

  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  });

  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}
