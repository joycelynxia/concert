import React, { useEffect } from 'react';
import { Tokens } from 'types/spotify';

// interface Tokens {
//   access_token: string;
//   refresh_token: string;
//   expires_in?: number;
// }

interface SpotifyCallbackProps {
  onTokensReceived: (tokens: Tokens) => void;
}

export const SpotifyCallback: React.FC<SpotifyCallbackProps> = ({ onTokensReceived }) => {
  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);

      /* ---------- 1. New flow: tokens already in URL ---------- */
      const token = params.get('access_token');
      const refresh = params.get('refresh_token');
      if (token && refresh) {
        onTokensReceived({ access_token: token, refresh_token: refresh, expires_in: 3600});
        // Wipe the query-string so users don’t see the token
        window.history.replaceState({}, '', '/');
        return;
      }

      /* ---------- 2. Old flow: code exchange ---------- */
      const code = params.get('code');
      if (!code) {
        console.error('No code or tokens in callback URL');
        return;
      }

      try {
        const res = await fetch(`http://127.0.0.1:4000/api/auth/callback?code=${code}`);
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
        const data = await res.json();                // {access_token, refresh_token, expires_in}
        if (!data.expires_in) {
          data.expires_in = 3600; // fallback
        }
        onTokensReceived(data);
        window.history.replaceState({}, '', '/');
      } catch (err) {
        console.error('Failed to get tokens:', err);
      }
    }

    handleCallback();
  }, [onTokensReceived]);

  return <p>Loading Spotify authentication…</p>;
};
