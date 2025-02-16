import { useCallback, useState } from 'react';
import { PolkadotWallet, PolkadotWalletName } from './PolkadotWallet';
import { BaseWalletType } from './types';

/**
 * Represents the names of supported wallets that can be connected.
 */
export type ConnectedWalletsName = 'polkadot-js' | 'keyring' | 'metamask' | 'talisman' | 'subwallet-js' | 'enkrypt' | 'novawallet';

const wallets = new Map<
  ConnectedWalletsName,
  typeof PolkadotWallet 
>([
  ['polkadot-js', PolkadotWallet],
  ['talisman', PolkadotWallet],
  ['subwallet-js', PolkadotWallet],
  ['enkrypt', PolkadotWallet],
  ['novawallet', PolkadotWallet],
]);

/**
 * Key used for storing the type of connected wallet in localStorage.
 * 
 * @constant
 */
export const CONNECTED_WALLET_TYPE = 'connected-wallet-type';

const getLocalStorage = (key: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const getConnectedWallets = () => {
  return getLocalStorage(CONNECTED_WALLET_TYPE)?.split(';') || [];
};

const setConnectedWallets = (connectedWallets: string[]) => {
  setLocalStorage(CONNECTED_WALLET_TYPE, connectedWallets.join(';'));
};

/**
 * Custom React hook for managing wallet connections.
 * 
 * @returns An object containing:
 * - `connectWallet`: A function to connect a wallet of the specified type.
 * - `connectedWallets`: A Map of connected wallets and their respective accounts.
 * 
 * @example
 * ```typescript
 * const { connectWallet, connectedWallets } = useWalletCenter();
 * 
 * // Connect to a Polkadot.js wallet
 * await connectWallet('polkadot-js');
 * 
 * // Access the connected wallets and their accounts
 * ```
 */
export const useWalletCenter = (chainProperties?: any) => {
  const [connectedWallets, setConnectedWallets] = useState(
    new Map<ConnectedWalletsName, Map<string, BaseWalletType<any>>>([])
  );

  const connectWallet = useCallback(
    async (typeWallet: ConnectedWalletsName) => {
      try {
        const wallet = new (wallets.get(typeWallet)!)(typeWallet as PolkadotWalletName);
        const currentWallets = await wallet.getAccounts();
        
        setConnectedWallets(prev => {
          const newMap = new Map(prev);
          newMap.set(typeWallet, currentWallets);
          return newMap;
        });

        return currentWallets;
      } catch (e: any) {
        setConnectedWallets(prev => {
          const newMap = new Map(prev);
          newMap.delete(typeWallet);
          return newMap;
        });
        throw e;
      }
    },
    []
  );

  const disconnectWallet = (typeWallet: ConnectedWalletsName) => {
    const newConnectedWallets = new Map(connectedWallets);
    newConnectedWallets.delete(typeWallet);
    setConnectedWallets(newConnectedWallets);
  };

  return {
    connectWallet,
    connectedWallets,
    disconnectWallet
  } as const;
};