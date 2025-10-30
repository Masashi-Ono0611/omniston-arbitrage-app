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
  calculateArbitrageProfit,
  calculateNetProfit,
  calculateReceivedAmount,
  isProfitableArbitrage,
} from "./calculator";
import {
  ARBITRAGE_SLIPPAGE_BPS,
  ESTIMATED_GAS_COST,
  MIN_PROFIT_RATE,
} from "./constants";
import type {
  ArbitrageOpportunity,
  ArbitrageScannerConfig,
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
  
  // Quote stream states
  private forwardStream: QuoteStreamState = {
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle",
    error: null,
  };
  
  private reverseStream: QuoteStreamState = {
    quote: null,
    rfqId: null,
    lastUpdate: 0,
    status: "idle",
    error: null,
  };
  
  // Subscriptions
  private forwardSubscription: { unsubscribe: () => void } | null = null;
  private reverseSubscription: { unsubscribe: () => void } | null = null;
  
  // Callback for opportunity detection
  private onOpportunityCallback?: (opportunity: ArbitrageOpportunity) => void;
  private onErrorCallback?: (error: Error) => void;
  private onQuoteUpdateCallback?: (
    direction: "forward" | "reverse",
    quote: Quote,
  ) => void;

  constructor(
    omniston: Omniston,
    config?: Partial<ArbitrageScannerConfig>,
  ) {
    this.omniston = omniston;
    this.config = {
      minProfitRate: config?.minProfitRate ?? MIN_PROFIT_RATE,
      scanAmount: config?.scanAmount ?? 0n,
      estimatedGasCost: config?.estimatedGasCost ?? ESTIMATED_GAS_COST,
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
  ): Promise<void> {
    // Stop any existing scans
    this.stopScanning();

    // Update scan amount
    this.config.scanAmount = scanAmount;

    // Subscribe to forward stream (tokenA → tokenB)
    await this.subscribeForwardStream(tokenAAddress, tokenBAddress, scanAmount);

    // Wait a moment for forward quote to arrive
    // This ensures we have a valid amount for the reverse stream
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
    callback: (direction: "forward" | "reverse", quote: Quote) => void,
  ): void {
    this.onQuoteUpdateCallback = callback;
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
   * Subscribe to forward quote stream (tokenA → tokenB)
   */
  private async subscribeForwardStream(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: bigint,
  ): Promise<void> {
    this.forwardStream.status = "loading";

    const quoteRequest: QuoteRequest = {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      askAssetAddress: {
        address: tokenBAddress,
        blockchain: Blockchain.TON,
      },
      bidAssetAddress: {
        address: tokenAAddress,
        blockchain: Blockchain.TON,
      },
      amount: {
        bidUnits: amount.toString(),
        askUnits: undefined,
      },
      settlementParams: {
        maxPriceSlippageBps: ARBITRAGE_SLIPPAGE_BPS,
        maxOutgoingMessages: 4,
        gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
        flexibleReferrerFee: false,
      },
    };

    try {
      const observable = await this.omniston.requestForQuote(quoteRequest);

      this.forwardSubscription = observable.subscribe({
        next: (event: QuoteResponseEvent) => {
          this.handleForwardQuoteEvent(event);
        },
        error: (error: unknown) => {
          this.forwardStream.status = "error";
          this.forwardStream.error = String(error);
          this.onErrorCallback?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        },
      });
    } catch (error) {
      this.forwardStream.status = "error";
      this.forwardStream.error = String(error);
      throw error;
    }
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
    this.reverseStream.status = "loading";

    const quoteRequest: QuoteRequest = {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      askAssetAddress: {
        address: tokenAAddress,
        blockchain: Blockchain.TON,
      },
      bidAssetAddress: {
        address: tokenBAddress,
        blockchain: Blockchain.TON,
      },
      amount: {
        bidUnits: reverseAmount.toString(),
        askUnits: undefined,
      },
      settlementParams: {
        maxPriceSlippageBps: ARBITRAGE_SLIPPAGE_BPS,
        maxOutgoingMessages: 4,
        gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
        flexibleReferrerFee: false,
      },
    };

    try {
      const observable = await this.omniston.requestForQuote(quoteRequest);

      this.reverseSubscription = observable.subscribe({
        next: (event: QuoteResponseEvent) => {
          this.handleReverseQuoteEvent(event);
        },
        error: (error: unknown) => {
          this.reverseStream.status = "error";
          this.reverseStream.error = String(error);
          this.onErrorCallback?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        },
      });
    } catch (error) {
      this.reverseStream.status = "error";
      this.reverseStream.error = String(error);
      throw error;
    }
  }

  /**
   * Handle forward quote stream events
   */
  private handleForwardQuoteEvent(event: QuoteResponseEvent): void {
    if (event.type === "quoteUpdated") {
      this.forwardStream.quote = event.quote;
      this.forwardStream.rfqId = event.rfqId;
      this.forwardStream.lastUpdate = Date.now();
      this.forwardStream.status = "active";

      // Notify quote update
      this.onQuoteUpdateCallback?.("forward", event.quote);

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
      this.reverseStream.quote = event.quote;
      this.reverseStream.rfqId = event.rfqId;
      this.reverseStream.lastUpdate = Date.now();
      this.reverseStream.status = "active";

      // Notify quote update
      this.onQuoteUpdateCallback?.("reverse", event.quote);

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
    const { grossProfit, profitRate } = calculateArbitrageProfit(
      forwardQuote,
      reverseQuote,
      this.config.scanAmount,
    );

    const netProfit = calculateNetProfit(
      grossProfit,
      this.config.estimatedGasCost,
    );

    const profitable = isProfitableArbitrage(
      netProfit,
      this.config.minProfitRate,
      this.config.scanAmount,
    );

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
      gasCost: this.config.estimatedGasCost,
      timestamp: Date.now(),
      isProfitable: profitable,
    };

    // Notify if profitable
    if (profitable) {
      this.onOpportunityCallback?.(opportunity);
    }
  }

  /**
   * Wait for forward quote to arrive
   */
  private async waitForForwardQuote(
    timeoutMs: number = 10000,
  ): Promise<void> {
    const startTime = Date.now();

    while (!this.forwardStream.quote) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error("Timeout waiting for forward quote");
      }

      // Wait 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Reset stream states
   */
  private resetStreamStates(): void {
    this.forwardStream = {
      quote: null,
      rfqId: null,
      lastUpdate: 0,
      status: "idle",
      error: null,
    };

    this.reverseStream = {
      quote: null,
      rfqId: null,
      lastUpdate: 0,
      status: "idle",
      error: null,
    };
  }
}
