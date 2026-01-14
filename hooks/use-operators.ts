/**
 * React Query Hooks for Operators
 * Provides caching, auto-refresh, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query keys
export const operatorKeys = {
  all: ['operators'] as const,
  lists: () => [...operatorKeys.all, 'list'] as const,
  list: (filters?: any) => [...operatorKeys.lists(), { filters }] as const,
  details: () => [...operatorKeys.all, 'detail'] as const,
  detail: (id: string) => [...operatorKeys.details(), id] as const,
};

// Fetch all operators (with pagination & search)
async function fetchOperators(page = 1, limit = 20, search = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });
  const res = await fetch(`/api/operators?${params}`);
  if (!res.ok) throw new Error('Failed to fetch operators');
  return res.json();
}

// Fetch single operator
async function fetchOperator(id: string) {
  const res = await fetch(`/api/operators/${id}`);
  if (!res.ok) throw new Error('Failed to fetch operator');
  return res.json();
}

// Create operator
async function createOperator(data: any) {
  const res = await fetch('/api/operators', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create operator');
  }
  return res.json();
}

// Update operator
async function updateOperator({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/operators/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update operator');
  }
  return res.json();
}

// Delete operator
async function deleteOperator(id: string) {
  const res = await fetch(`/api/operators/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete operator');
  }
  return res.json();
}

// Hook: Get all operators (with pagination & search)
export function useOperators(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: [...operatorKeys.lists(), { page, limit, search }],
    queryFn: () => fetchOperators(page, limit, search),
    placeholderData: (previousData) => previousData, // Keep showing old data while loading new page
  });
}

// Hook: Get single operator
export function useOperator(id: string) {
  return useQuery({
    queryKey: operatorKeys.detail(id),
    queryFn: () => fetchOperator(id),
    enabled: !!id,
  });
}

// Hook: Create operator
export function useCreateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: operatorKeys.lists() });
    },
  });
}

// Hook: Update operator
export function useUpdateOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOperator,
    onSuccess: (data, variables) => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: operatorKeys.lists() });
      // Invalidate specific operator detail
      queryClient.invalidateQueries({ queryKey: operatorKeys.detail(variables.id) });
    },
  });
}

// Hook: Delete operator
export function useDeleteOperator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOperator,
    onSuccess: () => {
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: operatorKeys.lists() });
    },
  });
}

