'use client';
import Card from '../../components/Card';
import CardGrid from '@/components/card-grid/CardGrid';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import "./profilePage.css"
import Spacer from '@/components/ui/Spacer';
import { CustomConnectButton } from '@/components/ui/ConnectButton';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { useAccount, useChainId } from 'wagmi';
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from '@/components/contract/contracts';
import { nftAbi } from '@/components/contract/abi';
import { readContract } from '@wagmi/core/actions';
import { config } from '@/components/contract/config';
import { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AccountsContext } from '@/accounts/AccountsContext';
import { useChainAndScan } from '@/hooks/useChainAndScan';
import { ethers } from 'ethers';
import { ArrowDownIcon } from 'lucide-react';

interface TokenData {
    tokenId: number;
    imageUri: string;
    level: number;
    codeContribute: string;
}

export default function ProfilelPage() {
    const dispatch = useAppDispatch();
    const { cards, activeCardId } = useAppSelector((state) => state.card);
    const { address: wagmiAddress, isConnected } = useAccount();
    const { selectedAccount } = useContext(AccountsContext);
    const { chain, scan } = useChainAndScan();

    const getCurrentAddress = useCallback(() => {
        if (selectedAccount) {
            return selectedAccount.normalizedAddress;
        }
        if (isConnected && wagmiAddress) {
            return wagmiAddress;
        }
        return null;
    }, [selectedAccount, isConnected, wagmiAddress]);

    const { toast } = useToast();
    const chainId = useChainId();
    let contractAddress: `0x${string}` | undefined;
    let blockexplorer: string | undefined;

    const [isOptionsVisible, setOptionsVisible] = useState(false); 
    const optionsRef = useRef<HTMLDivElement | null>(null); 
    const [uriArray, setUriArray] = useState<TokenData[]>([]);
    const [hiddenCards, setHiddenCards] = useState<Set<number>>(new Set());
    const [delayedVisibleCards, setDelayedVisibleCards] = useState<Set<number>>(new Set());

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 }, 
        visible: { opacity: 1, y: 0 },   
    };

    const toggleOptions = () => {
        setOptionsVisible(!isOptionsVisible); 
    };

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

    const fetchTotalOwnerShitNFT = async () => {
        const currentAddress = getCurrentAddress();
        if (currentAddress) {
            try {
                if (selectedAccount) {
                    // Logic cho ví Polkadot
                    const result = await chain.collection.accountTokens({
                        address: currentAddress,
                        collectionId: 4794
                    });

                    const tokenIds = result.map(token => token.tokenId);
                    
                    const tokenData = await Promise.all(tokenIds.map(async (tokenId) => {
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

                        const codeContribute = await readContract(config, {
                            abi: nftAbi,
                            address: contractAddress,
                            functionName: 'getTokenCodeContribute',
                            args: [BigInt(tokenId)],
                        });

                        let codeContributeString = '';
                        try {
                            codeContributeString = ethers.toUtf8String(codeContribute as `0x${string}`);
                        } catch (error) {
                            console.warn(" Cannot convert codeContribute to UTF-8:", error);
                            codeContributeString = String(codeContribute);
                        }

                        return {
                            tokenId: tokenId,
                            imageUri: ethers.toUtf8String(uri),
                            level: Number(level),
                            codeContribute: codeContributeString
                        };
                    }));

                    setUriArray(tokenData);
                } else {
                    // Logic cho ví EVM
                    const result = await readContract(config, {
                        abi: nftAbi,
                        address: contractAddress,
                        functionName: 'getTokenIdsByOwner',
                        args: [currentAddress as `0x${string}`],
                    });
                    const tokenData = await Promise.all(result.map(async (tokenId) => {
                        const uri = await readContract(config, {
                            abi: nftAbi,
                            address: contractAddress,
                            functionName: 'getTokenImage',
                            args: [tokenId],
                        });
                        const uriString = ethers.toUtf8String(uri as `0x${string}`);
                        const level = await readContract(config, {
                            abi: nftAbi,
                            address: contractAddress,
                            functionName: 'getTokenLevel',
                            args: [tokenId],
                        });

                        const codeContribute = await readContract(config, {
                            abi: nftAbi,
                            address: contractAddress,
                            functionName: 'getTokenCodeContribute',
                            args: [tokenId],
                        });

                        let codeContributeString = '';
                        try {
                            codeContributeString = ethers.toUtf8String(codeContribute as `0x${string}`);
                        } catch (error) {
                            console.warn(" Cannot convert codeContribute to UTF-8:", error);
                            codeContributeString = String(codeContribute);
                        }

                        return {
                            tokenId: Number(tokenId),
                            imageUri: uriString,
                            level: Number(level),
                            codeContribute: codeContributeString
                        };
                    }));
                    
                    setUriArray(tokenData);
                }
            } catch (error) {
                console.error("Error fetching NFTs:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch NFTs",
                });
            }
        }
    };

    useEffect(() => {
        fetchTotalOwnerShitNFT();
    }, [getCurrentAddress(), contractAddress]);

    const handlePublishProfile = () => {
        const currentAddress = getCurrentAddress();
        if (currentAddress) {
            const profileUrl = `/profile/publish/${currentAddress}`;
            window.open(profileUrl, '_blank');
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please connect your wallet to publish your profile",
            });
        }
    };

    return (
        <>
            {/* <div className='v11e5678D'></div> */}
            <div className='background-container min-h-[100vh] border-2 border-solid border-primary rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment'>
                <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />
                <div className='
                max-phonescreen:flex-col max-phonescreen:items-start max-phonescreen:gap-2
                flex justify-between items-center px-[3vw]'>
                    <div className='flex items-center'>
                        <Link href="/" className='
                        max-phonescreen:text-[5vw] max-phonescreen:leading-[5vw]
                        text-primary mr-4 text-xl font-silkscreen'>
                            Home /
                        </Link>
                        <div className='
                        max-phonescreen:text-[8.5vw] max-phonescreen:leading-[8.5vw]
                        text-primary font-bold font-pixel uppercase text-[5.5vw] leading-[5.5vw] whitespace-nowrap'>
                            Profile 
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
                                        <Link href="/profile/add_id_discord" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                        fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Add ID Discord
                                        </Link>
                                        <Link
                                            href="#"
                                            onClick={handlePublishProfile}
                                            className='
                                            max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                            fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'
                                        >
                                            <span className='text-black'>Publish Profile</span>
                                        </Link>
                                        <Link href="/profile/donate" className='
                                        max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                                        fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Donate
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

                    <CardGrid>
                        {uriArray.map((tokenData, index) => (
                            <div 
                                key={index} 
                                className="relative transform-gpu transition-all duration-300 hover:scale-105 hover:z-10"
                                onClick={() => {
                                    setHiddenCards(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(index)) {
                                            newSet.delete(index);
                                        } else {
                                            newSet.add(index);
                                        }
                                        return newSet;
                                    });
                                }}
                                onMouseEnter={() => {
                                    setHiddenCards(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add(index);
                                        return newSet;
                                    });
                                    setDelayedVisibleCards(prev => {
                                        const newDelayedSet = new Set(prev);
                                        newDelayedSet.add(index);
                                        return newDelayedSet;
                                    });
                                }}
                                onMouseLeave={() => {
                                    setTimeout(() => {
                                        setHiddenCards(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(index);
                                            return newSet;
                                        });
                                        setDelayedVisibleCards(prev => {
                                            const newDelayedSet = new Set(prev);
                                            newDelayedSet.delete(index);
                                            return newDelayedSet;
                                        });
                                    }, 2000);
                                }}
                            >
                                <div className="transform-none w-full h-full">
                                    <div className="relative w-full h-full">
                                        <Card 
                                            id={`swsh12pt5-${index + 160}`} 
                                            name={cards[1].name} 
                                            number={cards[1].number} 
                                            img={tokenData.imageUri}
                                            set={cards[1].set} 
                                            types={cards[1].types} 
                                            subtypes={cards[1].subtypes} 
                                            supertype={cards[1].supertype} 
                                            rarity={cards[1].rarity} 
                                        />
                                        <div className={`absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center transition-opacity duration-300 hover:bg-black/70 ${hiddenCards.has(index) || delayedVisibleCards.has(index) ? 'hidden' : ''}`}>
                                            <div className="text-primary font-pixel">Token ID: {tokenData.tokenId}</div>
                                            <div className="text-primary font-pixel">Level: {tokenData.level}</div>
                                            <div className="text-primary font-pixel">Code Contribution: {tokenData.codeContribute}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardGrid>
            </div>
        
        </>
    );
}
