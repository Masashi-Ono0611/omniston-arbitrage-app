"use client";

import { Calculator } from "lucide-react";
import type { Quote } from "@ston-fi/omniston-sdk-react";

import { cn } from "@/lib/utils";

interface DebugPanelProps {
  debugInfo: {
    forwardQuote: Quote | null;
    reverseQuote: Quote | null;
    grossProfit: bigint;
    netProfit: bigint;
    profitRate: number;
    targetProfitRate: number;
    isProfitable: boolean;
    gasCost: bigint;
    slippageCost: bigint;
    slippageBps?: number;
    slippageForward?: bigint;
    slippageReverse?: bigint;
    scanAmount: bigint;
  } | null;
  className?: string;
}

export function DebugPanel({ debugInfo, className }: DebugPanelProps) {
  const formatAmount = (amount: bigint, decimals: number = 6): string => {
    const value = Number(amount) / 10 ** decimals;
    return value.toFixed(decimals);
  };

  if (!debugInfo) {
    return (
      <div className={cn("rounded-lg border bg-gray-50 p-4 dark:bg-gray-900", className)}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
          <Calculator className="h-4 w-4" />
          Calculation Debug
        </h3>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Debug information updates in real-time during scanning
        </div>
        <div className="text-xs text-gray-400">
          *Gas cost calculated using hardcoded 1 TON = 2 USDT rate
        </div>
      </div>
    );
  }

  const {
    forwardQuote,
    reverseQuote,
    grossProfit,
    netProfit,
    profitRate,
    targetProfitRate,
    isProfitable,
    gasCost,
    slippageCost,
    slippageBps,
    slippageForward,
    slippageReverse,
    scanAmount,
  } = debugInfo;

  return (
    <div className={cn("rounded-lg border bg-gray-50 p-4 dark:bg-gray-900", className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        <Calculator className="h-4 w-4" />
        Calculation Debug
      </h3>

      <div className="space-y-3 text-xs">
        {/* Quote Status */}
        <div className="rounded-md bg-white p-2 dark:bg-gray-800">
          <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
            Quote Status
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Forward:</span>
              <span className={cn(
                "ml-1 font-mono",
                forwardQuote ? "text-green-600" : "text-red-600"
              )}>
                {forwardQuote ? "✓ Available" : "✗ Missing"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Reverse:</span>
              <span className={cn(
                "ml-1 font-mono",
                reverseQuote ? "text-green-600" : "text-red-600"
              )}>
                {reverseQuote ? "✓ Available" : "✗ Missing"}
              </span>
            </div>
          </div>
        </div>

        {/* Input Values */}
        <div className="rounded-md bg-white p-2 dark:bg-gray-800">
          <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
            Input Values
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Scan Amount:</span>
              <span className="font-mono">{formatAmount(scanAmount)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target Rate:</span>
              <span className="font-mono text-blue-600">
                {(targetProfitRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {forwardQuote && reverseQuote && (
          <div className="rounded-md bg-white p-2 dark:bg-gray-800">
            <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
              Quote Details
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Forward Rate:</span>
                <span className="font-mono">
                  1 USDT → {formatAmount(BigInt(forwardQuote.askUnits))} USDe
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reverse Rate:</span>
                <span className="font-mono">
                  {formatAmount(BigInt(reverseQuote.bidUnits))} USDe → {formatAmount(BigInt(reverseQuote.askUnits))} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Forward Gas:</span>
                <span className="font-mono text-xs">
                  {forwardQuote.estimatedGasConsumption && forwardQuote.estimatedGasConsumption !== ""
                    ? `${(Number(forwardQuote.estimatedGasConsumption) / 1e9).toFixed(9)} TON`
                    : '0.065000000 TON (default)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reverse Gas:</span>
                <span className="font-mono text-xs">
                  {reverseQuote.estimatedGasConsumption && reverseQuote.estimatedGasConsumption !== ""
                    ? `${(Number(reverseQuote.estimatedGasConsumption) / 1e9).toFixed(9)} TON`
                    : '0.065000000 TON (default)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Gas:</span>
                <span className="font-mono text-xs">
                  {(() => {
                    const fwd = forwardQuote.estimatedGasConsumption && forwardQuote.estimatedGasConsumption !== ""
                      ? BigInt(forwardQuote.estimatedGasConsumption)
                      : 0n;
                    const rev = reverseQuote.estimatedGasConsumption && reverseQuote.estimatedGasConsumption !== ""
                      ? BigInt(reverseQuote.estimatedGasConsumption)
                      : 0n;
                    const total = fwd + rev; // nanoTON
                    const totalTon = (Number(total) / 1e9).toFixed(9);
                    return `${totalTon} TON ≒ ${formatAmount(gasCost)} USDT`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Profit Calculation */}
        {forwardQuote && reverseQuote && (
          <div className="rounded-md bg-white p-2 dark:bg-gray-800">
            <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
              Profit Calculation
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Gross Profit:</span>
                <span className={cn(
                  "font-mono",
                  grossProfit > 0n ? "text-green-600" : "text-red-600"
                )}>
                  {formatAmount(grossProfit)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gas Cost:</span>
                <span className="font-mono text-red-600">
                  -{formatAmount(gasCost)} USDT*
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max Slippage Cost:</span>
                <span className="font-mono text-orange-600">
                  -{formatAmount(slippageCost < 0n ? -slippageCost : slippageCost)} USDT
                </span>
              </div>
              <div className="mt-1 space-y-1 pl-2 text-[11px] text-gray-500">
                <div className="flex justify-between">
                  <span>Slippage Tolerance:</span>
                  <span className="font-mono">{slippageBps !== undefined ? (slippageBps / 100).toFixed(2) : "-"}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Forward Slip:</span>
                  <span className="font-mono">-{formatAmount((slippageForward ?? 0n) < 0n ? -(slippageForward as bigint) : (slippageForward ?? 0n))} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span>Reverse Slip:</span>
                  <span className="font-mono">-{formatAmount((slippageReverse ?? 0n) < 0n ? -(slippageReverse as bigint) : (slippageReverse ?? 0n))} USDT</span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span className="font-semibold">Net Profit:</span>
                <span className={cn(
                  "font-mono font-semibold",
                  netProfit > 0n ? "text-green-600" : "text-red-600"
                )}>
                  {formatAmount(netProfit)} USDT
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Final Result */}
        {forwardQuote && reverseQuote && (
          <div className="rounded-md bg-white p-2 dark:bg-gray-800">
            <p className="mb-1 font-semibold text-gray-600 dark:text-gray-400">
              Final Result
            </p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Actual Rate:</span>
                <span className={cn(
                  "font-mono font-semibold",
                  profitRate >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {profitRate > 0 ? "+" : ""}{profitRate.toFixed(3)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Is Profitable:</span>
                <span className={cn(
                  "font-mono font-bold",
                  isProfitable ? "text-green-600" : "text-red-600"
                )}>
                  {isProfitable ? "✓ YES" : "✗ NO"}
                </span>
              </div>
              <div className="mt-2 rounded-sm bg-gray-100 p-2 dark:bg-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  {profitRate >= targetProfitRate 
                    ? `✓ Actual rate (${profitRate.toFixed(3)}%) ≥ Target (${(targetProfitRate * 100).toFixed(1)}%)`
                    : `✗ Actual rate (${profitRate.toFixed(3)}%) < Target (${(targetProfitRate * 100).toFixed(1)}%)`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
