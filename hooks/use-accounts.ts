/**
 * React Query Hooks for Accounts
 * Provides caching, auto-refresh, and optimistic updates with pagination
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filters?: any) => [...accountKeys.lists(), { filters }] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
};

// Fetch all accounts (with pagination, search, and filters)
async function fetchAccounts(
  page = 1, 
  limit = 20, 
  search = '', 
  operatorId?: string,
  filters?: { application_id?: string; line_id?: string; status?: string }
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(filters?.application_id && { application_id: filters.application_id }),
    ...(filters?.line_id && { line_id: filters.line_id }),
    ...(filters?.status && { status: filters.status }),
  });
  
  const headers: HeadersInit = {};
  if (operatorId) {
    headers["X-Operator-Id"] = operatorId;
  }
  
  const res = await fetch(`/api/accounts?${params}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

// Create account
async function createAccount(data: any) {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create account');
  }
  return res.json();
}

// Update account
async function updateAccount({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update account');
  }
  return res.json();
}

// Delete account
async function deleteAccount(id: string) {
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete account');
  }
  return res.json();
}

// Hook: Get all accounts (with pagination, search, and filters)
export function useAccounts(
  page = 1, 
  limit = 20, 
  search = '', 
  operatorId?: string,
  filters?: { application_id?: string; line_id?: string; status?: string }
) {
  return useQuery({
    queryKey: [...accountKeys.lists(), { page, limit, search, operatorId, filters }],
    queryFn: () => fetchAccounts(page, limit, search, operatorId, filters),
    placeholderData: (previousData) => previousData, // Keep showing old data while loading new page
    staleTime: 1 * 60 * 1000, // 1 minute (accounts change more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Create account
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook: Update account
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (data, variables) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      // Invalidate specific account detail
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(variables.id) });
    },
  });
}

// Hook: Delete account
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      // Also invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

