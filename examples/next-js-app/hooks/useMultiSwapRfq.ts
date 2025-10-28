import {
  Blockchain,
  GaslessSettlement,
  type QuoteRequest,
  type QuoteResponseEvent,
  SettlementMethod,
} from "@ston-fi/omniston-sdk-react";
import { useCallback, useRef } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { floatToBigNumber, percentToPercentBps } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import {
  type SwapItem,
  useMultiSwap,
  useMultiSwapDispatch,
} from "@/providers/multi-swap";

const TON_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

export const useMultiSwapRfq = () => {
  const omniston = useOmniston();
  const { swaps, isQuotingAll } = useMultiSwap();
  const dispatch = useMultiSwapDispatch();
  const { getAssetByAddress } = useAssets();
  const abortControllerRef = useRef<AbortController | null>(null);

  const getQuoteForSwap = useCallback(
    async (swap: SwapItem, retryCount = 0): Promise<void> => {
      if (!swap.askAddress || !swap.bidAmount) {
        throw new Error("Missing required fields");
      }

      const bidAsset = getAssetByAddress(TON_ADDRESS);
      const askAsset = getAssetByAddress(swap.askAddress);

      if (!bidAsset || !askAsset) {
        throw new Error("Asset not found");
      }

      const quoteRequest: QuoteRequest = {
        settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
        askAssetAddress: {
          address: swap.askAddress,
          blockchain: Blockchain.TON,
        },
        bidAssetAddress: {
          address: TON_ADDRESS,
          blockchain: Blockchain.TON,
        },
        amount: {
          bidUnits: floatToBigNumber(
            swap.bidAmount,
            bidAsset.meta.decimals,
          ).toString(),
          askUnits: undefined,
        },
        settlementParams: {
          maxPriceSlippageBps: percentToPercentBps(swap.slippage),
          maxOutgoingMessages: 4,
          gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
          flexibleReferrerFee: false,
        },
      };

      try {
        dispatch({
          type: "SET_SWAP_STATUS",
          payload: { id: swap.id, status: "loading", error: null },
        });

        const observable = await omniston.requestForQuote(quoteRequest);

        return new Promise((resolve, reject) => {
          const subscription = observable.subscribe({
            next: (event: QuoteResponseEvent) => {
              if (event.type === "quoteUpdated") {
                dispatch({
                  type: "SET_SWAP_QUOTE",
                  payload: { id: swap.id, quote: event.quote },
                });
                subscription.unsubscribe();
                resolve();
              } else if (event.type === "unsubscribed") {
                subscription.unsubscribe();
                reject(new Error("Quote request timed out"));
              }
            },
            error: (error: unknown) => {
              subscription.unsubscribe();
              reject(error);
            },
          });

          // Abort handling
          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener("abort", () => {
              subscription.unsubscribe();
              reject(new Error("Aborted"));
            });
          }
        });
      } catch (error) {
        // Retry logic
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          console.warn(
            `Retry ${retryCount + 1}/${MAX_RETRY_ATTEMPTS} for swap ${swap.id}`,
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          return getQuoteForSwap(swap, retryCount + 1);
        }

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        dispatch({
          type: "SET_SWAP_STATUS",
          payload: { id: swap.id, status: "error", error: errorMessage },
        });
        throw error;
      }
    },
    [omniston, dispatch, getAssetByAddress],
  );

  const getAllQuotes = useCallback(async () => {
    if (isQuotingAll) return;

    abortControllerRef.current = new AbortController();
    dispatch({ type: "START_QUOTING_ALL" });

    try {
      for (let i = 0; i < swaps.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          break;
        }

        const swap = swaps[i];
        if (!swap) continue;

        dispatch({ type: "SET_CURRENT_QUOTING_INDEX", payload: i });
        await getQuoteForSwap(swap);
      }
    } catch (error) {
      console.error("Failed to get all quotes:", error);
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
