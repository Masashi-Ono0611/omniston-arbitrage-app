/**
 * Arbitrage configuration constants
 */


/** Default scan amount in USDT (6 decimals) - 100 USDT */
export const DEFAULT_SCAN_AMOUNT = 100_000_000n;

/** Default target profit rate for arbitrage detection - 0.1% */
export const DEFAULT_TARGET_PROFIT_RATE = 0.001;

/** Default gas units for transactions in nanoTON - fallback and estimate */
export const DEFAULT_GAS_UNITS = 0n;

/** Default slippage tolerance for arbitrage swaps (in basis points) */
export const DEFAULT_SLIPPAGE_BPS = 50; // 0.5%

/** TON to USDT rate (6 decimals) - 2 USDT */
export const TON_TO_USDT_RATE = 2_000_000n;

/** Conversion rate from TON to nanoTON */
export const NANO_TON_PER_TON = 1_000_000_000n; // 1 TON = 1,000,000,000 nanoTON

/** TON contract addresses for arbitrage pairs */
export const TOKEN_ADDRESSES = {
  /** USDT contract address on TON */
  USDT: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  /** USDe contract address on TON */
  USDE: "EQAIb6KmdfdDR7CN1GBqVJuP25iCnLKCvBlJ07Evuu2dzP5f",
} as const;


