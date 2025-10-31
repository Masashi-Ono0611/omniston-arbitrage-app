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
  const currentTime = Date.now();
  
  // If expired, show "expired at"
  if (deadline.getTime() <= currentTime) {
    return `expired at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
  
  // If today, show just time with seconds
  if (deadline.toDateString() === new Date(currentTime).toDateString()) {
    return `until ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
  
  // If different day, show date and time with seconds
  return `until ${deadline.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
};

/**
 * Validates quotes and throws an error if any are invalid
 */
export const validateQuotesOrThrow = (quotes: { quote: Quote; name: string }[]) => {
  const invalidNames = quotes
    .filter(({ quote }) => !isQuoteValid(quote))
    .map(({ name }) => name);
    
  if (invalidNames.length > 0) {
    throw new Error(`Quote expired: ${invalidNames.join(", ")}. Please get new quotes.`);
  }
};
