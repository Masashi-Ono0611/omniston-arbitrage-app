/**
 * Arbitrage configuration constants
 */

/** Minimum profit rate threshold (%) for arbitrage opportunities */
export const MIN_PROFIT_RATE = 0.1; // 0.1%

/** Default scan amount in USDT (6 decimals) - 100 USDT */
export const DEFAULT_SCAN_AMOUNT = 100_000000n;

/** Estimated gas cost per transaction in nanoTON - approximately 0.5 TON */
export const ESTIMATED_GAS_COST = 500_000000n; // 0.5 TON

/** TON contract addresses for arbitrage pairs */
export const TOKEN_ADDRESSES = {
  /** USDT contract address on TON */
  USDT: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  /** USDe contract address on TON */
  USDE: "EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f",
} as const;

/** Slippage tolerance for arbitrage swaps (in basis points) */
export const ARBITRAGE_SLIPPAGE_BPS = 50; // 0.5%
