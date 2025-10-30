"use client";

import { MultiSwapActions } from "@/components/MultiSwapActions";
import { MultiSwapBatchExecute } from "@/components/MultiSwapBatchExecute";
import { MultiSwapForm } from "@/components/MultiSwapForm";
import { MultiSwapHeader } from "@/components/MultiSwapHeader";
import { MultiSwapQuotePreview } from "@/components/MultiSwapQuotePreview";

console.log("[PAGE] Home component rendering");

export default function Home() {
  console.log("[PAGE] Home function called");
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
