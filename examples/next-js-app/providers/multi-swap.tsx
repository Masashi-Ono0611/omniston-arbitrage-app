"use client";

import type { Quote } from "@ston-fi/omniston-sdk-react";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  useContext,
  useReducer,
} from "react";

import { SWAP_CONFIG } from "@/lib/constants";
import { logger } from "@/lib/logger";

export const DEFAULT_SLIPPAGE = 0.05;

export type SwapItem = {
  id: string;
  bidAddress: string;
  askAddress: string;
  bidAmount: string;
  slippage: number;
  autoSlippage: boolean;
  quote: Quote | null;
  rfqId: string | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  quoteHistory: {
    quoteId: string;
    receivedAt: number;
    resolverName?: string;
  }[];
};

type MultiSwapState = {
  swaps: SwapItem[];
  isQuotingAll: boolean;
};

const createEmptySwap = (): SwapItem => ({
  id: crypto.randomUUID(),
  bidAddress: "",
  askAddress: "",
  bidAmount: "",
  slippage: DEFAULT_SLIPPAGE,
  autoSlippage: false,
  quote: null,
  rfqId: null,
  status: "idle",
  error: null,
  quoteHistory: [],
});

const initialState: MultiSwapState = {
  swaps: [createEmptySwap()],
  isQuotingAll: false,
};

type MultiSwapAction =
  | { type: "ADD_SWAP" }
  | { type: "REMOVE_SWAP"; payload: string }
  | {
      type: "UPDATE_SWAP";
      payload: { id: string; updates: Partial<SwapItem> };
    }
  | {
      type: "SET_SWAP_QUOTE";
      payload: { id: string; quote: Quote; rfqId: string; receivedAt: number };
    }
  | {
      type: "SET_SWAP_STATUS";
      payload: {
        id: string;
        status: SwapItem["status"];
        error?: string | null;
      };
    }
  | { type: "START_QUOTING_ALL" }
  | { type: "FINISH_QUOTING_ALL" }
  | { type: "RESET_SWAP_QUOTE"; payload: string };

const MultiSwapContext = createContext<MultiSwapState>(initialState);
const MultiSwapDispatchContext = createContext<Dispatch<MultiSwapAction>>(
  () => {},
);

const multiSwapReducer = (
  state: MultiSwapState,
  action: MultiSwapAction,
): MultiSwapState => {
  switch (action.type) {
    case "ADD_SWAP":
      if (state.swaps.length >= SWAP_CONFIG.MAX_SWAPS) return state;
      return {
        ...state,
        swaps: [...state.swaps, createEmptySwap()],
      };

    case "REMOVE_SWAP":
      if (state.swaps.length <= 1) return state;
      return {
        ...state,
        swaps: state.swaps.filter((swap) => swap.id !== action.payload),
      };

    case "UPDATE_SWAP":
      return {
        ...state,
        swaps: state.swaps.map((swap) =>
          swap.id === action.payload.id
            ? { ...swap, ...action.payload.updates }
            : swap,
        ),
      };

    case "SET_SWAP_QUOTE": {
      // Force new object references for ALL swaps to ensure React detects changes
      const nextSwaps: SwapItem[] = state.swaps.map(
        (swap) =>
          swap.id === action.payload.id
            ? {
                ...swap,
                quote: action.payload.quote,
                rfqId: action.payload.rfqId,
                status: "success" as const,
                error: null,
                quoteHistory: [
                  ...swap.quoteHistory,
                  {
                    quoteId: action.payload.quote.quoteId,
                    receivedAt: action.payload.receivedAt,
                    resolverName: action.payload.quote.resolverName,
                  },
                ],
              }
            : { ...swap }, // Force new reference even for unchanged swaps
      );
      const h = action.payload.quote.quoteId;
      logger.info(
        `[STORE] SET_SWAP_QUOTE id=${action.payload.id} quoteId=${h} history_len=${
          nextSwaps.find((s) => s.id === action.payload.id)?.quoteHistory
            .length ?? 0
        }`,
      );
      return {
        ...state,
        swaps: nextSwaps,
      };
    }

    case "SET_SWAP_STATUS":
      return {
        ...state,
        swaps: state.swaps.map((swap) =>
          swap.id === action.payload.id
            ? {
                ...swap,
                status: action.payload.status,
                error: action.payload.error ?? swap.error,
              }
            : swap,
        ),
      };

    case "START_QUOTING_ALL":
      return {
        ...state,
        isQuotingAll: true,
        swaps: state.swaps.map((swap) => ({
          ...swap,
          status: "idle",
          error: null,
          quote: null,
          rfqId: null,
          quoteHistory: [],
        })),
      };

    case "FINISH_QUOTING_ALL":
      return {
        ...state,
        isQuotingAll: false,
      };

    case "RESET_SWAP_QUOTE":
      return {
        ...state,
        swaps: state.swaps.map((swap) =>
          swap.id === action.payload
            ? {
                ...swap,
                quote: null,
                rfqId: null,
                status: "idle",
                error: null,
                quoteHistory: [],
              }
            : swap,
        ),
      };

    default:
      return state;
  }
};

export const MultiSwapProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(multiSwapReducer, initialState);

  return (
    <MultiSwapContext.Provider value={state}>
      <MultiSwapDispatchContext.Provider value={dispatch}>
        {children}
      </MultiSwapDispatchContext.Provider>
    </MultiSwapContext.Provider>
  );
};

export const useMultiSwap = () => useContext(MultiSwapContext);
export const useMultiSwapDispatch = () => useContext(MultiSwapDispatchContext);
