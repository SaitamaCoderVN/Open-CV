"use client"

import { CustomConnectButton } from "@/components/ui/ConnectButton";
import Spacer from "@/components/ui/Spacer";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { useDropzone } from 'react-dropzone';
import { FaSpinner } from 'react-icons/fa';
import "./style.css";
import { readContract } from "@wagmi/core/actions";
import { config } from "@/components/contract/config";
import { nftAbi } from "@/components/contract/abi";
import { useToast } from "@/components/ui/use-toast";
import { BaseError, useAccount, useChainId, useWriteContract } from "wagmi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";

import { AnimatePresence, motion } from "framer-motion";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { ethers } from "ethers";
import { AccountsContext } from '@/accounts/AccountsContext';
import { useWaitForTransactionReceipt } from "wagmi";
import { TransactionStatus } from "@/components/TransactionStatus";
import { ArrowDownIcon } from "lucide-react";

function UpgradePage() {
    const dispatch = useAppDispatch();
    const { cards } = useAppSelector((state) => state.card);
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localImageFile, setLocalImageFile] = useState(null);
    const [localImagePreview, setLocalImagePreview] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uriArray, setUriArray] = useState<Array<[string | bigint, string, bigint]>>([]);
    const [nftValue, setNftValue] = useState('');
    const [nftLevel, setNftLevel] = useState(1);

    const [isOptionsVisible, setOptionsVisible] = useState(false); 
    const optionsRef = useRef<HTMLDivElement | null>(null); 
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 }, 
        visible: { opacity: 1, y: 0 },   
    };

    const { selectedAccount } = useContext(AccountsContext);
    const { chain, scan } = useChainAndScan();

    const [isLoading, setIsLoading] = useState(false);

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

    const { toast } = useToast();
    const account = useAccount();
    const chainId = useChainId();
    let contractAddress: `0x${string}` | undefined;
    let blockexplorer: string | undefined;

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

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!isConnected && !selectedAccount) {
                throw new Error("Please connect wallet");
            }

            if (selectedAccount) {
                await upgradeWithPolkadot();
            } else if (isConnected) {
                await upgradeWithEVM();

            }

            setTimeout(() => {
                window.location.reload();
            }, 2000);

            toast({
                title: "Success",
                description: "NFT has been minted successfully!",
            });
        
        } catch (error) {
            console.error("Mint error:", error);
            toast({
                variant: "destructive",
                title: "NFT Minting Error",
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const upgradeWithPolkadot = async () => {
        if (!selectedAccount) throw new Error("Polkadot account not found");

        try {
            setIsPolkadotPending(true);
            const codeContribute = await readContract(config, {
                address: contractAddress,
                abi: nftAbi,
                functionName: "getTokenCodeContribute",
                args: [BigInt(nftValue)],
            });

            const result = await chain.evm.send(
                {
                    contract: {
                        address: contractAddress as string,
                        abi: nftAbi as any
                    },
                    functionName: "setLevelImageUri",
                    functionArgs: [
                        BigInt(nftValue),
                        codeContribute,
                        Number(nftLevel)
                    ],
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
        } catch (error) {
            console.error("Error during minting:", error);
            setPolkadotTransactionStatus("Transaction failed: " + (error as Error).message);
            throw new Error("Cannot mint NFT: " + (error as Error).message);
        } finally {
            setIsPolkadotPending(false);
        }
    };

    const upgradeWithEVM = async () => {
        if (!wagmiAddress) throw new Error("EVM address not found");

        const codeContribute = await readContract(config, {
            address: contractAddress,
            abi: nftAbi,
            functionName: "getTokenCodeContribute",
            args: [BigInt(nftValue)],
        });

        await writeContract({
            address: contractAddress,
            abi: nftAbi,
            functionName: "setTokenLevel",
            args: [BigInt(nftValue), codeContribute, Number(nftLevel)],
            chain: config[chainId],
            account: account.address,
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (address) {
                try {
                    if (!address.toLowerCase().startsWith("0x")) {
                        const result = await chain.collection.accountTokens({
                            address: address,
                            collectionId: 4794
                        });

                        const tokenIds = result.map(token => token.tokenId);

                        const tokenUriForContributorAndLevel = await Promise.all(tokenIds.map(async (tokenId) => {
                            const uri = await readContract(config, {
                                abi: nftAbi,
                                address: contractAddress,
                                functionName: 'getTokenImage',
                                args: [BigInt(tokenId)],
                            });
                            const level = await readContract(config, {
                                abi: nftAbi,
                                address: contractAddress,
                                functionName: 'getTokenLevel',
                                args: [BigInt(tokenId)],
                            });
                            return [BigInt(tokenId), uri, BigInt(level)] as [string | bigint, string, bigint];
                        }));

                        const filteredTokens = tokenUriForContributorAndLevel.filter(
                            ([_, __, level]) => level !== BigInt(0)
                        );

                        setUriArray(filteredTokens);
                    } else {
                        const result = await readContract(config, {
                            abi: nftAbi,
                            address: contractAddress,
                            functionName: 'getTokenIdsByOwner',
                            args: [address as `0x${string}`],
                        });

                        const tokenUriForContributorAndLevel = await Promise.all(result.map(async (tokenId) => {
                            const uri = await readContract(config, {
                                abi: nftAbi,
                                address: contractAddress,
                                functionName: 'getTokenImage',
                                args: [tokenId],
                            });
                            const level = await readContract(config, {
                                abi: nftAbi,
                                address: contractAddress,
                                functionName: 'getTokenLevel',
                                args: [tokenId],
                            });
                            return [tokenId, uri, BigInt(level)] as [string | bigint, string, bigint];
                        }));

                        // Lọc bỏ những NFT có level = 0
                        const filteredTokens = tokenUriForContributorAndLevel.filter(
                            ([_, __, level]) => level !== BigInt(0)
                        );

                        setUriArray(filteredTokens);
                    }
                } catch (error) {
                    console.error('Error reading from contract:', error);
                }
            }
        };

        fetchData();
    }, [address]);

    const { address: wagmiAddress, isConnected } = useAccount();
    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState<string | null>(null);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState<string | null>(null);

    useEffect(() => {
    }, [selectedAccount]);

    return (
        <>
        <div className='v11e5678D'></div>
        <div className='background-container min-h-[100vh] border-2 border-solid border-primary rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment flex flex-col'>
        <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />

            <div className='
            max-phonescreen:flex-col max-phonescreen:items-start max-phonescreen:gap-2
            
            flex justify-between items-center px-[3vw]'>
                <div className='flex items-center '>
                    <div className="flex flex-col">
                        <Link href="/" className='
                        max-phonescreen:text-[5vw] max-phonescreen:leading-[5vw]
                        
                        text-primary mr-4 text-xl font-silkscreen'>
                            Home /
                        </Link>
                    </div>
                    <div className='
                        max-phonescreen:text-[8.5vw] max-phonescreen:leading-[8.5vw]
                    
                    text-primary font-bold font-pixel uppercase text-[5.5vw] leading-[5.5vw] whitespace-nowrap'>
                        Upgrade NFT
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
                                    <Link href="/replace" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Replace
                                    </Link>
                                    <Link href="/reward" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Reward
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
            <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />


            <div className="
            max-phonescreen:flex-col-reverse max-phonescreen:gap-10
            
            add-profile-container flex px-[3vw] ">
                <div className="
                max-phonescreen:w-full max-phonescreen:p-0
                
                left-column w-[65%] pr-4 ">
                    <div className="flex-column">
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter Address"
                            className="
                            max-phonescreen:w-full
                            
                            w-[50%] px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                    
                    <div className="mt-[9vh]">
                    <h1 className="text-primary font-pixel text-3xl">Profile of {address}</h1>
                    {uriArray.length === 0 ? (
                        <p className="text-primary font-pixel text-3xl">You haven`t got any NFTs yet</p>
                    ) : (
                        <ul className="grid grid-cols-3 gap-4">
                            {uriArray.map((item, index) => (
                                <li key={index} className="text-center bg-secondary/20 p-4 rounded-lg border-2 border-[#ce8eeb]/50 hover:border-[#ce8eeb] transition-all duration-300">
                                    <div className="flex flex-col gap-4">
                                        {/* NFT Image */}
                                        <div className="relative border-2 border-[#b373d0]/30 rounded-lg overflow-hidden">
                                            <img 
                                                src={ethers.toUtf8String(item[1])} 
                                                alt={`Image ${index}`} 
                                                className="w-full h-auto"
                                            />
                                        </div>

                                        {/* NFT Info */}
                                        <div className="space-y-2 border-t-2 border-[#ce8eeb]/30 pt-2">
                                            <p className="text-primary font-pixel">Token ID: {item[0].toString()}</p>
                                            <p className="text-primary font-pixel">Level: {item[2].toString()}</p>
                                        </div>

                                        {/* Action Button */}
                                        <button 
                                            onClick={() => setNftValue(item[0].toString())}
                                            className="w-full mt-4 bg-[#b373d0] text-white font-pixel py-2 px-4 rounded-md 
                                             hover:bg-[#ce8eeb] transition-colors flex items-center justify-center gap-2
                                             border-2 border-[#b373d0] hover:border-[#ce8eeb]"
                                        >
                                            <span>Select for Upgrade</span>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                    
                </div>
                <div className="
                max-phonescreen:w-full max-phonescreen:p-0
                
                right-column w-[35%] pl-4 overflow-y-auto">
                    <div className="add-profile-form">
                        <h2 className="text-primary font-bold font-pixel text-2xl mb-4">Upgrade OG NFT</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* <div>
                                <label htmlFor="nftName" className="block text-primary font-pixel mb-2">NFT Name</label>
                                <input
                                    type="text"
                                    id="nftName"
                                    value={nftName}
                                    onChange={(e) => setNftName(e.target.value)}
                                    className="w-full px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div> */}
                            <div className="flex flex-col">
                                <label htmlFor="nftValue" className="block text-primary font-pixel mb-2">NFT of your choice</label>
                                <input
                                    type="text"
                                    id="nftValue"
                                    value={nftValue}
                                    onChange={(e) => setNftValue(e.target.value)}
                                    className="w-full px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="nftLevel" className="block text-primary font-pixel mb-2">Level to Update (must be `{'>'}` 0)</label>
                                <input
                                    type="number"
                                    id="nftLevel"
                                    value={nftLevel}
                                    onChange={(e) => setNftLevel(Number(e.target.value))}
                                    className="w-full px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    required
                                    min="1"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="bg-primary text-white font-pixel py-2 px-4 rounded-md hover:bg-secondary transition-colors flex items-center justify-center w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Upgrade...
                                    </>
                                ) : (
                                    'Upgrade'
                                )}
                            </button>
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
            </div>
            <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />

        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
}

export default UpgradePage;