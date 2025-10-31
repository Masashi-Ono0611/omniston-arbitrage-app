import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { useQueryId } from "@/hooks/useQueryId";
import { SWAP_CONFIG } from "@/lib/constants";
import { modifyQueryId } from "@/lib/payload-utils";
import type { ArbitrageOpportunity } from "@/lib/arbitrage/types";

/**
 * Hook for executing a single arbitrage opportunity
 * Executes both forward and reverse swaps in a single transaction
 * Uses the slippage tolerance specified in the opportunity (from Scanner Control UI)
 */
export const useArbitrageExecute = () => {
  const wallet = useTonWallet();
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();
  const { getQueryIdAsBigInt } = useQueryId(wallet?.account.address.toString());

  const [isExecuting, setIsExecuting] = useState(false);

  /**
   * Execute arbitrage opportunity by building and sending both swaps
   * @param opportunity - The arbitrage opportunity to execute
   */
  const executeArbitrage = useCallback(
    async (opportunity: ArbitrageOpportunity) => {
      if (!wallet) throw new Error("Wallet not connected");

      setIsExecuting(true);

      try {
        const autoQueryId = getQueryIdAsBigInt();
        const walletAddressObj = {
          address: wallet.account.address.toString(),
          blockchain: Blockchain.TON,
        };

        // Use the slippage tolerance specified in Scanner Control UI (stored in opportunity.slippageBps)
        // The quotes were already requested with this slippage, so we use useRecommendedSlippage: false
        const [forwardTransaction, reverseTransaction] = await Promise.all([
          omniston.buildTransfer({
            quote: opportunity.forwardQuote,
            sourceAddress: walletAddressObj,
            destinationAddress: walletAddressObj,
            gasExcessAddress: walletAddressObj,
            useRecommendedSlippage: false,
          }),
          omniston.buildTransfer({
            quote: opportunity.reverseQuote,
            sourceAddress: walletAddressObj,
            destinationAddress: walletAddressObj,
            gasExcessAddress: walletAddressObj,
            useRecommendedSlippage: false,
          }),
        ]);

        const messagesForSend = [
          ...(forwardTransaction.ton?.messages ?? []),
          ...(reverseTransaction.ton?.messages ?? []),
        ].map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: modifyQueryId(message.payload, autoQueryId),
          stateInit: message.jettonWalletStateInit,
        }));

        await tonConnect.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + SWAP_CONFIG.TRANSACTION_VALID_DURATION_SECONDS,
          messages: messagesForSend,
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, omniston, tonConnect, getQueryIdAsBigInt],
  );

  return {
    executeArbitrage,
    isExecuting,
  };
};
