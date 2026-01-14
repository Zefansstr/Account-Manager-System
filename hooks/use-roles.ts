/**
 * React Query Hooks for Roles
 * Provides caching, auto-refresh, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Query keys
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

// Fetch roles
async function fetchRoles() {
  const res = await fetch('/api/roles');
  if (!res.ok) throw new Error('Failed to fetch roles');
  const json = await res.json();
  return json.data || [];
}

// Create role
async function createRole(data: { code: string; name: string; description?: string }) {
  const res = await fetch('/api/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create role');
  }
  
  return res.json();
}

// Update role
async function updateRole({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update role');
  }
  
  return res.json();
}

// Delete role
async function deleteRole(id: string) {
  const res = await fetch(`/api/roles/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete role');
  }
  
  return res.json();
}

// Hook: Get all roles
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: fetchRoles,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Create role
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success('Role created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create role');
    },
  });
}

// Hook: Update role
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRole,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables.id) });
      toast.success('Role updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

// Hook: Delete role
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success('Role deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });
}
