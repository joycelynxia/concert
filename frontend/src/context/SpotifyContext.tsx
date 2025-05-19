import React, { createContext, useContext, useState } from 'react';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface SpotifyContextProps {
  tokens: Tokens | null;
  setTokens: React.Dispatch<React.SetStateAction<Tokens | null>>;
}

const SpotifyContext = createContext<SpotifyContextProps | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<Tokens | null>(null);

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
