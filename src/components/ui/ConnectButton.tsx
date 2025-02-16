"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useAccount } from 'wagmi';
import { useAppDispatch } from '../../hooks/useRedux';
import { setUser, clearUser } from '../../redux/userSlice';
import { User } from '../../types/User';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWalletCenter } from '@/accounts/useWalletCenter';
import { AccountsContext } from '@/accounts/AccountsContext';

export const CustomConnectButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { connectWallet, disconnectWallet } = useWalletCenter();
  const { accounts, setAccounts, setSelectedAccountId, selectedAccountId, selectedAccount } =
    useContext(AccountsContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const removeLocalStorage = (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  };

  const handlePolkadotConnect = async () => {
    setIsConnecting(true);
    try {
      const accounts = await connectWallet('polkadot-js');

      if (!accounts || accounts.size === 0) {
        throw new Error('No accounts found');
      }
      
      const firstAccount = accounts.values().next().value;
      if (!firstAccount?.address) {
        throw new Error('Invalid account data');
      }
      
      setAccounts(prev => new Map(prev).set(firstAccount.address, firstAccount));
      
      const user = new User(firstAccount.address);
      user.walletType = 'polkadot';
      dispatch(setUser(user));

      const accountId = Array.from(accounts.keys()).indexOf(firstAccount.normalizedAddress);

      setSelectedAccountId(accountId);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect to Polkadot wallet:", error);

      alert(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePolkadotDisconnect = () => {
    disconnectWallet('polkadot-js');
    
    dispatch(clearUser());
    
    removeLocalStorage('selectedAccount');
    removeLocalStorage('accounts');
    removeLocalStorage('selectedAccountId');
    removeLocalStorage('CONNECTED_WALLET_TYPE');
    
    setAccounts(new Map());
    setSelectedAccountId(-1);
    
    setIsOpen(false);
    setIsConnecting(false);

  };

  useEffect(() => {
    if (!isEvmConnected && !accounts.size) {
      dispatch(clearUser());
      removeLocalStorage('selectedAccount');
    }
  }, [isEvmConnected, accounts, dispatch]);

  useEffect(() => {
    if (!isEvmConnected) {
      dispatch(clearUser());
      
      removeLocalStorage('wagmi.wallet');
      removeLocalStorage('wagmi.connected');
      removeLocalStorage('wagmi.account');
      
      setIsOpen(false);
    }
  }, [isEvmConnected, dispatch]);

  useEffect(() => {
    if (accounts.size > 0) {
      setLocalStorage('selectedAccount', JSON.stringify(accounts.values().next().value));
    }
  }, [accounts, setAccounts]);


  useEffect(() => {
    const savedAccount = getLocalStorage('selectedAccount');
    if (savedAccount) {
      const account = JSON.parse(savedAccount);

      if (account.walletType === 'polkadot') {
        connectWallet('polkadot-js').then((accounts) => {
          if (accounts && accounts.size > 0) {
            const firstAccount = accounts.values().next().value;
            if (firstAccount.address === account.address) {
              setAccounts((prevAccounts) => new Map(prevAccounts).set(firstAccount.address, firstAccount));

              const user = new User(firstAccount.address);
              user.walletType = 'polkadot';
              dispatch(setUser(user));
              const accountId = Array.from(accounts.keys()).indexOf(firstAccount.address);
              setSelectedAccountId(accountId);
            }
          }
        }).catch((error) => {
          console.error("Failed to reconnect to Polkadot wallet:", error);
        });
      }
    }
  }, [connectWallet, accounts, dispatch, setSelectedAccountId]);

  useEffect(() => {
    if (isEvmConnected && evmAddress) {
      const user = new User(evmAddress);
      user.walletType = 'evm';
      dispatch(setUser(user));
    }
  }, [isEvmConnected, evmAddress, dispatch]);

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  const isAnyWalletConnected = isEvmConnected || (accounts.size > 0);

  if (isAnyWalletConnected) {
    if (accounts.size > 0) {
      const connectedWallet = accounts.values().next().value;
      const address = connectedWallet.normalizedAddress;
      const name = connectedWallet.name;

      if (connectedWallet && address) {

        const walletName = connectedWallet.name || "Unknown Wallet";
        const walletAddress = address || "Unknown Address";

        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <span>{walletName}</span>
              <span className="text-gray-400">
                {`${(walletAddress as string).slice(0, 6)}...${(walletAddress as string).slice(-4)}`}
              </span>
            </div>
            <button
              onClick={handlePolkadotDisconnect}
              className="fu-btn profile flex items-center justify-center bg-red-600 text-white font-silkscreen font-semibold px-3 py-1 text-sm hover:bg-red-700 transition-all duration-300"
            >
              Disconnect
            </button>
          </div>
        );
      } else {
        throw new Error("No connected wallet found or address is undefined.");
      }
    }
    return <ConnectButton />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="max-phonescreen:h-[7vw] max-phonescreen:w-[36vw] max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw]
        fu-btn profile flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300"
      >
        CONNECT WALLET
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full mt-2 right-0 bg-secondary-background rounded-md shadow-lg z-50"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
          >
            <div className="flex flex-col p-2 gap-2">
              <ConnectButton label="EVM WALLET" />
              <button
                onClick={handlePolkadotConnect}
                disabled={isConnecting}
                className="max-phonescreen:h-[7vw] max-phonescreen:w-[36vw] max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw]
                fu-btn profile flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300"
              >
                {isConnecting ? 'Connecting...' : 'POLKADOT WALLET'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};