/**
 * React Query Hook for Lookups
 * Provides caching for lookup data (applications, lines, departments, roles)
 */

import { useQuery } from '@tanstack/react-query';

// Query keys
export const lookupKeys = {
  all: ['lookups'] as const,
  byModule: (module: string) => [...lookupKeys.all, module] as const,
};

// Fetch lookups for a module
async function fetchLookups(module: string = 'account-management') {
  const res = await fetch(`/api/lookups?module=${module}`);
  if (!res.ok) throw new Error('Failed to fetch lookups');
  const json = await res.json();
  return json.data;
}

// Hook: Get lookups for a module
export function useLookups(module: string = 'account-management') {
  return useQuery({
    queryKey: lookupKeys.byModule(module),
    queryFn: () => fetchLookups(module),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (lookups don't change often)
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
