"use client";

import { Activity, AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Copy as CopyButton } from "@/components/ui/copy";
import { trimStringWithEllipsis } from "@/lib/utils";
import type { QuoteStreamState } from "@/lib/arbitrage/types";
import { cn } from "@/lib/utils";

interface QuoteStreamStatusProps {
  direction: "forward" | "reverse";
  stream: QuoteStreamState;
  className?: string;
}

export function QuoteStreamStatus({
  direction,
  stream,
  className,
}: QuoteStreamStatusProps) {
  const [showHistory, setShowHistory] = useState(false);
  const { status, quote, lastUpdate, error, history } = stream;

  const formatAmount = (amount: string, decimals: number = 6): string => {
    const value = Number(amount) / 10 ** decimals;
    return value.toFixed(2);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "loading":
        return "Loading...";
      case "active":
        return "Active";
      case "error":
        return "Error";
      default:
        return "Idle";
    }
  };

  const directionLabel = direction === "forward" ? "USDT → USDe" : "USDe → USDT";

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 dark:bg-gray-950",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {directionLabel}
        </h3>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {getStatusText()}
          </span>
        </div>
      </div>

      {quote ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Bid:</span>
            <span className="font-mono font-semibold">
              {formatAmount(quote.bidUnits)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ask:</span>
            <span className="font-mono font-semibold">
              {formatAmount(quote.askUnits)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Rate:</span>
            <span className="font-mono text-xs">
              {(
                Number(quote.askUnits) / Number(quote.bidUnits)
              ).toFixed(6)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Est. Gas Units:</span>
            <span className="font-mono text-xs">
              {quote.estimatedGasConsumption && quote.estimatedGasConsumption !== ""
                ? `${(Number(quote.estimatedGasConsumption) / 1e9).toFixed(9)} TON`
                : 'Not set'}
            </span>
          </div>
          {lastUpdate > 0 && (
            <div className="flex justify-between border-t pt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">
                Updated:
              </span>
              <span className="text-xs font-mono text-gray-500">
                {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Quote history toggle */}
          {history.length > 0 && (
            <div className="border-t pt-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showHistory ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Quote History ({history.length})
              </button>
            </div>
          )}

          {/* Quote history list */}
          {showHistory && history.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <h4 className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
                Quote Updates
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {history.map((entry, index) => (
                  <div
                    key={`${entry.rfqId}-${entry.receivedAt}`}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <span className="text-muted-foreground w-4">
                      {history.length - index}.
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(entry.receivedAt).toLocaleTimeString()}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-mono">
                      {(
                        Number(entry.quote.askUnits) /
                        Number(entry.quote.bidUnits)
                      ).toFixed(6)}
                    </span>
                    <span className="text-muted-foreground ml-2">Quote ID:</span>
                    <CopyButton value={entry.quote.quoteId}>
                      {trimStringWithEllipsis(entry.quote.quoteId, 6)}
                    </CopyButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <p>Waiting for quote...</p>
          )}
        </div>
      )}
    </div>
  );
}
