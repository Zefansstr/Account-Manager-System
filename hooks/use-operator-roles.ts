/**
 * React Query Hooks for Operator Roles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const operatorRoleKeys = {
  all: ['operator-roles'] as const,
  lists: () => [...operatorRoleKeys.all, 'list'] as const,
  detail: (id: string) => [...operatorRoleKeys.all, 'detail', id] as const,
  permissions: (id: string) => [...operatorRoleKeys.all, 'permissions', id] as const,
};

// Fetch all operator roles
async function fetchOperatorRoles() {
  const res = await fetch('/api/operator-roles');
  if (!res.ok) throw new Error('Failed to fetch operator roles');
  return res.json();
}

// Fetch role permissions
async function fetchRolePermissions(id: string) {
  const res = await fetch(`/api/operator-roles/${id}/permissions`);
  if (!res.ok) throw new Error('Failed to fetch permissions');
  return res.json();
}

// Hook: Get all operator roles
export function useOperatorRoles() {
  return useQuery({
    queryKey: operatorRoleKeys.lists(),
    queryFn: fetchOperatorRoles,
  });
}

// Hook: Get role permissions
export function useRolePermissions(id: string) {
  return useQuery({
    queryKey: operatorRoleKeys.permissions(id),
    queryFn: () => fetchRolePermissions(id),
    enabled: !!id,
  });
}

// Hook: Update role permissions
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, permissions }: { id: string; permissions: any }) => {
      const res = await fetch(`/api/operator-roles/${id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update permissions');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: operatorRoleKeys.permissions(variables.id) });
    },
  });
}

