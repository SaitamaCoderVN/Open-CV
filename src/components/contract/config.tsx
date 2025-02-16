import { http, createConfig } from '@wagmi/core';
import { kaia, kairos } from "@wagmi/core/chains";
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

export const config = createConfig({
  chains: [opalTestnet, kaia, kairos], // Thêm uniqueChain vào mảng chains
  transports: {
    [8882]: http("https://rpc-opal.unique.network"),
    [kaia.id]: http("https://public-en.node.kaia.io"),
    [kairos.id]: http("https://public-en-kairos.node.kaia.io"),
  },
})