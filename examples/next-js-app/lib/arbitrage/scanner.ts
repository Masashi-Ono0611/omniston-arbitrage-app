import {
  Blockchain,
  GaslessSettlement,
  type Omniston,
  type Quote,
  type QuoteRequest,
  type QuoteResponseEvent,
  SettlementMethod,
} from "@ston-fi/omniston-sdk-react";

import {
  DEFAULT_GAS_UNITS,
  DEFAULT_SLIPPAGE_BPS,
  DEFAULT_TARGET_PROFIT_RATE,
  POLLING_INTERVAL_MS,
} from "./constants";
import {
  calculateArbitrageProfit,
  calculateGasCostFromQuotes,
  calculateNetProfit,
  calculateReceivedAmount,
  calculateProfitRate,
  isProfitableArbitrage,
} from "@/lib/arbitrage/calculator";
import type {
  ArbitrageOpportunity,
  ArbitrageScannerConfig,
  DebugInfo,
  QuoteStreamState,
} from "./types";

/**
 * Real-time arbitrage scanner using dual Observable streams
 * 
 * This scanner subscribes to two quote streams simultaneously:
 * 1. Forward stream: tokenA → tokenB
 * 2. Reverse stream: tokenB → tokenA
 * 
 * Both streams continuously update every 5-10 seconds, allowing
 * real-time arbitrage opportunity detection without re-subscribing.
 */
export class ArbitrageScanner {
  private omniston: Omniston;
  private config: ArbitrageScannerConfig;
  private currentSlippageBps: number = DEFAULT_SLIPPAGE_BPS;
  private currentMinProfitRate: number = DEFAULT_TARGET_PROFIT_RATE;
  
  private createInitialStreamState(): QuoteStreamState {
    return {
      quote: null,
      rfqId: null,
      lastUpdate: 0,
      status: "idle",
      error: null,
      history: [],
    };
  }

  // Quote stream states
  private forwardStream: QuoteStreamState = this.createInitialStreamState();
  private reverseStream: QuoteStreamState = this.createInitialStreamState();
  
  // Subscriptions
  private forwardSubscription: { unsubscribe: () => void } | null = null;
  private reverseSubscription: { unsubscribe: () => void } | null = null;
  
  // Callback for opportunity detection
  private onOpportunityCallback?: (opportunity: ArbitrageOpportunity) => void;
  private onErrorCallback?: (error: Error) => void;
  private onQuoteUpdateCallback?: (
    direction: "forward" | "reverse",
    quote: Quote,
    rfqId: string,
    receivedAt: number,
  ) => void;
  private onDebugCallback?: (debugInfo: DebugInfo) => void;

  constructor(
    omniston: Omniston,
    config?: Partial<ArbitrageScannerConfig>,
  ) {
    this.omniston = omniston;
    this.config = {
      minProfitRate: config?.minProfitRate ?? DEFAULT_TARGET_PROFIT_RATE,
      scanAmount: config?.scanAmount ?? 0n,
      estimatedGasCost: config?.estimatedGasCost ?? DEFAULT_GAS_UNITS,
    };
  }

  /**
   * Start scanning for arbitrage opportunities
   * Subscribes to both forward and reverse quote streams
   */
  async startScanning(
    tokenAAddress: string,
    tokenBAddress: string,
    scanAmount: bigint,
    slippageBps: number = DEFAULT_SLIPPAGE_BPS,
    minProfitRate: number = DEFAULT_TARGET_PROFIT_RATE,
  ): Promise<void> {
    // Stop any existing scans
    this.stopScanning();

    // Update scan amount, slippage, and profit rate
    this.config.scanAmount = scanAmount;
    this.currentSlippageBps = slippageBps;
    this.currentMinProfitRate = minProfitRate;

    // Subscribe to forward stream (tokenA → tokenB)
    await this.subscribeForwardStream(tokenAAddress, tokenBAddress, scanAmount, slippageBps);

    // Wait for forward quote to arrive
    await this.waitForForwardQuote();

    // Subscribe to reverse stream (tokenB → tokenA)
    await this.subscribeReverseStream(tokenBAddress, tokenAAddress);
  }

  /**
   * Stop scanning and unsubscribe from all streams
   */
  stopScanning(): void {
    if (this.forwardSubscription) {
      this.forwardSubscription.unsubscribe();
      this.forwardSubscription = null;
    }

    if (this.reverseSubscription) {
      this.reverseSubscription.unsubscribe();
      this.reverseSubscription = null;
    }

    this.resetStreamStates();
  }

  /**
   * Set callback for when arbitrage opportunity is detected
   */
  onOpportunity(callback: (opportunity: ArbitrageOpportunity) => void): void {
    this.onOpportunityCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Set callback for quote updates
   */
  onQuoteUpdate(
    callback: (
      direction: "forward" | "reverse",
      quote: Quote,
      rfqId: string,
      receivedAt: number,
    ) => void,
  ): void {
    this.onQuoteUpdateCallback = callback;
  }

  /**
   * Set callback for debug information
   */
  onDebug(callback: (debugInfo: DebugInfo) => void): void {
    this.onDebugCallback = callback;
  }

  /**
   * Get current stream states
   */
  getStreamStates(): {
    forward: QuoteStreamState;
    reverse: QuoteStreamState;
  } {
    return {
      forward: { ...this.forwardStream },
      reverse: { ...this.reverseStream },
    };
  }

  /**
   * Subscribe to quote stream (generic method)
   */
  private async subscribeStream(
    direction: "forward" | "reverse",
    bidAssetAddress: string,
    askAssetAddress: string,
    amount: bigint,
    slippageBps: number,
  ): Promise<void> {
    const stream = direction === "forward" ? this.forwardStream : this.reverseStream;
    stream.status = "loading";

    const quoteRequest: QuoteRequest = {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      askAssetAddress: {
        address: askAssetAddress,
        blockchain: Blockchain.TON,
      },
      bidAssetAddress: {
        address: bidAssetAddress,
        blockchain: Blockchain.TON,
      },
      amount: {
        bidUnits: amount.toString(),
        askUnits: undefined,
      },
      settlementParams: {
        maxPriceSlippageBps: slippageBps,
        maxOutgoingMessages: 4,
        gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
        flexibleReferrerFee: false,
      },
    };

    try {
      const observable = await this.omniston.requestForQuote(quoteRequest);

      const subscription = observable.subscribe({
        next: (event: QuoteResponseEvent) => {
          if (direction === "forward") {
            this.handleForwardQuoteEvent(event);
          } else {
            this.handleReverseQuoteEvent(event);
          }
        },
        error: (error: unknown) => {
          stream.status = "error";
          stream.error = String(error);
          this.onErrorCallback?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        },
      });

      if (direction === "forward") {
        this.forwardSubscription = subscription;
      } else {
        this.reverseSubscription = subscription;
      }
    } catch (error) {
      stream.status = "error";
      stream.error = String(error);
      throw error;
    }
  }

  /**
   * Subscribe to forward quote stream (tokenA → tokenB)
   */
  private async subscribeForwardStream(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: bigint,
    slippageBps: number,
  ): Promise<void> {
    await this.subscribeStream("forward", tokenAAddress, tokenBAddress, amount, slippageBps);
  }

  /**
   * Subscribe to reverse quote stream (tokenB → tokenA)
   */
  private async subscribeReverseStream(
    tokenBAddress: string,
    tokenAAddress: string,
  ): Promise<void> {
    // Calculate amount from forward quote
    if (!this.forwardStream.quote) {
      throw new Error("Forward quote not available");
    }

    const reverseAmount = calculateReceivedAmount(this.forwardStream.quote);
    await this.subscribeStream("reverse", tokenBAddress, tokenAAddress, reverseAmount, this.currentSlippageBps);
  }

  /**
   * Handle forward quote stream events
   */
  private handleForwardQuoteEvent(event: QuoteResponseEvent): void {
    if (event.type === "quoteUpdated") {
      const receivedAt = Date.now();
      
      // Update internal state
      this.forwardStream.quote = event.quote;
      this.forwardStream.rfqId = event.rfqId;
      this.forwardStream.lastUpdate = receivedAt;
      this.forwardStream.status = "active";

      // Notify quote update (hook will manage history)
      this.onQuoteUpdateCallback?.("forward", event.quote, event.rfqId, receivedAt);

      // Check for arbitrage opportunity
      this.checkArbitrageOpportunity();
    } else if (event.type === "unsubscribed") {
      this.forwardStream.status = "idle";
    }
  }

  /**
   * Handle reverse quote stream events
   */
  private handleReverseQuoteEvent(event: QuoteResponseEvent): void {
    if (event.type === "quoteUpdated") {
      const receivedAt = Date.now();
      
      // Update internal state
      this.reverseStream.quote = event.quote;
      this.reverseStream.rfqId = event.rfqId;
      this.reverseStream.lastUpdate = receivedAt;
      this.reverseStream.status = "active";

      // Notify quote update (hook will manage history)
      this.onQuoteUpdateCallback?.("reverse", event.quote, event.rfqId, receivedAt);

      // Check for arbitrage opportunity
      this.checkArbitrageOpportunity();
    } else if (event.type === "unsubscribed") {
      this.reverseStream.status = "idle";
    }
  }

  /**
   * Check if current quotes present an arbitrage opportunity
   */
  private checkArbitrageOpportunity(): void {
    const { quote: forwardQuote } = this.forwardStream;
    const { quote: reverseQuote } = this.reverseStream;

    // Both quotes must be available
    if (!forwardQuote || !reverseQuote) {
      return;
    }

    // Calculate profit
    const { grossProfit } = calculateArbitrageProfit(
      forwardQuote,
      reverseQuote,
      this.config.scanAmount,
    );

    // Calculate actual gas cost from quotes
    const actualGasCost = calculateGasCostFromQuotes(forwardQuote, reverseQuote);

    // Max slippage cost using notionals (USDT 6-decimals)
    const reverseReceivedUsdt = calculateReceivedAmount(reverseQuote);
    const forwardSlip = (this.config.scanAmount * BigInt(this.currentSlippageBps)) / 10000n;
    const reverseSlip = (reverseReceivedUsdt * BigInt(this.currentSlippageBps)) / 10000n;
    const slippageCost = forwardSlip + reverseSlip;

    const netProfit = calculateNetProfit(
      grossProfit,
      actualGasCost,
      slippageCost,
    );

    const profitRate = calculateProfitRate(netProfit, this.config.scanAmount);

    const profitable = isProfitableArbitrage(
      netProfit,
      this.currentMinProfitRate,
      this.config.scanAmount,
    );

    // Send debug information (always)
    this.onDebugCallback?.({
      forwardQuote,
      reverseQuote,
      grossProfit,
      netProfit,
      targetProfitRate: this.currentMinProfitRate,
      gasCost: actualGasCost,
      slippageCost,
      slippageBps: this.currentSlippageBps,
      slippageForward: forwardSlip,
      slippageReverse: reverseSlip,
      scanAmount: this.config.scanAmount,
    });

    // Create opportunity object
    const opportunity: ArbitrageOpportunity = {
      pair: [
        forwardQuote.bidAssetAddress.address,
        forwardQuote.askAssetAddress.address,
      ],
      forwardQuote,
      reverseQuote,
      profitRate,
      estimatedProfit: grossProfit,
      netProfit,
      gasCost: actualGasCost,
      grossProfit,
      slippageCost,
      scanAmount: this.config.scanAmount,
      timestamp: Date.now(),
      isProfitable: profitable,
    };

    // Notify if profitable
    if (profitable) {
      this.onOpportunityCallback?.(opportunity);
    }
  }

  /**
   * Wait for forward quote to arrive with timeout
   */
  private async waitForForwardQuote(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();
    
    while (!this.forwardStream.quote) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout waiting for forward quote after ${timeoutMs}ms`);
      }
      
      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
    }
  }

  /**
   * Reset stream states
   */
  private resetStreamStates(): void {
    this.forwardStream = this.createInitialStreamState();
    this.reverseStream = this.createInitialStreamState();
  }
}
