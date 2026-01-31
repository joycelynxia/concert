import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tokens } from "types/spotify";

interface SpotifyCallbackProps {
  onTokensReceived: (tokens: Tokens) => void;
  onAuthError?: (message: string) => void;
}

export const SpotifyCallback: React.FC<SpotifyCallbackProps> = ({
  onTokensReceived,
  onAuthError,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);

      // --- 1. CSRF protection via state check ---
      const returnedState = params.get("state");
      const storedState = localStorage.getItem("spotify_auth_state");
      if (returnedState !== storedState) {
        console.error("State mismatch");
        onAuthError?.("Authentication failed: state mismatch.");
        return;
      }

      // --- 2. Direct token return (e.g. from PKCE flow) ---
      const token = params.get("access_token");
      const refresh = params.get("refresh_token");

      if (token && refresh) {
        const tokens: Tokens = {
          access_token: token,
          refresh_token: refresh,
          expires_in: 3600,
        };

        persistTokens(tokens, onTokensReceived);
        onTokensReceived(tokens);
        navigate("/", { replace: true });
        return;
      }

      // --- 3. Authorization Code flow: exchange code with backend ---
      const code = params.get("code");
      if (!code) {
        console.error("No code or tokens in callback URL");
        onAuthError?.("Spotify login failed. Please try again.");
        return;
      }

      try {
        const res = await fetch(
          `http://127.0.0.1:4000/api/auth/callback?code=${code}`,
          { method: "GET" }
        );

        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`);
        }

        const data = await res.json(); // {access_token, refresh_token, expires_in}
        const tokens: Tokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in || 3600,
        };

        persistTokens(tokens, onTokensReceived);
        onTokensReceived(tokens);
        navigate("/", { replace: true });
      } catch (err: any) {
        console.error("Token exchange failed:", err);
        onAuthError?.("Could not complete Spotify login.");
      }
    }

    handleCallback();
  }, [navigate, onTokensReceived, onAuthError]);

  return <p>Loading Spotify authentication…</p>;
};

// --- 4. Optional: save to localStorage for persistence ---
function persistTokens(tokens: Tokens, onTokenUpdate?: (tokens: Tokens) => void) {
  localStorage.setItem("spotify_tokens", JSON.stringify({
    ...tokens,
    expires_at: Date.now() + tokens.expires_in * 1000,
  }));
  scheduleTokenRefresh(tokens, onTokenUpdate);
}

// --- 5. Optional: auto-refresh token before it expires ---
function scheduleTokenRefresh(tokens: Tokens, onTokenUpdate?: (tokens: Tokens) => void) {
  const refreshDelay = Math.max((tokens.expires_in - 300) * 1000, 0); // 5 min before expiry

  setTimeout(async () => {
    try {
      const res = await fetch("http://127.0.0.1:4000/api/auth/refresh_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });

      const newTokens = await res.json();
      const updatedTokens: Tokens = {
        ...tokens,
        access_token: newTokens.access_token,
        expires_in: newTokens.expires_in || 3600,
      };

      persistTokens(updatedTokens, onTokenUpdate);
      onTokenUpdate?.(updatedTokens); // Update React context so Player uses fresh token
    } catch (err) {
      console.error("Failed to refresh token:", err);
    }
  }, refreshDelay);
}
