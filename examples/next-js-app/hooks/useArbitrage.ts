import type { Quote } from "@ston-fi/omniston-sdk-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useOmniston } from "@/hooks/useOmniston";
import { DEFAULT_TARGET_PROFIT_RATE, HISTORY_LIMITS } from "@/lib/arbitrage/constants";
import type {
  ArbitrageOpportunity,
  DebugInfo,
  QuoteStreamState,
  ScannerStatus,
} from "@/lib/arbitrage/types";
import { ArbitrageScanner } from "@/lib/arbitrage/scanner";
import { logger } from "@/lib/logger";
import { createQuoteStreamUpdater, createInitialQuoteStream, validateArbitrageParams } from "@/lib/arbitrage/utils";

/**
 * Custom hook for arbitrage scanning
 * 
 * Manages the lifecycle of ArbitrageScanner and provides
 * React state for UI integration
 */
export const useArbitrage = () => {
  const omniston = useOmniston();
  const scannerRef = useRef<ArbitrageScanner | null>(null);
  const updateForwardStream = useRef(createQuoteStreamUpdater("forward"));
  const updateReverseStream = useRef(createQuoteStreamUpdater("reverse"));

  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentOpportunity, setCurrentOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [opportunityHistory, setOpportunityHistory] = useState<ArbitrageOpportunity[]>([]);
  const [currentMinProfitRate, setCurrentMinProfitRate] = useState<number>(DEFAULT_TARGET_PROFIT_RATE);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [forwardStream, setForwardStream] = useState<QuoteStreamState>(createInitialQuoteStream());
  const [reverseStream, setReverseStream] = useState<QuoteStreamState>(createInitialQuoteStream());

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
        setOpportunityHistory((prev) => [opportunity, ...prev].slice(0, HISTORY_LIMITS.OPPORTUNITY_HISTORY)); // Keep last opportunities
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
          setForwardStream(prev => updateForwardStream.current(prev, quote, rfqId, receivedAt));
        } else {
          setReverseStream(prev => updateReverseStream.current(prev, quote, rfqId, receivedAt));
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

      // Validate parameters
      const validationError = validateArbitrageParams(tokenAAddress, tokenBAddress, amount, slippageBps, minProfitRate);
      if (validationError) {
        throw new Error(validationError);
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
      setForwardStream(createInitialQuoteStream());
      setReverseStream(createInitialQuoteStream());
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
    return forwardStream.quote && reverseStream.quote
      ? { forward: forwardStream.quote, reverse: reverseStream.quote }
      : null;
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
