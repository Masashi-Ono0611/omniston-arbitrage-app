"use client";

import { MultiSwapActions } from "@/components/MultiSwapActions";
import { MultiSwapBatchExecute } from "@/components/MultiSwapBatchExecute";
import { MultiSwapForm } from "@/components/MultiSwapForm";
import { MultiSwapHeader } from "@/components/MultiSwapHeader";
import { MultiSwapQuotePreview } from "@/components/MultiSwapQuotePreview";
import { useMultiSwapRfq } from "@/hooks/useMultiSwapRfq";

export default function Home() {
  const rfqHook = useMultiSwapRfq();

  return (
    <section className="mx-auto w-full max-w-[900px] pt-4 md:pt-12 flex flex-col gap-4">
      <MultiSwapHeader />
      <MultiSwapForm />
      <MultiSwapActions rfqHook={rfqHook} />
      <MultiSwapQuotePreview unsubscribeSwap={rfqHook.unsubscribeSwap} />
      <MultiSwapBatchExecute />
    </section>
  );
}
