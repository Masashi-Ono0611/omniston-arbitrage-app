"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";

import { AssetSelect } from "@/components/AssetSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AssetMetadata } from "@/models/asset";
import { useAssets } from "@/providers/assets";
import {
  type SwapItem,
  useMultiSwap,
  useMultiSwapDispatch,
} from "@/providers/multi-swap";

const TON_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";

const validateFloatValue = (value: string): boolean =>
  /^([0-9]+([.][0-9]*)?|[.][0-9]+)$/.test(value);

export const MultiSwapForm = () => {
  const { swaps } = useMultiSwap();
  const dispatch = useMultiSwapDispatch();

  const handleAddSwap = () => {
    dispatch({ type: "ADD_SWAP" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Multi Swap Configuration</h2>
        <Button
          onClick={handleAddSwap}
          disabled={swaps.length >= 5}
          variant="outline"
          size="sm"
        >
          <Plus size={16} className="mr-1" />
          Add Swap ({swaps.length}/5)
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {swaps.map((swap, index) => (
          <SwapItemCard key={swap.id} swap={swap} index={index} />
        ))}
      </div>
    </div>
  );
};

const SwapItemCard = ({ swap, index }: { swap: SwapItem; index: number }) => {
  const { swaps } = useMultiSwap();
  const dispatch = useMultiSwapDispatch();
  const { getAssetByAddress, assetsQuery, insertAsset } = useAssets();

  const askAsset = getAssetByAddress(swap.askAddress);

  const availableAssets = [...(assetsQuery.data ?? new Map()).values()].filter(
    (asset) => asset.contractAddress !== TON_ADDRESS,
  );

  const handleRemove = () => {
    dispatch({ type: "REMOVE_SWAP", payload: swap.id });
  };

  const handleAskAssetChange = (asset: AssetMetadata | null) => {
    if (asset) {
      insertAsset(asset);
    }

    dispatch({
      type: "UPDATE_SWAP",
      payload: {
        id: swap.id,
        updates: { askAddress: asset?.contractAddress ?? "" },
      },
    });
  };

  const handleBidAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !validateFloatValue(value)) return;

    dispatch({
      type: "UPDATE_SWAP",
      payload: { id: swap.id, updates: { bidAmount: value } },
    });
  };

  const handleSlippageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !validateFloatValue(value)) return;

    const slippage = parseFloat(value) / 100;
    if (slippage >= 0 && slippage <= 1) {
      dispatch({
        type: "UPDATE_SWAP",
        payload: { id: swap.id, updates: { slippage } },
      });
    }
  };

  const getStatusColor = () => {
    switch (swap.status) {
      case "loading":
        return "border-blue-500 bg-blue-50/50";
      case "success":
        return "border-green-500 bg-green-50/50";
      case "error":
        return "border-red-500 bg-red-50/50";
      default:
        return "";
    }
  };

  return (
    <Card className={cn("relative", getStatusColor())}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bid Asset (TON - Fixed) */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                You Bid (TON)
              </Label>
              <Input
                type="text"
                placeholder="0.0"
                value={swap.bidAmount}
                onChange={handleBidAmountChange}
                disabled={swap.status === "loading"}
              />
            </div>

            {/* Ask Asset */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">You Ask</Label>
              <AssetSelect
                assets={availableAssets}
                selectedAsset={askAsset ?? null}
                onAssetSelect={handleAskAssetChange}
                loading={assetsQuery.isLoading}
              />
            </div>

            {/* Slippage */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Slippage (%)
              </Label>
              <Input
                type="text"
                placeholder="5.0"
                value={(swap.slippage * 100).toString()}
                onChange={handleSlippageChange}
                disabled={swap.status === "loading"}
              />
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={swaps.length <= 1 || swap.status === "loading"}
            className="shrink-0"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        {/* Status Display */}
        {swap.status === "loading" && (
          <div className="mt-3 text-sm text-blue-600">Getting quote...</div>
        )}
        {swap.status === "error" && swap.error && (
          <div className="mt-3 text-sm text-red-600">Error: {swap.error}</div>
        )}
        {swap.status === "success" && swap.quote && (
          <div className="mt-3 text-sm text-green-600">
            Quote received: {swap.quote.quoteId.slice(0, 8)}...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
