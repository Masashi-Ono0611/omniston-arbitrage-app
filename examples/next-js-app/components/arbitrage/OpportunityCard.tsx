"use client";

import { ArrowRight, TrendingUp } from "lucide-react";

import type { ArbitrageOpportunity } from "@/lib/arbitrage/types";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
  opportunity: ArbitrageOpportunity;
  className?: string;
}

export function OpportunityCard({
  opportunity,
  className,
}: OpportunityCardProps) {
  const {
    profitRate,
    netProfit,
    isProfitable,
    timestamp,
    forwardQuote,
    reverseQuote,
  } = opportunity;

  const formatAmount = (amount: bigint, decimals: number = 6): string => {
    const value = Number(amount) / 10 ** decimals;
    return value.toFixed(decimals);
  };

  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isProfitable
          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
          : "border-gray-300 bg-gray-50 dark:bg-gray-900",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Profit indicator */}
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp
              className={cn(
                "h-5 w-5",
                isProfitable ? "text-green-600" : "text-gray-500",
              )}
            />
            <span
              className={cn(
                "text-lg font-bold",
                isProfitable ? "text-green-700" : "text-gray-700",
              )}
            >
              {profitRate > 0 ? "+" : ""}
              {profitRate.toFixed(3)}%
            </span>
          </div>

          {/* Trade path */}
          <div className="mb-3 flex items-center gap-2 text-sm">
            <span className="font-mono text-gray-700 dark:text-gray-300">
              {formatAmount(BigInt(forwardQuote.bidUnits))} USDT
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="font-mono text-gray-700 dark:text-gray-300">
              {formatAmount(BigInt(forwardQuote.askUnits))} USDe
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="font-mono text-gray-700 dark:text-gray-300">
              {formatAmount(BigInt(reverseQuote.askUnits))} USDT
            </span>
          </div>

          {/* Profit details */}
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Net Profit:</span>
              <span
                className={cn(
                  "font-mono font-semibold",
                  netProfit > 0n ? "text-green-600" : "text-red-600",
                )}
              >
                {formatAmount(netProfit)} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span>Detected:</span>
              <span className="font-mono">{formatTimestamp(timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        {isProfitable && (
          <div className="ml-4">
            <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white">
              Profitable
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
