"use client";

// import * as React from "react";
// import { argentWallet, trustWallet, ledgerWallet } from "@rainbow-me/rainbowkit/wallets";
// import { polygon, base } from "wagmi/chains";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { WagmiProvider } from "wagmi";

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import {
  base, polygon
} from 'wagmi/chains';
import { coinbaseWallet, phantomWallet, argentWallet, trustWallet, ledgerWallet, rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
  appName: "GIBI",
  projectId: "0xB8B6910ed0cf70F92C9a6327838dad479302e7Ad",
  wallets: [
    { groupName: "Popular", wallets: [coinbaseWallet, phantomWallet, rabbyWallet] },
    ...wallets,
    {
      groupName: "Other",
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],

  chains: [polygon, base],
  ssr: true, // If your dApp uses server side rendering (SSR)
  transports: {
    // Add transports for your dApp
  },


});
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
