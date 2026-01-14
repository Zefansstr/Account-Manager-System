/**
 * React Query Hooks for Departments
 * Provides caching, auto-refresh, and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Query keys
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

// Fetch departments
async function fetchDepartments() {
  const res = await fetch('/api/departments');
  if (!res.ok) throw new Error('Failed to fetch departments');
  const json = await res.json();
  return json.data || [];
}

// Create department
async function createDepartment(data: { code: string; name: string; description?: string }) {
  const res = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create department');
  }
  
  return res.json();
}

// Update department
async function updateDepartment({ id, data }: { id: string; data: any }) {
  const res = await fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update department');
  }
  
  return res.json();
}

// Delete department
async function deleteDepartment(id: string) {
  const res = await fetch(`/api/departments/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete department');
  }
  
  return res.json();
}

// Hook: Get all departments
export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: fetchDepartments,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook: Create department
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('Department created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create department');
    },
  });
}

// Hook: Update department
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) });
      toast.success('Department updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update department');
    },
  });
}

// Hook: Delete department
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success('Department deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete department');
    },
  });
}
