"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Download, Power, CheckSquare, Square, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { canCreate, canEdit, canDelete, canEnableDisable, canImport, canExport, isColumnVisible, isSuperAdmin, getAllowedFilters } from "@/lib/permissions";

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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [applications, setApplications] = useState<LookupData>([]);
  const [lines, setLines] = useState<LookupData>([]);
  const [departments, setDepartments] = useState<LookupData>([]);
  const [roles, setRoles] = useState<LookupData>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; imported?: number; total?: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selected, setSelected] = useState<Account | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterApplication, setFilterApplication] = useState("");
  const [filterLine, setFilterLine] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  // Permission checks
  const menuName = "Accounts";
  
  // Get allowed filters based on role
  const allowedFilters = getAllowedFilters(menuName);
  const hasCreatePermission = isSuperAdmin() || canCreate(menuName);
  const hasEditPermission = isSuperAdmin() || canEdit(menuName);
  const hasDeletePermission = isSuperAdmin() || canDelete(menuName);
  const hasEnableDisablePermission = isSuperAdmin() || canEnableDisable(menuName);
  const hasImportPermission = isSuperAdmin() || canImport(menuName);
  const hasExportPermission = isSuperAdmin() || canExport(menuName);
  
  // Column visibility checks
  const showStatusColumn = isSuperAdmin() || isColumnVisible(menuName, "status");
  const showApplicationColumn = isSuperAdmin() || isColumnVisible(menuName, "application");
  const showLineColumn = isSuperAdmin() || isColumnVisible(menuName, "line");
  const showUsernameColumn = isSuperAdmin() || isColumnVisible(menuName, "username");
  const showPasswordColumn = isSuperAdmin() || isColumnVisible(menuName, "password");
  const showDepartmentColumn = isSuperAdmin() || isColumnVisible(menuName, "department");
  const showRoleColumn = isSuperAdmin() || isColumnVisible(menuName, "role");
  const showRemarkColumn = isSuperAdmin() || isColumnVisible(menuName, "remark");
  
  const [formData, setFormData] = useState({
    applicationId: "",
    lineId: "",
    username: "",
    password: "",
    departmentId: "",
    roleId: "",
    remark: "",
  });

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
      
      const res = await fetch(`/api/accounts?${params}`, { headers });
      const json = await res.json();
      setAccounts(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [appRes, lineRes, deptRes, roleRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/lines"),
        fetch("/api/departments"),
        fetch("/api/roles"),
      ]);
      const [appData, lineData, deptData, roleData] = await Promise.all([
        appRes.json(),
        lineRes.json(),
        deptRes.json(),
        roleRes.json(),
      ]);
      setApplications(appData.data || []);
      setLines(lineData.data || []);
      setDepartments(deptData.data || []);
      setRoles(roleData.data || []);
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [page, limit, debouncedSearch]);

  // Client-side filtering for dropdown filters only (search is now server-side)
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Note: Search is now handled server-side, only apply dropdown filters here
      // Dropdown filters stay client-side for better UX
      if (false && searchQuery) { // Disabled - now server-side
        const query = searchQuery.toLowerCase();
        const matchUsername = acc.username.toLowerCase().includes(query);
        const matchRemark = acc.remark?.toLowerCase().includes(query);
        
        if (!matchUsername && !matchRemark) {
          return false;
        }
      }
      
      // Application filter
      if (filterApplication && acc.applicationId !== filterApplication) {
        return false;
      }
      
      // Line filter
      if (filterLine && acc.lineId !== filterLine) {
        return false;
      }
      
      // Status filter
      if (filterStatus && acc.status !== filterStatus) {
        return false;
      }
      
      return true;
    });
  }, [accounts, searchQuery, filterApplication, filterLine, filterStatus]);

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchAccounts();
        setIsAddOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        fetchAccounts();
        setIsEditOpen(false);
        setSelected(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAccounts();
        setIsDeleteOpen(false);
        setSelected(null);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

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

  // Toggle single account status
  const toggleAccountStatus = async (accountId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/accounts/${accountId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  // Bulk status update
  const bulkUpdateStatus = async (status: "active" | "inactive") => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/accounts/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds: selectedIds, status }),
      });
      if (res.ok) {
        fetchAccounts();
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Error bulk updating status:", error);
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccounts.map(acc => acc.id));
    }
  };

  // Toggle single selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/accounts/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountIds: selectedIds }),
      });
      if (res.ok) {
        fetchAccounts();
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
      }
    } catch (error) {
      console.error("Error bulk deleting:", error);
    }
  };

  // Import Excel functionality
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Map Excel columns to database fields
      const accountsToImport = jsonData.map((row: any) => {
        // Find IDs by code/name
        const app = applications.find(a => a.code === row.Application || a.name === row.Application);
        const line = lines.find(l => l.code === row.Line || l.name === row.Line);
        const dept = departments.find(d => d.code === row.Department || d.name === row.Department);
        const role = roles.find(r => r.code === row.Role || r.name === row.Role);

        return {
          application_id: app?.id || null,
          line_id: line?.id || null,
          username: row.Username,
          password: row.Password,
          department_id: dept?.id || null,
          role_id: role?.id || null,
          remark: row.Remark || null,
        };
      });

      // Send to API
      const res = await fetch("/api/accounts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: accountsToImport }),
      });

      const result = await res.json();

      if (res.ok) {
        setImportResult({
          success: true,
          message: result.message,
          imported: result.imported,
          total: result.total,
        });
        fetchAccounts(); // Refresh table
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed",
        });
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        message: error.message || "Failed to parse Excel file",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Download Excel template
  const downloadTemplate = () => {
    const template = [
      {
        Application: "HWBO",
        Line: "SBMY",
        Username: "EXAMPLE001",
        Password: "password123",
        Department: "CRM_HOD",
        Role: "HOD_M1",
        Remark: "Example account",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts Template");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // Application
      { wch: 10 }, // Line
      { wch: 20 }, // Username
      { wch: 15 }, // Password
      { wch: 20 }, // Department
      { wch: 15 }, // Role
      { wch: 30 }, // Remark
    ];

    XLSX.writeFile(workbook, "Accounts_Import_Template.xlsx");
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
              placeholder="Search username atau remark..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9" 
            />
          </div>
          <select 
            value={filterApplication}
            onChange={(e) => setFilterApplication(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Applications</option>
            {applications
              .filter(app => {
                // If no data filters, show all
                if (allowedFilters.applications.length === 0) return true;
                // If has data filters, only show allowed applications
                return allowedFilters.applications.includes(app.id);
              })
              .map((app) => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
          </select>
          <select 
            value={filterLine}
            onChange={(e) => setFilterLine(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Lines</option>
            {lines
              .filter(line => {
                // If no data filters, show all
                if (allowedFilters.lines.length === 0) return true;
                // If has data filters, only show allowed lines
                return allowedFilters.lines.includes(line.id);
              })
              .map((line) => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="text-sm text-muted-foreground ml-2">
            {pagination.total} total account{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
          {hasImportPermission && (
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          )}
          {hasCreatePermission && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar - Show only when items selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
          <Badge variant="secondary" className="px-3 py-2 bg-primary/20 text-primary border-primary">
            {selectedIds.length} selected
          </Badge>
          {hasEnableDisablePermission && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus("active")}
                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary"
              >
                <Power className="mr-2 h-4 w-4" />
                Enable Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus("inactive")}
                className="bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive"
              >
                <Power className="mr-2 h-4 w-4" />
                Disable Selected
              </Button>
            </>
          )}
          {hasDeletePermission && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-[50px]">
                  <button onClick={toggleSelectAll} className="hover:text-primary">
                    {selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                {showStatusColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>}
                {showApplicationColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Application</th>}
                {showLineColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Line</th>}
                {showUsernameColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Username</th>}
                {showPasswordColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Password</th>}
                {showDepartmentColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Department</th>}
                {showRoleColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>}
                {showRemarkColumn && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Remark</th>}
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && accounts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-4">
                    <TableSkeleton rows={10} columns={8} />
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No accounts found</td></tr>
              ) : (
                filteredAccounts.map((acc) => (
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
                    {showStatusColumn && (
                      <td className="px-4 py-3">
                        {acc.status === "active" ? (
                          <Badge className="bg-primary text-primary-foreground">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>
                        )}
                      </td>
                    )}
                    {showApplicationColumn && (
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary">{acc.application}</Badge>
                      </td>
                    )}
                    {showLineColumn && <td className="px-4 py-3"><Badge variant="secondary">{acc.line}</Badge></td>}
                    {showUsernameColumn && <td className="px-4 py-3"><span className="font-mono text-sm font-medium text-primary">{acc.username}</span></td>}
                    {showPasswordColumn && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{showPassword[acc.id] ? acc.password : "••••••••"}</span>
                          <button onClick={() => togglePassword(acc.id)} className="text-muted-foreground hover:text-foreground">
                            {showPassword[acc.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                    {showDepartmentColumn && <td className="px-4 py-3 text-sm text-foreground">{acc.department}</td>}
                    {showRoleColumn && <td className="px-4 py-3 text-sm text-foreground">{acc.role}</td>}
                    {showRemarkColumn && <td className="px-4 py-3 text-sm text-muted-foreground">{acc.remark || "-"}</td>}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {hasEnableDisablePermission && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAccountStatus(acc.id, acc.status || "active")}
                            className={acc.status === "active" ? "hover:bg-primary/10 hover:text-primary" : "hover:bg-destructive/10 hover:text-destructive"}
                            title={acc.status === "active" ? "Disable Account" : "Enable Account"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        {hasEditPermission && (
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary"
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
                            }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasDeletePermission && (
                          <Button variant="ghost" size="sm" className="hover:bg-destructive/10"
                            onClick={() => { setSelected(acc); setIsDeleteOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
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
            onPageSizeChange={handlePageSizeChange}
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
                {applications.map((app) => (<option key={app.id} value={app.id}>{app.name}</option>))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Line</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.lineId} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}>
                <option value="">Select Line</option>
                {lines.map((line) => (<option key={line.id} value={line.id}>{line.name}</option>))}
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
                {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                <option value="">Select Role</option>
                {roles.map((role) => (<option key={role.id} value={role.id}>{role.name}</option>))}
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
                {applications.map((app) => (<option key={app.id} value={app.id}>{app.name}</option>))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Line</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.lineId} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}>
                <option value="">Select Line</option>
                {lines.map((line) => (<option key={line.id} value={line.id}>{line.name}</option>))}
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
                {departments.map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                <option value="">Select Role</option>
                {roles.map((role) => (<option key={role.id} value={role.id}>{role.name}</option>))}
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Accounts</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedIds.length} account(s)</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <p className="text-sm text-destructive font-medium">⚠️ Warning</p>
            <p className="text-sm text-muted-foreground mt-1">
              You are about to permanently delete {selectedIds.length} account(s). This will remove all account data and cannot be recovered.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={bulkDelete}>
              Delete {selectedIds.length} Account(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Accounts from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx or .xls) to import multiple accounts at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Download Template Button */}
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">Need a template?</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download our Excel template with example data and correct column format
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Excel File *</Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isImporting ? "Importing..." : "Choose Excel File"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Supported: .xlsx, .xls files
              </p>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`rounded-lg border p-4 ${
                importResult.success 
                  ? "border-primary bg-primary/10" 
                  : "border-destructive bg-destructive/10"
              }`}>
                <div className="flex items-start gap-2">
                  {importResult.success ? (
                    <span className="text-primary text-lg">✓</span>
                  ) : (
                    <span className="text-destructive text-lg">✗</span>
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      importResult.success ? "text-primary" : "text-destructive"
                    }`}>
                      {importResult.success ? "Success!" : "Failed"}
                    </p>
                    <p className="text-sm text-foreground mt-1">
                      {importResult.message}
                    </p>
                    {importResult.imported !== undefined && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Imported: {importResult.imported} / {importResult.total} accounts
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">📝 Excel Format:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Application</strong>: HWBO, SCRM, atau OFFICE_GRAM</li>
                <li><strong>Line</strong>: SBMY, LVMY, MYR, atau SGD</li>
                <li><strong>Username</strong>: Required, must be unique</li>
                <li><strong>Password</strong>: Required</li>
                <li><strong>Department</strong>: Code seperti CRM_HOD, SE2, dll</li>
                <li><strong>Role</strong>: Code seperti HOD_M1, SQUAD_LEAD, dll</li>
                <li><strong>Remark</strong>: Optional</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportOpen(false);
                setImportResult(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
}
