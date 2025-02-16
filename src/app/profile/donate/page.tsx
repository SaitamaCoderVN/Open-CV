"use client";

import { nftAbi } from "@/components/contract/abi";
import { BLOCK_EXPLORER_OPAL, BLOCK_EXPLORER_QUARTZ, BLOCK_EXPLORER_UNIQUE, CHAINID, CONTRACT_ADDRESS_OPAL, CONTRACT_ADDRESS_QUARTZ, CONTRACT_ADDRESS_UNIQUE } from "@/components/contract/contracts";
import { CustomConnectButton } from "@/components/ui/ConnectButton";
import Spacer from "@/components/ui/Spacer";
import Link from "next/link";
import { useContext, useState } from 'react';
import {
    type BaseError,
    useWaitForTransactionReceipt,
    useWriteContract,
    useChainId,
    useAccount,
} from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/components/contract/config";
import { useChainAndScan } from "@/hooks/useChainAndScan";
import { AccountsContext } from '@/accounts/AccountsContext';
import { TransactionStatus } from "@/components/TransactionStatus";

function DonatePage() {
    const [amount, setAmount] = useState<number>(0);
    const { chain } = useChainAndScan();
    
    const { toast } = useToast();
    const chainId = useChainId();
    const account = useAccount();
    let contractAddress: `0x${string}` | undefined;
    let blockexplorer: string | undefined;

    const { selectedAccount } = useContext(AccountsContext);
    const [isLoading, setIsLoading] = useState(false);
    const [isPolkadotPending, setIsPolkadotPending] = useState(false);
    const [polkadotTransactionStatus, setPolkadotTransactionStatus] = useState('');
    const [polkadotTransactionHash, setPolkadotTransactionHash] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { address: wagmiAddress, isConnected } = useAccount();

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
                title: "Error",
                description: "Please select a supported network",
            });
            return;
        }

        try {
            if (!isConnected && !selectedAccount) {
                throw new Error("Please connect your wallet");
            }

            let transactionHash;
            if (selectedAccount) {
                transactionHash = await donateWithPolkadot();
            } else if (isConnected) {
                transactionHash = await donateWithEVM();
            }

            toast({
                title: "Success!",
                description: (
                    <div>
                        <p>Thank you for donating!</p>
                        {transactionHash && (
                            <a 
                                href={`${blockexplorer}/tx/${transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 underline"
                            >
                                View transaction
                            </a>
                        )}
                    </div>
                ),
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Transaction cancelled",
                description: `${(error as BaseError).shortMessage || "An error occurred"}`,
            });
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
        }
    };

    const donateWithPolkadot = async () => {
        if(!selectedAccount) throw new Error("No Polkadot account found");

        try {
            setIsPolkadotPending(true);
            const result = await chain.evm.send(
                {
                    contract: {
                        address: contractAddress as string,
                        abi: nftAbi as any
                    },
                    functionName: "donate",
                    functionArgs: [],
                    value: BigInt(amount * 1e18),
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
            return result.extrinsicOutput.hash;

        } catch (error) {
            console.error("Error when donating:", error);
            setPolkadotTransactionStatus("Transaction failed: " + (error as Error).message);
            throw new Error("Cannot donate: " + (error as Error).message);
        } finally {
            setIsPolkadotPending(false);
        }
    }

    const donateWithEVM = async () => {
        if(!isConnected) throw new Error("No EVM account found");

        try {
            const result = await writeContract({
                address: contractAddress,
                abi: nftAbi,
                functionName: "deposit",
                args: [BigInt(amount * 1e18)],
                value: BigInt(amount * 1e18),
                chain: config[chainId],
                account: account.address as `0x${string}`,
            });
            return result;
        } catch (error) {
            console.error('Error when performing transaction:', error);
            throw error;
        }
    }

    return (
        <>
            <div className='v11e5678D'></div>
            <div className='background-container min-h-[100vh] border-2 border-solid border-primary rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment'>
                <Spacer className='h-[3vw] max-phonescreen:h-[4vw]' />
                <div className='max-phonescreen:flex-col max-phonescreen:items-start max-phonescreen:gap-2 flex justify-between items-center px-[3vw]'>
                    <div className='flex items-center'>
                        <Link href="/" className='max-phonescreen:text-[4vw] max-phonescreen:leading-[4vw] text-primary mr-4 text-xl font-silkscreen'>
                            Home /
                        </Link>
                        <div className='max-phonescreen:text-[5.5vw] max-phonescreen:leading-[5.5vw] text-primary font-bold font-pixel uppercase text-[5.5vw] leading-[5.5vw] whitespace-nowrap'>
                            Donate 
                        </div>
                    </div>
                    <div className='max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] max-phonescreen:h-[27px] connect-btn text-primary font-pixel uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap'>
                        <CustomConnectButton />
                    </div>
                </div>

                <div className="w-full mt-10">
                    <div className="max-phonescreen:w-[calc(100%-20px)] bg-secondary-background p-8 rounded-lg max-w-2xl mx-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="amount" className="block text-lg font-medium text-gray-300 mb-2">
                                    Amount of Token
                                </label>
                                <input
                                    type="number"
                                    id="amount"
                                    placeholder="Enter the amount of token to donate"
                                    className="w-full px-4 py-2 bg-background text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                                    value={amount}
                                    onChange={(e) => setAmount(parseInt(e.target.value, 10))}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-black text-[#3f3c40] font-bold py-2 px-4 rounded-md hover:text-[#c7c1c9] transition duration-300 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Processing...' : 'Donate now'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="max-phonescreen:max-w-[400px] mt-8 bg-secondary p-6 rounded-lg max-w-2xl mx-auto">
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

export default DonatePage;
