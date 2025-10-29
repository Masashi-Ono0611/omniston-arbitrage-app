"use client";

import { Blockchain } from "@ston-fi/omniston-sdk-react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";

import { AddressPreview } from "@/components/AddressPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "@/components/ui/copy";
import { useOmniston } from "@/hooks/useOmniston";
import { bigNumberToFloat, trimStringWithEllipsis } from "@/lib/utils";
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
  const [showDetails, setShowDetails] = useState(false);

  const bidAsset = getAssetByAddress(TON_ADDRESS);
  const askAsset = getAssetByAddress(swap.askAddress);
  const protocolFeeAsset = swap.quote?.protocolFeeAsset
    ? getAssetByAddress(swap.quote.protocolFeeAsset.address)
    : null;

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
    <div className="border rounded-md">
      <div className="flex items-center gap-3 p-3">
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
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
          >
            <span>Quote ID: {swap.quote.quoteId.slice(0, 8)}...</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${showDetails ? "rotate-180" : ""}`}
            />
          </button>
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

      {showDetails && (
        <div className="border-t p-3 bg-secondary/20">
          <ul className="space-y-2 text-xs [&>li]:grid [&>li]:grid-cols-[max-content_1fr] [&>li]:gap-2 [&>li>*:nth-child(2)]:ml-auto [&>li>*:nth-child(2)]:font-mono [&>li>*:nth-child(2)]:truncate">
            {swap.rfqId && (
              <li>
                <span>RFQ ID:</span>
                <Copy value={swap.rfqId}>
                  {trimStringWithEllipsis(swap.rfqId, 6)}
                </Copy>
              </li>
            )}
            <li>
              <span>Quote ID:</span>
              <Copy value={swap.quote.quoteId}>
                {trimStringWithEllipsis(swap.quote.quoteId, 6)}
              </Copy>
            </li>
            <li>
              <span>Resolved by:</span>
              <AddressPreview address={swap.quote.resolverId}>
                {swap.quote.resolverName}
              </AddressPreview>
            </li>
            <hr />
            <li>
              <span>Bid amount:</span>
              <span>
                {bigNumberToFloat(swap.quote.bidUnits, bidAsset.meta.decimals)}{" "}
                {bidAsset.meta.symbol}
              </span>
            </li>
            <li>
              <span>Ask amount:</span>
              <span>
                {bigNumberToFloat(swap.quote.askUnits, askAsset.meta.decimals)}{" "}
                {askAsset.meta.symbol}
              </span>
            </li>
            {protocolFeeAsset && (
              <li>
                <span>Protocol fee:</span>
                <span>
                  {bigNumberToFloat(
                    swap.quote.protocolFeeUnits,
                    protocolFeeAsset.meta.decimals,
                  )}{" "}
                  {protocolFeeAsset.meta.symbol}
                </span>
              </li>
            )}
            <li>
              <span>Estimated gas:</span>
              <span>
                {bigNumberToFloat(swap.quote.estimatedGasConsumption, 9)} TON
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
