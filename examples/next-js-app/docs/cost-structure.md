# Cost Structure in the Omniston Arbitrage dApp

This document explains how the arbitrage dApp models and accounts for the costs of swapping on decentralized exchanges.

It connects:
- The cost taxonomy from *"The Costs of Swapping on Decentralized Exchanges"*
- The data returned in Omniston `Quote` objects
- How this dApp uses those values in its arbitrage and debug calculations

The goal is to clarify what is included in each number you see in the UI (especially in the **Calculation Debug** panel) and avoid any double-counting of costs.

---

## 1. Cost taxonomy from the paper

The paper "The Costs of Swapping on Decentralized Exchanges" separates swap costs into four main categories:

1. **Gas Cost**  
   The cost of paying blockchain transaction fees (e.g. TON gas) to execute the swap and related messages.

2. **Protocol / LP Fees**  
   Fees charged by the DEX protocol and liquidity providers.  
   Examples: Uniswap pool fee (e.g. 0.05% / 0.3%), protocol fee on top, routing fees across multiple pools.

3. **Price Impact**  
   The effect of trade size on the execution price due to the AMM curve and pool liquidity.  
   Even without explicit fees, a large trade against a finite pool moves the price unfavorably.

4. **Slippage Cost**  
   Additional cost caused by price movements *between* quote time and actual execution (e.g. market moves while the transaction is pending).  
   Often captured via a slippage tolerance parameter and manifests as a worse-than-quoted execution price.

In short:
- (1) is pure gas / network cost
- (2) and (3) are embedded in the **execution price**
- (4) is the risk that the **actual execution price** deviates from the quoted price

---

## 2. What Omniston `Quote` returns

The dApp uses `Quote` from `@ston-fi/omniston-sdk(-react)`.

Relevant fields (simplified):

```ts
interface Quote {
  // Core trade amounts
  bidUnits: string; // Amount of bid asset the trader must pay, including all fees
  askUnits: string; // Amount of ask asset the trader will get after all fees

  // Fee breakdown
  referrerFeeAsset?: Address;
  referrerFeeUnits: string;
  protocolFeeAsset?: Address;
  protocolFeeUnits: string;

  // Gas estimation
  gasBudget: string;             // Total gas budget for the trade (nanoTON)
  estimatedGasConsumption: string; // Estimated gas units consumed (nanoTON)

  // Metadata
  quoteId: string;
  resolverName: string;
  quoteTimestamp: number;
  tradeStartDeadline: number;
}
```

Key points from the official comments in the proto files:

- `bidUnits`  
  > "The amount of bid asset the trader must pay, **including all fees**."

- `askUnits`  
  > "The amount of ask asset the trader will get **after all fees**."

- `protocolFeeUnits`  
  > "The amount of fees charged by the **protocol** (in units of the asset specified in `protocol_fee_asset`)."

- `referrerFeeUnits`  
  > "The amount of fees that the **referrer** will get."

Therefore:

- `bidUnits` / `askUnits` already include:
  - DEX / LP trading fees
  - Omniston protocol fees
  - Referrer fees (if configured)
- There is **no separate field** for LP fee or price impact. They are embedded into the effective execution rate encoded by `bidUnits` and `askUnits`.

Gas-related data (`gasBudget`, `estimatedGasConsumption`) is provided separately and is **not** included in `bidUnits` / `askUnits`.

---

## 3. How the dApp uses these values

### 3.1 Forward and reverse rates (Quote Details)

In the **Calculation Debug** panel, the *Quote Details* section displays for the forward direction:

> Forward Rate: `100.000000 USDT → 100.071533 USDe`

This is computed as:

- Input amount: `scanAmount` (e.g. 100 USDT)
- Output amount: `forwardQuote.askUnits` (USDe), formatted via `formatAmount`

In code (`DebugPanel.tsx`):

```ts
{formatAmount(debugInfo.scanAmount)} USDT → {formatAmount(BigInt(forwardQuote.askUnits))} USDe
```

So **Forward Rate is the fully fee-inclusive effective rate** returned by the Omniston resolver:

- **LP / DEX fees:** already inside `askUnits`
- **Protocol fees:** already reflected in `bidUnits` / `askUnits`
- **Referrer fee:** already reflected in `bidUnits` / `askUnits`

The dApp does **not** subtract LP/protocol/referrer fees a second time.

---

### 3.2 Gross profit

Gross profit for an arbitrage round trip is computed purely from quotes:

- Start with `initialAmount` (scan amount in USDT)
- After forward+reverse quotes, compute final received USDT

In code (`calculator.ts`):

```ts
const receivedAmount = calculateReceivedAmount(reverseQuote); // reverseQuote.askUnits
const grossProfit = receivedAmount - initialAmount;
```

Therefore, `grossProfit` already reflects:

- The **combined effect** of
  - LP / DEX trading fees
  - Omniston protocol fees
  - Referrer fees
  - Price impact due to the AMM curve and route

It does **not** include gas cost or additional slippage risk. Those are handled separately.

---

### 3.3 Gas cost

Gas cost is derived from `estimatedGasConsumption`:

```ts
const actualGasCost = calculateGasCostFromQuotes(forwardQuote, reverseQuote);
```

Implementation (simplified):

- Sum forward and reverse `estimatedGasConsumption` (nanoTON)
- Convert nanoTON → USDT using fixed constants:
  - `NANO_TON_PER_TON`
  - `TON_TO_USDT_RATE` (e.g. 1 TON = 2 USDT)

This yields `gasCost` in USDT terms.

`netProfit` is then computed as:

```ts
netProfit = grossProfit - gasCost - slippageCost;
```

**Important:**
- Gas cost is **not** part of `bidUnits` / `askUnits`
- It is subtracted **exactly once** from `grossProfit` as a separate cost component

---

### 3.4 Slippage cost

The dApp models slippage as a **worst-case additional cost** based on the user-defined slippage tolerance (`slippageBps`).

In `scanner.ts`:

```ts
const reverseReceivedUsdt = calculateReceivedAmount(reverseQuote); // reverseQuote.askUnits
const forwardSlip = (scanAmount * BigInt(slippageBps)) / 10000n;
const reverseSlip = (reverseReceivedUsdt * BigInt(slippageBps)) / 10000n;
const slippageCost = forwardSlip + reverseSlip;

netProfit = calculateNetProfit(grossProfit, actualGasCost, slippageCost);
```

This means:

- The app assumes **both legs** of the arbitrage could slip by up to `slippageBps` in notional terms.
- `slippageCost` is treated as a *risk buffer* and subtracted once from `grossProfit`.
- If the real execution occurs at exactly the quoted price, this cost is conservative (overestimation), but it ensures the arbitrage opportunity remains robust under adverse price movements.

Price impact that is already present **at quote time** is in `grossProfit` via `bidUnits` / `askUnits`.  
Slippage cost models **future price movement up to the allowed tolerance**, not the existing price impact.

---

## 4. Mapping the 4 cost categories to this dApp

Putting everything together:

1. **Gas Cost**  
   - Source: `Quote.estimatedGasConsumption` / `gasBudget`  
   - Handling: Converted to USDT (`gasCost`) and subtracted once from `grossProfit`.

2. **Protocol / LP Fees**  
   - Source: Embedded in `bidUnits` / `askUnits` (execution price).  
   - Additional fields: `protocolFeeUnits`, `referrerFeeUnits` give extra breakdown, but the core effect is already in the rate.  
   - Handling: Reflected exactly once in `grossProfit` via `receivedAmount - initialAmount`.  
   - The dApp does **not** subtract them again as separate cost items.

3. **Price Impact**  
   - Source: Also embedded in `bidUnits` / `askUnits` as part of the effective execution price.  
   - Handling: Reflected once in `grossProfit`.  
   - The app does **not** compute or display explicit `priceImpactBps`, nor does it double-count it in a separate term.

4. **Slippage Cost**  
   - Source: User-configured `slippageBps` (and protocol limits via `maxPriceSlippageBps`).  
   - Handling: DApp computes a **maximum slippage cost** based on notionals (forward + reverse) and subtracts it once as `slippageCost` from `grossProfit`.

From the implementation perspective:

- Each of the four categories is accounted for **exactly once**.
- There is no place where the same cost is subtracted twice (no double counting).
- The only approximation is that *future* slippage is modeled as a worst-case buffer, which is intentional and conservative.

---

## 5. Summary

- **Forward / Reverse rates** in the UI already reflect:
  - LP / DEX fees
  - Protocol fees
  - Referrer fees
  - Price impact at the time of quoting

- **Gas cost** is calculated explicitly from `estimatedGasConsumption` and subtracted from gross profit.

- **Slippage cost** is modeled explicitly from the user’s slippage tolerance and subtracted as a maximal risk buffer.

As a result, the arbitrage calculations in this dApp are:
- Aligned with the four cost categories from the DEX cost literature, and
- Designed to avoid double-counting any individual cost component.
