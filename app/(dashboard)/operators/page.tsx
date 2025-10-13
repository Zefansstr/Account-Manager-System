"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Power, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useOperators, useCreateOperator, useUpdateOperator, useDeleteOperator } from "@/hooks/use-operators";
import { useOperatorRoles } from "@/hooks/use-operator-roles";

type Operator = {
  id: string;
  username: string;
  password?: string;
  full_name: string;
  operator_role_id: string;
  role_name?: string;
  status: string;
  last_login?: string;
  created_at: string;
};

type OperatorRole = {
  id: string;
  role_code: string;
  role_name: string;
  status: string;
};

export default function OperatorsPage() {
  // Pagination & Search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 when searching
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // React Query hooks - automatic caching & refetching with pagination!
  const { data: operatorsData, isLoading: operatorsLoading } = useOperators(page, limit, debouncedSearch);
  const { data: rolesData, isLoading: rolesLoading } = useOperatorRoles();
  const createOperator = useCreateOperator();
  const updateOperator = useUpdateOperator();
  const deleteOperator = useDeleteOperator();

  // Local state for UI
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    operator_role_id: "",
    status: "active",
  });

  // Derived state from React Query
  const operators = operatorsData?.data || [];
  const pagination = operatorsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const roles = (rolesData?.data || []).filter((r: OperatorRole) => r.status === "active");
  const loading = operatorsLoading || rolesLoading;

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      operator_role_id: roles.length > 0 ? roles[0].id : "",
      status: "active",
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleAdd = async () => {
    // Reset messages
    setErrorMessage("");
    setSuccessMessage("");

    // Validate form
    if (!formData.username.trim()) {
      setErrorMessage("Username tidak boleh kosong");
      return;
    }
    if (!formData.password.trim()) {
      setErrorMessage("Password tidak boleh kosong");
      return;
    }
    if (!formData.full_name.trim()) {
      setErrorMessage("Full Name tidak boleh kosong");
      return;
    }
    if (!formData.operator_role_id) {
      setErrorMessage("Silakan pilih Role");
      return;
    }

    // Use React Query mutation
    createOperator.mutate(formData, {
      onSuccess: () => {
        setIsAddOpen(false);
        resetForm();
        setSuccessMessage("Operator berhasil ditambahkan!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
      onError: (error: any) => {
        setErrorMessage(error.message || "Gagal menambahkan operator");
      },
    });
  };

  const handleEdit = async () => {
    if (!selectedOperator) return;

    // Use React Query mutation
    updateOperator.mutate(
      { id: selectedOperator.id, data: formData },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setSelectedOperator(null);
          resetForm();
          setSuccessMessage("Operator berhasil diupdate!");
          setTimeout(() => setSuccessMessage(""), 3000);
        },
        onError: (error: any) => {
          setErrorMessage(error.message || "Gagal mengupdate operator");
        },
      }
    );
  };

  const handleDelete = async () => {
    if (!selectedOperator) return;

    // Use React Query mutation
    deleteOperator.mutate(selectedOperator.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedOperator(null);
        setSuccessMessage("Operator berhasil dihapus!");
        setTimeout(() => setSuccessMessage(""), 3000);
      },
      onError: (error: any) => {
        setErrorMessage(error.message || "Gagal menghapus operator");
      },
    });
  };

  const openEditDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setFormData({
      username: operator.username,
      password: "",
      full_name: operator.full_name,
      operator_role_id: operator.operator_role_id,
      status: operator.status,
    });
    setIsEditOpen(true);
  };

  const toggleOperatorStatus = async (operator: Operator) => {
    const newStatus = operator.status === "active" ? "inactive" : "active";
    
    // Use React Query mutation
    updateOperator.mutate(
      {
        id: operator.id,
        data: {
          full_name: operator.full_name,
          operator_role_id: operator.operator_role_id,
          status: newStatus,
        },
      },
      {
        onSuccess: () => {
          setSuccessMessage(`Operator ${newStatus === "active" ? "activated" : "deactivated"}!`);
          setTimeout(() => setSuccessMessage(""), 3000);
        },
        onError: (error: any) => {
          setErrorMessage(error.message || "Gagal mengubah status");
        },
      }
    );
  };


  if (loading && operators.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Operators</h2>
            <p className="text-sm text-muted-foreground">
              Manage system operators and assign roles
            </p>
          </div>
        </div>
        <TableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operators</h2>
          <p className="text-sm text-muted-foreground">
            Manage system operators and assign roles
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setErrorMessage("");
          setSuccessMessage("");
          setIsAddOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Operator
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 px-4 py-3">
          <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search operators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {pagination.total} total operator{pagination.total !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Full Name</th>
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Username</th>
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="w-[25%] px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">
                        {searchTerm ? "No operators found matching your search" : "No operators yet"}
                      </p>
                      {searchTerm && (
                        <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                          Clear search
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                operators.map((operator, index) => (
                <tr
                  key={operator.id}
                  className={`border-b border-border transition-colors hover:bg-secondary/30 ${
                    index % 2 === 0 ? "bg-card" : "bg-secondary/10"
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-foreground font-medium">{operator.full_name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-primary">{operator.username}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {operator.role_name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      variant={operator.status === "active" ? "default" : "secondary"}
                      className={
                        operator.status === "active"
                          ? "bg-primary/20 text-primary border border-primary"
                          : "bg-secondary text-muted-foreground"
                      }
                    >
                      {operator.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleOperatorStatus(operator)}
                        className={
                          operator.status === "active"
                            ? "hover:bg-destructive/10 hover:text-destructive"
                            : "hover:bg-primary/10 hover:text-primary"
                        }
                        title={operator.status === "active" ? "Disable" : "Enable"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(operator)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOperator(operator);
                          setIsDeleteOpen(true);
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            isLoading={operatorsLoading}
            pageSize={limit}
            onPageSizeChange={handlePageSizeChange}
            totalRecords={pagination.total}
          />
        </div>
      </div>

      {/* Add Operator Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Operator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                disabled={createOperator.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                disabled={createOperator.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-fullname">Full Name</Label>
              <Input
                id="add-fullname"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                disabled={createOperator.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <select
                id="add-role"
                value={formData.operator_role_id}
                onChange={(e) => setFormData({ ...formData, operator_role_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createOperator.isPending}
              >
                {roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <select
                id="add-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createOperator.isPending}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={createOperator.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              className="bg-primary hover:bg-primary/90"
              disabled={createOperator.isPending}
            >
              {createOperator.isPending ? "Menambahkan..." : "Add Operator"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Operator Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Operator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Full Name</Label>
              <Input
                id="edit-fullname"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={formData.operator_role_id}
                onChange={(e) => setFormData({ ...formData, operator_role_id: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {roles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete operator <strong className="text-foreground">{selectedOperator?.username}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

