import { BaseError } from "wagmi";

interface TransactionStatusProps {
  isPending?: boolean;
  isConfirming?: boolean;
  isConfirmed?: boolean;
  hash?: string;
  error?: Error | BaseError | null;
  isPolkadotPending?: boolean;
  polkadotTransactionStatus?: string | null;
  polkadotTransactionHash?: string | null;
  blockexplorer?: string;
}

export function TransactionStatus({
  isPending,
  isConfirming,
  isConfirmed,
  hash,
  error,
  isPolkadotPending,
  polkadotTransactionStatus,
  polkadotTransactionHash,
  blockexplorer,
}: TransactionStatusProps) {
  const ExplorerLink = ({ txHash }: { txHash: string }) => (
    <>
      {' '}
      <a
        href={`${blockexplorer}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:underline"
      >
        View on block explorer
      </a>
    </>
  );

  return (
    <div className="mt-4 bg-secondary/20 p-4 rounded-lg text-sm">
      <h3 className="text-lg font-semibold text-white mb-2">Transaction Status</h3>
      
      {isPending && <p className="text-yellow-300">Waiting for signature...</p>}
      
      {isConfirming && <p className="text-yellow-300">Confirming...</p>}
      
      {isConfirmed && hash && (
        <p className="text-green-300">
          Transaction successful!
          <ExplorerLink txHash={hash} />
        </p>
      )}

      {isPolkadotPending && (
        <p className="text-yellow-300">Polkadot transaction processing...</p>
      )}

      {polkadotTransactionStatus && (
        <p className={`text-${polkadotTransactionStatus.includes("successful") ? "green" : "red"}-300`}>
          {polkadotTransactionStatus}
          {polkadotTransactionStatus.includes("successful") && polkadotTransactionHash && (
            <ExplorerLink txHash={polkadotTransactionHash} />
          )}
        </p>
      )}

      {error && (
        <p className="text-red-300">
          Error: {(error as BaseError).shortMessage || "An unknown error occurred"}
        </p>
      )}

      {!isPending && !isConfirming && !isConfirmed && !isPolkadotPending && !error && !polkadotTransactionStatus && (
        <p className="text-gray-300">No transactions yet</p>
      )}
    </div>
  );
} 