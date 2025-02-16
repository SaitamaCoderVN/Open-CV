"use client"

import { CustomConnectButton } from "@/components/ui/ConnectButton";
import Spacer from "@/components/ui/Spacer";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { useDropzone } from 'react-dropzone';
import { FaSpinner } from 'react-icons/fa';
import "./style.css"
import { readContract } from "@wagmi/core/actions";
import { config } from "@/components/contract/config";
import { nftAbi } from "@/components/contract/abi";
import { useToast } from "@/components/ui/use-toast";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";

import { AnimatePresence, motion } from "framer-motion";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { ethers } from "ethers";
import { AccountsContext } from '@/accounts/AccountsContext';
import { Address } from "@unique-nft/utils";
import { useWaitForTransactionReceipt, useSendTransaction } from "wagmi";
import { SdkContext } from "@/sdk/SdkContext";
import { UniqueNFTFactory } from "@unique-nft/solidity-interfaces";
import { TransactionStatus } from "@/components/TransactionStatus";
import { ArrowDownIcon } from "lucide-react";

function NestingPage() {
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
    const [localImagePreview, setLocalImagePreview] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uriArray, setUriArray] = useState<Array<[string | bigint, string, bigint]>>([]);
    const [TokenIdParent, setTokenIdParent] = useState('');
    const [TokenIdNested, setTokenIdNested] = useState('');

    const [isOptionsVisible, setOptionsVisible] = useState(false); 
    const optionsRef = useRef<HTMLDivElement | null>(null); 
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 }, 
        visible: { opacity: 1, y: 0 },   
    };

    const { sdk } = useContext(SdkContext);

    const { chain, scan } = useChainAndScan();

    const [isLoading, setIsLoading] = useState(false);

    const { 
        data: hashTransaction, 
        isPending: isPendingTransaction, 
        sendTransaction 
      } = useSendTransaction()

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
                await nestingWithPolkadot();
            } else if (isConnected) {
                await nestingWithEVM();
            }

            setTimeout(() => {
                window.location.reload();
            }, 2000);

            toast({
                title: "Success",
                description: "NFT has been minted successfully!",
            });
        
        } catch (error) {
            console.error("Nesting error:", error);
            toast({
                variant: "destructive",
                title: "NFT Nesting Error",
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const nestingWithPolkadot = async () => {
        if (!selectedAccount) throw new Error("Polkadot account not found");

        try {
            setIsPolkadotPending(true);
            
            // Check token IDs
            if (!TokenIdParent || !TokenIdNested) {
                throw new Error("Invalid Token ID");
            }

            // Check if tokens exist
            const parentExists = await chain.token.get({
                collectionId: 4794,
                tokenId: Number(TokenIdParent)
            });
            
            const nestedExists = await chain.token.get({
                collectionId: 4794,
                tokenId: Number(TokenIdNested)
            });

            if (!parentExists || !nestedExists) {
                throw new Error("One or both tokens do not exist");
            }

            // Check ownership
            const tokenInfo = await chain.token.get({
                collectionId: 4794,
                tokenId: Number(TokenIdParent)
            });

            if (tokenInfo.owner !== selectedAccount.normalizedAddress) {
                throw new Error("You don't own the parent token");
            }

            // Perform nesting
            const result = await chain.token.nest(
                {
                    parent: { 
                        collectionId: 4794, 
                        tokenId: Number(TokenIdParent) 
                    },
                    nested: { 
                        collectionId: 4794, 
                        tokenId: Number(TokenIdNested) 
                    },
                },
                { 
                    signerAddress: selectedAccount.address 
                },
                { 
                    signer: selectedAccount.signer 
                }
            );

            if (!result || !result.extrinsicOutput) {
                throw new Error("Nesting transaction failed");
            }

            setPolkadotTransactionStatus("Transaction successful!");
            setPolkadotTransactionHash(result.extrinsicOutput.hash);

        } catch (error) {
            console.error("Error during nesting:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            setPolkadotTransactionStatus("Transaction failed: " + errorMessage);
            throw new Error("Cannot nest NFT: " + errorMessage);
        } finally {
            setIsPolkadotPending(false);
        }
    };

    const nestingWithEVM = async () => {
        try {
            if (!wagmiAddress) throw new Error("Please connect EVM wallet");
            if (!TokenIdParent || !TokenIdNested) throw new Error("Please enter Token ID");

            setIsLoading(true);

            const collectionAddress = Address.collection.idToAddress(4794);
            const tokenAddress = Address.nesting.idsToAddress(4794, Number(TokenIdParent));

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const collectionContract = await UniqueNFTFactory(
                collectionAddress,
                signer
            );

            const ownerOfNested = await collectionContract.ownerOf(Number(TokenIdNested));
            const ownerOfParent = await collectionContract.ownerOf(Number(TokenIdParent));
            
            if (ownerOfNested.toLowerCase() !== wagmiAddress.toLowerCase()) {
                throw new Error("You don't own the nested token");
            }
            
            if (ownerOfParent.toLowerCase() !== wagmiAddress.toLowerCase()) {
                throw new Error("You don't own the parent token");
            }
            const approveResult = await collectionContract.approve(
                tokenAddress,
                Number(TokenIdNested)
            );
            await approveResult.wait();

            const result = await collectionContract.transfer(
                tokenAddress, 
                Number(TokenIdNested)
            );

            await result.wait();

            toast({
                title: "Success",
                description: "NFT has been nested successfully!",
                duration: 5000,
            });

        } catch (error) {
            console.error("Nesting error:", error);
            toast({
                variant: "destructive",
                title: "Nesting Error", 
                description: error instanceof Error ? error.message : "Cannot perform NFT nesting",
                duration: 5000,
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const currentAddress = getCurrentAddress();
            if (currentAddress) {
                try {
                    if (selectedAccount) {

                        const result = await chain.collection.accountTokens(
                            {
                                address: currentAddress,
                                collectionId: 4794
                            }
                        );

                        const tokenIds = result.map(token => token.tokenId)

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
    
                        setUriArray(tokenUriForContributorAndLevel);
                    } else {
                        const result = await chain.collection.accountTokens(
                            {
                                address: currentAddress,
                                collectionId: 4794
                            }
                        );

                        const tokenIds = result.map(token => token.tokenId)

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
                        Nesting NFT
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
                        <div className="mt-[9vh]">
                            <h1 className="text-primary font-pixel text-3xl">
                                Your NFTs
                            </h1>
                            {uriArray.length === 0 ? (
                                <p className="text-primary font-pixel text-3xl">You don't have any NFTs yet</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {uriArray.map((item, index) => (
                                        <div key={index} className="bg-secondary/20 rounded-lg p-4 border-2 border-primary">
                                            <div className="flex flex-col">
                                                {/* NFT Image */}
                                                <img 
                                                    src={ethers.toUtf8String(item[1])} 
                                                    alt={`NFT ${item[0]}`} 
                                                    className="w-full rounded-lg border-2 border-primary"
                                                />
                                                <div className="mt-2 text-center">
                                                    <p className="text-primary font-pixel font-bold">NFT #{item[0].toString()}</p>
                                                    <p className="text-primary/80 font-pixel text-sm">Level {item[2].toString()}</p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    <button 
                                                        onClick={() => setTokenIdParent(item[0].toString())}
                                                        className="flex-1 bg-primary text-white font-pixel py-2 px-4 rounded-md 
                                                                 hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <span>Select as Parent NFT</span>
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    <button 
                                                        onClick={() => setTokenIdNested(item[0].toString())}
                                                        className="flex-1 bg-primary text-white font-pixel py-2 px-4 rounded-md 
                                                                 hover:bg-secondary transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <span>Select as Child NFT</span>
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
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
                        <h2 className="text-primary font-bold font-pixel text-2xl mb-4">Nesting NFT</h2>
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
                                <label htmlFor="nftValue" className="block text-primary font-pixel mb-2">Token ID of Parent NFT</label>
                                <input
                                    type="text"
                                    id="nftValue"
                                    value={TokenIdParent}
                                    onChange={(e) => setTokenIdParent(e.target.value)}
                                    className="w-full px-4 py-2 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="nftLevel" className="block text-primary font-pixel mb-2">Token ID of Nested NFT</label>
                                <input
                                    type="number"
                                    id="nftLevel"
                                    value={TokenIdNested}
                                    onChange={(e) => setTokenIdNested(e.target.value)}
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
                                        Nesting...
                                    </>
                                ) : (
                                    'Nesting'
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

export default NestingPage;