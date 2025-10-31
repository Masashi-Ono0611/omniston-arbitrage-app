import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { useQueryId } from "@/hooks/useQueryId";
import { SWAP_CONFIG } from "@/lib/constants";
import { modifyQueryId } from "@/lib/payload-utils";
import type { ArbitrageOpportunity } from "@/lib/arbitrage/types";
import { useSwapSettings } from "@/providers/swap-settings";

/**
 * Hook for executing a single arbitrage opportunity
 * Executes both forward and reverse swaps in a single transaction
 */
export const useArbitrageExecute = () => {
  const wallet = useTonWallet();
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();
  const { autoSlippageTolerance } = useSwapSettings();
  const { getQueryIdAsBigInt } = useQueryId(wallet?.account.address.toString());

  const [isExecuting, setIsExecuting] = useState(false);

  /**
   * Execute arbitrage opportunity by building and sending both swaps
   * @param opportunity - The arbitrage opportunity to execute
   */
  const executeArbitrage = useCallback(
    async (opportunity: ArbitrageOpportunity) => {
      if (!wallet) {
        throw new Error("Wallet not connected");
      }

      setIsExecuting(true);

      try {
        const autoQueryId = getQueryIdAsBigInt();
        const walletAddress = wallet.account.address.toString();

        // Create common address object
        const walletAddressObj = {
          address: walletAddress,
          blockchain: Blockchain.TON,
        };

        // Build both transfers in parallel
        const [forwardTransaction, reverseTransaction] = await Promise.all([
          omniston.buildTransfer({
            quote: opportunity.forwardQuote,
            sourceAddress: walletAddressObj,
            destinationAddress: walletAddressObj,
            gasExcessAddress: walletAddressObj,
            useRecommendedSlippage: autoSlippageTolerance,
          }),
          omniston.buildTransfer({
            quote: opportunity.reverseQuote,
            sourceAddress: walletAddressObj,
            destinationAddress: walletAddressObj,
            gasExcessAddress: walletAddressObj,
            useRecommendedSlippage: autoSlippageTolerance,
          }),
        ]);

        // Prepare messages for sending
        const messagesForSend = [
          ...(forwardTransaction.ton?.messages ?? []),
          ...(reverseTransaction.ton?.messages ?? []),
        ].map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: modifyQueryId(message.payload, autoQueryId),
          stateInit: message.jettonWalletStateInit,
        }));

        // Send transaction
        await tonConnect.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + SWAP_CONFIG.TRANSACTION_VALID_DURATION_SECONDS,
          messages: messagesForSend,
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, omniston, tonConnect, autoSlippageTolerance, getQueryIdAsBigInt],
  );

  return {
    executeArbitrage,
    isExecuting,
  };
};
