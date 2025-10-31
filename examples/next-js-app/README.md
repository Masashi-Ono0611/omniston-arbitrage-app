# Omniston Next.js Demo App

A production-ready Next.js application demonstrating the Omniston SDK for multi-swap operations and arbitrage opportunities on the TON blockchain. This app showcases best practices in DeFi application architecture, state management, and transaction handling.

🔗 **Live Demo**: [https://omniston.ston.fi](https://omniston.ston.fi)

## Features

### Multi-Swap Operations
- Execute multiple token swaps in a single transaction
- Real-time quote fetching from multiple DEXs
- Batch transaction execution with gas optimization
- Support for up to 5 simultaneous swaps

### Arbitrage Scanner
- Real-time detection of arbitrage opportunities between USDT/USDe pairs
- Live quote streaming from forward and reverse directions
- Profit calculation including gas and slippage costs
- Target profit rate configuration
- One-click arbitrage execution for detected opportunities
- Collapsible opportunity history with detailed tracking

### Key Components
- **Scanner Control**: Start/stop arbitrage scanning with configurable parameters
- **Quote Stream Status**: Real-time monitoring of bid/ask quotes and gas estimates
- **Opportunity Cards**: Visual display of profitable opportunities with execution buttons
- **Debug Panel**: Detailed calculation breakdown for development and analysis

## Quick Start

1. Install dependencies:
```sh
pnpm install
```

2. Set up environment variables:
```sh
cp .env.example .env
```

3. Run the development server:
```sh
turbo dev
```

The app will be available at `http://localhost:3000`.

## Architecture & Design Principles

### Code Organization

The application follows a clean, modular architecture with clear separation of concerns:

```
/app              # Next.js App Router pages and API routes
/components       # React components (UI + business logic)
  /arbitrage      # Arbitrage-specific components
/hooks            # Custom React hooks for business logic
/lib              # Utility functions and helpers
  /arbitrage      # Arbitrage calculation and type definitions
/providers        # React Context providers for state management
/models           # TypeScript type definitions
/queries          # React Query query factories
```

### Component Naming Strategy

#### Shared Components (No Prefix)
Reusable utilities that can be used across different features:
- `SwapSettings.tsx` - Global swap configuration
- `AssetSelect.tsx` - Asset selection dropdown
- `ConnectionStatus.tsx` - Wallet connection indicator
- `Header.tsx` - Application header

#### Feature-Specific Components (`Multi` Prefix)
Components specific to the multi-swap functionality:
- `MultiSwapForm.tsx` - Multi-swap configuration form
- `MultiSwapActions.tsx` - Quote request actions
- `MultiSwapBatchExecute.tsx` - Batch transaction execution
- `MultiSwapQuotePreview.tsx` - Quote visualization with history
- `MultiSwapHeader.tsx` - Feature header component

#### Arbitrage Components (Located in `/components/arbitrage/`)
Components specific to the arbitrage scanning functionality:
- `OpportunityCard.tsx` - Display arbitrage opportunities with execution buttons
- `QuoteStreamStatus.tsx` - Real-time quote monitoring with collapsible history
- `DebugPanel.tsx` - Detailed calculation breakdown and debugging information
- `ScannerControl.tsx` - Arbitrage scanner configuration and control

**Why retain the `Multi` prefix?**
1. **Future-proof**: Allows single-swap feature to be added without naming conflicts
2. **Clear intent**: Immediately identifies components handling multiple operations
3. **Consistency**: Maintains a predictable naming pattern

### Key Design Decisions

#### 1. **Hybrid RFQ Strategy** (`hooks/useMultiSwapRfq.ts`)
Implements a sophisticated quote fetching approach:
- **Sequential First Quote**: Process swaps one-by-one for initial quotes
- **Parallel Continuous Updates**: All subscriptions remain active for real-time updates
- **Quote History**: Tracks all quote updates with timestamps and resolver information
- **Error Resilience**: Failed swaps don't block others from processing

#### 2. **Performance Optimization**
- **React.memo**: Component memoization prevents unnecessary re-renders
- **useCallback**: Stabilizes function references across renders
- **useEffect Cleanup**: Proper memory management for subscriptions and timeouts
- **Optimized State Updates**: Force new object references for React change detection

#### 3. **SDK Bug Fix** (`packages/omniston-sdk/src/ApiClient/ApiClient.ts`)
Fixed critical subscription routing bug:
- **Problem**: Closure-captured Map reference prevented multiple subscriptions
- **Solution**: Always reference latest Map in addMethod callback
- **Impact**: Enables proper parallel quote updates for multiple swaps

#### 4. **Type-Safe State Management** (`providers/multi-swap.tsx`)
```typescript
export type SwapItem = {
  id: string;
  quoteHistory: {
    quoteId: string;
    receivedAt: number;
    resolverName?: string;
  }[];
  // ... other properties
};
```

#### 5. **Environment-Aware Logging** (`lib/logger.ts`)
Conditional logging that prevents production leaks - debug output in development, silent in production.

#### 4. **Memoized Provider Functions** (`providers/assets.tsx`)
All provider functions are wrapped in `useCallback` to prevent unnecessary re-renders and stabilize dependency chains.

#### 5. **Factory Pattern for State Initialization** (`providers/multi-swap.tsx`)
Consistent object creation using `createEmptySwap()` factory function - eliminates duplication and ensures consistency.

#### 6. **Separation of Concerns: UI vs Logic** (`hooks/useBatchExecute.ts`, `hooks/useArbitrageExecute.ts`)
Business logic in hooks (transaction building, message construction), presentation in components (user interaction, visual feedback).

#### 7. **Arbitrage Execution Pattern** (`hooks/useArbitrageExecute.ts`)
Single arbitrage execution follows the same pattern as batch execution:
- Parallel building of forward and reverse transfers
- Message combination and QueryID application
- Single transaction sending with proper error handling

#### 8. **Provider Hierarchy** (`providers/index.tsx`)
Carefully ordered provider stack:
```
1. QueryClient → 2. TonConnect → 3. Assets → 4. Omniston → 5. SwapSettings → 6. MultiSwap
```
Clear dependency flow prevents initialization issues.

#### 9. **Utility Function Consistency** (`lib/utils.ts`)
Single-purpose utility functions (`decimalToPercent`, `percentToDecimal`) are self-documenting and prevent inline calculations.

## Important Implementation Notes

### Asset Management
- **Dynamic loading**: All assets fetched from Ston.fi API
- **No hardcoded addresses**: Assets are API-driven, not hardcoded
- **Wallet-aware**: Shows user's balance assets + popular assets

### State Management
- **React Context**: For global state (assets, settings, multi-swap)
- **Optimized updates**: Force new references for React change detection
- **Quote history**: Persistent tracking of all quote updates

## Environment Variables

Required environment variables (see `.env.example`):

```bash
OMNIDEMO__TONCONNECT__MANIFEST_URL=https://omniston.ston.fi/api/tonconnect-manifest
OMNIDEMO__OMNISTON__API_URL=wss://omni-ws.ston.fi
OMNIDEMO__STON_API=https://api.ston.fi
OMNIDEMO__STON_API__ASSETS_QUERY_CONDITION='...'
OMNIDEMO__STON_API__ASSETS_SEARCH_CONDITION='...'
```

`NODE_ENV` is automatically set by Next.js - do not set it manually.

## Build & Deployment

### Development
```sh
pnpm dev  # Starts on http://localhost:3000
```

### Production Build
```sh
pnpm build  # Builds optimized production bundle
pnpm start  # Serves production build
```

### Docker
```sh
docker build -t omniston-demo .
docker run -p 3000:3000 omniston-demo
```

## Code Quality

### Linting & Formatting
```sh
pnpm lint    # Run Biome linter
pnpm format  # Format code with Biome
```

### Type Checking
```sh
pnpm turbo build  # Includes TypeScript type checking
```