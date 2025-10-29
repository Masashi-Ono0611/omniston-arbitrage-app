import { useCallback } from "react";

import { QUERY_ID } from "@/lib/constants";

/**
 * Custom hook for generating and managing QueryIDs
 * @param userAddress User's wallet address (optional)
 * @returns QueryID generation functions
 */
export function useQueryId(userAddress?: string) {
  /**
   * Automatically generate a unique QueryID
   * @returns Generated QueryID (20-digit number string)
   */
  const generateAutoQueryId = useCallback((): string => {
    // Use timestamp (milliseconds) as base and add address suffix for uniqueness
    const timestamp = Date.now().toString();
    const addressSuffix = userAddress
      ? userAddress
          .slice(-QUERY_ID.ADDRESS_SUFFIX_LENGTH)
          .replace(/[^0-9]/g, "")
      : Math.floor(Math.random() * 10 ** QUERY_ID.RANDOM_DIGITS_LENGTH)
          .toString()
          .padStart(QUERY_ID.RANDOM_DIGITS_LENGTH, "0");

    // Combine timestamp and address suffix to generate QueryID
    const baseId = (timestamp + addressSuffix).slice(0, QUERY_ID.LENGTH - 2);
    return baseId.padEnd(QUERY_ID.LENGTH, "0");
  }, [userAddress]);

  /**
   * Generate a QueryID
   * @param queryId Optional QueryID (if specified, only validation is performed)
   * @returns Generated QueryID (20-digit number string)
   */
  const generateQueryId = useCallback(
    (queryId?: string): string => {
      // Validate QueryID specified in arguments
      if (queryId) {
        try {
          BigInt(queryId);
          // Return as-is if valid number
          return queryId;
        } catch (error) {
          console.warn("Invalid query ID format, generating new one:", queryId);
        }
      }

      // Return auto-generated QueryID
      return generateAutoQueryId();
    },
    [generateAutoQueryId],
  );

  /**
   * Convert QueryID to BigInt
   * @param queryId QueryID to convert (if not specified, generate new one)
   * @returns QueryID converted to BigInt
   */
  const getQueryIdAsBigInt = useCallback(
    (queryId?: string): bigint => {
      const idToUse = generateQueryId(queryId);
      try {
        return BigInt(idToUse);
      } catch (error) {
        console.error("Query ID conversion error:", error);
        throw new Error("Invalid query ID format. Please enter a number");
      }
    },
    [generateQueryId],
  );

  return {
    generateQueryId,
    getQueryIdAsBigInt,
    generateAutoQueryId,
  };
}
