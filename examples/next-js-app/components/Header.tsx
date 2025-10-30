"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import GitBookIcon from "@/public/icons/gitbook.svg";
import GitHubIcon from "@/public/icons/github.svg";

export function Header() {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background justify-between">
      <section className="container flex items-center gap-4">
        <a
          href="https://ston.fi"
          target="_blank noopener noreferrer"
          className="hover:opacity-80 transition-opacity relative"
        >
          <Image
            src="https://static.ston.fi/branbook/omniston/logo/black.svg"
            width={180}
            height={60}
            alt="logo"
          />
          <Badge className="absolute rotate-[-13deg] -right-7 bottom-1 scale-[0.8]">
            example
          </Badge>
        </a>

        <nav className="mr-auto flex gap-4 ml-8">
          <Link
            href="/"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Multi-Swap
          </Link>
          <Link
            href="/arbitrage"
            className="text-sm font-medium hover:text-blue-600 transition-colors"
          >
            Arbitrage
          </Link>
        </nav>

        <TonConnectButton />
        <a
          href="https://github.com/ston-fi/omniston-sdk"
          target="_blank noopener noreferrer"
          className="hover:opacity-60 transition-opacity"
        >
          <Image src={GitHubIcon} alt="GitHub" width={24} height={24} />
        </a>
        <a
          href="https://docs.ston.fi/docs/developer-section/omniston"
          target="_blank noopener noreferrer"
          className="hover:opacity-60 transition-opacity"
        >
          <Image src={GitBookIcon} alt="GitBook" width={24} height={24} />
        </a>
      </section>
    </header>
  );
}
