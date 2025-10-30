"use client";

import { AlertCircle, TrendingUp } from "lucide-react";

import { OpportunityCard } from "@/components/arbitrage/OpportunityCard";
import { QuoteStreamStatus } from "@/components/arbitrage/QuoteStreamStatus";
import { ScannerControl } from "@/components/arbitrage/ScannerControl";
import { useArbitrage } from "@/hooks/useArbitrage";

export default function ArbitragePage() {
  const {
    status,
    error,
    currentOpportunity,
    opportunityHistory,
    forwardStream,
    reverseStream,
    startScanning,
    stopScanning,
    clearHistory,
  } = useArbitrage();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          TON DEX Arbitrage Scanner
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time arbitrage opportunity detection for USDT/USDe pair
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:bg-red-950/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-400">
              Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Scanner control */}
        <div className="lg:col-span-1">
          <ScannerControl
            status={status}
            onStart={startScanning}
            onStop={stopScanning}
          />
        </div>

        {/* Right column: Quote streams and opportunities */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quote streams */}
          <div>
            <h2 className="mb-3 text-lg font-bold">Quote Streams</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <QuoteStreamStatus direction="forward" stream={forwardStream} />
              <QuoteStreamStatus direction="reverse" stream={reverseStream} />
            </div>
          </div>

          {/* Current opportunity */}
          {currentOpportunity && (
            <div>
              <h2 className="mb-3 text-lg font-bold">Current Opportunity</h2>
              <OpportunityCard opportunity={currentOpportunity} />
            </div>
          )}

          {/* Opportunity history */}
          {opportunityHistory.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  Opportunity History ({opportunityHistory.length})
                </h2>
                <button
                  onClick={clearHistory}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-3">
                {opportunityHistory.slice(0, 10).map((opp, index) => (
                  <OpportunityCard
                    key={`${opp.timestamp}-${index}`}
                    opportunity={opp}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!currentOpportunity && opportunityHistory.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
              <TrendingUp className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                No Opportunities Yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start scanning to detect arbitrage opportunities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="mt-8 rounded-lg border bg-blue-50 p-6 dark:bg-blue-950/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
          How it works
        </h3>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
          <li>
            • The scanner subscribes to two quote streams simultaneously (USDT →
            USDe and USDe → USDT)
          </li>
          <li>
            • Quotes update automatically every 5-10 seconds without
            re-subscribing
          </li>
          <li>
            • When both quotes are available, the system calculates potential
            profit
          </li>
          <li>
            • Profitable opportunities (after gas costs) are highlighted in
            green
          </li>
        </ul>
      </div>
    </div>
  );
}
