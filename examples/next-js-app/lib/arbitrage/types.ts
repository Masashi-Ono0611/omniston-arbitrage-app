import type { Quote } from "@ston-fi/omniston-sdk-react";

/**
 * Base interface for arbitrage calculations
 */
export interface ArbitrageCalculation {
  forwardQuote: Quote | null;
  reverseQuote: Quote | null;
  grossProfit: bigint;
  netProfit: bigint;
  gasCost: bigint;
  slippageCost: bigint;
  scanAmount: bigint;
}

/**
 * Debug information shared between scanner, hook, and panel
 */
export interface DebugInfo extends ArbitrageCalculation {
  targetProfitRate: number;
  slippageBps?: number;
  slippageForward?: bigint;
  slippageReverse?: bigint;
}

/**
 * Arbitrage opportunity detected between two assets
 */
export interface ArbitrageOpportunity extends ArbitrageCalculation {
  /** Asset pair [tokenA, tokenB] */
  pair: [string, string];
  /** Forward quote (tokenA → tokenB) */
  forwardQuote: Quote;
  /** Reverse quote (tokenB → tokenA) */
  reverseQuote: Quote;
  /** Profit rate in percentage (%) */
  profitRate: number;
  /** Estimated profit in base units */
  estimatedProfit: bigint;
  /** Timestamp when opportunity was detected */
  timestamp: number;
  /** Whether this opportunity is profitable after all costs */
  isProfitable: boolean;
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
