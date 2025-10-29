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
/models           # TypeScript type definitions
/quries           # React Query query factories
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
- `MultiSwapQuotePreview.tsx` - Quote visualization
- `MultiSwapHeader.tsx` - Feature header component

**Why retain the `Multi` prefix?**
1. **Future-proof**: Allows single-swap feature to be added without naming conflicts
2. **Clear intent**: Immediately identifies components handling multiple operations
3. **Consistency**: Maintains a predictable naming pattern

### Key Design Decisions

#### 1. **Centralized Configuration** (`lib/constants.ts`)
All magic numbers and configuration values are defined as named constants:
```typescript
export const SWAP_CONFIG = {
  MAX_SWAPS: 5,
  MAX_OUTGOING_MESSAGES: 4,
  TRANSACTION_VALID_DURATION_SECONDS: 5 * 60,
} as const;
```
Single source of truth, easy to modify, self-documenting code.

#### 2. **Type-Safe Validation** (`lib/validators.ts`, `lib/type-guards.ts`)
Centralized validation logic with TypeScript type guards eliminates `!` non-null assertions and ensures type safety:
```typescript
export const isSwapWithQuote = (swap: SwapItem): swap is SwapItem & { quote: Quote } =>
  swap.status === "success" && swap.quote !== null;
```

#### 3. **Environment-Aware Logging** (`lib/logger.ts`)
Conditional logging that prevents production leaks - debug output in development, silent in production.

#### 4. **Memoized Provider Functions** (`providers/assets.tsx`)
All provider functions are wrapped in `useCallback` to prevent unnecessary re-renders and stabilize dependency chains.

#### 5. **Factory Pattern for State Initialization** (`providers/multi-swap.tsx`)
Consistent object creation using `createEmptySwap()` factory function - eliminates duplication and ensures consistency.

#### 6. **Separation of Concerns: UI vs Logic** (`hooks/useBatchExecute.ts`)
Business logic in hooks (transaction building, message construction), presentation in components (user interaction, visual feedback).

#### 7. **Provider Hierarchy** (`providers/index.tsx`)
Carefully ordered provider stack:
```
1. QueryClient → 2. TonConnect → 3. Assets → 4. Omniston → 5. SwapSettings → 6. MultiSwap
```
Clear dependency flow prevents initialization issues.

#### 8. **Utility Function Consistency** (`lib/utils.ts`)
Single-purpose utility functions (`decimalToPercent`, `percentToDecimal`) are self-documenting and prevent inline calculations.

## Important Implementation Notes

### Error Handling Strategy
- **Transaction errors**: Delegated to TonConnect UI for consistent UX
- **Application errors**: Handled by Next.js error boundaries (`error.tsx`, `global-error.tsx`)
- **Validation errors**: Caught at UI layer before API calls
- **No redundant try-catch**: Avoid duplicate error handling across layers

### Asset Management
- **Dynamic loading**: All assets fetched from Ston.fi API
- **No hardcoded addresses**: Assets are API-driven, not hardcoded
- **Wallet-aware**: Shows user's balance assets + popular assets
- **Local storage cache**: Persists unconditional assets for better UX

### QueryID System
- **Auto-generated**: Unique 20-digit IDs for transaction tracking
- **Timestamp-based**: Uses `Date.now()` + wallet address suffix
- **Payload modification**: Applied to all transaction messages via `modifyQueryId()`
- **Debug visibility**: Logged in development for troubleshooting

### State Management
- **React Context**: For global state (assets, settings, multi-swap)
- **React Query**: For server state (API data, caching)
- **Local state**: For component-specific UI state
- **No Redux**: Kept simple with Context + Hooks pattern

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