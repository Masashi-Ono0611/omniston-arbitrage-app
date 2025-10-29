# Omniston Next.js demo app

This is an example app to demonstrate the Omniston SDK package usage in real life and provide code as a docs for those who prefer this way.

You can try the demo app [here](https://omniston.ston.fi) or run it locally by following these steps:

1. install dependencies

```sh
pnpm install
```

2. run the dev command

```sh
turbo dev
```

## Code Organization and Naming Conventions

### Component Naming Strategy

This application follows a clear naming convention to distinguish between shared components and feature-specific components:

#### Shared Components (No Prefix)
Components without prefixes are shared utilities that can be used across different features:
- `SwapSettings.tsx` - Configuration settings for swap operations
- `AssetSelect.tsx` - Asset selection component
- `ConnectionStatus.tsx` - Wallet connection status display
- `Header.tsx` - Application header

#### Feature-Specific Components (With Prefix)
Components with the `Multi` prefix are specific to the multi-swap functionality:
- `MultiSwapForm.tsx` - Form for configuring multiple swap operations
- `MultiSwapActions.tsx` - Action buttons for multi-swap operations
- `MultiSwapExecute.tsx` - Execution interface for multi-swap transactions
- `MultiSwapQuotePreview.tsx` - Preview component for multi-swap quotes

#### Hooks and Providers
- `useMultiSwapRfq.ts` - Hook for managing multi-swap RFQ (Request for Quote)
- `multi-swap.tsx` (provider) - State management for multi-swap operations

### Rationale

The `Multi` prefix is intentionally retained even though single-swap functionality has been removed from the current implementation. This decision ensures:

1. **Future Extensibility**: If single-swap functionality is re-introduced, there will be no naming conflicts
2. **Clear Intent**: The prefix clearly indicates that these components handle multiple simultaneous swap operations
3. **Code Clarity**: Developers can immediately understand the scope and purpose of each component
4. **Consistency**: Maintains a consistent pattern for feature-specific implementations
