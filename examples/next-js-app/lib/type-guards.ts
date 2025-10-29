import type { Quote } from "@ston-fi/omniston-sdk-react";

import type { SwapItem } from "@/providers/multi-swap";

/**
 * Type guard to check if a swap has a valid quote and rfqId
 * Narrows the type to ensure quote and rfqId are non-null
 * Note: quote and rfqId are always set together, so checking status is sufficient
 */
export const isSwapWithQuote = (
  swap: SwapItem,
): swap is SwapItem & { quote: Quote; rfqId: string } =>
  swap.status === "success" && swap.quote !== null;

/**
 * Checks if a swap item has all required data for operations
 * Used for validation before processing swaps
 */
export const hasValidSwapData = (swap: SwapItem): boolean =>
  Boolean(swap.bidAddress && swap.askAddress && swap.bidAmount);
