import type { Quote } from "@ston-fi/omniston-sdk-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import type {
  ArbitrageOpportunity,
  QuoteStreamState,
  ScannerStatus,
} from "@/lib/arbitrage/types";
import { ArbitrageScanner } from "@/lib/arbitrage/scanner";
import { logger } from "@/lib/logger";

/**
 * Custom hook for arbitrage scanning
 * 
 * Manages the lifecycle of ArbitrageScanner and provides
 * React state for UI integration
 */
export const useArbitrage = () => {
  const omniston = useOmniston();
  const scannerRef = useRef<ArbitrageScanner | null>(null);

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [currentOpportunity, setCurrentOpportunity] =
    useState<ArbitrageOpportunity | null>(null);
  const [opportunityHistory, setOpportunityHistory] = useState<
    ArbitrageOpportunity[]
  >([]);
  const [forwardStream, setForwardStream] = useState<QuoteStreamState>({
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle",
    error: null,
  });
  const [reverseStream, setReverseStream] = useState<QuoteStreamState>({
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle",
    error: null,
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize scanner
   */
  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new ArbitrageScanner(omniston);

      // Set up callbacks
      scannerRef.current.onOpportunity((opportunity) => {
        logger.info("Arbitrage opportunity detected:", opportunity);
        setCurrentOpportunity(opportunity);
        setOpportunityHistory((prev) => [opportunity, ...prev].slice(0, 50)); // Keep last 50
      });

      scannerRef.current.onError((err) => {
        logger.error("Arbitrage scanner error:", err);
        setError(err.message);
        setStatus("error");
      });

      scannerRef.current.onQuoteUpdate((direction, quote) => {
        if (direction === "forward") {
          setForwardStream((prev) => ({
            ...prev,
            quote,
            lastUpdate: Date.now(),
            status: "active",
          }));
        } else {
          setReverseStream((prev) => ({
            ...prev,
            quote,
            lastUpdate: Date.now(),
            status: "active",
          }));
        }
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stopScanning();
      }
    };
  }, [omniston]);

  /**
   * Start scanning for arbitrage opportunities
   */
  const startScanning = useCallback(
    async (
      tokenAAddress: string,
      tokenBAddress: string,
      scanAmount: bigint,
    ) => {
      if (!scannerRef.current) {
        throw new Error("Scanner not initialized");
      }

      try {
        setStatus("initializing");
        setError(null);
        setCurrentOpportunity(null);

        await scannerRef.current.startScanning(
          tokenAAddress,
          tokenBAddress,
          scanAmount,
        );

        setStatus("scanning");
        logger.info("Arbitrage scanning started");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        setStatus("error");
        logger.error("Failed to start scanning:", err);
        throw err;
      }
    },
    [],
  );

  /**
   * Stop scanning
   */
  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stopScanning();
      setStatus("idle");
      setForwardStream({
        quote: null,
        rfqId: null,
        lastUpdate: 0,
        status: "idle",
        error: null,
      });
      setReverseStream({
        quote: null,
        rfqId: null,
        lastUpdate: 0,
        status: "idle",
        error: null,
      });
      logger.info("Arbitrage scanning stopped");
    }
  }, []);

  /**
   * Clear opportunity history
   */
  const clearHistory = useCallback(() => {
    setOpportunityHistory([]);
  }, []);

  /**
   * Get quotes for manual execution
   */
  const getQuotesForExecution = useCallback(():
    | { forward: Quote; reverse: Quote }
    | null => {
    if (!forwardStream.quote || !reverseStream.quote) {
      return null;
    }

    return {
      forward: forwardStream.quote,
      reverse: reverseStream.quote,
    };
  }, [forwardStream.quote, reverseStream.quote]);

  return {
    // Status
    status,
    error,
    isScanning: status === "scanning",

    // Current opportunity
    currentOpportunity,
    opportunityHistory,

    // Stream states
    forwardStream,
    reverseStream,

    // Actions
    startScanning,
    stopScanning,
    clearHistory,
    getQuotesForExecution,
  };
};
