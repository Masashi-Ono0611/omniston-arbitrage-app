import type { Quote } from "@ston-fi/omniston-sdk-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import type {
  ArbitrageOpportunity,
  DebugInfo,
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
  const [error, setError] = useState<string | null>(null);
  const [currentOpportunity, setCurrentOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [opportunityHistory, setOpportunityHistory] = useState<ArbitrageOpportunity[]>([]);
  const [currentMinProfitRate, setCurrentMinProfitRate] = useState<number>(0.001); // Default 0.1%
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [forwardStream, setForwardStream] = useState<QuoteStreamState>({
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle",
    error: null,
    history: [],
  });
  const [reverseStream, setReverseStream] = useState<QuoteStreamState>({
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle",
    error: null,
    history: [],
  });

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

      scannerRef.current.onDebug((debugData) => {
        logger.debug("Arbitrage calculation debug:", debugData);
        setDebugInfo(debugData);
      });

      scannerRef.current.onQuoteUpdate((direction, quote, rfqId, receivedAt) => {
        if (direction === "forward") {
          setForwardStream((prev) => {
            // Add to history (like sample's SET_SWAP_QUOTE)
            const newHistory = [
              ...prev.history,
              {
                quote,
                rfqId,
                receivedAt,
                resolverName: quote.resolverName,
              },
            ].slice(-20); // Keep last 20

            // Force new object reference (like sample)
            return {
              quote,
              rfqId,
              lastUpdate: receivedAt,
              status: "active" as const,
              error: null,
              history: newHistory,
            };
          });
        } else {
          setReverseStream((prev) => {
            // Add to history (like sample's SET_SWAP_QUOTE)
            const newHistory = [
              ...prev.history,
              {
                quote,
                rfqId,
                receivedAt,
                resolverName: quote.resolverName,
              },
            ].slice(-20); // Keep last 20

            // Force new object reference (like sample)
            return {
              quote,
              rfqId,
              lastUpdate: receivedAt,
              status: "active" as const,
              error: null,
              history: newHistory,
            };
          });
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
   * Start scanning
   */
  const startScanning = useCallback(
    async (tokenAAddress: string, tokenBAddress: string, amount: bigint, slippageBps: number, minProfitRate: number) => {
      if (!scannerRef.current) {
        throw new Error("Scanner not initialized");
      }

      setStatus("initializing");
      setError(null);
      setCurrentMinProfitRate(minProfitRate);

      try {
        await scannerRef.current.startScanning(tokenAAddress, tokenBAddress, amount, slippageBps, minProfitRate);
        setStatus("scanning");
        logger.info("Arbitrage scanning started");
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error("Failed to start arbitrage scanning:", error);
        setError(error.message);
        setStatus("error");
        throw error;
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
        history: [],
      });
      setReverseStream({
        quote: null,
        rfqId: null,
        lastUpdate: 0,
        status: "idle",
        error: null,
        history: [],
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

    // Configuration
    currentMinProfitRate,

    // Debug information
    debugInfo,

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
