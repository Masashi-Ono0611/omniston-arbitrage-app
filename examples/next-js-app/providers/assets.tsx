"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsConnectionRestored, useTonAddress } from "@tonconnect/ui-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { z } from "zod";

import { CACHE_CONFIG, STORAGE_KEYS } from "@/lib/constants";
import type { AssetMetadata } from "@/models/asset";
import { assetQueryFactory } from "@/quries/assets";

type AssetsContextValue = {
  assetsQuery: ReturnType<
    typeof useQuery<Map<AssetMetadata["contractAddress"], AssetMetadata>>
  >;
  getAssetByAddress: (
    address: AssetMetadata["contractAddress"],
  ) => AssetMetadata | undefined;
  insertAsset: (asset: AssetMetadata) => void;
};

const AssetsContext = createContext<AssetsContextValue | undefined>(undefined);

export const AssetsProvider = ({ children }: { children: React.ReactNode }) => {
  const walletAddress = useTonAddress();
  const isConnectionRestored = useIsConnectionRestored();
  const queryClient = useQueryClient();

  const [unconditionalAssets, setUnconditionalAssets] = useState(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const persistedUnconditionalAssets = localStorage.getItem(
      STORAGE_KEYS.UNCONDITIONAL_ASSETS,
    );

    if (!persistedUnconditionalAssets) {
      return [];
    }

    return z
      .array(z.string())
      .catch([])
      .parse(JSON.parse(persistedUnconditionalAssets));
  });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.UNCONDITIONAL_ASSETS,
      JSON.stringify(unconditionalAssets),
    );
  }, [unconditionalAssets]);

  const assetsQuery = useQuery({
    ...assetQueryFactory.fetch({
      unconditionalAssets,
      walletAddress,
    }),
    select: (data) =>
      new Map(data.map((asset) => [asset.contractAddress, asset])),
    enabled: isConnectionRestored,
    refetchInterval: CACHE_CONFIG.ASSETS_REFETCH_INTERVAL_MS,
    staleTime: CACHE_CONFIG.ASSETS_STALE_TIME,
  });

  const getAssetByAddress = useCallback(
    (address: AssetMetadata["contractAddress"]) =>
      assetsQuery.data?.get(address),
    [assetsQuery.data],
  );

  const insertAsset = useCallback(
    (asset: AssetMetadata) => {
      if (assetsQuery.data?.get(asset.contractAddress)) return;

      setUnconditionalAssets((prev) => [...prev, asset.contractAddress]);
      queryClient.setQueryData(
        assetQueryFactory.fetch({
          unconditionalAssets,
          walletAddress,
        }).queryKey,
        (old: AssetMetadata[] | undefined) => {
          if (!old) return [asset];

          const exists = old.some(
            (a) => a.contractAddress === asset.contractAddress,
          );

          if (exists) return old;

          return [...old, asset];
        },
      );
    },
    [assetsQuery.data, queryClient, unconditionalAssets, walletAddress],
  );

  return (
    <AssetsContext.Provider
      value={{
        assetsQuery,
        getAssetByAddress,
        insertAsset,
      }}
    >
      {children}
    </AssetsContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetsContext);

  if (!context) {
    throw new Error("useAssets must be used within an AssetsProvider");
  }

  return context;
};
