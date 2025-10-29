"use client";

import { Omniston, OmnistonProvider } from "@ston-fi/omniston-sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { THEME, TonConnectUIProvider } from "@tonconnect/ui-react";
import React, { useRef } from "react";

import { AssetsProvider } from "./assets";
import { MultiSwapProvider } from "./multi-swap";
import { SwapSettingsProvider } from "./swap-settings";

const queryClient = new QueryClient();

export function Providers({
  children,
  omnistonApiUrl,
  tonConnectManifestUrl,
}: {
  children: React.ReactNode;
  omnistonApiUrl: string;
  tonConnectManifestUrl: string;
}) {
  const omniston = useRef(
    new Omniston({
      apiUrl: omnistonApiUrl,
      logger: console,
    }),
  );

  /**
   * Provider hierarchy (inner to outer):
   * 1. QueryClient - React Query for data fetching
   * 2. TonConnect - Wallet connection (provides wallet address)
   * 3. Assets - Requires wallet address from TonConnect
   * 4. Omniston - SDK initialization (uses assets data)
   * 5. SwapSettings - Independent settings management
   * 6. MultiSwap - Uses assets and settings for swap state
   */
  return (
    <QueryClientProvider client={queryClient}>
      <TonConnectUIProvider
        uiPreferences={{
          borderRadius: "s",
          theme: THEME.LIGHT,
        }}
        manifestUrl={tonConnectManifestUrl}
      >
        <AssetsProvider>
          <OmnistonProvider omniston={omniston.current}>
            <SwapSettingsProvider>
              <MultiSwapProvider>{children}</MultiSwapProvider>
            </SwapSettingsProvider>
          </OmnistonProvider>
        </AssetsProvider>
      </TonConnectUIProvider>
    </QueryClientProvider>
  );
}
