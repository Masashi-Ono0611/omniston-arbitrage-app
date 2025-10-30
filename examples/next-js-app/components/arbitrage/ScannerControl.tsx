"use client";

import { Loader2, Play, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { TOKEN_ADDRESSES } from "@/lib/arbitrage/constants";
import type { ScannerStatus } from "@/lib/arbitrage/types";

interface ScannerControlProps {
  status: ScannerStatus;
  onStart: (
    tokenA: string,
    tokenB: string,
    amount: bigint,
  ) => Promise<void> | void;
  onStop: () => void;
}

export function ScannerControl({
  status,
  onStart,
  onStop,
}: ScannerControlProps) {
  const [scanAmount, setScanAmount] = useState<string>("100");
  const [isStarting, setIsStarting] = useState(false);

  const isScanning = status === "scanning" || status === "initializing";

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const amount = BigInt(Number(scanAmount) * 1_000000); // Convert to 6 decimals
      await onStart(TOKEN_ADDRESSES.USDT, TOKEN_ADDRESSES.USDE, amount);
    } catch (error) {
      console.error("Failed to start scanning:", error);
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
            min="1"
            step="1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Amount to use for arbitrage scanning
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
