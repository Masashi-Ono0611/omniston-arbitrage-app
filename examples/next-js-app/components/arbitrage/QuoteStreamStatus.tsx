"use client";

import { Activity, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

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
  const { status, quote, lastUpdate, error } = stream;

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
