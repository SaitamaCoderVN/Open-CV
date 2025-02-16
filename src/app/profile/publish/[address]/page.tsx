"use client"

import { useParams } from 'next/navigation';
import { useEffect, useState, useContext } from 'react';
import { nftAbi } from "@/components/contract/abi";
import { CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";
import { readContract } from '@wagmi/core/actions';
import { config } from '@/components/contract/config';
import Spacer from '@/components/ui/Spacer';
import CardGrid from '@/components/card-grid/CardGrid';
import Card from '@/components/Card';
import { useAppSelector } from '@/hooks/useRedux';
import { useChainAndScan } from '@/hooks/useChainAndScan';
import { ethers } from 'ethers';
import { UniqueChain } from '@unique-nft/sdk';

// Add interface to define data type
interface TokenData {
    imageUri: string;
    level: number;
    codeContribute: string;
}

export default function PublishProfilePage() {
    const { address } = useParams();
    const addressString = Array.isArray(address) ? address[0] : address;
    const [tokenDataArray, setTokenDataArray] = useState<TokenData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isError, setIsError] = useState<boolean>(false);
    const { cards } = useAppSelector((state) => state.card);
    const sdk = UniqueChain({
        baseUrl: "https://rest.unique.network/v2/opal", 
    });
    const [hiddenCards, setHiddenCards] = useState<Set<number>>(new Set());
    const [delayedVisibleCards, setDelayedVisibleCards] = useState<Set<number>>(new Set());

    const fetchTotalOwnerNFT = async () => {
        if (addressString) {
            try {
                setIsLoading(true);
                
                if (!addressString.toLowerCase().startsWith("0x")) {
                    // Logic for Polkadot address
                    const result = await sdk.collection.accountTokens({
                        address: addressString,
                        collectionId: 4794
                    });

                    if (!result || !Array.isArray(result)) {
                        setTokenDataArray([]);
                        return;
                    }

                    const tokenIds = result.map(token => token.tokenId);
                    
                    const tokenData = await Promise.all(tokenIds.map(async (tokenId) => {
                        const imageUri = await readContract(config, {
                            abi: nftAbi,
                            address: CONTRACT_ADDRESS_OPAL,
                            functionName: 'getTokenImage',
                            args: [BigInt(tokenId)],
                        });
                        
                        const level = await readContract(config, {
                            abi: nftAbi,
                            address: CONTRACT_ADDRESS_OPAL,
                            functionName: 'getTokenLevel',
                            args: [BigInt(tokenId)],
                        });

                        const codeContribute = await readContract(config, {
                            abi: nftAbi,
                            address: CONTRACT_ADDRESS_OPAL,
                            functionName: 'getTokenCodeContribute',
                            args: [BigInt(tokenId)],
                        });
                        
                        let codeContributeString = '';
                        try {
                            codeContributeString = ethers.toUtf8String(codeContribute as `0x${string}`);
                        } catch (error) {
                            console.warn("Unable to convert codeContribute to UTF-8:", error);
                            codeContributeString = String(codeContribute);
                        }

                        return {
                            imageUri: ethers.toUtf8String(imageUri),
                            level: Number(level),
                            codeContribute: codeContributeString
                        };
                    }));

                    setTokenDataArray(tokenData as TokenData[]);
                } else {
                    // Logic for EVM address
                    const result = await readContract(config, {
                        abi: nftAbi,
                        address: CONTRACT_ADDRESS_OPAL,
                        functionName: 'getTokenIdsByOwner',
                        args: [addressString as `0x${string}`],
                    });

                    const tokenData = await Promise.all(result.map(async (tokenId) => {
                        const imageUri = await readContract(config, {
                            abi: nftAbi,
                            address: CONTRACT_ADDRESS_OPAL,
                            functionName: 'getTokenImage',
                            args: [tokenId],
                        });

                        const uriString = ethers.toUtf8String(imageUri as `0x${string}`);
                        
                        const level = await readContract(config, {
                            abi: nftAbi,
                            address: CONTRACT_ADDRESS_OPAL,
                            functionName: 'getTokenLevel',
                            args: [tokenId],
                        });

                        const codeContribute = await readContract(config, {
                            abi: nftAbi,
                            address: CONTRACT_ADDRESS_OPAL,
                            functionName: 'getTokenCodeContribute',
                            args: [tokenId],
                        });

                        let codeContributeString = '';
                        try {
                            codeContributeString = ethers.toUtf8String(codeContribute as `0x${string}`);
                        } catch (error) {
                            console.warn("Unable to convert codeContribute to UTF-8:", error);
                            codeContributeString = String(codeContribute);
                        }

                        return {
                            imageUri: uriString,
                            level: Number(level),
                            codeContribute: codeContributeString
                        };
                    }));
                    
                    setTokenDataArray(tokenData);
                }
            } catch (error) {
                console.error("Error fetching NFTs:", error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchTotalOwnerNFT();
    }, [address]);

    const toggleCardInfo = (index: number) => {
        setHiddenCards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                setTimeout(() => {
                    setDelayedVisibleCards(prev => {
                        const newDelayedSet = new Set(prev);
                        newDelayedSet.delete(index);
                        return newDelayedSet;
                    });
                }, 2000);
                newSet.delete(index);
            } else {
                newSet.add(index);
                setDelayedVisibleCards(prev => {
                    const newDelayedSet = new Set(prev);
                    newDelayedSet.add(index);
                    return newDelayedSet;
                });
            }
            return newSet;
        });
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error loading data</div>;
    }

    return (
        <>
            <div className='background-container min-h-[100vh] border-2 border-solid border-primary rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment'>
                <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />
                <div className='flex justify-between items-center px-[3vw]'>
                    <div className='flex items-center'>
                        <div className='text-primary font-bold font-pixel uppercase text-[3.5vw] leading-[5.5vw] whitespace-nowrap'>
                            Profile of {address.slice(0, 3)}...{address.slice(-3)}
                        </div>
                    </div>
                </div>
                <CardGrid>
                    {tokenDataArray.map((tokenData, index) => (
                        <div 
                            key={index} 
                            className="relative transform-gpu transition-all duration-300 hover:scale-105 hover:z-10"
                            onClick={() => toggleCardInfo(index)}
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
                                        <div>Level: {tokenData.level}</div>
                                        <div>Code Contribution: {tokenData.codeContribute}</div>
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