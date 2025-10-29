/**
 * QueryID configuration constants
 */
export const QUERY_ID = {
  /** Default QueryID value */
  DEFAULT: "0",
  /** Total length of QueryID (20 digits) */
  LENGTH: 20,
  /** Length of address suffix used in QueryID generation */
  ADDRESS_SUFFIX_LENGTH: 6,
  /** Length of random digits when address is not available */
  RANDOM_DIGITS_LENGTH: 6,
} as const;
