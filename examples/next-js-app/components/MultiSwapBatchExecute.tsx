"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBatchExecute } from "@/hooks/useBatchExecute";
import { isSwapWithQuote } from "@/lib/type-guards";
import { bigNumberToFloat } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import { useMultiSwap, useMultiSwapDispatch } from "@/providers/multi-swap";

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

  const swapsWithQuotes = swaps.filter(isSwapWithQuote);

  if (swapsWithQuotes.length === 0) {
    return null;
  }

  const handleBatchExecute = async () => {
    await executeBatch(swapsWithQuotes);
    setIsExecuted(true);

    // Reset all swap quotes after successful execution
    for (const swap of swapsWithQuotes) {
      dispatch({ type: "RESET_SWAP_QUOTE", payload: swap.id });
    }
  };

  // Get bid asset from first swap for display
  const firstBidAddress = swapsWithQuotes[0]?.bidAddress;
  const bidAsset = firstBidAddress ? getAssetByAddress(firstBidAddress) : null;

  if (!bidAsset) {
    return null;
  }

  const totalBidAmount = swapsWithQuotes.reduce(
    (sum, swap) => sum + parseFloat(swap.quote.bidUnits),
    0,
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Batch Execute All Swaps</h3>
              <p className="text-sm text-muted-foreground">
                Execute {swapsWithQuotes.length} swap
                {swapsWithQuotes.length > 1 ? "s" : ""} in one transaction
              </p>
            </div>
            {isExecuted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 size={20} />
                <span className="font-medium">Executed</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-secondary/50 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Swaps:</span>
              <span className="font-medium">{swapsWithQuotes.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Bid Amount:</span>
              <span className="font-medium">
                {bigNumberToFloat(
                  totalBidAmount.toString(),
                  bidAsset.meta.decimals,
                )}{" "}
                {bidAsset.meta.symbol}
              </span>
            </div>
          </div>

          {/* Swap List Preview */}
          <div className="space-y-2">
            {swapsWithQuotes.map((swap, index) => {
              const swapBidAsset = getAssetByAddress(swap.bidAddress);
              const askAsset = getAssetByAddress(swap.askAddress);

              if (!swapBidAsset || !askAsset) return null;

              return (
                <div
                  key={swap.id}
                  className="flex items-center gap-2 text-sm p-2 bg-card border rounded"
                >
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
              );
            })}
          </div>

          {/* Execute Button */}
          {!isExecuted && (
            <Button
              onClick={handleBatchExecute}
              disabled={!wallet || isExecuting}
              size="lg"
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Executing Batch Transaction...
                </>
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
