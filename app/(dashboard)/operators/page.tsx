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
  const operators: Operator[] = operatorsData?.data || [];
  const pagination = operatorsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const roles: OperatorRole[] = (rolesData?.data || []).filter((r: OperatorRole) => r.status === "active");
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
      <div className="flex flex-col w-full bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
        <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Operators</h1>
            <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">0</span>
          </div>
          <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">Manage system operators and assign roles</p>
        </div>
        <div className="mt-6">
          <TableSkeleton rows={10} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
      <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Operators</h1>
            <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">{pagination.total}</span>
          </div>
          <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">Manage system operators and assign roles</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 w-80 h-9 border border-[#7F5539]/25 dark:border-[#7F5539]/50 rounded-md px-3.5 bg-[#faf8f6] dark:bg-[#1a1a1a] flex-shrink-0 shadow-[0_2px_6px_rgba(127,85,57,0.1)]">
            <Search className="h-4 w-4 flex-shrink-0 text-[rgba(127,85,57,0.35)] dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search operators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-[#1e1e1e] dark:text-gray-200 min-w-0 placeholder:text-[rgba(127,85,57,0.4)] dark:placeholder:text-gray-500"
            />
          </div>
          <div className="h-8 w-px flex-shrink-0 bg-[rgba(127,85,57,0.2)]" aria-hidden />
          <Button onClick={() => { resetForm(); setErrorMessage(""); setSuccessMessage(""); setIsAddOpen(true); }} className="h-8 px-4 bg-[#3a2314] dark:bg-transparent dark:border dark:border-[#2a2a2a] dark:text-white text-white text-sm font-medium rounded border-0 cursor-pointer hover:opacity-90 dark:hover:bg-white/10 transition-colors shadow-[0_2px_6px_rgba(127,85,57,0.12)]">
            <Plus className="mr-2 h-4 w-4" />Add Operator
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="mt-4 rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/20 px-4 py-3">
          <p className="text-sm text-green-700 dark:text-green-400">{successMessage}</p>
        </div>
      )}

      <div className="min-h-[280px] max-h-[calc(100vh-320px)] overflow-auto border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-lg scrollbar-invisible bg-white dark:bg-[#101211]">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[20%] bg-[#f0eae4] dark:bg-[#101211]">Full Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[20%] bg-[#f0eae4] dark:bg-[#101211]">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[20%] bg-[#f0eae4] dark:bg-[#101211]">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[15%] bg-[#f0eae4] dark:bg-[#101211]">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-[#1e1e1e] dark:text-white w-[25%] bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#101211]">
            {operators.length === 0 ? (
              <tr className="bg-white dark:bg-[#101211]">
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <p>{searchTerm ? "No operators found matching your search" : "No operators yet"}</p>
                    {searchTerm && <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} className="min-w-[88px]">Clear search</Button>}
                  </div>
                </td>
              </tr>
            ) : (
              operators.map((operator) => (
                <tr key={operator.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{operator.full_name}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><span className="text-[#7f5539] dark:text-[#a06540] font-medium">{operator.username}</span></td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><Badge variant="secondary" className="bg-[#7f5539]/15 text-[#7f5539] dark:bg-[#7f5539]/25 dark:text-[#a06540] border-[#7f5539]/30">{operator.role_name}</Badge></td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                    <Badge variant={operator.status === "active" ? "success" : "secondary"} className={operator.status === "active" ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-200" : "bg-secondary text-muted-foreground"}>
                      {operator.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggleOperatorStatus(operator)} className={operator.status === "active" ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-primary/10 hover:text-primary"} title={operator.status === "active" ? "Disable" : "Enable"}><Power className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(operator)} className="hover:bg-primary/10 hover:text-primary"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedOperator(operator); setIsDeleteOpen(true); }} className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-4 border-t border-[#7F5539]/20 dark:border-[#7F5539]/40">
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

      {/* Add Operator Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#1e1e1e] dark:text-white">Add New Operator</DialogTitle>
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsAddOpen(false)} disabled={createOperator.isPending}>Cancel</Button>
            <Button onClick={handleAdd} className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90 text-white" disabled={createOperator.isPending}>{createOperator.isPending ? "Menambahkan..." : "Add Operator"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Operator Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#1e1e1e] dark:text-white">Edit Operator</DialogTitle>
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[#1e1e1e] dark:text-white">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Are you sure you want to delete operator <strong className="text-[#1e1e1e] dark:text-white">{selectedOperator?.username}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="min-w-[88px]" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

