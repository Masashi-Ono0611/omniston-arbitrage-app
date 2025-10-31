"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBatchExecute } from "@/hooks/useBatchExecute";
import { isSwapWithQuote } from "@/lib/type-guards";
import { bigNumberToFloat } from "@/lib/utils";
import { isQuoteValid } from "@/lib/quote-validation";
import { useAssets } from "@/providers/assets";
import { useMultiSwap, useMultiSwapDispatch } from "@/providers/multi-swap";
import { QuoteValidityIndicator } from "@/components/ui/QuoteValidityIndicator";

/**
 * Component for batch executing all swaps in a single transaction
 * QueryID is auto-generated for tracking and debugging
 */
export const MultiSwapBatchExecute = () => {
  const { swaps } = useMultiSwap();
  const wallet = useTonWallet();
  const dispatch = useMultiSwapDispatch();
  const { getAssetByAddress } = useAssets();
  const { executeBatch, isExecuting } = useBatchExecute();

  const [isExecuted, setIsExecuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const swapsWithQuotes = swaps.filter(isSwapWithQuote);

  if (swapsWithQuotes.length === 0) {
    return null;
  }

  // Check if any quotes are invalid
  const hasInvalidQuotes = swapsWithQuotes.some(swap => !swap.quote || !isQuoteValid(swap.quote));

  const handleBatchExecute = async () => {
    setError(null);
    try {
      await executeBatch(swapsWithQuotes);
      setIsExecuted(true);

      // Reset all swap quotes after successful execution
      for (const swap of swapsWithQuotes) {
        dispatch({ type: "RESET_SWAP_QUOTE", payload: swap.id });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute batch transaction");
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Batch Execute All Swaps</h3>
            {isExecuted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 size={20} />
                <span className="font-medium">Executed</span>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Swap List Preview */}
          <div className="space-y-2">
            {swapsWithQuotes.map((swap, index) => {
              const swapBidAsset = getAssetByAddress(swap.bidAddress);
              const askAsset = getAssetByAddress(swap.askAddress);

              if (!swapBidAsset || !askAsset || !swap.quote) return null;

              return (
                <div
                  key={swap.id}
                  className="flex flex-col gap-2 text-sm p-3 bg-card border rounded"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                      {index + 1}
                    </div>
                    <span className="flex-1 truncate">
                      {bigNumberToFloat(
                        swap.quote.bidUnits,
                        swapBidAsset.meta.decimals,
                      )}{" "}
                      {swapBidAsset.meta.symbol} →{" "}
                      {bigNumberToFloat(
                        swap.quote.askUnits,
                        askAsset.meta.decimals,
                      )}{" "}
                      {askAsset.meta.symbol}
                    </span>
                  </div>
                  <QuoteValidityIndicator 
                    quote={swap.quote} 
                    showExpirationTime={true}
                  />
                </div>
              );
            })}
          </div>

          {/* Execute Button */}
          {!isExecuted && (
            <Button
              onClick={handleBatchExecute}
              disabled={!wallet || isExecuting || hasInvalidQuotes}
              size="lg"
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Executing Batch Transaction...
                </>
              ) : hasInvalidQuotes ? (
                "Some quotes have expired"
              ) : (
                `Execute All ${swapsWithQuotes.length} Swaps (Batch)`
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
