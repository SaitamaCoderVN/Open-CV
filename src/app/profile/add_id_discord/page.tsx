"use client";
import { nftAbi } from "@/components/contract/abi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";
import { CustomConnectButton } from "@/components/ui/ConnectButton";
import Spacer from "@/components/ui/Spacer";
import Link from "next/link";
import { useState, useEffect, useContext } from 'react';
import {
    useChainId,
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { readContract } from '@wagmi/core/actions'; // Import hàm readContract
import { config } from "@/components/contract/config";
import { useSearchParams } from "next/navigation";
import { AccountsContext } from '@/accounts/AccountsContext';
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { TransactionStatus } from "@/components/TransactionStatus";

function AddIDDiscordPage() {
    const searchParams = useSearchParams();
    const [discordIdAuth, setDiscordIdAuth] = useState<string | null>(null); // State để lưu ID Discord đã xác thc

    const [currentDiscordId, setCurrentDiscordId] = useState<string | null>(null); // State để lưu ID Discord hiện tại

    const { toast } = useToast();
    const chainId = useChainId();
    const account = useAccount();
    let contractAddress: `0x${string}` | undefined;
    let blockexplorer: string | undefined;
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Thêm biến trạng thái để theo dõi xác thực

    const { selectedAccount } = useContext(AccountsContext);
    const { chain, scan } = useChainAndScan();

    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState<string | null>(null);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState<string | null>(null);

    const handleLogin = async () => {
        const redirectUri = 'https://discord.com/oauth2/authorize?client_id=1306227974579949568&response_type=code&redirect_uri=https%3A%2F%2Fdragonft.org%2Fapi%2Fauth%2Fdiscord%2Fcallback&scope=identify'; // Replace with your redirect URI
        
        window.location.href = redirectUri;
        setIsAuthenticated(true);
    };
    useEffect(() => {
        const discordId = searchParams.get('discordId');

        if (discordId) {
            setDiscordIdAuth(discordId);
            setIsAuthenticated(true);
        } else {
            console.warn("No discordId found in search parameters.");
        }
    }, [searchParams]);

    useEffect(() => {
        if (isAuthenticated && discordIdAuth && currentDiscordId === null && account.address) {
            handleSubmit();
        } else {
            console.warn("Conditions not met for handleSubmit:", { isAuthenticated, discordIdAuth, currentDiscordId, accountAddress: account.address }); // Cảnh báo nếu điều kiện không được thỏa mãn
        }
    }, [isAuthenticated, discordIdAuth, currentDiscordId, account.address]);

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

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

    useEffect(() => {
        const fetchDiscordId = async () => {
            if (!contractAddress || !account.address) return;

            try {
                const result = await readContract(config, {
                    abi: nftAbi,
                    address: contractAddress,
                    functionName: 'getDiscordId',
                    args: [account.address],
                });

                setCurrentDiscordId(result as string);
            } catch (error) {
                console.error("Error fetching Discord ID:", error);
            }
        };

        fetchDiscordId();
    }, [account.address, contractAddress]);

    useEffect(() => {
    }, [currentDiscordId]);

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        if (!contractAddress) {
            toast({
                variant: "destructive",
                title: "Network Error",
                description: "Please select a supported network",
            });
            return;
        }

        try {
            if (!account.isConnected && !selectedAccount) {
                throw new Error("Please connect wallet");
            }

            if (selectedAccount) {
                await submitWithPolkadot();
            } else if (account.isConnected) {
                await submitWithEVM();
            }

            toast({
                title: "Success",
                description: "Discord ID has been set successfully!",
            });

        } catch (error) {
            console.error("Error during transaction:", error);
            toast({
                variant: "destructive",
                title: "Transaction Error",
                description: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    const handleChangeDiscordId = () => {
        setCurrentDiscordId(null); // Reset current Discord ID to allow re-authentication
        handleLogin(); // Redirect to Discord login
    };

    const submitWithPolkadot = async () => {
        if (!selectedAccount) throw new Error("Polkadot account not found");
        if (!discordIdAuth) throw new Error("Discord ID not found");

        try {
            setIsPolkadotPending(true);
            const result = await chain.evm.send(
                {
                    contract: {
                        address: contractAddress as string,
                        abi: nftAbi as any
                    },
                    functionName: "setDiscordId",
                    functionArgs: [
                        selectedAccount.address,
                        discordIdAuth
                    ],
                    gasLimit: BigInt(3_000_000)
                },
                { signerAddress: selectedAccount.address },
                { signer: selectedAccount.signer }
            );

            if (!result.result.isSuccessful) {
                throw new Error("Transaction failed");
            }

            setPolkadotTransactionStatus("Transaction successful!");
            setPolkadotTransactionHash(result.extrinsicOutput.hash);
        } catch (error) {
            console.error("Error during transaction:", error);
            setPolkadotTransactionStatus("Transaction failed: " + (error as Error).message);
            throw new Error("Cannot set Discord ID: " + (error as Error).message);
        } finally {
            setIsPolkadotPending(false);
        }
    };

    const submitWithEVM = async () => {
        if (!account.address) throw new Error("EVM address not found");
        if (!discordIdAuth) throw new Error("Discord ID not found");

        await writeContract({
            address: contractAddress,
            abi: nftAbi,
            functionName: "setDiscordId",
            args: [account.address, discordIdAuth],
            chain: config[chainId],
            account: account.address,
        });
    };

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
                        <Link href="/profile" className='
                        max-phonescreen:text-[4vw] max-phonescreen:leading-[4vw]
                        text-primary mr-4 text-xl font-silkscreen'>
                            profile /
                        </Link>
                        <div className='
                        max-phonescreen:text-[5.5vw] max-phonescreen:leading-[5.5vw]
                        text-primary font-bold font-pixel uppercase text-[4.5vw] leading-[5.5vw] whitespace-nowrap'>
                            ADD ID DISCORD 
                        </div>
                    </div>
                    <div className='
                    max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px]
                    connect-btn text-primary font-pixel uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap'>
                            <CustomConnectButton />
                    </div>
                </div>

                <div className="w-full mt-10">
                    <div className="
                    max-phonescreen:w-[calc(100%-20px)]
                    bg-secondary-background p-8 rounded-lg max-w-2xl mx-auto">
                        {currentDiscordId ? (
                            <div className="mb-4">
                                <p className="text-lg font-medium text-gray-300">Your Discord ID: {currentDiscordId}</p>
                                <button
                                    onClick={handleChangeDiscordId}
                                    className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition duration-300 mt-4"
                                >
                                    Change ID Discord
                                </button>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <button
                                    onClick={handleLogin}
                                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
                                >
                                    Login with Discord
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="
                    max-phonescreen:w-[calc(100%-20px)]
                    mt-8 bg-secondary p-6 rounded-lg max-w-2xl mx-auto">
                        <h3 className="text-xl font-semibold text-white mb-4">Transaction Status</h3>
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

export default AddIDDiscordPage;