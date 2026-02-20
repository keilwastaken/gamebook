import { createContext, useContext, type ReactNode } from "react";

import { useGames } from "./game-store";

type GamesContextValue = ReturnType<typeof useGames>;

const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const value = useGames();
  return (
    <GamesContext.Provider value={value}>{children}</GamesContext.Provider>
  );
}

export function useGamesContext(): GamesContextValue {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGamesContext must be used within GamesProvider");
  return ctx;
}
