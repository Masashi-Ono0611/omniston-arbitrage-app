import type { Quote } from "@ston-fi/omniston-sdk-react";

/**
 * Checks if a quote is still valid based on its trade start deadline
 * @param quote The quote to validate
 * @returns boolean indicating if the quote is still valid
 */
export const isQuoteValid = (quote: Quote): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime < quote.tradeStartDeadline;
};

/**
 * Gets the remaining time until a quote expires
 * @param quote The quote to check
 * @returns Remaining time in seconds, or 0 if already expired
 */
export const getQuoteRemainingTime = (quote: Quote): number => {
  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = quote.tradeStartDeadline - currentTime;
  return Math.max(0, remaining);
};

/**
 * Formats remaining time for display
 * @param remainingTimeInSeconds Time in seconds
 * @returns Formatted string (e.g., "2分30秒", "期限切れ")
 */
export const formatRemainingTime = (remainingTimeInSeconds: number): string => {
  if (remainingTimeInSeconds <= 0) return "期限切れ";
  
  const minutes = Math.floor(remainingTimeInSeconds / 60);
  const seconds = remainingTimeInSeconds % 60;
  
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分`;
  }
  
  return `${seconds}秒`;
};
