"use client";

import { Settings } from "lucide-react";

import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MultiSwapActions } from "@/components/MultiSwapActions";
import { MultiSwapExecute } from "@/components/MultiSwapExecute";
import { MultiSwapForm } from "@/components/MultiSwapForm";
import { MultiSwapQuotePreview } from "@/components/MultiSwapQuotePreview";
import { SwapSettings } from "@/components/SwapSettings";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-[900px] pt-4 md:pt-12 flex flex-col gap-4">
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

      <MultiSwapForm />
      <MultiSwapActions />
      <MultiSwapQuotePreview />
      <MultiSwapExecute />
    </section>
  );
}
