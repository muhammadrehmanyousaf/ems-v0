import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BACKEND_URL } from '@/lib/backend-url';
import { PlatformStats } from '@/lib/types';

const fetchPlatformStats = async (): Promise<PlatformStats> => {
  const response = await axios.get(`${BACKEND_URL}api/v1/platform-stats`);
  if (response.data.status) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'Failed to fetch platform stats');
};

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: fetchPlatformStats,
    staleTime: 1000 * 60 * 5, // Cache the response for 5 minutes
    retry: 2, // Retry twice on failure
    refetchOnWindowFocus: false, // Prevent re-fetching when changing tabs
  });
}