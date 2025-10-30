/**
 * Common utility functions for arbitrage components
 */

import type { Quote } from "@ston-fi/omniston-sdk-react";
import type { QuoteStreamState } from "./types";

/**
 * Format bigint amount to decimal string
 */
export function formatAmount(amount: bigint, decimals: number = 6): string {
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
export function createQuoteStreamUpdater(
  _direction: "forward" | "reverse"
) {
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
    ].slice(-20); // Keep last 20

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
  return Number((netProfit * 10000n) / initialAmount) / 100;
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
  
  if (minProfitRate < 0) {
    return "Minimum profit rate must be non-negative";
  }
  
  return null;
}
