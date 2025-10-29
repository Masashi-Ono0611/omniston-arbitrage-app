"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMultiSwapRfq } from "@/hooks/useMultiSwapRfq";
import { validateSwapsForQuote } from "@/lib/validators";
import { useMultiSwap } from "@/providers/multi-swap";

export const MultiSwapActions = () => {
  const { swaps, isQuotingAll, currentQuotingIndex } = useMultiSwap();
  const { getAllQuotes, cancelQuoting } = useMultiSwapRfq();

  const canGetQuotes = validateSwapsForQuote(swaps);

  return (
    <div className="flex flex-col gap-3">
      {/* Get All Quotes Button */}
      <Button
        onClick={getAllQuotes}
        disabled={!canGetQuotes || isQuotingAll}
        size="lg"
        className="w-full"
      >
        {isQuotingAll ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Getting Quotes ({(currentQuotingIndex ?? 0) + 1}/{swaps.length})
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

      {/* Progress Info */}
      {isQuotingAll && currentQuotingIndex !== null && (
        <div className="text-sm text-muted-foreground text-center">
          Processing Swap {currentQuotingIndex + 1} of {swaps.length}...
        </div>
      )}
    </div>
  );
};
