/**
 * React Query Hooks for Applications
 * Provides caching, auto-refresh, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};

// Fetch applications
async function fetchApplications() {
  const res = await fetch('/api/applications');
  if (!res.ok) throw new Error('Failed to fetch applications');
  const json = await res.json();
  return json.data || [];
}

// Create application
async function createApplication(data: { code: string; name: string; description?: string }) {
  const operatorStr = localStorage.getItem('operator');
  const operator = operatorStr ? JSON.parse(operatorStr) : null;
  
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create application');
  }
  
  return res.json();
}

// Update application
async function updateApplication({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update application');
  }
  
  return res.json();
}

// Delete application
async function deleteApplication(id: string) {
  const res = await fetch(`/api/applications/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete application');
  }
  
  return res.json();
}

// Hook: Get all applications
export function useApplications() {
  return useQuery({
    queryKey: applicationKeys.lists(),
    queryFn: fetchApplications,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Create application
export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      toast.success('Application created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create application');
    },
  });
}

// Hook: Update application
export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(variables.id) });
      toast.success('Application updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update application');
    },
  });
}

// Hook: Delete application
export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      toast.success('Application deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete application');
    },
  });
}
