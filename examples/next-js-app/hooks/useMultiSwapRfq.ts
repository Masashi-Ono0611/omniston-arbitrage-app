import {
  Blockchain,
  GaslessSettlement,
  type QuoteRequest,
  type QuoteResponseEvent,
  SettlementMethod,
} from "@ston-fi/omniston-sdk-react";
import { useCallback, useEffect, useRef } from "react";

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
  const subscriptionsRef = useRef<Map<string, { unsubscribe: () => void }>>(
    new Map(),
  );

  logger.info("[RFQ] useMultiSwapRfq hook initialized");

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
        logger.info(`[RFQ] Starting quote request for Swap ${swap.id}`);
        dispatch({
          type: "SET_SWAP_STATUS",
          payload: { id: swap.id, status: "loading", error: null },
        });

        const observable = await omniston.requestForQuote(quoteRequest);
        logger.info(`[RFQ] Observable created for Swap ${swap.id}`);

        return new Promise((resolve, reject) => {
          let firstQuoteReceived = false;

          const subscription = observable.subscribe({
            next: (event: QuoteResponseEvent) => {
              logger.info(`[RFQ] Event received for Swap ${swap.id}:`, {
                type: event.type,
                rfqId: event.rfqId,
                quoteId:
                  event.type === "quoteUpdated"
                    ? event.quote.quoteId
                    : undefined,
              });

              if (event.type === "quoteUpdated") {
                // Update state with the new quote
                dispatch({
                  type: "SET_SWAP_QUOTE",
                  payload: {
                    id: swap.id,
                    quote: event.quote,
                    rfqId: event.rfqId,
                    receivedAt: Date.now(),
                  },
                });

                if (!firstQuoteReceived) {
                  firstQuoteReceived = true;
                  // Store subscription for later cleanup
                  subscriptionsRef.current.set(swap.id, subscription);
                  logger.info(
                    `[RFQ] First quote received for Swap ${swap.id}, subscription stored. Active subscriptions: ${subscriptionsRef.current.size}`,
                  );
                  // Resolve immediately after first quote - no waiting
                  resolve();
                } else {
                  logger.info(
                    `[RFQ] Quote updated for Swap ${swap.id} (Quote ID: ${event.quote.quoteId})`,
                  );
                }
                // Subscription stays active - quotes will continue to update
              } else if (event.type === "unsubscribed") {
                logger.warn(
                  `[RFQ] Unsubscribed event received for Swap ${swap.id}`,
                );
                subscriptionsRef.current.delete(swap.id);
                subscription.unsubscribe();
                if (firstQuoteReceived) {
                  resolve();
                } else {
                  reject(new Error("Quote request timed out"));
                }
              } else if (event.type === "ack") {
                logger.info(
                  `[RFQ] ACK received for Swap ${swap.id}, RFQ ID: ${event.rfqId}`,
                );
              } else if (event.type === "noQuote") {
                logger.warn(`[RFQ] No quote available for Swap ${swap.id}`);
              }
            },
            error: (error: unknown) => {
              logger.error(
                `[RFQ] Error in subscription for Swap ${swap.id}:`,
                error,
              );
              subscriptionsRef.current.delete(swap.id);
              subscription.unsubscribe();
              reject(error);
            },
          });

          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener("abort", () => {
              logger.warn(`[RFQ] Abort signal received for Swap ${swap.id}`);
              subscriptionsRef.current.delete(swap.id);
              subscription.unsubscribe();
              reject(new Error("Aborted"));
            });
          }

          logger.info(`[RFQ] Subscription started for Swap ${swap.id}`);
        });
      } catch (error) {
        logger.error(`[RFQ] Exception caught for Swap ${swap.id}:`, error);
        if (retryCount < RETRY_CONFIG.MAX_ATTEMPTS) {
          logger.info(
            `[RFQ] Retrying Swap ${swap.id} (attempt ${retryCount + 1}/${RETRY_CONFIG.MAX_ATTEMPTS})`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_CONFIG.DELAY_MS),
          );
          return getQuoteForSwap(swap, retryCount + 1);
        }

        logger.error(`[RFQ] Max retry attempts reached for Swap ${swap.id}`);
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

    logger.info(`[RFQ] Starting getAllQuotes for ${swaps.length} swaps`);
    // Clean up any existing subscriptions first
    const existingCount = subscriptionsRef.current.size;
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current.clear();
    if (existingCount > 0) {
      logger.info(`[RFQ] Cleaned up ${existingCount} existing subscriptions`);
    }

    abortControllerRef.current = new AbortController();
    dispatch({ type: "START_QUOTING_ALL" });

    try {
      // Execute RFQ requests sequentially (wait for first quote of each)
      // But keep subscriptions alive for continuous background updates
      for (const swap of swaps) {
        if (abortControllerRef.current?.signal.aborted) {
          logger.warn(`[RFQ] getAllQuotes aborted`);
          break;
        }

        logger.info(
          `[RFQ] Processing Swap ${swap.id} (${swaps.indexOf(swap) + 1}/${swaps.length})`,
        );
        try {
          // Wait for first quote, then move to next swap
          // Subscription stays active for continuous updates
          await getQuoteForSwap(swap);
          logger.info(
            `[RFQ] Swap ${swap.id} first quote received, moving to next. Active subscriptions: ${subscriptionsRef.current.size}`,
          );
        } catch (error) {
          logger.error(`[RFQ] Failed to get quote for swap ${swap.id}:`, error);
          // Continue to next swap even if this one fails
        }
      }
    } catch (error) {
      logger.error("[RFQ] Failed to get all quotes:", error);
    } finally {
      logger.info(
        `[RFQ] getAllQuotes finished. Final active subscriptions: ${subscriptionsRef.current.size}`,
      );
      dispatch({ type: "FINISH_QUOTING_ALL" });
      abortControllerRef.current = null;
    }
  }, [swaps, isQuotingAll, dispatch, getQuoteForSwap]);

  const cancelQuoting = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const cleanupSubscriptions = useCallback(() => {
    const count = subscriptionsRef.current.size;
    if (count > 0) {
      logger.info(`[RFQ] Cleaning up ${count} subscriptions`);
    }
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current.clear();
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, [cleanupSubscriptions]);

  return {
    getAllQuotes,
    cancelQuoting,
    cleanupSubscriptions,
    isQuotingAll,
  };
};
