/**
 * Common utility functions for arbitrage components
 */

import type { Quote } from "@ston-fi/omniston-sdk-react";
import type { QuoteStreamState } from "./types";
import { HISTORY_LIMITS, USDT_DECIMALS } from "./constants";

/**
 * Format bigint amount to decimal string
 */
export function formatAmount(amount: bigint, decimals: number = USDT_DECIMALS): string {
  const value = Number(amount) / 10 ** decimals;
  return value.toFixed(decimals);
}

/**
 * Format timestamp to readable time string
 */
export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString();
}

/**
 * Create a quote stream state updater helper
 */
export function createQuoteStreamUpdater() {
  return function updateStream(
    prev: QuoteStreamState,
    quote: Quote,
    rfqId: string,
    receivedAt: number
  ) {
    const newHistory = [
      ...prev.history,
      {
        quote,
        rfqId,
        receivedAt,
        resolverName: quote.resolverName,
      },
    ].slice(-HISTORY_LIMITS.QUOTE_HISTORY); // Keep last quotes

    return {
      quote,
      rfqId,
      lastUpdate: receivedAt,
      status: "active" as const,
      error: null,
      history: newHistory,
    };
  };
}

/**
 * Reset quote stream state to initial values
 */
export function createInitialQuoteStream() {
  return {
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle" as const,
    error: null,
    history: [],
  };
}

/**
 * Calculate profit rate from net profit and initial amount
 */
export function calculateProfitRate(netProfit: bigint, initialAmount: bigint): number {
  if (initialAmount === 0n) return 0;
  // Convert basis points to percentage: (profit * 10000) / amount / 100
  return Number((netProfit * 10000n) / initialAmount) / 100;
}

/**
 * Calculate total gas cost from two quotes
 */
export function calculateTotalGasCost(forwardQuote: Quote, reverseQuote: Quote): bigint {
  const fwd = forwardQuote.estimatedGasConsumption && forwardQuote.estimatedGasConsumption !== ""
    ? BigInt(forwardQuote.estimatedGasConsumption)
    : 0n;
  const rev = reverseQuote.estimatedGasConsumption && reverseQuote.estimatedGasConsumption !== ""
    ? BigInt(reverseQuote.estimatedGasConsumption)
    : 0n;
  return fwd + rev;
}

/**
 * Format gas amount from nanoTON to TON
 */
export function formatGasAmount(nanoTon: bigint): string {
  return (Number(nanoTon) / 1e9).toFixed(9);
}

/**
 * Validate arbitrage parameters
 */
export function validateArbitrageParams(
  tokenAAddress: string,
  tokenBAddress: string,
  amount: bigint,
  slippageBps: number,
  minProfitRate: number
): string | null {
  if (!tokenAAddress || !tokenBAddress) {
    return "Token addresses are required";
  }
  
  if (tokenAAddress === tokenBAddress) {
    return "Token addresses must be different";
  }
  
  if (amount <= 0n) {
    return "Amount must be greater than 0";
  }
  
  if (slippageBps < 0 || slippageBps > 10000) {
    return "Slippage BPS must be between 0 and 10000";
  }
  
  if (minProfitRate < -1) {
    return "Minimum profit rate must be -100% or higher";
  }
  
  return null;
}
