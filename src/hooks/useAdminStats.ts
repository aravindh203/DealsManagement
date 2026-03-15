import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { sharePointService } from "../services/sharePointService";
import { getAccessTokenByApp } from "./useClientCredentialsAuth";
import { appConfig } from "../config/appConfig";

export interface AdminStats {
  containerCount: number;
  totalStorageUsedBytes: number;
  totalStorageTotalBytes: number;
  containers: Array<{
    id: string;
    name: string;
    usedBytes: number;
    totalBytes: number;
  }>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Fetches all containers and aggregates their storage quota for the Admin dashboard. */
export const useAdminStats = (): AdminStats => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [containerCount, setContainerCount] = useState(0);
  const [totalStorageUsedBytes, setTotalStorageUsedBytes] = useState(0);
  const [totalStorageTotalBytes, setTotalStorageTotalBytes] = useState(0);
  const [containers, setContainers] = useState<
    Array<{ id: string; name: string; usedBytes: number; totalBytes: number }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!isAuthenticated) return;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getAccessTokenByApp();
        if (!token) {
          setError("Failed to acquire access token");
          return;
        }

        const containerList = await sharePointService.getAllContainers(token, appConfig.containerTypeId);
        setContainerCount(containerList.length);

        const quotaResults = await Promise.all(
          containerList.map(async (c) => {
            const quota = await sharePointService.getDriveQuota(token, c.id);
            return {
              id: c.id,
              name: c.name,
              usedBytes: quota.used,
              totalBytes: quota.total,
            };
          }),
        );
        setContainers(quotaResults);
        setTotalStorageUsedBytes(quotaResults.reduce((sum, c) => sum + c.usedBytes, 0));
        setTotalStorageTotalBytes(quotaResults.reduce((sum, c) => sum + c.totalBytes, 0));
      } catch (err: any) {
        setError(err.message || "Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isAuthenticated, getAccessToken, tick]);

  return {
    containerCount,
    totalStorageUsedBytes,
    totalStorageTotalBytes,
    containers,
    loading,
    error,
    refetch,
  };
};

// ── Utility: format bytes into human-readable string ──────────────
export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};
