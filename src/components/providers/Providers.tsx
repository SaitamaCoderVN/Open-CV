'use client'

import { Provider } from "react-redux";
import { store } from "@/redux/store";
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  getDefaultWallets,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { http, WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { kaia, kairos } from "@wagmi/core/chains";
import { trustWallet, ledgerWallet } from "@rainbow-me/rainbowkit/wallets";
import { AccountsContextProvider } from "@/accounts/AccountsContext";

const { wallets } = getDefaultWallets();

// Define the Unique chain
const opalTestnet = {
  id: 8882, // Sửa thành 8880 hoặc "0x22b0"
  name: "Opal",
  network: "opal",
  nativeCurrency: {
    name: "Opal",
    symbol: "OPL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-opal.unique.network"],
      websocket: ["wss://ws-opal.unique.network"],
    },
    public: {
      http: ["https://rpc-opal.unique.network"],
      websocket: ["wss://ws-opal.unique.network"],
    },
  },
  blockExplorers: {
    default: { name: "Opal", url: "https://opal.subscan.io/" },
  },
  testnet: true,
};

const queryClient = new QueryClient();
const config = getDefaultConfig({
  appName: 'Soulbound Community',
  projectId: 'kaitojoitd',
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  chains: [opalTestnet, kaia, kairos],
  transports: {
    [8882]: http("https://rpc-opal.unique.network"),
    [kaia.id]: http("https://public-en.node.kaia.io"),
    [kairos.id]: http("https://public-en-kairos.node.kaia.io"),
  },
  ssr: true, // If your dApp uses server side rendering (SSR)
});
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={opalTestnet}
          showRecentTransactions={true}
          theme={darkTheme({
            accentColor: "#b373d0",
            accentColorForeground: "white",
            borderRadius: "none",
          })}
          locale="en-US"
        >
          <AccountsContextProvider>
            <Provider store={store}>{children}</Provider>
          </AccountsContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
