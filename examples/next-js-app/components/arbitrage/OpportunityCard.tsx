"use client";

import { ArrowRight, Play, TrendingUp } from "lucide-react";

import type { ArbitrageOpportunity } from "@/lib/arbitrage/types";
import { cn } from "@/lib/utils";
import { formatAmount, formatTimestamp } from "@/lib/arbitrage/utils";
import { calculateProfitRate } from "@/lib/arbitrage/calculator";
import { Button } from "@/components/ui/button";
import { useArbitrageExecute } from "@/hooks/useArbitrageExecute";
import { useTonWallet } from "@tonconnect/ui-react";

interface OpportunityCardProps {
  opportunity: ArbitrageOpportunity;
  targetProfitRate?: number;
  className?: string;
  showExecuteButton?: boolean;
}

export function OpportunityCard({
  opportunity,
  targetProfitRate,
  className,
  showExecuteButton = false,
}: OpportunityCardProps) {
  const {
    netProfit,
    estimatedProfit,
    gasCost,
    isTargetAchieved,
    timestamp,
    forwardQuote,
    reverseQuote,
    scanAmount,
    slippageCost,
  } = opportunity;

  const { executeArbitrage, isExecuting } = useArbitrageExecute();
  const wallet = useTonWallet();

  const actualRate = calculateProfitRate(netProfit, scanAmount);

  const handleExecute = () => {
    executeArbitrage(opportunity).catch(console.error);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isTargetAchieved
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
                isTargetAchieved ? "text-green-600" : "text-gray-500",
              )}
            />
            <span
              className={cn(
                "text-lg font-bold",
                isTargetAchieved ? "text-green-700" : "text-gray-700",
              )}
            >
              {actualRate > 0 ? "+" : ""}
              {actualRate.toFixed(3)}%
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
              <span>Gross Profit:</span>
              <span className="font-mono">
                {formatAmount(estimatedProfit)} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gas Cost*:</span>
              <span className="font-mono text-red-600">
                -{formatAmount(gasCost)} USDT
              </span>
            </div>
            <div className="flex justify-between">
              <span>Slippage Cost:</span>
              <span className="font-mono text-orange-600">
                -{formatAmount(slippageCost)} USDT
              </span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-semibold">Net Profit:</span>
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
            {targetProfitRate !== undefined && (
              <div className="mt-2 text-xs text-gray-500">
                Target Profit Rate: {(targetProfitRate * 100).toFixed(1)}%
              </div>
            )}
            <div className="text-xs text-gray-400">
              *Gas cost calculated using hardcoded 1 TON = 2 USDT rate
            </div>
          </div>
        </div>

        {/* Status badge and execute button */}
        <div className="ml-4 flex flex-col gap-2">
          {isTargetAchieved && (
            <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white">
              Target Achieved
            </span>
          )}
          {showExecuteButton && (
            <Button
              onClick={handleExecute}
              disabled={!wallet || isExecuting}
              size="sm"
              variant={isTargetAchieved ? "default" : "outline"}
              className="min-w-24"
            >
              {isExecuting ? "Executing..." : <><Play className="mr-1 h-3 w-3" />Execute</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
