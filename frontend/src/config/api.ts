/**
 * Backend API base URL.
 * - Local: leave REACT_APP_API_URL unset (defaults to http://127.0.0.1:4000).
 * - Deployed: set REACT_APP_API_URL to your Railway URL (with or without https://).
 */
function getApiBase(): string {
  const raw = process.env.REACT_APP_API_URL || "http://127.0.0.1:4000";
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const API_BASE = getApiBase();
