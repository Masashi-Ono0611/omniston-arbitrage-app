"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMultiSwapRfq } from "@/hooks/useMultiSwapRfq";
import { validateSwapsForQuote } from "@/lib/validators";
import { useMultiSwap } from "@/providers/multi-swap";

export const MultiSwapActions = () => {
  const { swaps, isQuotingAll } = useMultiSwap();
  const { getAllQuotes, cancelQuoting } = useMultiSwapRfq();

  const canGetQuotes = validateSwapsForQuote(swaps);

  console.log("[DEBUG] MultiSwapActions rendered", {
    canGetQuotes,
    isQuotingAll,
    swapsLength: swaps.length,
  });

  // Calculate progress
  const completedSwaps = swaps.filter(
    (swap) => swap.status === "success" || swap.status === "error",
  ).length;
  const loadingSwaps = swaps.filter((swap) => swap.status === "loading").length;

  const handleGetQuotes = () => {
    console.log("[DEBUG] Get All Quotes button clicked");
    getAllQuotes();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Get All Quotes Button */}
      <Button
        onClick={handleGetQuotes}
        disabled={!canGetQuotes || isQuotingAll}
        size="lg"
        className="w-full"
      >
        {isQuotingAll ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Getting Quotes ({completedSwaps}/{swaps.length})
          </>
        ) : (
          "Get All Quotes"
        )}
      </Button>

      {/* Cancel Button */}
      {isQuotingAll && (
        <Button
          onClick={cancelQuoting}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Cancel
        </Button>
      )}

      {/* Progress Info - Parallel with live updates */}
      {isQuotingAll && (
        <div className="text-sm text-muted-foreground text-center space-y-1">
          <div>
            {loadingSwaps > 0 && (
              <span>
                Processing {loadingSwaps} swap{loadingSwaps > 1 ? "s" : ""}
                in parallel...
              </span>
            )}
          </div>
          <div>
            {completedSwaps > 0 && (
              <span className="text-green-600 dark:text-green-400">
                ✓ {completedSwaps} quote{completedSwaps > 1 ? "s" : ""} received
                (updating live)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
