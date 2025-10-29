import {
  Blockchain,
  GaslessSettlement,
  type QuoteRequest,
  type QuoteResponseEvent,
  SettlementMethod,
} from "@ston-fi/omniston-sdk-react";
import { useCallback, useRef } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { QUOTE_CONFIG, RETRY_CONFIG, SWAP_CONFIG } from "@/lib/constants";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { floatToBigNumber, percentToPercentBps } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import {
  type SwapItem,
  useMultiSwap,
  useMultiSwapDispatch,
} from "@/providers/multi-swap";
import { useSwapSettings } from "@/providers/swap-settings";

export const useMultiSwapRfq = () => {
  const omniston = useOmniston();
  const { swaps, isQuotingAll } = useMultiSwap();
  const dispatch = useMultiSwapDispatch();
  const { getAssetByAddress } = useAssets();
  const {
    settlementMethods,
    referrerAddress,
    referrerFeeBps,
    flexibleReferrerFee,
  } = useSwapSettings();
  const abortControllerRef = useRef<AbortController | null>(null);

  const getQuoteForSwap = useCallback(
    async (swap: SwapItem, retryCount = 0): Promise<void> => {
      if (!swap.bidAddress || !swap.askAddress || !swap.bidAmount) {
        throw new Error("Missing required fields");
      }

      const bidAsset = getAssetByAddress(swap.bidAddress);
      const askAsset = getAssetByAddress(swap.askAddress);

      if (!bidAsset || !askAsset) {
        throw new Error("Asset not found");
      }

      const quoteRequest: QuoteRequest = {
        settlementMethods: settlementMethods,
        askAssetAddress: {
          address: swap.askAddress,
          blockchain: Blockchain.TON,
        },
        bidAssetAddress: {
          address: swap.bidAddress,
          blockchain: Blockchain.TON,
        },
        amount: {
          bidUnits: floatToBigNumber(
            swap.bidAmount,
            bidAsset.meta.decimals,
          ).toString(),
          askUnits: undefined,
        },
        referrerAddress: referrerAddress
          ? {
              address: referrerAddress,
              blockchain: Blockchain.TON,
            }
          : undefined,
        referrerFeeBps: referrerFeeBps,
        settlementParams: {
          maxPriceSlippageBps: percentToPercentBps(swap.slippage),
          maxOutgoingMessages: SWAP_CONFIG.MAX_OUTGOING_MESSAGES,
          gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
          flexibleReferrerFee: flexibleReferrerFee,
        },
      };

      try {
        dispatch({
          type: "SET_SWAP_STATUS",
          payload: { id: swap.id, status: "loading", error: null },
        });

        const observable = await omniston.requestForQuote(quoteRequest);

        return new Promise((resolve, reject) => {
          let firstQuoteReceived = false;
          let waitTimeout: NodeJS.Timeout | null = null;
          let absoluteTimeout: NodeJS.Timeout | null = null;

          const cleanup = () => {
            if (waitTimeout) clearTimeout(waitTimeout);
            if (absoluteTimeout) clearTimeout(absoluteTimeout);
          };

          const subscription = observable.subscribe({
            next: (event: QuoteResponseEvent) => {
              if (event.type === "quoteUpdated") {
                // Update state with the new quote
                dispatch({
                  type: "SET_SWAP_QUOTE",
                  payload: {
                    id: swap.id,
                    quote: event.quote,
                    rfqId: event.rfqId,
                  },
                });

                if (!firstQuoteReceived) {
                  firstQuoteReceived = true;
                  // Wait for potentially better quotes
                  waitTimeout = setTimeout(() => {
                    cleanup();
                    subscription.unsubscribe();
                    resolve();
                  }, QUOTE_CONFIG.QUOTE_WAIT_FOR_BETTER_MS);
                }
                // If additional quotes come in, they automatically update via dispatch
              } else if (event.type === "unsubscribed") {
                cleanup();
                subscription.unsubscribe();
                if (firstQuoteReceived) {
                  resolve();
                } else {
                  reject(new Error("Quote request timed out"));
                }
              }
            },
            error: (error: unknown) => {
              cleanup();
              subscription.unsubscribe();
              reject(error);
            },
          });

          // Absolute timeout to prevent hanging indefinitely
          absoluteTimeout = setTimeout(() => {
            cleanup();
            subscription.unsubscribe();
            if (firstQuoteReceived) {
              resolve();
            } else {
              reject(new Error("Quote request absolute timeout"));
            }
          }, QUOTE_CONFIG.QUOTE_TIMEOUT_MS);

          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener("abort", () => {
              cleanup();
              subscription.unsubscribe();
              reject(new Error("Aborted"));
            });
          }
        });
      } catch (error) {
        if (retryCount < RETRY_CONFIG.MAX_ATTEMPTS) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_CONFIG.DELAY_MS),
          );
          return getQuoteForSwap(swap, retryCount + 1);
        }

        dispatch({
          type: "SET_SWAP_STATUS",
          payload: { id: swap.id, status: "error", error: formatError(error) },
        });
        throw error;
      }
    },
    [
      omniston,
      dispatch,
      getAssetByAddress,
      settlementMethods,
      referrerAddress,
      referrerFeeBps,
      flexibleReferrerFee,
    ],
  );

  const getAllQuotes = useCallback(async () => {
    if (isQuotingAll) return;

    abortControllerRef.current = new AbortController();
    dispatch({ type: "START_QUOTING_ALL" });

    try {
      // Execute all RFQ requests in parallel
      const quotePromises = swaps.map((swap) => {
        if (abortControllerRef.current?.signal.aborted) {
          return Promise.reject(new Error("Aborted"));
        }
        // Wrap in promise to catch individual errors without failing others
        return getQuoteForSwap(swap).catch((error) => {
          logger.error(`Failed to get quote for swap ${swap.id}:`, error);
          // Return null to indicate failure but don't throw
          return null;
        });
      });

      // Wait for all quotes to complete (success or failure)
      await Promise.all(quotePromises);
    } catch (error) {
      logger.error("Failed to get all quotes:", error);
    } finally {
      dispatch({ type: "FINISH_QUOTING_ALL" });
      abortControllerRef.current = null;
    }
  }, [swaps, isQuotingAll, dispatch, getQuoteForSwap]);

  const cancelQuoting = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    getAllQuotes,
    cancelQuoting,
    isQuotingAll,
  };
};
