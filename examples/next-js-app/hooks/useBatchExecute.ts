import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { modifyQueryId } from "@/lib/payload-utils";
import type { SwapItem } from "@/providers/multi-swap";
import { useSwapSettings } from "@/providers/swap-settings";

/**
 * Hook for batch executing multiple swaps in a single transaction
 * Inspired by useBuildAndSendTxForQuotes pattern
 */
export const useBatchExecute = () => {
  const wallet = useTonWallet();
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();
  const { autoSlippageTolerance } = useSwapSettings();

  const [isExecuting, setIsExecuting] = useState(false);

  /**
   * Build and send transaction for all quotes in a single batch
   * @param swaps - Array of swap items with quotes
   * @param fixedQueryId - Optional fixed QueryID (decimal or 0x... format)
   */
  const executeBatch = useCallback(
    async (swaps: SwapItem[], fixedQueryId?: string) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      const swapsWithQuotes = swaps.filter((swap) => swap.quote !== null);

      if (swapsWithQuotes.length === 0) {
        throw new Error("No quotes available to execute");
      }

      setIsExecuting(true);

      try {
        // Normalize fixedQueryId to bigint
        const rawFq = fixedQueryId?.trim?.() ?? "";
        let fixedQueryIdBig: bigint | undefined = undefined;
        if (rawFq.length > 0) {
          try {
            fixedQueryIdBig = BigInt(rawFq);
          } catch {
            fixedQueryIdBig = undefined;
          }
        }
        // Build all transfers in parallel using Promise.all
        const transactionResponses = await Promise.all(
          swapsWithQuotes.map((swap) =>
            omniston.buildTransfer({
              quote: swap.quote!,
              sourceAddress: {
                address: wallet.account.address.toString(),
                blockchain: Blockchain.TON,
              },
              destinationAddress: {
                address: wallet.account.address.toString(),
                blockchain: Blockchain.TON,
              },
              gasExcessAddress: {
                address: wallet.account.address.toString(),
                blockchain: Blockchain.TON,
              },
              useRecommendedSlippage: autoSlippageTolerance,
            }),
          ),
        );

        // Flatten all messages from all transactions into a single array
        const allMessages = transactionResponses.flatMap(
          (tx) => tx.ton?.messages ?? [],
        );

        if (allMessages.length === 0) {
          throw new Error("No messages generated from quotes");
        }

        // Apply fixedQueryId to messages and prepare for sending
        const messagesForSend = allMessages.map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload:
            message.payload && fixedQueryIdBig !== undefined
              ? modifyQueryId(message.payload, fixedQueryIdBig)
              : message.payload,
          stateInit: message.jettonWalletStateInit,
        }));

        // Debug log: Output constructed messages
        console.error(
          "[BatchTx] messages.forSend(JSON):",
          JSON.stringify(messagesForSend, null, 2),
        );
        if (fixedQueryIdBig !== undefined) {
          console.error(
            "[BatchTx] Fixed QueryID applied:",
            fixedQueryIdBig.toString(),
          );
        }

        // Send all messages in a single batch transaction
        await tonConnect.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
          messages: messagesForSend,
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, omniston, tonConnect, autoSlippageTolerance],
  );

  return {
    executeBatch,
    isExecuting,
  };
};
