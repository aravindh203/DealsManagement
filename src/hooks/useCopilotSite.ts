import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';
import { appConfig } from '../config/appConfig';

export const useCopilotSite = (containerId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [siteName, setSiteName] = useState<string | null>(null);
  const { getAccessToken, isAuthenticated } = useAuth();
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const shouldProcess = isAuthenticated && !!containerId;

  const normalizedContainerId = useMemo(() => {
    if (!containerId || !shouldProcess) return '';
    if (containerId.startsWith('b!')) return containerId;
    return `b!${containerId}`;
  }, [containerId, shouldProcess]);

  useEffect(() => {
    if (!siteUrl) {
      setSiteUrl(appConfig.sharePointHostname.replace(/\/+$/, ''));
    }
    if (!siteName) {
      setSiteName('SharePoint Site');
    }
    if (!shouldProcess || !normalizedContainerId) return;
    if (fetchAttempted) return;

    const fetchSiteInfo = async () => {
      if (isLoading) return;
      try {
        setIsLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) {
          setError('Authentication token not available');
          return;
        }

        const containerDetails = await sharePointService.getContainerDetails(token, normalizedContainerId);
        setFetchAttempted(true);

        if (!containerDetails) {
          setError('Container details are undefined');
          return;
        }

        const name = containerDetails.name || 'SharePoint Site';
        setSiteName(name);

        if (!containerDetails.webUrl) {
          setError('Container webUrl is undefined');
          return;
        }

        const normalizedUrl = containerDetails.webUrl.replace(/\/+$/, '');
        setSiteUrl(normalizedUrl);
      } catch {
        setError('Failed to load site information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiteInfo();
  }, [normalizedContainerId, getAccessToken, isAuthenticated, shouldProcess, fetchAttempted]);

  const sharePointHostname = useMemo(() => {
    try {
      if (!siteUrl) {
        return appConfig.sharePointHostname.replace(/\/+$/, '');
      }
      const url = new URL(siteUrl);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return appConfig.sharePointHostname.replace(/\/+$/, '');
    }
  }, [siteUrl]);

  return {
    isLoading,
    error,
    siteUrl,
    siteName,
    sharePointHostname,
    fetchAttempted
  };
};
