"use client";

import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import GitBookIcon from "@/public/icons/gitbook.svg";
import GitHubIcon from "@/public/icons/github.svg";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background justify-between">
      <section className="container flex items-center gap-4">
        <a
          href="https://ston.fi"
          target="_blank noopener noreferrer"
          className="hover:opacity-80 transition-opacity relative mr-auto"
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

        <nav className="flex gap-2 mr-auto ml-8">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              pathname === "/"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary",
            )}
          >
            Single Swap
          </Link>
          <Link
            href="/multi-swap"
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors",
              pathname === "/multi-swap"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary",
            )}
          >
            Multi Swap
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
