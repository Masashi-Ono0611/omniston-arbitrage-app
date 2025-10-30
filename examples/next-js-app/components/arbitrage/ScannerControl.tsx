"use client";

import { Loader2, Play, Square, AlertCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_TARGET_PROFIT_RATE, TOKEN_ADDRESSES, INPUT_LIMITS, USDT_DECIMALS } from "@/lib/arbitrage/constants";
import type { ScannerStatus } from "@/lib/arbitrage/types";
import { validateArbitrageParams } from "@/lib/arbitrage/utils";

interface ScannerControlProps {
  status: ScannerStatus;
  onStart: (
    tokenA: string,
    tokenB: string,
    amount: bigint,
    slippageBps: number,
    minProfitRate: number,
  ) => Promise<void> | void;
  onStop: () => void;
}

export function ScannerControl({
  status,
  onStart,
  onStop,
}: ScannerControlProps) {
  const [scanAmount, setScanAmount] = useState<string>("100");
  const [slippagePercent, setSlippagePercent] = useState<string>("0.5");
  const [minProfitRate, setMinProfitRate] = useState<string>((DEFAULT_TARGET_PROFIT_RATE * 100).toString());
  const [isStarting, setIsStarting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isScanning = status === "scanning" || status === "initializing";

  const validateInputs = (): string | null => {
    const amount = Number(scanAmount);
    const slippage = Number(slippagePercent);
    const profitRate = Number(minProfitRate);
    
    if (isNaN(amount) || amount < INPUT_LIMITS.MIN_SCAN_AMOUNT) {
      return `Scan amount must be at least ${INPUT_LIMITS.MIN_SCAN_AMOUNT}`;
    }
    
    if (isNaN(slippage) || slippage < INPUT_LIMITS.MIN_SLIPPAGE_PERCENT || slippage > INPUT_LIMITS.MAX_SLIPPAGE_PERCENT) {
      return `Slippage must be between ${INPUT_LIMITS.MIN_SLIPPAGE_PERCENT}% and ${INPUT_LIMITS.MAX_SLIPPAGE_PERCENT}%`;
    }
    
    if (isNaN(profitRate) || profitRate < 0) {
      return "Minimum profit rate must be non-negative";
    }
    
    return null;
  };

  const handleStart = async () => {
    const error = validateInputs();
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError(null);
    setIsStarting(true);
    try {
      const amount = BigInt(Number(scanAmount) * 10 ** USDT_DECIMALS); // Convert to token decimals
      const slippageBps = Math.round(Number(slippagePercent) * 100); // Convert percent to basis points (100 = 1%)
      const profitRate = Number(minProfitRate) / 100; // Convert percent to decimal
      
      const validationError = validateArbitrageParams(
        TOKEN_ADDRESSES.USDT,
        TOKEN_ADDRESSES.USDE,
        amount,
        slippageBps,
        profitRate
      );
      
      if (validationError) {
        setValidationError(validationError);
        return;
      }
      
      await onStart(TOKEN_ADDRESSES.USDT, TOKEN_ADDRESSES.USDE, amount, slippageBps, profitRate);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Failed to start scanning");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = () => {
    onStop();
  };

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-gray-950">
      <h2 className="mb-4 text-lg font-bold">Scanner Control</h2>

      {validationError && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          {validationError}
        </div>
      )}

      <div className="space-y-4">
        {/* Scan amount input */}
        <div>
          <label
            htmlFor="scanAmount"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Scan Amount (USDT)
          </label>
          <input
            id="scanAmount"
            type="number"
            value={scanAmount}
            onChange={(e) => setScanAmount(e.target.value)}
            disabled={isScanning}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            min={INPUT_LIMITS.MIN_SCAN_AMOUNT}
            step="1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Amount to use for arbitrage scanning
          </p>
        </div>

        {/* Slippage input */}
        <div>
          <label
            htmlFor="slippage"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Slippage Tolerance (%)
          </label>
          <input
            id="slippage"
            type="number"
            value={slippagePercent}
            onChange={(e) => setSlippagePercent(e.target.value)}
            disabled={isScanning}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            min={INPUT_LIMITS.MIN_SLIPPAGE_PERCENT}
            max={INPUT_LIMITS.MAX_SLIPPAGE_PERCENT}
            step="0.1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Maximum price slippage tolerance for profit calculation
          </p>
        </div>

        {/* Minimum profit rate input */}
        <div>
          <label
            htmlFor="profitRate"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Target Profit Rate (%)
          </label>
          <input
            id="profitRate"
            type="number"
            value={minProfitRate}
            onChange={(e) => setMinProfitRate(e.target.value)}
            disabled={isScanning}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            min="-5"
            max="10"
            step="0.1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum profit rate to detect as opportunity (use negative for testing)
          </p>
        </div>

        {/* Trading pair info */}
        <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-900">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Trading Pair
          </p>
          <p className="mt-1 font-mono text-sm font-bold">USDT ⇄ USDe</p>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={handleStart}
              disabled={isStarting || !scanAmount || Number(scanAmount) <= 0}
              className="flex-1"
            >
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="destructive"
              className="flex-1"
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 dark:bg-blue-950/20">
          <div
            className={`h-2 w-2 rounded-full ${
              isScanning ? "animate-pulse bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status:{" "}
            <span className="capitalize">
              {status === "initializing" ? "Starting..." : status}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
