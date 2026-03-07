"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { createContext, ReactNode, useContext } from "react";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex =
  url && url.startsWith("https://")
    ? new ConvexReactClient(url)
    : null;

export const ConvexAvailableContext = createContext(false);

export function useConvexAvailable() {
  return useContext(ConvexAvailableContext);
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <ConvexAvailableContext.Provider value={false}>
        {children}
      </ConvexAvailableContext.Provider>
    );
  }
  return (
    <ConvexAvailableContext.Provider value={true}>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ConvexAvailableContext.Provider>
  );
}
