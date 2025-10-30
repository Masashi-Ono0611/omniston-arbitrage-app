import type { Quote } from "@ston-fi/omniston-sdk-react";

/**
 * Calculate the amount received from a quote
 */
export function calculateReceivedAmount(quote: Quote): bigint {
  if (!quote.askUnits) {
    throw new Error("Quote does not contain askUnits");
  }
  return BigInt(quote.askUnits);
}

/**
 * Calculate arbitrage profit from forward and reverse quotes
 */
export function calculateArbitrageProfit(
  forwardQuote: Quote,
  reverseQuote: Quote,
  initialAmount: bigint,
): {
  receivedAmount: bigint;
  grossProfit: bigint;
  profitRate: number;
} {
  // Calculate final amount after round trip
  const receivedAmount = calculateReceivedAmount(reverseQuote);
  const grossProfit = receivedAmount - initialAmount;
  
  // Calculate profit rate as percentage
  // Use Number for percentage calculation to avoid precision issues
  const profitRate =
    Number((grossProfit * 10000n) / initialAmount) / 100;

  return {
    receivedAmount,
    grossProfit,
    profitRate,
  };
}

/**
 * Calculate net profit after gas costs
 */
export function calculateNetProfit(
  grossProfit: bigint,
  gasCost: bigint,
): bigint {
  return grossProfit - gasCost;
}

/**
 * Check if arbitrage opportunity is profitable
 */
export function isProfitableArbitrage(
  netProfit: bigint,
  minProfitRate: number,
  initialAmount: bigint,
): boolean {
  if (netProfit <= 0n) {
    return false;
  }

  const actualProfitRate = Number((netProfit * 10000n) / initialAmount) / 100;
  return actualProfitRate >= minProfitRate;
}
