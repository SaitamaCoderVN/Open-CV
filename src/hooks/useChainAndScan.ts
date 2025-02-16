import { useEffect, useState } from "react";
import {
  UniqueChain,
  UniqueChainInstance,
  UniqueIndexer,
  UniqueIndexerInstance
} from "@unique-nft/sdk";

type ChainAndScan = {
  chain: UniqueChainInstance | null;
  scan: UniqueIndexerInstance | null;
};

/**
 * Custom hook to initialize and access `UniqueChain` and `UniqueScan` instances for a specified network.
**/
export const useChainAndScan = () => {
  const [data, setData] = useState<ChainAndScan>({ chain: null, scan: null });
  const [loading, setLoading] = useState(true);

  const chainUrl = "https://rest.unique.network/v2/opal";
  const scanUrl = "https://rest.unique.network/v2/opal";

  useEffect(() => {
    const getChainAndScan = async () => {
      try {
        const uniqueChain = UniqueChain({
          baseUrl: chainUrl,
        });

        const uniqueScan = UniqueIndexer({
          baseUrl: scanUrl,
        });

        setData({ chain: uniqueChain, scan: uniqueScan });
      } catch (error) {
        console.error("Error fetching chain and scan:", error);
      } finally {
        setLoading(false);
      }
    };

    getChainAndScan();
  }, [chainUrl, scanUrl]);

  return { ...data, loading };
};