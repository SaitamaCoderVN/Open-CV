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
import { useWaitForTransactionReceipt } from "wagmi";
import { AccountsContext } from "@/accounts/AccountsContext";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { ethers } from "ethers";

import { AnimatePresence, motion } from "framer-motion";
import { TransactionStatus } from "@/components/TransactionStatus";
const FileUploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} width="12" height="12" viewBox="0 0 24 24" fill="none" role="img" color="white"><path fillRule="evenodd" clipRule="evenodd" d="M13.25 1.26003C12.9109 1.25 12.5071 1.25 11.997 1.25H11.25C8.44974 1.25 7.04961 1.25 5.98005 1.79497C5.03924 2.27433 4.27433 3.03924 3.79497 3.98005C3.25 5.04961 3.25 6.44974 3.25 9.25V14.75C3.25 17.5503 3.25 18.9504 3.79497 20.02C4.27433 20.9608 5.03924 21.7257 5.98005 22.205C7.04961 22.75 8.44974 22.75 11.25 22.75H12.75C15.5503 22.75 16.9504 22.75 18.02 22.205C18.9608 21.7257 19.7257 20.9608 20.205 20.02C20.75 18.9504 20.75 17.5503 20.75 14.75V10.003C20.75 9.49288 20.75 9.08913 20.74 8.75001H17.2H17.1695H17.1695C16.6354 8.75002 16.1895 8.75003 15.8253 8.72027C15.4454 8.68924 15.0888 8.62212 14.7515 8.45028C14.2341 8.18663 13.8134 7.76593 13.5497 7.24849C13.3779 6.91122 13.3108 6.55457 13.2797 6.17468C13.25 5.81045 13.25 5.3646 13.25 4.83044V4.80001V1.26003ZM20.5164 7.25001C20.3941 6.86403 20.2252 6.4939 20.0132 6.14791C19.704 5.64333 19.2716 5.21096 18.4069 4.34621L18.4069 4.34619L17.6538 3.59315L17.6538 3.59314C16.789 2.72839 16.3567 2.29601 15.8521 1.9868C15.5061 1.77478 15.136 1.6059 14.75 1.48359V4.80001C14.75 5.37244 14.7506 5.75666 14.7748 6.05253C14.7982 6.33966 14.8401 6.47694 14.8862 6.5675C15.0061 6.8027 15.1973 6.99393 15.4325 7.11377C15.5231 7.15991 15.6604 7.2018 15.9475 7.22526C16.2434 7.24943 16.6276 7.25001 17.2 7.25001H20.5164ZM12.5303 10.4697C12.2374 10.1768 11.7626 10.1768 11.4697 10.4697L8.96967 12.9697C8.67678 13.2626 8.67678 13.7374 8.96967 14.0303C9.26256 14.3232 9.73744 14.3232 10.0303 14.0303L11.25 12.8107V17C11.25 17.4142 11.5858 17.75 12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V12.8107L13.9697 14.0303C14.2626 14.3232 14.7374 14.3232 15.0303 14.0303C15.3232 13.7374 15.3232 13.2626 15.0303 12.9697L12.5303 10.4697Z" fill="currentColor"></path></svg>
);
const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="injected-svg" data-src="https://cdn.hugeicons.com/icons/arrow-down-01-stroke-sharp.svg"  role="img" color="#000000">
    <path d="M5.99977 9.00005L11.9998 15L17.9998 9" stroke="#000000" strokeWidth="2" stroke-miterlimit="16"></path>
    </svg>
);
function ReplacePage() {
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localImageFile, setLocalImageFile] = useState(null);
    const [localImagePreview, setLocalImagePreview] = useState('');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uriArray, setUriArray] = useState<Array<[string | bigint, string]>>([]);
    const [nftValue, setNftValue] = useState('');

    const { toast } = useToast();
    const account = useAccount();
    const chainId = useChainId();
    let contractAddress: `0x${string}` | undefined;
    let blockexplorer: string | undefined;

    const [isLoading, setIsLoading] = useState(false);

    
    const { selectedAccount } = useContext(AccountsContext);
    const { chain, scan } = useChainAndScan();

    const [isOptionsVisible, setOptionsVisible] = useState(false); 
    const optionsRef = useRef<HTMLDivElement | null>(null); 
    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 }, 
        visible: { opacity: 1, y: 0 },   
    };

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
        case CHAINID.UNIQUE:
            contractAddress = CONTRACT_ADDRESS_UNIQUE;
            blockexplorer = BLOCK_EXPLORER_UNIQUE;
            break;
        case CHAINID.QUARTZ:
            contractAddress = CONTRACT_ADDRESS_QUARTZ;
            blockexplorer = BLOCK_EXPLORER_QUARTZ;
            break;
    }

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLocalImageFile(file);
        setLocalImagePreview(URL.createObjectURL(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {'image/*': []},
        multiple: false
    });


    const { data: hash, error, isPending, writeContract } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState<string | null>(null);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState<string | null>(null);

    const generateCombinedImage = async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                resolve(null);
                return;
            }
    
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(null);
                return;
            }
    
            const img = new Image();
            img.onload = () => {
                const aspectRatio = 0.718;
                const cardWidth = 400;
                const cardHeight = cardWidth / aspectRatio;
                canvas.width = cardWidth;
                canvas.height = cardHeight;
    
                // Create gradient background for the frame
                const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
                gradient.addColorStop(0, '#2a0845');
                gradient.addColorStop(1, '#6441A5');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, cardWidth, cardHeight);
    
                // Draw image with object-fit: cover
                const frameMargin = 20;
                const imageWidth = cardWidth - frameMargin * 2;
                const imageHeight = cardHeight - frameMargin * 3;
                const imageAspectRatio = img.width / img.height;
                let drawWidth, drawHeight, offsetX, offsetY;
    
                if (imageAspectRatio > imageWidth / imageHeight) {
                    drawHeight = imageHeight;
                    drawWidth = drawHeight * imageAspectRatio;
                    offsetX = frameMargin + (imageWidth - drawWidth) / 2;
                    offsetY = frameMargin * 2;
                } else {
                    drawWidth = imageWidth;
                    drawHeight = drawWidth / imageAspectRatio;
                    offsetX = frameMargin;
                    offsetY = frameMargin * 2 + (imageHeight - drawHeight) / 2;
                }
    
                ctx.save();
                ctx.beginPath();
                ctx.rect(frameMargin, frameMargin * 2, imageWidth, imageHeight);
                ctx.clip();
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                ctx.restore();
    
                // Outer frame
                ctx.strokeStyle = '#8A2BE2';
                ctx.lineWidth = 8;
                ctx.strokeRect(10, 10, cardWidth - 20, cardHeight - 20);
    
                // Inner frame
                ctx.strokeStyle = '#4B0082';
                ctx.lineWidth = 4;
                ctx.strokeRect(frameMargin, frameMargin, cardWidth - frameMargin * 2, cardHeight - frameMargin * 2);
    
                // Corner accents
                const cornerSize = 30;
                ctx.strokeStyle = '#9370DB';
                ctx.lineWidth = 2;
                // Top-left
                ctx.beginPath();
                ctx.moveTo(5, 35);
                ctx.lineTo(5, 5);
                ctx.lineTo(35, 5);
                ctx.stroke();
                // Top-right
                ctx.beginPath();
                ctx.moveTo(cardWidth - 35, 5);
                ctx.lineTo(cardWidth - 5, 5);
                ctx.lineTo(cardWidth - 5, 35);
                ctx.stroke();
                // Bottom-left
                ctx.beginPath();
                ctx.moveTo(5, cardHeight - 35);
                ctx.lineTo(5, cardHeight - 5);
                ctx.lineTo(35, cardHeight - 5);
                ctx.stroke();
                // Bottom-right
                ctx.beginPath();
                ctx.moveTo(cardWidth - 35, cardHeight - 5);
                ctx.lineTo(cardWidth - 5, cardHeight - 5);
                ctx.lineTo(cardWidth - 5, cardHeight - 35);
                ctx.stroke();
    
                // Draw name at the top
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, cardWidth, 40);
                ctx.fillStyle = '#ce8eeb';
                ctx.font = 'bold 24px "Courier New", monospace';
                ctx.textAlign = 'center';
                // ctx.fillText(nftName, cardWidth / 2, 28);
    
                // Draw title at the bottom
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, cardHeight - 40, cardWidth, 40);
                ctx.fillStyle = '#E6E6FA';
                ctx.font = '20px "Courier New", monospace';
                ctx.textAlign = 'center';
                // ctx.fillText(nftTitle, cardWidth / 2, cardHeight - 15);
    
                // Add some tech-inspired details
                ctx.strokeStyle = 'rgba(147, 112, 219, 0.5)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(frameMargin, 50 + i * 20);
                    ctx.lineTo(cardWidth - frameMargin, 50 + i * 20);
                    ctx.stroke();
                }
    
                // Circular element
                ctx.strokeStyle = '#9370DB';
                ctx.beginPath();
                ctx.arc(cardWidth - 40, 60, 15, 0, Math.PI * 2);
                ctx.stroke();
    
                // Data-like lines
                ctx.beginPath();
                ctx.moveTo(40, 60);
                ctx.lineTo(cardWidth - 70, 60);
                ctx.moveTo(40, 70);
                ctx.lineTo(cardWidth - 90, 70);
                ctx.moveTo(40, 80);
                ctx.lineTo(cardWidth - 80, 80);
                ctx.stroke();
    
                canvas.toBlob((blob) => {
                    resolve(blob);
                });
            };
            img.src = localImagePreview;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let cloudinaryUrl = '';
            if (localImageFile) {
                const combinedImageBlob = await generateCombinedImage();
                if (combinedImageBlob) {
                    const formData = new FormData();
                    formData.append('file', combinedImageBlob, 'combined_image.png');

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }

                    const data = await response.json();
                    cloudinaryUrl = data.url;

                    if (selectedAccount) {
                        await replaceWithPolkadot(cloudinaryUrl);
                    } else if (isConnected) {
                        await replaceWithEVM(cloudinaryUrl);
                    }

                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);

                    toast({
                        title: "Success",
                        description: "NFT has been replaced successfully!",

                    });
                }
            }

        } catch (error) {
            console.error("Replace error:", error);
            toast({
                variant: "destructive",
                title: "NFT Replace Error",
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const replaceWithEVM = async (cloudinaryUrl: string) => {
        if (!wagmiAddress) throw new Error("EVM address not found");

        const codeContribute = await readContract(config, {
            address: contractAddress,
            abi: nftAbi,
            functionName: "getTokenCodeContribute",
            args: [
                BigInt(nftValue),
            ],
            account: account.address,
        });

        await writeContract({
            address: contractAddress,
            abi: nftAbi,
            functionName: "setImageForLevelZero",
            args: [
                BigInt(nftValue),
                codeContribute,
                cloudinaryUrl
            ],
            chain: config[chainId],
            account: account.address,
        });
    };

    const replaceWithPolkadot = async (cloudinaryUrl: string) => {
        if (!selectedAccount) throw new Error("Polkadot address not found");
        setIsPolkadotPending(true);
        try {
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
                    functionName: "setImageForLevelZero",
                    functionArgs: [
                        BigInt(nftValue),
                        codeContribute,
                        cloudinaryUrl
                    ],
                    gasLimit: BigInt(3_000_000)
                },
                { signerAddress: selectedAccount.address },
                { signer: selectedAccount.signer }
            );

            if (!result.result.isSuccessful) {
                throw new Error("Replace transaction failed");
            }

            setPolkadotTransactionStatus("Transaction successful!");
            setPolkadotTransactionHash(result.extrinsicOutput.hash);
        } catch (error) {
            console.error("Error during replace:", error);
            setPolkadotTransactionStatus("Transaction failed: " + (error as Error).message);
            throw new Error("Cannot replace NFT: " + (error as Error).message);
        } finally {
            setIsPolkadotPending(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (address) {
                try {
                    if (!address.toLowerCase().startsWith("0x")) {

                        const result = await chain.collection.accountTokens(
                            {
                                address: address,
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
                            return [BigInt(tokenId), uri] as [string | bigint, string];
                        }));
    
                        setUriArray(tokenUriForContributorAndLevel);
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
                            return [tokenId, uri] as [string | bigint, string];
                        }));
    
                        setUriArray(tokenUriForContributorAndLevel);
                    }
                } catch (error) {
                    console.error('Error reading from contract:', error);
                }
            }
        };

        fetchData();
    }, [address]);
    const { address: wagmiAddress, isConnected } = useAccount();

    useEffect(() => {
    }, [selectedAccount]);

    // Thêm state để theo dõi NFT được chọn
    const [selectedNftId, setSelectedNftId] = useState<string>('');

    // Thêm hàm xử lý khi chọn NFT
    const handleSelectNft = (tokenId: string) => {
        setSelectedNftId(tokenId);
        setNftValue(tokenId);
    };

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
                        Replace NFT
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
                        <p className="text-primary font-pixel text-3xl">You haven't got any NFTs yet</p>
                    ) : (
                        <ul className="grid grid-cols-3 gap-4">
                            {uriArray.map((item, index) => (
                                <li key={index} className="text-center relative group">
                                    <div className="relative">
                                        <img 
                                            src={ethers.toUtf8String(item[1])} 
                                            alt={`Image ${index}`} 
                                            className={`max-w-[80%] h-auto mx-auto transition-all duration-300 ${
                                                selectedNftId === item[0].toString() ? 'ring-4 ring-primary' : ''
                                            }`}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleSelectNft(item[0].toString())}
                                                className={`px-4 py-2 bg-primary text-white rounded-md font-pixel text-sm hover:bg-secondary transition-colors ${
                                                    selectedNftId === item[0].toString() ? 'bg-secondary' : ''
                                                }`}
                                            >
                                                {selectedNftId === item[0].toString() ? 'Selected' : 'Select for Replace'}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-primary font-pixel mt-2">Token ID: {item[0].toString()}</p>
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
                        <h2 className="text-primary font-bold font-pixel text-2xl mb-4">Replace Certificate NFT</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex flex-col">
                                <div className="relative w-full pt-[24px]">
                                    <div className="absolute z-0 top-0 left-0 flex items-center gap-[4px] pt-[4px] pb-[32px] px-[8px] rounded-tl-[12px] rounded-tr-[12px] bg-primary">
                                        <FileUploadIcon className="w-[12px] h-[12px]"/>
                                        <span className="max-phonescreen:text-[2.5vw] max-phonescreen:leading-[2.5vw] text-white font-pixel text-[1vw] leading-[1vw]">
                                            Upload Image
                                        </span>
                                    </div>
                                    <div className="upload__frame rounded-md flex relative overflow-visible before:rounded-md before:z-0 before:absolute before:bg-gradient-to-br max-phonescreen:before:p-0 before:p-8 before:inset-0 before:from-primary before:from-0% before:via-primary before:via-26% before:to-[#ffffff21] before:to-40%">
                                        <div {...getRootProps()} className="z-[1] w-full p-4 text-center font-pixel font-semibold text-primary cursor-pointer relative min-h-[10vw] flex flex-col items-center justify-center">
                                            <input {...getInputProps()} disabled={isSubmitting} />
                                            {isDragActive ? (
                                                <p>Drop the image here ...</p>
                                            ) : (
                                                <p className="text-sm">Drag and drop an image here, or click to select a file</p>
                                            )}
                                            {localImagePreview && (
                                                <div className="mt-2">
                                                    <img src={localImagePreview} alt="Preview" className="max-w-[150px] h-auto" />
                                                    <p className="mt-1 text-xs">Click or drag a new image to replace</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute left-[1px] top-[1px] right-[1px] bottom-[1px] rounded-md overflow-hidden p-[20px] border-image min-w-0 flex flex-col gap-300 bg-background outline-dashed outline-[1.5px] outline-background"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col">
                                <label htmlFor="nftValue" className="block text-primary font-pixel mb-2 text-sm">NFT of your choice</label>
                                <input
                                    type="text"
                                    id="nftValue"
                                    value={nftValue}
                                    onChange={(e) => setNftValue(e.target.value)}
                                    className="w-full px-3 py-1.5 bg-black text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="bg-primary text-white font-pixel py-1.5 px-3 rounded-md hover:bg-secondary transition-colors flex items-center justify-center w-full text-sm"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Replace...
                                    </>
                                ) : (
                                    'Replace'
                                )}
                            </button>
                            
                            <div className="
                            max-phonescreen:max-w-[400px]   
                            mt-8 bg-secondary p-6 rounded-lg max-w-2xl mx-auto">
                                {/* Transaction Status Section */}
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
                        </form>
                    </div>
                </div>
            </div>
            <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
}

export default ReplacePage;