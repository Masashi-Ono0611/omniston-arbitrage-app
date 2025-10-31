import type { Quote } from "@ston-fi/omniston-sdk-react";
import { isQuoteValid } from "./arbitrage/quote-validator";

/**
 * Validates quotes and throws an error if any are invalid
 * @param quotes Array of quotes with their identifiers
 * @throws Error if any quotes are expired
 */
export const validateQuotesOrThrow = (quotes: { quote: Quote; identifier: string }[]) => {
  const invalidQuotes = quotes.filter(({ quote }) => !isQuoteValid(quote));
  
  if (invalidQuotes.length > 0) {
    const identifiers = invalidQuotes.map(({ identifier }) => identifier);
    throw new Error(
      `Quote is expired: ${identifiers.join(", ")}. Please get a new quote.`
    );
  }
};
