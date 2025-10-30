import type { Quote } from "@ston-fi/omniston-sdk-react";
import { 
  DEFAULT_GAS_UNITS, 
  DEFAULT_SLIPPAGE_BPS,
  TON_TO_USDT_RATE, 
  NANO_TON_PER_TON 
} from "./constants";

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
 * Calculate net profit after gas costs and slippage
 */
export function calculateNetProfit(
  grossProfit: bigint,
  gasCost: bigint,
  slippageBps: number = DEFAULT_SLIPPAGE_BPS,
): bigint {
  // Calculate slippage cost (slippageBps / 10000)
  const slippageCost = (grossProfit * BigInt(slippageBps)) / 10000n;
  return grossProfit - gasCost - slippageCost;
}

/**
 * Calculate net profit when explicit slippage cost is provided
 */
export function calculateNetProfitWithSlippageCost(
  grossProfit: bigint,
  gasCost: bigint,
  slippageCost: bigint,
): bigint {
  return grossProfit - gasCost - slippageCost;
}

/**
 * Calculate actual gas cost from quotes (in USDT)
 * Note: Using hardcoded 1 TON = 2 USDT rate for calculation
 * If gasBudget is not set in quotes, falls back to estimated gas consumption or default estimate
 */
export function calculateGasCostFromQuotes(
  forwardQuote: Quote,
  reverseQuote: Quote,
): bigint {
  // Try to extract gas budget from quotes (in nanoTON)
  let forwardGas = 0n;
  let reverseGas = 0n;
  
  // Use estimatedGasConsumption from quotes (convert gas units to nanoTON)
  // estimatedGasConsumption is in gas units, need to convert to nanoTON
  // Assuming 1 gas unit ≈ 1 nanoTON for TON blockchain
  if (forwardQuote.estimatedGasConsumption && forwardQuote.estimatedGasConsumption !== "") {
    forwardGas = BigInt(forwardQuote.estimatedGasConsumption);
  } else {
    // Fallback to default estimate if not available
    forwardGas = DEFAULT_GAS_UNITS;
  }
  
  if (reverseQuote.estimatedGasConsumption && reverseQuote.estimatedGasConsumption !== "") {
    reverseGas = BigInt(reverseQuote.estimatedGasConsumption);
  } else {
    reverseGas = DEFAULT_GAS_UNITS;
  }
  
  // Total gas cost in nanoTON
  const totalGasNanoTON = forwardGas + reverseGas;
  
  // Convert nanoTON to USDT using constants
  const gasCostInUSDT = (totalGasNanoTON * TON_TO_USDT_RATE) / NANO_TON_PER_TON;
  
  return gasCostInUSDT;
}

/**
 * Calculate maximum slippage cost based on notional amounts and slippage tolerance (bps)
 * forwardNotional: initial scan amount in USDT (6 decimals)
 * reverseNotional: expected USDT received from reverse quote (6 decimals)
 */
export function calculateMaxSlippageCost(
  initialAmount: bigint,
  reverseReceivedUsdt: bigint,
  slippageBps: number,
): bigint {
  const forwardSlip = (initialAmount * BigInt(slippageBps)) / 10000n;
  const reverseSlip = (reverseReceivedUsdt * BigInt(slippageBps)) / 10000n;
  return forwardSlip + reverseSlip;
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
