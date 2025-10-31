import type { Quote } from "@ston-fi/omniston-sdk-react";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

import { getQuoteRemainingTime, formatExpirationTime, isQuoteValid } from "@/lib/quote-validation";

interface QuoteValidityIndicatorProps {
  quote: Quote;
  showExpirationTime?: boolean;
}

export const QuoteValidityIndicator = ({ 
  quote, 
  showExpirationTime = true
}: QuoteValidityIndicatorProps) => {
  const isValid = isQuoteValid(quote);
  const remainingTime = getQuoteRemainingTime(quote);

  if (!isValid) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Quote expired</span>
        {showExpirationTime && (
          <span className="text-xs text-muted-foreground">
            {formatExpirationTime(quote)}
          </span>
        )}
      </div>
    );
  }

  const isExpiringSoon = remainingTime < 60; // 1 minute

  return (
    <div className={`flex items-center gap-2 ${isExpiringSoon ? "text-yellow-600" : "text-green-600"}`}>
      {isExpiringSoon ? (
        <Clock className="h-4 w-4" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">Quote valid</span>
      {showExpirationTime && (
        <span className="text-xs text-muted-foreground">
          {formatExpirationTime(quote)}
        </span>
      )}
    </div>
  );
};
