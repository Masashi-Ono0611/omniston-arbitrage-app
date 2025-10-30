"use client";

import { useId } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettlementMethod, useSwapSettings } from "@/providers/swap-settings";

export function SwapSettings({
  trigger = (
    <Button variant="outline" className="w-fit">
      Settings
    </Button>
  ),
}: React.ComponentProps<"div"> & {
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap Settings</DialogTitle>
        </DialogHeader>
        <ReferrerSection />
        <SettlementMethodsSection />
        <FlexibleReferrerFeeSection />
      </DialogContent>
    </Dialog>
  );
}

const ReferrerSection = () => {
  const {
    referrerAddress,
    setReferrerAddress,
    referrerFeeBps,
    setReferrerFeeBps,
  } = useSwapSettings();

  const addressInputId = useId();
  const feeInputId = useId();

  return (
    <section className="flex flex-col space-y-2">
      <div className="grid items-center gap-1.5 w-full">
        <Label htmlFor={addressInputId}>Referrer Address</Label>
        <Input
          id={addressInputId}
          type="text"
          value={referrerAddress}
          placeholder="EQ..."
          onChange={(e) => {
            const address = e.target.value || undefined;

            setReferrerAddress(address);

            if (!address) {
              setReferrerFeeBps(undefined);
            }
          }}
        />
      </div>
      <div className="grid items-center gap-1.5 w-full">
        <Label htmlFor={feeInputId}>Referrer Fee (BPS)</Label>
        <Input
          id={feeInputId}
          type="number"
          disabled={!referrerAddress}
          min={0}
          max={100}
          value={referrerFeeBps}
          placeholder="0-100"
          onChange={(e) => {
            const feeBps = e.target.value;

            setReferrerFeeBps(feeBps ? Number.parseInt(feeBps) : undefined);
          }}
        />
      </div>
    </section>
  );
};

const SettlementMethodsSection = () => {
  const { settlementMethods, setSettlementMethods } = useSwapSettings();

  return (
    <section className="space-y-2">
      <p className="text-sm font-medium">Settlement Methods</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(SettlementMethod).map(([key, value]) => (
          <Button
            key={key}
            disabled={
              settlementMethods.length === 1 && settlementMethods[0] === value
            }
            variant={
              settlementMethods.includes(value) ? "default" : "secondary"
            }
            onClick={() => {
              if (settlementMethods.includes(value)) {
                setSettlementMethods([
                  ...new Set(settlementMethods.filter((m) => m !== value)),
                ]);
              } else {
                setSettlementMethods([
                  ...new Set([...settlementMethods, value]),
                ]);
              }
            }}
          >
            {key}
          </Button>
        ))}
      </div>
    </section>
  );
};

const FlexibleReferrerFeeSection = () => {
  const { flexibleReferrerFee, setFlexibleReferrerFee } = useSwapSettings();

  return (
    <section className="flex gap-2 items-center">
      <Label htmlFor="flexible-referrer-fee" className="flex-1">
        Whether a flexible referrer fee can be applied for the quote
      </Label>
      <Switch
        id="flexible-referrer-fee"
        checked={flexibleReferrerFee}
        onCheckedChange={(checked) => setFlexibleReferrerFee(checked)}
      />
    </section>
  );
};
