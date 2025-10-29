/**
 * Formats unknown error types into a user-friendly string message
 * Used for displaying errors in UI components
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
};
