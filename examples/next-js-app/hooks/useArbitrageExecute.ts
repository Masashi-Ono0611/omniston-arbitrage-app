import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useCallback, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { useQueryId } from "@/hooks/useQueryId";
import { SWAP_CONFIG } from "@/lib/constants";
import { modifyQueryId } from "@/lib/payload-utils";
import type { ArbitrageOpportunity } from "@/lib/arbitrage/types";
import { validateQuotesOrThrow } from "@/lib/quote-validation";

/**
 * Hook for executing arbitrage opportunities using UI-specified slippage
 */
export const useArbitrageExecute = () => {
  const wallet = useTonWallet();
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();
  const { getQueryIdAsBigInt } = useQueryId(wallet?.account.address.toString());
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeArbitrage = useCallback(
    async (opportunity: ArbitrageOpportunity) => {
      if (!wallet) throw new Error("Wallet not connected");

      setError(null);
      setIsExecuting(true);
      try {
        // Validate quotes before proceeding
        validateQuotesOrThrow([
          { quote: opportunity.forwardQuote, name: "Forward" },
          { quote: opportunity.reverseQuote, name: "Reverse" },
        ]);

        const [autoQueryId, walletAddress] = await Promise.all([
          getQueryIdAsBigInt(),
          Promise.resolve({
            address: wallet.account.address.toString(),
            blockchain: Blockchain.TON,
          }),
        ]);

        const buildOptions = {
          sourceAddress: walletAddress,
          destinationAddress: walletAddress,
          gasExcessAddress: walletAddress,
          useRecommendedSlippage: false as const,
        };

        const [forwardTx, reverseTx] = await Promise.all([
          omniston.buildTransfer({ ...buildOptions, quote: opportunity.forwardQuote }),
          omniston.buildTransfer({ ...buildOptions, quote: opportunity.reverseQuote }),
        ]);

        const messages = [
          ...(forwardTx.ton?.messages ?? []),
          ...(reverseTx.ton?.messages ?? []),
        ].map((message) => ({
          address: message.targetAddress,
          amount: message.sendAmount,
          payload: modifyQueryId(message.payload, autoQueryId),
          stateInit: message.jettonWalletStateInit,
        }));

        await tonConnect.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + SWAP_CONFIG.TRANSACTION_VALID_DURATION_SECONDS,
          messages,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to execute arbitrage");
        throw err; // Re-throw to maintain existing error handling
      } finally {
        setIsExecuting(false);
      }
    },
    [wallet, omniston, tonConnect, getQueryIdAsBigInt],
  );

  return { executeArbitrage, isExecuting, error };
};
