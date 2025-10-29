"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
          <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>
            Application Error
          </h1>
          <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
            A critical error occurred. Please try refreshing the page.
          </p>
          {error.message && (
            <pre
              style={{
                background: "#f3f4f6",
                padding: "1rem",
                borderRadius: "0.375rem",
                overflow: "auto",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: "#0ea5e9",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
