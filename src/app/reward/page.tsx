"use client";

import { nftAbi } from "@/components/contract/abi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL } from "@/components/contract/contracts";
import { CustomConnectButton } from "@/components/ui/ConnectButton";
import Spacer from "@/components/ui/Spacer";
import Link from "next/link";
import { useContext, useEffect, useRef, useState } from 'react';
import {
    type BaseError,
    useWaitForTransactionReceipt,
    useWriteContract,
    useChainId,
    useAccount,
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/components/contract/config";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownIcon } from "lucide-react";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { AccountsContext } from '@/accounts/AccountsContext';
import { TransactionStatus } from "@/components/TransactionStatus";

function RewardPage() {
    const [codeContribute, setCodeContribute] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [tokenIdOfNFT, setTokenIdOfNFT] = useState<number>(0);
    const [levelFrom, setLevelFrom] = useState<number>(0);
    const [levelTo, setLevelTo] = useState<number>(0);
    const {chain} = useChainAndScan();
    
    const { toast } = useToast();
    const chainId = useChainId();
    const account = useAccount();
    let contractAddress: `0x${string}` | undefined;
    let blockexplorer: string | undefined;

    const [isOptionsVisible, setOptionsVisible] = useState(false); 
    const optionsRef = useRef<HTMLDivElement | null>(null); 
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 }, 
        visible: { opacity: 1, y: 0 },   
    };

    const { selectedAccount } = useContext(AccountsContext);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState('');
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { address: wagmiAddress, isConnected } = useAccount();

    const toggleOptions = () => {
        setOptionsVisible(!isOptionsVisible); 
    };
    // Function to handle clicks outside the dropdown
    const handleClickOutside = (event: MouseEvent) => {
        if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
            setOptionsVisible(false); 
        }
    };
    
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside); 
        };
    }, []);

    switch (chainId) {
        case CHAINID.OPAL:
            contractAddress = CONTRACT_ADDRESS_OPAL;
            blockexplorer = BLOCK_EXPLORER_OPAL;
            break;
        case CHAINID.QUARTZ:
            contractAddress = CONTRACT_ADDRESS_QUARTZ;
            blockexplorer = BLOCK_EXPLORER_QUARTZ;
            break;
        case CHAINID.UNIQUE:
            contractAddress = CONTRACT_ADDRESS_UNIQUE;
            blockexplorer = BLOCK_EXPLORER_UNIQUE;
            break;
    }

    const { data: hash, error, isPending, writeContract } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!contractAddress) {
            toast({
                variant: "destructive",
                title: "Network Error",
                description: "Please select a supported network",
            });
            return;
        }
        
        const rewardType = (document.getElementById('rewardType') as HTMLSelectElement).value;
        
        try {
            if (!isConnected && !selectedAccount) {
                throw new Error("Please connect wallet");
            }

            if (selectedAccount) {
                await rewardWithPolkadot(rewardType);
            } else if (isConnected) {
                await rewardWithEVM(rewardType);
            }

            setTimeout(() => {
                window.location.reload();
            }, 2000);

            
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Transaction Cancelled",
                description: `${(error as BaseError).shortMessage || "An unknown error occurred"}`,
            });
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const rewardWithPolkadot = async (rewardType: string) => {
        if(!selectedAccount) throw new Error("Polkadot account not found");

        try {
            setIsPolkadotPending(true);
            if(rewardType === 'nft') {
                const result = await chain.evm.send(
                    {
                        contract: {
                            address: contractAddress as string,
                            abi: nftAbi as any
                        },
                        functionName: "rewardByTokenId",
                        functionArgs: [
                            BigInt(tokenIdOfNFT),
                            BigInt(amount * 1e18)
                        ],
                        value: BigInt(amount * 1e18),
                        gasLimit: BigInt(3_000_000)
                    },
                    { signerAddress: selectedAccount.address },
                    { signer: selectedAccount.signer }
                );
    
                if (!result.result.isSuccessful) {
                    throw new Error("Mint transaction failed");
                }
    
                setPolkadotTransactionStatus("Transaction successful!");
                setPolkadotTransactionHash(result.extrinsicOutput.hash);
            } else if(rewardType === 'code_contribute') {
                const result = await chain.evm.send(
                    {
                        contract: {
                            address: contractAddress as string,
                            abi: nftAbi as any
                        },
                        functionName: "rewardByCodeContribute",
                        functionArgs: [
                            codeContribute as `0x${string}`,
                            BigInt(amount * 1e18),
                            BigInt(levelFrom),
                            BigInt(levelTo)
                        ],
                        value: BigInt(amount * 1e18),
                        gasLimit: BigInt(3_000_000)
                    },
                    { signerAddress: selectedAccount.address },
                    { signer: selectedAccount.signer }
                );
    
                if (!result.result.isSuccessful) {
                    throw new Error("Mint transaction failed");
                }
    
                setPolkadotTransactionStatus("Transaction successful!");
                setPolkadotTransactionHash(result.extrinsicOutput.hash);
            }

        } catch (error) {
            console.error("Error during minting:", error);
            setPolkadotTransactionStatus("Transaction failed: " + (error as Error).message);
            throw new Error("Cannot mint NFT: " + (error as Error).message);
        } finally {
            setIsPolkadotPending(false);
        }
    }

    const rewardWithEVM = async (rewardType: string) => {
        if(!isConnected) throw new Error("EVM account not found");

        try {
            if (rewardType === 'nft') {
                await writeContract({
                    address: contractAddress,
                    abi: nftAbi,
                    functionName: "rewardByTokenId",
                    args: [BigInt(tokenIdOfNFT), BigInt(amount * 1e18)],
                    value: BigInt(amount * 1e18),
                    chain: config[chainId],
                    account: account.address as `0x${string}`,
                });
            } else if (rewardType === 'code_contribute') {

                await writeContract({
                    address: contractAddress,
                    abi: nftAbi,
                    functionName: "rewardByCodeContribute",
                    args: [codeContribute as `0x${string}`, BigInt(amount * 1e18), BigInt(levelFrom), BigInt(levelTo)],
                    value: BigInt(amount * 1e18),
                    chain: config[chainId],
                    account: account.address as `0x${string}`,
                });
            }
        } catch (error) {
            console.error('Error during contract read:', error);
        }
    }

    return (
        <>
            <div className='v11e5678D'></div>
            <div className='background-container min-h-[100vh] border-2 border-solid border-primary rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment'>
            <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />

                <div className='
                max-phonescreen:flex-col max-phonescreen:items-start max-phonescreen:gap-2
                
                flex justify-between items-center px-[3vw]'>
                    <div className='flex items-center'>
                        <Link href="/" className='
                        max-phonescreen:text-[4vw] max-phonescreen:leading-[4vw]
                        
                        text-primary mr-4 text-xl font-silkscreen'>
                            Home /
                        </Link>
                        
                        <div className='
                        max-phonescreen:text-[5.5vw] max-phonescreen:leading-[5.5vw]
                        
                        text-primary font-bold font-pixel uppercase text-[5.5vw] leading-[5.5vw] whitespace-nowrap'>
                            Reward 
                        </div>
                    </div>
                    
                    <div className='
                    max-phonescreen:gap-1
                    
                    flex gap-3 flex-row-reverse'>
                    <div className='relative' ref={optionsRef}> {/* Attach ref here */}
                        <button 
                            onClick={toggleOptions} 
                            className=' 
                            max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                            
                            fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'
                        >
                            <span>Options</span>
                            <ArrowDownIcon className='ml-2' />
                        </button>
                        <AnimatePresence>
                            {isOptionsVisible && ( // Conditionally render the buttons with animation
                                <motion.div
                                    className='absolute top-14 right-0 z-10 shadow-lg rounded-md flex flex-col gap-3'
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    variants={dropdownVariants}
                                    transition={{ duration: 0.2 }} // Animation duration
                                >
                                    <Link href="/admin" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Admin
                                    </Link>
                                    <Link href="/config" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Config
                                    </Link>
                                    <Link href="/upgrade" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Upgrade
                                    </Link>
                                    <Link href="/replace" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Replace
                                    </Link>
                                    <Link href="/nesting" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Nesting
                                    </Link>
                                    <Link href="/unnest" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Unnest
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className='
                    max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                    
                    connect-btn text-primary font-pixel uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap'>
                        <CustomConnectButton />
                    </div>
                </div>
                </div>

                <div className="w-full mt-10">
                    <div className="
                    max-phonescreen:w-[calc(100%-20px)]
                    
                    bg-secondary-background p-8 rounded-lg max-w-2xl mx-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="rewardType" className="block text-lg font-medium text-gray-300 mb-2">
                                    Reward Type
                                </label>
                                <select
                                    id="rewardType"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    onChange={(e) => {
                                        const isAddressReward = e.target.value === 'nft';
                                        const levelFields = document.getElementById('levelFields');
                                        const recipientAddressContainer = document.getElementById('recipientAddressContainer');
                                        if (levelFields) {
                                            levelFields.style.display = isAddressReward ? 'none' : 'block';
                                        }
                                        if (recipientAddressContainer) {
                                            recipientAddressContainer.style.display = isAddressReward ? 'block' : 'none';
                                        }
                                    }}
                                >
                                    <option value="code_contribute">Reward by Code Contribute</option>
                                    <option value="nft">Reward by NFT Token Id</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="amount" className="block text-lg font-medium text-gray-300 mb-2">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    id="amount"
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    value={amount}
                                    onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                                />
                            </div>

                            <div>
                                <label htmlFor="token" className="block text-lg font-medium text-gray-300 mb-2">
                                    Token
                                </label>
                                <select
                                    id="token"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    onChange={(e) => {
                                        const isNative = e.target.value === 'native';
                                        const tokenAddressContainer = document.getElementById('tokenAddressContainer');
                                        if (tokenAddressContainer) {
                                            tokenAddressContainer.style.display = isNative ? 'none' : 'block';
                                        }
                                    }}
                                >
                                    <option value="native">Native Token</option>
                                    <option value="address" disabled>Token ERC20</option>
                                </select>
                            </div>

                            <div id="tokenAddressContainer" style={{ display: 'none' }}>
                                <label htmlFor="tokenAddress" className="block text-lg font-medium text-gray-300 mb-2">
                                    Token Address (optional)
                                </label>
                                <input
                                    type="text"
                                    id="tokenAddress"
                                    placeholder="Enter token address"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                />
                            </div>

                            <div id="recipientAddressContainer" style={{ display: 'none' }}>
                                <label htmlFor="tokenIdOfNFT" className="block text-lg font-medium text-gray-300 mb-2">
                                    Token Id of NFT
                                </label>
                                <input
                                    type="number"
                                    id="tokenIdOfNFT"
                                    placeholder="Enter token Id of NFT"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    value={tokenIdOfNFT}
                                    onChange={(e) => setTokenIdOfNFT(parseInt(e.target.value, 10))}
                                />
                            </div>

                            <div id="levelFields">
                                <div className="
                                max-phonescreen:flex-col max-phonescreen:space-x-0
                                flex space-x-4
                                ">
                                    <div className="flex-1">
                                        <label htmlFor="codeContribute" className="block text-lg font-medium text-gray-300 mb-2 whitespace-nowrap">
                                            Code Contribute
                                        </label>
                                        <input
                                            type="text"
                                            id="codeContribute"
                                            placeholder="Enter code contribute"
                                            className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                            value={codeContribute}
                                            onChange={(e) => setCodeContribute(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label htmlFor="levelFrom" className="block text-lg font-medium text-gray-300 mb-2 whitespace-nowrap">
                                            Level From
                                        </label>
                                        <input
                                            type="number"
                                            id="levelFrom"
                                            placeholder="Enter starting level"
                                            className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                            value={levelFrom}
                                            onChange={(e) => setLevelFrom(parseInt(e.target.value, 10))}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label htmlFor="levelTo" className="block text-lg font-medium text-gray-300 mb-2 whitespace-nowrap">
                                            Level To
                                        </label>
                                        <input
                                            type="number"
                                            id="levelTo"
                                            placeholder="Enter ending level"
                                            className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                            value={levelTo}
                                            onChange={(e) => setLevelTo(parseInt(e.target.value, 10))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full bg-black text-[#3f3c40] font-bold py-2 px-4 rounded-md hover:text-[#c7c1c9] transition duration-300"
                                >
                                    Reward now
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="
                    max-phonescreen:max-w-[400px]   
                    mt-8 bg-secondary p-6 rounded-lg max-w-2xl mx-auto">
                        <TransactionStatus 
                            isPending={isPending}
                            isConfirming={isConfirming}
                            isConfirmed={isConfirmed}
                            hash={hash}
                            error={error}
                            isPolkadotPending={isPolkadotPending}
                            polkadotTransactionStatus={polkadotTransactionStatus}
                            polkadotTransactionHash={polkadotTransactionHash}
                            blockexplorer={blockexplorer}
                        />
                    </div>
                </div>
                <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />


            </div>
        </>
    );
}

export default RewardPage;