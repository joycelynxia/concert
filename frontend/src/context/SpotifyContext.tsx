import React, { createContext, useContext, useState, useEffect } from 'react';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
}

interface SpotifyContextProps {
  tokens: Tokens | null;
  setTokens: React.Dispatch<React.SetStateAction<Tokens | null>>;
}

const SpotifyContext = createContext<SpotifyContextProps | undefined>(undefined);
const STORAGE_KEY = "spotify_tokens";

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<Tokens | null>(null);

  // Load persisted tokens on app init (survives page refresh)
  useEffect(() => {
    async function loadTokens() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (!parsed?.refresh_token) return;

        const isExpired = parsed.expires_at && Date.now() >= parsed.expires_at - 300 * 1000;

        if (isExpired) {
          // Token expired - refresh it
          const res = await fetch("http://127.0.0.1:4000/api/auth/refresh_token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: parsed.refresh_token }),
          });
          if (!res.ok) return;
          const data = await res.json();
          const freshTokens = {
            access_token: data.access_token,
            refresh_token: parsed.refresh_token,
            expires_in: data.expires_in || 3600,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...freshTokens,
            expires_at: Date.now() + freshTokens.expires_in * 1000,
          }));
          setTokens(freshTokens);
        } else {
          setTokens({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
            expires_in: Math.floor((parsed.expires_at - Date.now()) / 1000) || 3600,
          });
        }
      } catch {
        // Ignore corrupted localStorage or network errors
      }
    }
    loadTokens();
  }, []);

  return (
    <SpotifyContext.Provider value={{ tokens, setTokens }}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
};
