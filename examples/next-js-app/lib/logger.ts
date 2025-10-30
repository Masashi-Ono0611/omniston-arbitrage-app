/**
 * Logging utility that conditionally outputs based on environment
 * Prevents logging in production while maintaining debug output in development
 */

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  /**
   * Debug level logging - only outputs in development
   * Use for detailed debugging information
   */
  debug: (message: string, ...data: unknown[]) => {
    if (isDevelopment) {
      console.debug(message, ...data);
    }
  },

  /**
   * Info level logging - only outputs in development
   * Use for general informational messages
   */
  info: (message: string, ...data: unknown[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...data);
    }
  },

  /**
   * Warning level logging - only outputs in development
   * Use for potential issues or deprecation notices
   */
  warn: (message: string, ...data: unknown[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...data);
    }
  },

  /**
   * Error level logging - only outputs in development
   * Use for error messages and debugging
   */
  error: (message: string, ...data: unknown[]) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...data);
    }
  },
} as const;
