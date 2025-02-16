"use client"

import Spacer from "@/components/ui/Spacer";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { CustomConnectButton } from "@/components/ui/ConnectButton";
import { TransactionStatus } from "@/components/TransactionStatus";

import { nftAbi } from "@/components/contract/abi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";
import { useCallback, useRef, useState, useEffect, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaSpinner } from 'react-icons/fa';
import {
    useWaitForTransactionReceipt,
    useWriteContract,
    useChainId,
    useAccount
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/components/contract/config";
import { readContract } from "@wagmi/core/actions";
import { AccountsContext } from "@/accounts/AccountsContext";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { ethers } from "ethers";
import { Address } from "@unique-nft/utils";


const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="injected-svg" data-src="https://cdn.hugeicons.com/icons/arrow-down-01-stroke-sharp.svg"  role="img" color="#000000">
    <path d="M5.99977 9.00005L11.9998 15L17.9998 9" stroke="#000000" strokeWidth="2" stroke-miterlimit="16"></path>
    </svg>
);
const FileUploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} width="12" height="12" viewBox="0 0 24 24" fill="none" role="img" color="white">
        <path fillRule="evenodd" clipRule="evenodd" d="M13.25 1.26003C12.9109 1.25 12.5071 1.25 11.997 1.25H11.25C8.44974 1.25 7.04961 1.25 5.98005 1.79497C5.03924 2.27433 4.27433 3.03924 3.79497 3.98005C3.25 5.04961 3.25 6.44974 3.25 9.25V14.75C3.25 17.5503 3.25 18.9504 3.79497 20.02C4.27433 20.9608 5.03924 21.7257 5.98005 22.205C7.04961 22.75 8.44974 22.75 11.25 22.75H12.75C15.5503 22.75 16.9504 22.75 18.02 22.205C18.9608 21.7257 19.7257 20.9608 20.205 20.02C20.75 18.9504 20.75 17.5503 20.75 14.75V10.003C20.75 9.49288 20.75 9.08913 20.74 8.75001H17.2H17.1695H17.1695C16.6354 8.75002 16.1895 8.75003 15.8253 8.72027C15.4454 8.68924 15.0888 8.62212 14.7515 8.45028C14.2341 8.18663 13.8134 7.76593 13.5497 7.24849C13.3779 6.91122 13.3108 6.55457 13.2797 6.17468C13.25 5.81045 13.25 5.3646 13.25 4.83044V4.80001V1.26003ZM20.5164 7.25001C20.3941 6.86403 20.2252 6.4939 20.0132 6.14791C19.704 5.64333 19.2716 5.21096 18.4069 4.34621L18.4069 4.34619L17.6538 3.59315L17.6538 3.59314C16.789 2.72839 16.3567 2.29601 15.8521 1.9868C15.5061 1.77478 15.136 1.6059 14.75 1.48359V4.80001C14.75 5.37244 14.7506 5.75666 14.7748 6.05253C14.7982 6.33966 14.8401 6.47694 14.8862 6.5675C15.0061 6.8027 15.1973 6.99393 15.4325 7.11377C15.5231 7.15991 15.6604 7.2018 15.9475 7.22526C16.2434 7.24943 16.6276 7.25001 17.2 7.25001H20.5164ZM12.5303 10.4697C12.2374 10.1768 11.7626 10.1768 11.4697 10.4697L8.96967 12.9697C8.67678 13.2626 8.67678 13.7374 8.96967 14.0303C9.26256 14.3232 9.73744 14.3232 10.0303 14.0303L11.25 12.8107V17C11.25 17.4142 11.5858 17.75 12 17.75C12.4142 17.75 12.75 17.4142 12.75 17V12.8107L13.9697 14.0303C14.2626 14.3232 14.7374 14.3232 15.0303 14.0303C15.3232 13.7374 15.3232 13.2626 15.0303 12.9697L12.5303 10.4697Z" fill="currentColor"></path>
    </svg>
);
function ApplyAll() {
    const [userIds, setUserIds] = useState<string[]>([]); // State to store user IDs
    const { selectedAccount } = useContext(AccountsContext); // Sử dụng useContext để lấy thông tin tài khoản
    const { chain, scan } = useChainAndScan();
    const [isLoading, setIsLoading] = useState(false);
    const [link, setLink] = useState('');
    const [isLoadingIds, setIsLoadingIds] = useState(false);
    const fetchUserIdsFromLink = async (link: string) => {
        const match = link.match(/(\d+)/); // Extract ID from the link
        if (match) {
            const id = match[0]; // Get the matched ID
            setIsLoadingIds(true); // Set loading state to true
            try {
                const response = await fetch(`/api/leaderboard?serverId=${id}`); // Fetch using the extracted ID
                if (response.ok) {
                    const data = await response.json();
                    const ids = data.players.map((player: { id: string }) => player.id); // Extract IDs
                    setUserIds(ids); 
                } else {
                    console.error('Failed to fetch user IDs');
                }
            } catch (error) {
                console.error('Error fetching user IDs:', error);
            } finally {
                setIsLoadingIds(false); // Reset loading state
            }
        } else {
            console.error('No valid ID found in the link');
        }
    };
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

    // handle form section
    const [uri, setUri] = useState('');
    const [toAddresses, setToAddresses] = useState<string[]>([]);
    const [level, setLevel] = useState('');
    const [codeContribute, setCodeContribute] = useState('');
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [localImagePreview, setLocalImagePreview] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false); // New state for upload success

    const { toast } = useToast();
    const chainId = useChainId();
    const account = useAccount();
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLocalImageFile(file);
        setLocalImagePreview(URL.createObjectURL(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (uploadSuccess) return; // Prevent file upload if uploadSuccess is true
            const file = acceptedFiles[0];
            if (!file) return;
    
            setLocalImageFile(file);
            setLocalImagePreview(URL.createObjectURL(file));
        },
        accept: {'image/*': []},
        multiple: false,
        disabled: uploadSuccess,
    });

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
                ctx.fillText("", cardWidth / 2, 28);

                // Draw title at the bottom
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, cardHeight - 40, cardWidth, 40);
                ctx.fillStyle = '#E6E6FA';
                ctx.font = '20px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillText("", cardWidth / 2, cardHeight - 15);

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

    const { data: hash, error, isPending, writeContract } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const handleUpload = async () => {
        if (!localImageFile) return;

        setIsUploading(true);
        try {
            const combinedImageBlob = await generateCombinedImage(); // Use the existing function
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
                setUri(data.url); // Set the uri to the uploaded image URL
                setUploadSuccess(true); // Set upload success to true
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setLocalImageFile(null);
        setLocalImagePreview('');
        setUri(''); // Reset uri if cancelled
        setUploadSuccess(false); // Reset upload success state
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!isConnected && !selectedAccount) {
                throw new Error("Please connect wallet");
            }

            if (selectedAccount) {
                await mintWithPolkadot(codeContribute);
            } else if (isConnected) {
                await mintWithEVM(codeContribute);
            }

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
            setIsLoading(false);
        }
    };

    const mintWithPolkadot = async (codeContribute: string) => {
        if (!selectedAccount) throw new Error("Polkadot account not found");

        try {
            setIsPolkadotPending(true);
            await Promise.all(toAddresses.map(async (address) => {

                const result = await chain.evm.send(
                    {
                        contract: {
                            address: contractAddress as string,
                            abi: nftAbi as any
                        },
                        functionName: "mint_DragonNFT",
                        functionArgs: [
                            {
                                eth: ethers.ZeroAddress,
                                sub: Address.extract.substratePublicKey(selectedAccount.address)
                            },
                            codeContribute,
                            Number(0),
                            uri
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

            }));
            
        } catch (error) {
            console.error("Error during minting:", error);
            setPolkadotTransactionStatus("Transaction failed: " + (error as Error).message);
            throw new Error("Cannot mint NFT: " + (error as Error).message);
        } finally {
            setIsPolkadotPending(false);
        }
    };

    const mintWithEVM = async (codeContribute: string) => {
        if (!wagmiAddress) throw new Error("EVM address not found");

        await Promise.all(toAddresses.map(async (address) => {
            await writeContract({
                address: contractAddress,
                abi: nftAbi,
                functionName: "mint_DragonNFT",
                args: [
                    { 
                        eth: address as `0x${string}`, 
                        sub: BigInt(0) 
                    }, 
                    uri, 
                    Number(level), 
                    codeContribute
                ],
                chain: config[chainId],
                account: account.address,
            });
        }));
    };

    useEffect(() => {
        if (isConfirmed) {
            resetForm();
        }
    }, [isConfirmed]);

    const { address: wagmiAddress, isConnected } = useAccount();

    useEffect(() => {
    }, [selectedAccount]);

    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState<string | null>(null);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState<string | null>(null);

    const resetForm = () => {
        setLocalImageFile(null);
        setLocalImagePreview('');
        setUri('');
        setToAddresses([]);
        setLevel('');
        setCodeContribute('');
        setUploadSuccess(false);
    };


    // useEffect(() => {
    //     const fetchUserIds = async () => {
    //         const serverId = '1170911030789029898'; 
    //         const response = await fetch(`/api/leaderboard?serverId=${serverId}`);
    //         if (response.ok) {
    //             const data = await response.json();
    //             const ids = data.players.map((player: { id: string }) => player.id); // Extract IDs
    //             setUserIds(ids); 
    //         } else {
    //             console.error('Failed to fetch user IDs');
    //         }
    //     };

    //     fetchUserIds();
    // }, []);

    const getAddressesFromIds = async (ids: string[]) => {
        try {
            const addresses = await Promise.all(ids.map(async id => {
                const addressById = await readContract(config, {
                    abi: nftAbi,
                    address: contractAddress,
                    functionName: 'getAddressByDiscordId',
                    args: [id],
                });
                if (addressById !== '0x0000000000000000000000000000000000000000') {
                    return addressById;
                }
                return null;
            }));

            const validAddresses = addresses.filter(address => address !== null);
            setToAddresses(validAddresses);
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
    };

    return (
        <>
        <div className='v11e5678D'></div>
        <div className='background-container min-h-[100vh] border-2 border-solid border-primary rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment'>
        <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />

                <div className='flex justify-between items-center px-[3vw]'>
                    <div className='flex items-center'>
                        <Link href="/" className='text-primary mr-4 text-xl font-silkscreen'>
                            Home /
                        </Link>
                        <Link href="/admin" className='text-primary mr-4 text-xl font-silkscreen'>
                            Admin /
                        </Link>
                        <div className='text-primary font-bold font-pixel uppercase text-[4.5vw] leading-[5.5vw] whitespace-nowrap'>
                            Apply All
                        </div>
                    </div>
                    <div className='flex gap-3 flex-row-reverse'>
                        <div className='relative' ref={optionsRef}> {/* Attach ref here */}
                            <button 
                                onClick={toggleOptions} 
                                className=' fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'
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
                                        <Link href="/admin/config" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Config
                                        </Link>
                                        <Link href="/admin/upgrade" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Upgrade
                                        </Link>
                                        <Link href="/admin/replace" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Replace
                                        </Link>
                                        <Link href="/admin/reward" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Reward
                                        </Link>
                                        <Link href="/admin/nesting" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Nesting
                                        </Link>
                                        <Link href="/admin/unnest" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                                            Unnest
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className='connect-btn text-primary font-pixel uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap'>
                            <CustomConnectButton />
                        </div>
                        
                    </div>
                    
                </div>
                <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />



                <div className="w-full mt-10">
                    <div className="bg-secondary-background p-8 rounded-lg max-w-2xl mx-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="nftImage" className="block text-lg font-medium text-gray-300 mb-2">
                                    Upload NFT Image
                                </label>
                                <div className="relative w-full pt-[24px]">
                                    <div className="absolute z-0 top-0 left-0 flex items-center gap-[4px] pt-[4px] pb-[32px] px-[8px] rounded-tl-[12px] rounded-tr-[12px] bg-primary">
                                        <FileUploadIcon className="w-[12px] h-[12px]" />
                                        <span className="text-white font-pixel text-[1vw] leading-[1vw]">
                                            Upload Image
                                        </span>
                                    </div>
                                    <div className="upload__frame rounded-md flex relative overflow-visible before:rounded-md before:z-0 before:absolute before:bg-gradient-to-br before:p-12 before:inset-0 before:from-primary before:from-0% before:via-primary before:via-26% before:to-[#ffffff21] before:to-40%">
                                        <div {...getRootProps()} className="z-[1] w-full p-4 text-center font-pixel font-semibold text-primary cursor-pointer relative min-h-[15vw] flex flex-col items-center justify-center">
                                            <input {...getInputProps()} />
                                            
                                                <div>
                                                    {!uploadSuccess && (
                                                        <>
                                                            {isDragActive ? (
                                                            <p>Drop the image here ...</p>
                                                        ) : (
                                                            <p>Drag and drop an image here, or click to select a file</p>
                                                        )}
                                                        </>
                                                    )}
                                                    {localImagePreview && (
                                                        <div className="mt-4">
                                                            <img src={localImagePreview} alt="Preview" className="max-w-full h-auto" />
                                                            {!uploadSuccess && (<p className="mt-2 text-sm">Click or drag a new image to replace</p>)}
                                                        </div>
                                                    )}
                                                </div>
                                            
                                        </div>
                                        <div className="absolute left-[1px] top-[1px] right-[1px] bottom-[1px] rounded-md overflow-hidden p-[20px] border-image min-w-0 flex flex-col gap-300 bg-background outline-dashed outline-[1.5px] outline-background"></div>
                                    </div>
                                </div>
                                {uploadSuccess ? (
                                    <div className="mt-4 text-green-500">
                                        Upload successful! Please continue inputting your info.
                                    </div>
                                ) : (
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" onClick={handleCancel} className="bg-gray-600 text-white py-2 px-4 rounded-md hover:scale-105 transition-all duration-300">
                                            Cancel
                                        </button>
                                        <button type="button" onClick={handleUpload} className="bg-blue-500 text-white py-2 px-4 rounded-md hover:scale-105 transition-all duration-300" disabled={isUploading}>
                                            {isUploading ? <FaSpinner className="animate-spin" /> : 'Continue'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="level" className="block text-lg font-medium text-gray-300 mb-2">
                                    Level
                                </label>
                                <input
                                    type="text"
                                    id="level"
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    placeholder="Enter level"
                                    className={`w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary ${!uploadSuccess ? 'cursor-not-allowed' : ''}`}
                                    disabled={!uploadSuccess} // Disable input if upload is not successful
                                />
                            </div>

                            <div>
                                <label htmlFor="codeContribute" className="block text-lg font-medium text-gray-300 mb-2">
                                    Code Contribute
                                </label>
                                <input
                                    type="text"
                                    id="codeContribute"
                                    value={codeContribute}
                                    onChange={(e) => setCodeContribute(e.target.value)}
                                    placeholder="Enter code contribute"
                                    className={`w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary ${!uploadSuccess ? 'cursor-not-allowed' : ''}`}
                                    disabled={!uploadSuccess} // Disable input if upload is not successful
                                />
                            </div>

                            {/* ids place */}
                            <div>
                                <label htmlFor="link" className="block text-lg font-medium text-gray-300 mb-2">
                                    Enter Link to Fetch User IDs
                                </label>
                                <input
                                    type="text"
                                    id="link"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            fetchUserIdsFromLink(link);
                                            getAddressesFromIds(userIds);
                                        }
                                    }}
                                    placeholder="Enter link"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                />
                            </div>
                            {/* Loading animation */}
                            {isLoadingIds && <p className="text-yellow-300">Loading user IDs...</p>}
                            {/* ids place */}
                            <div className="overflow-y-auto max-h-60 bg-background text-gray-300 rounded-md p-4">
                                {userIds.length > 0 ? (
                                    userIds.map((id) => (
                                        <div key={id} className="text-gray-300">
                                            {id}
                                        </div>
                                    ))
                                ) : (
                                    !isLoadingIds && <p className="text-gray-500">No user IDs found.</p>
                                )}
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="w-full bg-black text-[#3f3c40] font-bold py-2 px-4 rounded-md hover:text-[#c7c1c9] transition duration-300"
                                    disabled={!uploadSuccess} // Disable submit button if upload is not successful
                                >
                                    Mint SoulBound NFT
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 bg-secondary p-6 rounded-lg max-w-2xl mx-auto">
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
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
    );
}

export default ApplyAll;