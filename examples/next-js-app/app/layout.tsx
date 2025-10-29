import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { cn, retrieveEnvVariable } from "@/lib/utils";
import { Providers } from "@/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swap via Ston.fi",
  description: "Demo app to demonstrate how to swap tokens via Ston.fi SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const omnistonApiUrl = retrieveEnvVariable("OMNIDEMO__OMNISTON__API_URL");
  const tonConnectManifestUrl = retrieveEnvVariable(
    "OMNIDEMO__TONCONNECT__MANIFEST_URL",
  );

  return (
    <html lang="en">
      <body className={cn(inter.className, "flex flex-col min-h-[100svh]")}>
        <Providers
          omnistonApiUrl={omnistonApiUrl}
          tonConnectManifestUrl={tonConnectManifestUrl}
        >
          <Header />
          <main className="container flex flex-col flex-1 h-full py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
