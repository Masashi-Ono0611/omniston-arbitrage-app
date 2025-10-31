import type { Quote } from "@ston-fi/omniston-sdk-react";

export interface ArbitrageCalculation {
  forwardQuote: Quote | null;
  reverseQuote: Quote | null;
  grossProfit: bigint;
  netProfit: bigint;
  gasCost: bigint;
  slippageCost: bigint;
  scanAmount: bigint;
}

export interface DebugInfo extends ArbitrageCalculation {
  targetProfitRate: number;
  slippageBps?: number;
  slippageForward?: bigint;
  slippageReverse?: bigint;
}

export interface ArbitrageOpportunity extends ArbitrageCalculation {
  pair: [string, string];
  forwardQuote: Quote;
  reverseQuote: Quote;
  profitRate: number;
  estimatedProfit: bigint;
  timestamp: number;
  isTargetAchieved: boolean;
  slippageBps: number;
}

/**
 * Configuration for arbitrage scanner
 */
export interface ArbitrageScannerConfig {
  /** Minimum profit rate threshold (%) */
  minProfitRate: number;
  /** Amount to use for scanning (in base units) */
  scanAmount: bigint;
  /** Estimated gas cost per transaction (in nanoTON) */
  estimatedGasCost: bigint;
}

/**
 * Status of the arbitrage scanner
 */
export type ScannerStatus = "idle" | "initializing" | "scanning" | "error";

/**
 * Quote history entry
 */
export interface QuoteHistoryEntry {
  quote: Quote;
  rfqId: string;
  receivedAt: number;
  resolverName?: string;
}

/**
 * Quote stream state
 */
export interface QuoteStreamState {
  quote: Quote | null;
  rfqId: string | null;
  lastUpdate: number;
  status: "idle" | "loading" | "active" | "error";
  error: string | null;
  history: QuoteHistoryEntry[];
}
