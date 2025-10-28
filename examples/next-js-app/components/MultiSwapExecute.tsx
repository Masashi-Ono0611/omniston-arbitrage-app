"use client";

import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOmniston } from "@/hooks/useOmniston";
import { bigNumberToFloat } from "@/lib/utils";
import { useAssets } from "@/providers/assets";
import {
  type SwapItem,
  useMultiSwap,
  useMultiSwapDispatch,
} from "@/providers/multi-swap";
import { useSwapSettings } from "@/providers/swap-settings";

const TON_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";

export const MultiSwapExecute = () => {
  const { swaps } = useMultiSwap();

  const hasAnyQuotes = swaps.some((swap) => swap.quote !== null);

  if (!hasAnyQuotes) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Execute Swaps</h3>
        <div className="flex flex-col gap-3">
          {swaps.map((swap, index) =>
            swap.quote ? (
              <SwapExecuteItem key={swap.id} swap={swap} index={index} />
            ) : null,
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SwapExecuteItem = ({
  swap,
  index,
}: {
  swap: SwapItem;
  index: number;
}) => {
  const wallet = useTonWallet();
  const [tonConnect] = useTonConnectUI();
  const omniston = useOmniston();
  const { getAssetByAddress } = useAssets();
  const { autoSlippageTolerance } = useSwapSettings();
  const dispatch = useMultiSwapDispatch();

  const [isExecuting, setIsExecuting] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);

  const bidAsset = getAssetByAddress(TON_ADDRESS);
  const askAsset = getAssetByAddress(swap.askAddress);

  if (!swap.quote || !bidAsset || !askAsset) {
    return null;
  }

  const handleExecute = async () => {
    if (!wallet || !swap.quote) return;

    try {
      setIsExecuting(true);

      const tx = await omniston.buildTransfer({
        quote: swap.quote,
        sourceAddress: {
          address: wallet.account.address.toString(),
          blockchain: Blockchain.TON,
        },
        destinationAddress: {
          address: wallet.account.address.toString(),
          blockchain: Blockchain.TON,
        },
        gasExcessAddress: {
          address: wallet.account.address.toString(),
          blockchain: Blockchain.TON,
        },
        useRecommendedSlippage: autoSlippageTolerance,
      });

      const omniMessages = tx.ton?.messages;

      if (!omniMessages) {
        throw new Error("buildTransfer method failed. No TON messages found");
      }

      await tonConnect.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 5 * 60,
        messages: omniMessages.map(
          (message: {
            targetAddress: string;
            sendAmount: string;
            payload: string;
            jettonWalletStateInit?: string;
          }) => ({
            address: message.targetAddress,
            amount: message.sendAmount,
            payload: message.payload,
            stateInit: message.jettonWalletStateInit,
          }),
        ),
      });

      setIsExecuted(true);
      dispatch({ type: "RESET_SWAP_QUOTE", payload: swap.id });
    } catch (error) {
      console.error("Failed to execute swap:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 border rounded-md">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 text-sm">
        <div className="font-medium">
          {bigNumberToFloat(swap.quote.bidUnits, bidAsset.meta.decimals)}{" "}
          {bidAsset.meta.symbol} →{" "}
          {bigNumberToFloat(swap.quote.askUnits, askAsset.meta.decimals)}{" "}
          {askAsset.meta.symbol}
        </div>
        <div className="text-xs text-muted-foreground">
          Quote ID: {swap.quote.quoteId.slice(0, 8)}...
        </div>
      </div>

      {isExecuted ? (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 size={16} />
          <span>Executed</span>
        </div>
      ) : wallet ? (
        <Button onClick={handleExecute} disabled={isExecuting} size="sm">
          {isExecuting ? (
            <>
              <Loader2 size={14} className="mr-1 animate-spin" />
              Executing...
            </>
          ) : (
            "Execute"
          )}
        </Button>
      ) : (
        <div className="text-sm text-muted-foreground">
          Connect wallet to execute
        </div>
      )}
    </div>
  );
};
