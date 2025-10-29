"use client";

import { Settings } from "lucide-react";

import { ConnectionStatus } from "@/components/ConnectionStatus";
import { SwapSettings } from "@/components/SwapSettings";
import { Button } from "@/components/ui/button";

export function MultiSwapHeader() {
  return (
    <div className="flex items-center gap-2">
      <h1 className="text-xl leading-8 font-medium mr-auto">Multi Swap</h1>

      <ConnectionStatus />

      <SwapSettings
        trigger={
          <Button variant="outline" className="size-8 p-0">
            <Settings size={16} />
          </Button>
        }
      />
    </div>
  );
}
