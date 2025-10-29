import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { useQueryId } from "@/hooks/useQueryId";
import { SWAP_CONFIG } from "@/lib/constants";
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
  const { getQueryIdAsBigInt } = useQueryId(wallet?.account.address.toString());

  const [isExecuting, setIsExecuting] = useState(false);

  /**
   * Build and send transaction for all quotes in a single batch
   * @param swaps - Array of swap items with quotes
   */
  const executeBatch = useCallback(
    async (swaps: SwapItem[]) => {
      setIsExecuting(true);

      try {
        // Generate auto QueryID for this batch transaction
        const autoQueryId = getQueryIdAsBigInt();

        const walletAddress = wallet!.account.address.toString();

        // Build all transfers in parallel using Promise.all
        const transactionResponses = await Promise.all(
          swaps.map((swap) =>
            omniston.buildTransfer({
              quote: swap.quote!,
              sourceAddress: {
                address: walletAddress,
                blockchain: Blockchain.TON,
              },
              destinationAddress: {
                address: walletAddress,
                blockchain: Blockchain.TON,
              },
              gasExcessAddress: {
                address: walletAddress,
                blockchain: Blockchain.TON,
              },
              useRecommendedSlippage: autoSlippageTolerance,
            }),
          ),
        );

        // Flatten all messages from all transactions
        const allMessages = transactionResponses.flatMap(
          (tx) => tx.ton?.messages ?? [],
        );

        // Apply auto-generated QueryID to all messages
        const messagesForSend = allMessages.map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: modifyQueryId(message.payload, autoQueryId),
          stateInit: message.jettonWalletStateInit,
        }));

        // Debug log: Output constructed messages
        console.error(
          "[BatchTx] messages.forSend(JSON):",
          JSON.stringify(messagesForSend, null, 2),
        );
        console.error(
          "[BatchTx] Auto-generated QueryID applied:",
          autoQueryId.toString(),
        );

        // Send all messages in a single batch transaction
        await tonConnect.sendTransaction({
          validUntil:
            Math.floor(Date.now() / 1000) +
            SWAP_CONFIG.TRANSACTION_VALID_DURATION_SECONDS,
          messages: messagesForSend,
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, omniston, tonConnect, autoSlippageTolerance, getQueryIdAsBigInt],
  );

  return {
    executeBatch,
    isExecuting,
  };
};
