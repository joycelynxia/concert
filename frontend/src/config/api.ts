/**
 * Backend API base URL.
 * - Local: set REACT_APP_API_URL in .env or leave unset (defaults to http://127.0.0.1:4000).
 * - Deployed (Vercel): set REACT_APP_API_URL in Vercel env to your Railway backend URL
 *   (e.g. https://your-app.railway.app) — no trailing slash.
 */
export const API_BASE =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:4000";
