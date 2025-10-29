"use client";

import { MultiSwapActions } from "@/components/MultiSwapActions";
import { MultiSwapBatchExecute } from "@/components/MultiSwapBatchExecute";
import { MultiSwapForm } from "@/components/MultiSwapForm";
import { MultiSwapHeader } from "@/components/MultiSwapHeader";
import { MultiSwapQuotePreview } from "@/components/MultiSwapQuotePreview";

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-[900px] pt-4 md:pt-12 flex flex-col gap-4">
      <MultiSwapHeader />
      <MultiSwapForm />
      <MultiSwapActions />
      <MultiSwapQuotePreview />
      <MultiSwapBatchExecute />
    </section>
  );
}
