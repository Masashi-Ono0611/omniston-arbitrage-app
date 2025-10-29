import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
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
   */
  const executeBatch = useCallback(
    async (swaps: SwapItem[]) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      const swapsWithQuotes = swaps.filter((swap) => swap.quote !== null);

      if (swapsWithQuotes.length === 0) {
        throw new Error("No quotes available to execute");
      }

      setIsExecuting(true);

      try {
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

        // Send all messages in a single batch transaction
        await tonConnect.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
          messages: allMessages.map((message) => ({
            address: message.targetAddress,
            amount: message.sendAmount,
            payload: message.payload,
            stateInit: message.jettonWalletStateInit,
          })),
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
