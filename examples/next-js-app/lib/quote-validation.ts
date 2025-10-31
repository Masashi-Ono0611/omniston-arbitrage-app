import type { Quote } from "@ston-fi/omniston-sdk-react";

/**
 * Checks if a quote is still valid based on its trade start deadline
 */
export const isQuoteValid = (quote: Quote): boolean => {
  return Math.floor(Date.now() / 1000) < quote.tradeStartDeadline;
};

/**
 * Gets the remaining time until a quote expires in seconds
 */
export const getQuoteRemainingTime = (quote: Quote): number => {
  const remaining = quote.tradeStartDeadline - Math.floor(Date.now() / 1000);
  return Math.max(0, remaining);
};

/**
 * Formats expiration time as absolute time
 */
export const formatExpirationTime = (quote: Quote): string => {
  const deadline = new Date(quote.tradeStartDeadline * 1000);
  const now = new Date();
  
  // If expired, show "expired at"
  if (deadline <= now) {
    return `expired at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
  
  // If today, show just time with seconds
  if (deadline.toDateString() === now.toDateString()) {
    return `until ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
  
  // If different day, show date and time with seconds
  return `until ${deadline.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
};

/**
 * Validates quotes and throws an error if any are invalid
 */
export const validateQuotesOrThrow = (quotes: { quote: Quote; name: string }[]) => {
  const invalid = quotes.filter(({ quote }) => !isQuoteValid(quote));
  
  if (invalid.length > 0) {
    const names = invalid.map(({ name }) => name);
    throw new Error(`Quote expired: ${names.join(", ")}. Please get new quotes.`);
  }
};
