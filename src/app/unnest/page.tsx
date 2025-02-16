"use client"

import Card from "@/components/Card";
import CardGrid from "@/components/card-grid/CardGrid";
import { CustomConnectButton } from "@/components/ui/ConnectButton";
import Spacer from "@/components/ui/Spacer";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { useDropzone } from 'react-dropzone';
import { FaSpinner } from 'react-icons/fa';
import "./style.css"
import { setCards } from "@/redux/cardSlice";
import { v4 as uuidv4 } from 'uuid';
import { getRandomRarity, getRandomType } from "@/utils/rarityUtils";
import { readContract } from "@wagmi/core/actions";
import { config } from "@/components/contract/config";
import { nftAbi } from "@/components/contract/abi";
import { useToast } from "@/components/ui/use-toast";
import { BaseError, useAccount, useChainId, useWriteContract } from "wagmi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";
import { UniqueChain } from "@unique-nft/sdk";

import { AnimatePresence, motion } from "framer-motion";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { ethers } from "ethers";
import { AccountsContext } from '@/accounts/AccountsContext';
import { Address } from "@unique-nft/utils";
import { useWaitForTransactionReceipt, useSendTransaction } from "wagmi";
import { SdkContext } from "@/sdk/SdkContext";
import { parseEther } from "viem";
import { SignerTypeEnum, Account } from "@/accounts/types";
import { toast } from '@/components/ui/use-toast';
import { UniqueNFTFactory } from "@unique-nft/solidity-interfaces";
import { TransactionStatus } from "@/components/TransactionStatus";
import { ArrowDownIcon } from "lucide-react";

interface NestedNFT {
    tokenId: number;
    imageUri: string;
}

function UnnestPage() {
    const dispatch = useAppDispatch();
    const { cards } = useAppSelector((state) => state.card);
    const { address: wagmiAddress, isConnected } = useAccount();
    const { selectedAccount } = useContext(AccountsContext);

    const getCurrentAddress = useCallback(() => {
        if (selectedAccount) {
            return selectedAccount.normalizedAddress;
        }
        if (isConnected && wagmiAddress) {
            return wagmiAddress;
        }
        return null;
    }, [selectedAccount, isConnected, wagmiAddress]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localImageFile, setLocalImageFile] = useState(null);
    const [localImagePreview, setLocalImagePreview] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uriArray, setUriArray] = useState<Array<[string | bigint, string, bigint, NestedNFT[]]>>([]);
    const [TokenIdNested, setTokenIdNested] = useState('');
    const [TokenIdParent, setTokenIdParent] = useState('');

    const [isOptionsVisible, setOptionsVisible] = useState(false); 
    const optionsRef = useRef<HTMLDivElement | null>(null); 
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 }, 
        visible: { opacity: 1, y: 0 },   
    };

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
        case CHAINID.UNIQUE:
            contractAddress = CONTRACT_ADDRESS_UNIQUE;
            blockexplorer = BLOCK_EXPLORER_UNIQUE;
            break;
        case CHAINID.QUARTZ:
            contractAddress = CONTRACT_ADDRESS_QUARTZ;
            blockexplorer = BLOCK_EXPLORER_QUARTZ;
            break;
        case CHAINID.OPAL:
            contractAddress = CONTRACT_ADDRESS_OPAL;
            blockexplorer = BLOCK_EXPLORER_OPAL;
            break;
    }

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLocalImageFile(file);
        setLocalImagePreview(URL.createObjectURL(file));
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (!isConnected && !selectedAccount) {
                throw new Error("Please connect wallet");
            }

            if (selectedAccount) {
                await unnestWithPolkadot();
            } else if (isConnected) {
                await unnestWithEVM();
            }

            toast({
                title: "Success",
                description: "NFT has been minted successfully!",
            });

            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error("Unnest error:", error);
            toast({
                variant: "destructive",
                title: "NFT Unnest Error",
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const unnestWithPolkadot = async () => {
        if (!selectedAccount) throw new Error("Polkadot account not found");

        try {
            setIsPolkadotPending(true);
            setPolkadotTransactionStatus("Processing...");
            setError(null);

            // Check token IDs
            if (!TokenIdNested) {
                throw new Error("Invalid Token ID");
            }

            // Check if tokens exist
            const bundleExists = await chain.token.get({
                collectionId: 4794,
                tokenId: Number(TokenIdNested)
            });
            
            if (!bundleExists) {
                throw new Error("Bundle token does not exist");
            }

            // Check ownership
            const tokenInfo = await chain.token.get({
                collectionId: 4794,
                tokenId: Number(TokenIdNested)
            });

            const tokenIds = tokenInfo.children?.map(child => child.tokenId) || [];

            // Perform Unnest
            const result = await chain.token.unnest(
                {
                    nested: { collectionId: 4794, tokenId: Number(TokenIdNested) }
                },
                { 
                    signerAddress: selectedAccount.address 
                },
                { 
                    signer: selectedAccount.signer 
                }
            );

            if (!result || !result.extrinsicOutput) {
                throw new Error("Unnest transaction failed");
            }

            setPolkadotTransactionStatus("Success!");
            setPolkadotTransactionHash(result.extrinsicOutput.hash);

            toast({
                title: "Success",
                description: "NFT has been unnested successfully!",
                duration: 5000,
            });

        } catch (error) {
            console.error("Error during Unnest:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setPolkadotTransactionStatus("Transaction failed: " + errorMessage);
            setError(error instanceof Error ? error : new Error(errorMessage));
            throw new Error("Cannot unnest NFT: " + errorMessage);
        } finally {
            setIsPolkadotPending(false);
        }
    };

    const unnestWithEVM = async () => {
        try {
            if (!wagmiAddress) throw new Error("Please connect EVM wallet");

            setIsPending(true);
            setIsSubmitting(true);
            setError(null);

            const collectionAddress = Address.collection.idToAddress(4794);
            const tokenAddress = Address.nesting.idsToAddress(4794, Number(TokenIdParent));

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const collectionContract = await UniqueNFTFactory(
                collectionAddress,
                signer
            );
            
            const result = await collectionContract.transferFrom(
                tokenAddress,
                wagmiAddress,
                Number(TokenIdNested)
            );

            setHash(result.hash);
            setIsConfirming(true);
            setIsPending(false);

            const receipt = await result.wait();
            
            if (receipt.status === 1) {
                setIsConfirmed(true);
                setIsConfirming(false);
                toast({
                    title: "Success",
                    description: "NFT has been unnested successfully!",
                    duration: 5000,
                });
            } else {
                throw new Error("Transaction failed");
            }

        } catch (error) {
            console.error("Unnest error:", error);
            setError(error instanceof Error ? error : new Error("Unknown error"));
            toast({
                variant: "destructive", 
                title: "Error Unnest NFT",
                description: error instanceof Error ? error.message : "Cannot unnest NFT",
                duration: 5000,
            });
            throw error;
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const currentAddress = getCurrentAddress();
            if (currentAddress) {
                try {
                    if (selectedAccount) {
                        const result = await chain.collection.accountTokens({
                            address: currentAddress,
                            collectionId: 4794
                        });

                        const tokenIds = result.map(token => token.tokenId);
                        
                        const bundleTokens = await Promise.all(
                            tokenIds.map(async (tokenId) => {
                                const tokenInfo = await chain.token.get({
                                    collectionId: 4794,
                                    tokenId: tokenId,
                                    withChildren: true
                                });
                                
                                const isBundle = tokenInfo.children && tokenInfo.children.length > 0;
                                return isBundle ? tokenId : null;
                            })
                        );

                        const bundleTokenIds = bundleTokens.filter(tokenId => tokenId !== null);

                        const tokenUriForContributorAndLevel = await Promise.all(bundleTokenIds.map(async (tokenId) => {
                            const tokenInfo = await chain.token.get({
                                collectionId: 4794,
                                tokenId: tokenId,
                                withChildren: true
                            });

                            const nestedTokens = await Promise.all(
                                (tokenInfo.children || []).map(async (child) => {
                                    const nestedUri = await readContract(config, {
                                        abi: nftAbi,
                                        address: contractAddress,
                                        functionName: 'getTokenImage',
                                        args: [BigInt(child.tokenId)],
                                    });
                                    
                                    return {
                                        tokenId: child.tokenId,
                                        imageUri: ethers.toUtf8String(nestedUri)
                                    };
                                })
                            );
                            
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

                            return [BigInt(tokenId), uri, BigInt(level), nestedTokens] as [string | bigint, string, bigint, NestedNFT[]];
                        }));

                        setUriArray(tokenUriForContributorAndLevel);
                    } else {
                        const result = await chain.collection.accountTokens({
                            address: currentAddress,
                            collectionId: 4794
                        });

                        const tokenIds = result.map(token => token.tokenId);
                        
                        const bundleTokens = await Promise.all(
                            tokenIds.map(async (tokenId) => {
                                const tokenInfo = await chain.token.get({
                                    collectionId: 4794,
                                    tokenId: tokenId,
                                    withChildren: true
                                });
                                
                                const isBundle = tokenInfo.children && tokenInfo.children.length > 0;
                                return isBundle ? tokenId : null;
                            })
                        );

                        const bundleTokenIds = bundleTokens.filter(tokenId => tokenId !== null);

                        const tokenUriForContributorAndLevel = await Promise.all(bundleTokenIds.map(async (tokenId) => {
                            const tokenInfo = await chain.token.get({
                                collectionId: 4794,
                                tokenId: tokenId,
                                withChildren: true
                            });

                            const nestedTokens = await Promise.all(
                                (tokenInfo.children || []).map(async (child) => {
                                    const nestedUri = await readContract(config, {
                                        abi: nftAbi,
                                        address: contractAddress,
                                        functionName: 'getTokenImage',
                                        args: [BigInt(child.tokenId)],
                                    });
                                    
                                    return {
                                        tokenId: child.tokenId,
                                        imageUri: ethers.toUtf8String(nestedUri)
                                    };
                                })
                            );
                            
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

                            return [BigInt(tokenId), uri, BigInt(level), nestedTokens] as [string | bigint, string, bigint, NestedNFT[]];
                        }));

                        setUriArray(tokenUriForContributorAndLevel);
                    }
                    
                } catch (error) {
                    console.error('Error reading from contract:', error);
                }
            }
        };

        fetchData();
    }, [getCurrentAddress]);

    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState<string | null>(null);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState<string | null>(null);

    // Thêm states cho EVM transaction
    const [isPending, setIsPending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); 
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [hash, setHash] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

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
                        Unnest NFT
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
                                    <Link href="/upgrade" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Upgrade
                                    </Link>
                                    <Link href="/nesting" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                    
                                    fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                        Nesting
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
                        <div className="mt-[9vh]">
                            <h1 className="text-primary font-pixel text-3xl">
                                Your bundle NFTs
                            </h1>
                            {uriArray.length === 0 ? (
                                <p className="text-primary font-pixel text-3xl">You haven't got any NFTs yet</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {uriArray.map((item, index) => (
                                        <div key={index} className="bg-secondary/20 rounded-lg p-4 border-2 border-primary">
                                            <div className="flex gap-4">
                                                {/* Bundle NFT */}
                                                <div className="w-1/2">
                                                    <img 
                                                        src={ethers.toUtf8String(item[1])} 
                                                        alt={`Bundle ${item[0]}`} 
                                                        className="w-full rounded-lg border-2 border-primary"
                                                    />
                                                    <div className="mt-2 text-center">
                                                        <p className="text-primary font-pixel font-bold">Bundle #{item[0].toString()}</p>
                                                        <p className="text-primary/80 font-pixel text-sm">Level {item[2].toString()}</p>
                                                    </div>
                                                </div>

                                                {/* Nested NFTs */}
                                                <div className="w-1/2">
                                                    <h3 className="text-primary font-pixel mb-2">Contains:</h3>
                                                    {item[3].length > 0 ? (
                                                        <div className="space-y-2">
                                                            {item[3].map((nestedNft, idx) => (
                                                                <div 
                                                                    key={idx} 
                                                                    className={`
                                                                        bg-primary/10 p-2 rounded flex items-center gap-2 cursor-pointer
                                                                        hover:bg-primary/20 transition-all duration-200
                                                                        ${TokenIdNested === nestedNft.tokenId.toString() ? 'ring-2 ring-primary' : ''}
                                                                    `}
                                                                    onClick={() => {
                                                                        setTokenIdNested(nestedNft.tokenId.toString());
                                                                        setTokenIdParent(item[0].toString());
                                                                    }}
                                                                >
                                                                    <img 
                                                                        src={nestedNft.imageUri}
                                                                        alt={`Nested NFT ${nestedNft.tokenId}`}
                                                                        className={`
                                                                            w-12 h-12 rounded-full object-cover border 
                                                                            ${TokenIdNested === nestedNft.tokenId.toString() ? 'border-2 border-primary' : 'border border-primary/50'}
                                                                            transition-all duration-200
                                                                        `}
                                                                    />
                                                                    <div>
                                                                        <p className="text-primary font-pixel text-sm">
                                                                            NFT #{nestedNft.tokenId}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-primary/60 font-pixel text-sm italic">
                                                            No nested NFTs
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                </div>
                <div className="
                max-phonescreen:w-full max-phonescreen:p-0
                
                right-column w-[35%] pl-4 overflow-y-auto">
                    <div className="add-profile-form">
                        <h2 className="text-primary font-bold font-pixel text-2xl mb-4">Unnest NFT</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!selectedAccount && (
                                <div className="flex flex-col">
                                    <label htmlFor="parentTokenId" className="block text-primary font-pixel mb-2">Parent NFT Token ID</label>
                                    <input
                                        type="text"
                                        id="parentTokenId"
                                        value={TokenIdParent}
                                        onChange={(e) => setTokenIdParent(e.target.value)}
                                        className="w-full px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <label htmlFor="nftValue" className="block text-primary font-pixel mb-2">Nested NFT Token ID</label>
                                <input
                                    type="text"
                                    id="nftValue"
                                    value={TokenIdNested}
                                    onChange={(e) => setTokenIdNested(e.target.value)}
                                    className="w-full px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    required
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
                                        Unnesting...
                                    </>
                                ) : (
                                    'Unnest'
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

export default UnnestPage;