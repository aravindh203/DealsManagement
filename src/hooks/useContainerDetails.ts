
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sharePointService } from '../services/sharePointService';

export const useContainerDetails = (containerId: string | undefined) => {
  const [containerDetails, setContainerDetails] = useState<{ webUrl: string, name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, getAccessToken } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !containerId) return;

    const fetchContainerDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getAccessToken();
        if (!token) {
          setError('Failed to get access token');
          return;
        }

        let normalizedContainerId = containerId;
        if (containerId.includes(',')) {
          normalizedContainerId = containerId;
        } else if (!containerId.startsWith('b!')) {
          normalizedContainerId = `b!${containerId}`;
        }

        const details = await sharePointService.getContainerDetails(token, normalizedContainerId);
        setContainerDetails(details);
      } catch (error: any) {
        setError(error.message || 'Failed to fetch container details');
        setContainerDetails({ webUrl: '', name: 'Project Container' });
      } finally {
        setLoading(false);
      }
    };

    fetchContainerDetails();
  }, [isAuthenticated, getAccessToken, containerId]);

  return { containerDetails, loading, error };
};
