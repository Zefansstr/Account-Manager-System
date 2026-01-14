/**
 * React Query Hooks for Lines
 * Provides caching, auto-refresh, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Query keys
export const lineKeys = {
  all: ['lines'] as const,
  lists: () => [...lineKeys.all, 'list'] as const,
  details: () => [...lineKeys.all, 'detail'] as const,
  detail: (id: string) => [...lineKeys.details(), id] as const,
};

// Fetch lines
async function fetchLines() {
  const res = await fetch('/api/lines');
  if (!res.ok) throw new Error('Failed to fetch lines');
  const json = await res.json();
  return json.data || [];
}

// Create line
async function createLine(data: { code: string; name: string; description?: string }) {
  const res = await fetch('/api/lines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create line');
  }
  
  return res.json();
}

// Update line
async function updateLine({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/lines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update line');
  }
  
  return res.json();
}

// Delete line
async function deleteLine(id: string) {
  const res = await fetch(`/api/lines/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete line');
  }
  
  return res.json();
}

// Hook: Get all lines
export function useLines() {
  return useQuery({
    queryKey: lineKeys.lists(),
    queryFn: fetchLines,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Create line
export function useCreateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineKeys.lists() });
      toast.success('Line created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create line');
    },
  });
}

// Hook: Update line
export function useUpdateLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLine,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: lineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lineKeys.detail(variables.id) });
      toast.success('Line updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update line');
    },
  });
}

// Hook: Delete line
export function useDeleteLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lineKeys.lists() });
      toast.success('Line deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete line');
    },
  });
}
