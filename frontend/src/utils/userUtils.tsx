export function getCurrentUserId(): string | null {
  try {
    const u = localStorage.getItem("user");
    if (!u) return null;
    const parsed = JSON.parse(u) as { id?: string };
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}