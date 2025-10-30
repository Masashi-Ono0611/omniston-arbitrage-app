# Omniston Next.js Demo App

A production-ready Next.js application demonstrating the Omniston SDK for multi-swap operations on the TON blockchain. This app showcases best practices in DeFi application architecture, state management, and transaction handling.

🔗 **Live Demo**: [https://omniston.ston.fi](https://omniston.ston.fi)

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
/hooks            # Custom React hooks for business logic
/lib              # Utility functions and helpers
/providers        # React Context providers for state management
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

## RFQ Processing Flow

### Hybrid Strategy Implementation
The multi-swap RFQ system uses a hybrid approach for optimal performance:

1. **Initialization Phase**
   - Cleanup existing subscriptions
   - Set up AbortController for cancellation
   - Dispatch `START_QUOTING_ALL` to update UI

2. **Sequential First Quote Phase**
   ```typescript
   for (const swap of swaps) {
     await getQuoteForSwap(swap); // Wait for first quote
     // Move to next swap
   }
   ```

3. **Parallel Continuous Updates Phase**
   - All subscriptions remain active
   - Each swap receives independent quote updates
   - UI updates in real-time via React state

4. **Quote History Tracking**
   ```typescript
   quoteHistory: [{
     quoteId: string;
     receivedAt: number;
     resolverName?: string;
   }]
   ```

### Error Handling
- **Individual swap failures**: Don't block other swaps
- **Subscription cleanup**: Proper memory management
- **Abort handling**: Graceful cancellation support

### RFQ Unsubscribe Functionality

The application supports manual cancellation of individual RFQ subscriptions:

1. **Individual Swap Unsubscribe**
   - Each active swap displays an "Unsubscribe" button
   - Clicking stops quote updates for that specific swap
   - Status changes from "Quote received & updating..." to "Quote received (RFQ stopped)"

2. **State Management**
   ```typescript
   export type SwapItem = {
     // ... other properties
     isRfqActive: boolean; // Tracks if RFQ is still active
   };
   ```

3. **Implementation Details**
   - **Hook Centralization**: Single `useMultiSwapRfq` instance shared across components
   - **Subscription Tracking**: Active subscriptions stored in `subscriptionsRef`
   - **Server Communication**: Calls `v1beta7.quote.unsubscribe` method
   - **UI Updates**: Real-time status reflection with proper state transitions

4. **Usage**
   ```typescript
   const { unsubscribeSwap } = useMultiSwapRfq();
   await unsubscribeSwap(swapId); // Manually stop RFQ for specific swap
   ```

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