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
 * Calculate net profit after gas costs and slippage
 */
export function calculateNetProfit(
  grossProfit: bigint,
  gasCost: bigint,
  slippageBps: number = 50, // Default 0.5%
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
    console.log('[GAS] Forward estimatedGasConsumption:', forwardQuote.estimatedGasConsumption, '→', forwardGas.toString());
  } else {
    // Fallback to default estimate if not available (0.065 TON = 65_000_000 nanoTON)
    forwardGas = 65_000_000n;
    console.log('[GAS] Forward using default:', forwardGas.toString());
  }
  
  if (reverseQuote.estimatedGasConsumption && reverseQuote.estimatedGasConsumption !== "") {
    reverseGas = BigInt(reverseQuote.estimatedGasConsumption);
    console.log('[GAS] Reverse estimatedGasConsumption:', reverseQuote.estimatedGasConsumption, '→', reverseGas.toString());
  } else {
    reverseGas = 65_000_000n;
    console.log('[GAS] Reverse using default:', reverseGas.toString());
  }
  
  // Total gas cost in nanoTON
  const totalGasNanoTON = forwardGas + reverseGas;
  console.log('[GAS] Total nanoTON:', totalGasNanoTON.toString());
  
  // Convert nanoTON to USDT (1 TON = 2 USDT, hardcoded)
  // 1 TON = 1_000_000_000 nanoTON
  // 1 TON = 2 USDT = 2_000_000 USDT (6 decimals)
  // Formula: nanoTON × 2_000_000 (USDT with 6 decimals) ÷ 1_000_000_000 (nanoTON per TON)
  const gasCostInUSDT = (totalGasNanoTON * 2_000_000n) / 1_000_000_000n;
  console.log('[GAS] Gas cost in USDT:', gasCostInUSDT.toString(), '(', Number(gasCostInUSDT) / 1e6, 'USDT)');
  
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
