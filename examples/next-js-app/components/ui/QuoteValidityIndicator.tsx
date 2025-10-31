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
  const isExpiringSoon = isValid && remainingTime < 60;

  const statusColor = isValid ? (isExpiringSoon ? "text-yellow-600" : "text-green-600") : "text-red-600";
  const statusText = isValid ? "Quote valid" : "Quote expired";

  return (
    <div className={`flex items-center gap-2 ${statusColor}`}>
      {isValid ? (isExpiringSoon ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />) : <AlertCircle className="h-4 w-4" />}
      <span className="text-sm font-medium">{statusText}</span>
      {showExpirationTime && (
        <span className="text-xs text-muted-foreground">
          {formatExpirationTime(quote)}
        </span>
      )}
    </div>
  );
};
