"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Download, Power, CheckSquare, Square, Search, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";

type Account = {
  id: string;
  application: string;
  applicationId?: string;
  line: string;
  lineId?: string;
  username: string;
  password: string;
  department: string;
  departmentId?: string;
  role: string;
  roleId?: string;
  remark?: string;
  status?: string;
};

type LookupData = { id: string; code: string; name: string }[];

export default function ProductsAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [applications, setApplications] = useState<LookupData>([]);
  const [lines, setLines] = useState<LookupData>([]);
  const [departments, setDepartments] = useState<LookupData>([]);
  const [roles, setRoles] = useState<LookupData>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [formData, setFormData] = useState({
    applicationId: "",
    lineId: "",
    username: "",
    password: "",
    departmentId: "",
    roleId: "",
    remark: "",
  });

  const menuName = "Accounts";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to page 1 when searching
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add operator ID to headers for data filtering
      if (operator?.id) {
        headers["X-Operator-Id"] = operator.id;
      }
      
      const res = await fetch(`/api/products/accounts?${params}`, { headers });
      const json = await res.json();
      setAccounts(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      // Use combined lookup endpoint to reduce API calls from 4 to 1
      const res = await fetch("/api/lookups?module=product-management");
      const json = await res.json();
      setApplications(json.data?.applications || []);
      setLines(json.data?.lines || []);
      setDepartments(json.data?.departments || []);
      setRoles(json.data?.roles || []);
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  };

  // Fetch lookups only once on mount
  useEffect(() => {
    // Fetch lookups immediately but non-blocking
    fetchLookups();
  }, []);

  // Fetch accounts when filters change
  useEffect(() => {
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      fetchAccounts();
    });
  }, [page, limit, debouncedSearch]);

  const resetForm = () => {
    setFormData({
      applicationId: "",
      lineId: "",
      username: "",
      password: "",
      departmentId: "",
      roleId: "",
      remark: "",
    });
  };

  const togglePassword = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map(acc => acc.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch("/api/products/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success(`Account "${formData.username}" created successfully!`);
        fetchAccounts();
        setIsAddOpen(false);
        resetForm();
      } else {
        // Check for duplicate username error
        if (result.error && (result.error.includes("duplicate key") || result.error?.includes("unique"))) {
          toast.error(`Username "${formData.username}" already exists. Please use a different username.`);
        } else {
          toast.error(result.error || "Failed to create account. Please try again.");
        }
        console.error("Error response:", result);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred while creating account. Please try again.");
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch(`/api/products/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success(`Account "${formData.username}" updated successfully!`);
        fetchAccounts();
        setIsEditOpen(false);
        setSelected(null);
        resetForm();
      } else {
        // Check for duplicate username error
        if (result.error && (result.error.includes("duplicate key") || result.error?.includes("unique"))) {
          toast.error(`Username "${formData.username}" is already taken by another account. Please use a different username.`);
        } else {
          toast.error(result.error || "Failed to update account. Please try again.");
        }
        console.error("Error response:", result);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred while updating account. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch(`/api/products/accounts/${selected.id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: operator?.id,
        }),
      });
      if (res.ok) {
        toast.success(`Account "${selected.username}" deleted successfully!`);
        fetchAccounts();
        setIsDeleteOpen(false);
        setSelected(null);
      } else {
        const result = await res.json();
        toast.error(result.error || "Failed to delete account. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred while deleting account. Please try again.");
    }
  };

  const toggleAccountStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch(`/api/products/accounts/${accountId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          userId: operator?.id,
        }),
      });
      if (res.ok) {
        toast.success(`Account status updated to ${newStatus}`);
        fetchAccounts();
      } else {
        const result = await res.json();
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status");
    }
  };

  return (
    <PermissionGuard menuName={menuName}>
      <div className="space-y-3">
      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search username, role, atau remark..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9" 
            />
          </div>
          <div className="text-sm text-muted-foreground ml-2">
            {pagination.total} total account{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-[50px]">
                  <button onClick={toggleSelectAll} className="hover:text-primary">
                    {selectedIds.length === accounts.length && accounts.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Application</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Line</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Username</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Password</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Remark</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No accounts found</td></tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSelect(acc.id)} className="hover:text-primary">
                        {selectedIds.includes(acc.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge 
                        variant={acc.status === "active" ? "default" : "secondary"}
                        className={acc.status === "active" ? "bg-primary/20 text-primary border border-primary" : "bg-muted text-muted-foreground"}
                      >
                        {acc.status || "inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-primary flex items-center gap-2">
                        <Package className="h-3 w-3 text-white" />
                        {acc.application || "-"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{acc.line || "-"}</Badge></td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-primary">{acc.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{showPassword[acc.id] ? acc.password : "••••••••"}</span>
                        <button onClick={() => togglePassword(acc.id)} className="text-muted-foreground hover:text-foreground">
                          {showPassword[acc.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{acc.department || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{acc.role || "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{acc.remark || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => toggleAccountStatus(acc.id, acc.status || "inactive")}
                          title={acc.status === "active" ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelected(acc);
                            setFormData({
                              applicationId: acc.applicationId || "",
                              lineId: acc.lineId || "",
                              username: acc.username,
                              password: acc.password,
                              departmentId: acc.departmentId || "",
                              roleId: acc.roleId || "",
                              remark: acc.remark || "",
                            });
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-destructive/10"
                          onClick={() => {
                            setSelected(acc);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
            isLoading={loading}
            pageSize={limit}
            onPageSizeChange={() => {}}
            totalRecords={pagination.total}
          />
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>Create a new account entry</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Application</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}>
                <option value="">Select Application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Line</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.lineId} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}>
                <option value="">Select Line</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>{line.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Username *</Label>
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. SBMYHOD001" />
            </div>
            <div className="grid gap-2">
              <Label>Password *</Label>
              <Input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" />
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remark</Label>
              <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} placeholder="Optional remark" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.username || !formData.password}>Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>Update account information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Application</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}>
                <option value="">Select Application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Line</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.lineId} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}>
                <option value="">Select Line</option>
                {lines.map((line) => (
                  <option key={line.id} value={line.id}>{line.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Username *</Label>
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Password *</Label>
              <Input type="text" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remark</Label>
              <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.username || !formData.password}>Update Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete account <strong>{selected?.username}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
}
