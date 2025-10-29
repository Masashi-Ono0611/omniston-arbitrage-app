import type { SwapItem } from "@/providers/multi-swap";

/**
 * Validates a float value string
 * Accepts formats: "123", "123.45", ".45", "123."
 */
export const validateFloatValue = (value: string): boolean =>
  /^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(value);

/**
 * Validates a single swap item has all required fields for quote request
 */
export const validateSwapItem = (swap: SwapItem): boolean =>
  Boolean(
    swap.bidAddress &&
      swap.askAddress &&
      swap.bidAmount &&
      parseFloat(swap.bidAmount) > 0,
  );

/**
 * Validates all swaps in array are ready for quote request
 */
export const validateSwapsForQuote = (swaps: SwapItem[]): boolean =>
  swaps.every(validateSwapItem);
