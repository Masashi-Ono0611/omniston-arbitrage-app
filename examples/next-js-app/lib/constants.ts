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

/**
 * Swap configuration constants
 */
export const SWAP_CONFIG = {
  /** Maximum number of swaps allowed in multi-swap */
  MAX_SWAPS: 5,
  /** Maximum outgoing messages for a quote request */
  MAX_OUTGOING_MESSAGES: 4,
  /** Transaction validity duration in seconds (5 minutes) */
  TRANSACTION_VALID_DURATION_SECONDS: 5 * 60,
} as const;

/**
 * Cache and query configuration constants
 */
export const CACHE_CONFIG = {
  /** Assets refetch interval in milliseconds (5 minutes) */
  ASSETS_REFETCH_INTERVAL_MS: 5 * 60 * 1000,
  /** Assets stale time (never stale, treat as static) */
  ASSETS_STALE_TIME: Infinity,
} as const;

/**
 * Retry configuration constants
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_ATTEMPTS: 3,
  /** Delay between retries in milliseconds */
  DELAY_MS: 2000,
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  /** Unconditional assets storage key */
  UNCONDITIONAL_ASSETS: "unconditional_assets",
  /** Swap settings storage key */
  SWAP_SETTINGS: "swapSettings",
} as const;
