"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Download, Power, CheckSquare, Square, Search, UserCog } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import * as XLSX from "xlsx";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { canCreate, canEdit, canDelete, canEnableDisable, canImport, canExport, isColumnVisible, isSuperAdmin, getAllowedFilters } from "@/lib/permissions";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount, accountKeys } from "@/hooks/use-accounts";
import { useLookups } from "@/hooks/use-lookups";
import { useQueryClient } from "@tanstack/react-query";
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

// Warna badge per application (konsisten per nama)
const APPLICATION_BADGE_COLORS = [
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700" },
  { bg: "bg-lime-100", text: "text-lime-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
];
function getApplicationBadgeColor(applicationName: string) {
  let hash = 0;
  for (let i = 0; i < applicationName.length; i++) {
    hash = applicationName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % APPLICATION_BADGE_COLORS.length;
  return APPLICATION_BADGE_COLORS[index];
}

export default function AccountsPage() {
  // Get operator ID for data filtering
  const [operatorId, setOperatorId] = useState<string>();

  // State untuk dropdown filter — diisi langsung dari API
  const [filterAppOptions, setFilterAppOptions] = useState<{ id: string; code: string; name: string }[]>([]);
  const [filterLineOptions, setFilterLineOptions] = useState<{ id: string; code: string; name: string }[]>([]);

  useEffect(() => {
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      const operator = JSON.parse(operatorStr);
      setOperatorId(operator.id);
    }

    // Fetch applications & lines untuk dropdown filter
    fetch("/api/applications")
      .then((r) => r.json())
      .then((json) => {
        const apps = (json.data || []).map((a: any) => ({ id: a.id, code: a.code, name: a.name }));
        setFilterAppOptions(apps);
      })
      .catch(() => {});

    fetch("/api/lines")
      .then((r) => r.json())
      .then((json) => {
        const ls = (json.data || []).map((l: any) => ({ id: l.id, code: l.code, name: l.name }));
        setFilterLineOptions(ls);
      })
      .catch(() => {});
  }, []);
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
  
  // Toast notifications
  const { toasts, success, error, warning, removeToast } = useToast();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterApplication, filterLine, filterStatus]);

  // React Query hooks for data fetching with automatic caching
  const { data: accountsData, isLoading: accountsLoading, error: accountsError } = useAccounts(
    page,
    limit,
    debouncedSearch,
    operatorId,
    {
      application_id: filterApplication || undefined,
      line_id: filterLine || undefined,
      status: filterStatus || undefined,
    }
  );

  const { data: lookupsData, isLoading: lookupsLoading } = useLookups('account-management');

  const accounts = accountsData?.data || [];
  const pagination = accountsData?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const applications = filterAppOptions;
  const lines = filterLineOptions;
  const departments = lookupsData?.departments || [];
  const roles = lookupsData?.roles || [];

  const loading = accountsLoading || lookupsLoading;

  // No need for client-side filtering anymore - all filtering is done server-side
  const filteredAccounts = accounts;

  // React Query mutations
  const queryClient = useQueryClient();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const handleAdd = async () => {
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      await createAccount.mutateAsync({
        ...formData,
        userId: operator?.id, // Add userId for audit logging
      });
      
      setIsAddOpen(false);
      resetForm();
      toast.success(`Account "${formData.username}" created successfully!`);
    } catch (err: any) {
      // Check for duplicate username error
      if (err.message && (err.message.includes("duplicate key") || err.message.includes("unique"))) {
        toast.error(`Username "${formData.username}" already exists. Please use a different username.`);
      } else {
        toast.error(err.message || "Failed to create account. Please try again.");
      }
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      await updateAccount.mutateAsync({
        id: selected.id,
        data: {
          ...formData,
          userId: operator?.id, // Add userId for audit logging
        },
      });
      
      setIsEditOpen(false);
      setSelected(null);
      resetForm();
      toast.success(`Account "${formData.username}" updated successfully!`);
    } catch (err: any) {
      // Check for duplicate username error
      if (err.message && (err.message.includes("duplicate key") || err.message.includes("unique"))) {
        toast.error(`Username "${formData.username}" is already taken by another account. Please use a different username.`);
      } else {
        toast.error(err.message || "Failed to update account. Please try again.");
      }
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteAccount.mutateAsync(selected.id);
      setIsDeleteOpen(false);
      setSelected(null);
      toast.success(`Account "${selected.username}" deleted successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account. Please try again.");
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
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
        const statusText = status === "active" ? "enabled" : "disabled";
        success(`Successfully ${statusText} ${selectedIds.length} account(s)!`);
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setSelectedIds([]);
      } else {
        const result = await res.json();
        error(result.error || "Failed to update account status. Please try again.");
      }
    } catch (err) {
      console.error("Error bulk updating status:", err);
      error("An error occurred while updating account status. Please try again.");
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAccounts.map((acc: Account) => acc.id));
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
        success(`Successfully deleted ${selectedIds.length} account(s)!`);
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
      } else {
        const result = await res.json();
        error(result.error || "Failed to delete accounts. Please try again.");
      }
    } catch (err) {
      console.error("Error bulk deleting:", err);
      error("An error occurred while deleting accounts. Please try again.");
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
        const app = applications.find((a: { id: string; code: string; name: string }) => a.code === row.Application || a.name === row.Application);
        const line = lines.find((l: { id: string; code: string; name: string }) => l.code === row.Line || l.name === row.Line);
        const dept = departments.find((d: { id: string; code: string; name: string }) => d.code === row.Department || d.name === row.Department);
        const role = roles.find((r: { id: string; code: string; name: string }) => r.code === row.Role || r.name === row.Role);

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
        queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Content panel */}
      <div className="flex-1 flex flex-col min-h-0 bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
        {/* Header */}
        <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>Account Management</h1>
              <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">
                {pagination.total}
              </span>
            </div>
            <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">
              Manage your team members and their account details here.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4 mt-6 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterDropdown
              value={filterApplication}
              onChange={(v) => { setFilterApplication(v); setPage(1); }}
              options={filterAppOptions.map((a) => ({ value: a.id, label: a.name || a.code }))}
              placeholder="All Application"
              minWidth="140px"
            />
            <FilterDropdown
              value={filterLine}
              onChange={(v) => { setFilterLine(v); setPage(1); }}
              options={filterLineOptions.map((l) => ({ value: l.id, label: l.name || l.code }))}
              placeholder="All Lines"
              minWidth="120px"
            />
            <FilterDropdown
              value={filterStatus}
              onChange={(v) => { setFilterStatus(v); setPage(1); }}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="All Status"
              minWidth="100px"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 w-80 h-9 border border-[#7F5539]/25 dark:border-[#7F5539]/50 rounded-md px-3.5 bg-[#faf8f6] dark:bg-[#1a1a1a] flex-shrink-0 shadow-[0_2px_6px_rgba(127,85,57,0.1)]">
              <Search className="h-4 w-4 flex-shrink-0 text-[rgba(127,85,57,0.35)] dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search username, role, or remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-[#1e1e1e] dark:text-gray-200 min-w-0 placeholder:text-[rgba(127,85,57,0.4)] dark:placeholder:text-gray-500"
              />
            </div>
            <div className="h-8 w-px flex-shrink-0 bg-[rgba(127,85,57,0.2)]" aria-hidden />
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
            {hasImportPermission && (
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="flex items-center gap-2 h-8 px-4 bg-[#a06540] rounded border-0 cursor-pointer text-white text-sm font-medium whitespace-nowrap hover:opacity-90 transition-opacity shadow-[0_2px_6px_rgba(127,85,57,0.12)]"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </button>
            )}
            {hasCreatePermission && (
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="h-8 px-4 bg-[#3a2314] dark:bg-transparent dark:border dark:border-[#2a2a2a] dark:text-white rounded border-0 cursor-pointer text-white text-sm font-medium whitespace-nowrap hover:opacity-90 dark:hover:bg-white/10 transition-colors shadow-[0_2px_6px_rgba(127,85,57,0.12)]"
              >
                <span className="dark:text-[#a06540]">+</span> Add Account
              </button>
            )}
          </div>
        </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 py-3 px-4 rounded bg-[#7f5539]/5 dark:bg-[#7f5539]/15 border border-[#7f5539]/20 dark:border-[#7f5539]/30 mb-4">
          <span className="text-sm font-medium bg-[#7f5539]/10 text-[#7f5539] px-3 py-1.5 rounded">
            {selectedIds.length} selected
          </span>
          {hasEnableDisablePermission && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus("active")}
                className="border-2 border-[#7f5539] bg-[#7f5539]/10 hover:bg-[#7f5539]/20 text-[#7f5539] shadow-[0_2px_6px_rgba(127,85,57,0.1)]"
              >
                <Power className="mr-2 h-4 w-4" />
                Enable Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkUpdateStatus("inactive")}
                className="border-2 border-amber-700 bg-amber-50 hover:bg-amber-100 text-amber-800 shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
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
              className="border-2 border-red-600 bg-red-600 hover:bg-red-700 text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

        <div className="min-h-[280px] max-h-[calc(100vh-320px)] overflow-auto border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-lg scrollbar-invisible bg-white dark:bg-[#101211]">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
              <tr>
                <th className="text-center text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 w-14 bg-[#f0eae4] dark:bg-[#101211]">
                  <button onClick={toggleSelectAll} className="hover:text-[#7f5539]">
                    {selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                {showStatusColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Status</th>}
                {showApplicationColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Application</th>}
                {showLineColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Line</th>}
                {showUsernameColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Username</th>}
                {showPasswordColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Password</th>}
                {showDepartmentColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Department</th>}
                {showRoleColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Role</th>}
                {showRemarkColumn && <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Remark</th>}
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#101211]">
              {loading && accounts.length === 0 ? (
                <tr className="bg-white dark:bg-[#101211]">
                  <td colSpan={10} className="p-4 bg-white dark:bg-[#101211]">
                    <TableSkeleton rows={10} columns={8} />
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr className="bg-white dark:bg-[#101211]"><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground dark:text-gray-400 bg-white dark:bg-[#101211]">No accounts found</td></tr>
              ) : (
                filteredAccounts.map((acc: Account) => {
                  const { bg, text } = getApplicationBadgeColor(acc.application || "");
                  return (
                  <tr key={acc.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle text-center">
                      <button onClick={() => toggleSelect(acc.id)} className="hover:text-[#7f5539]">
                        {selectedIds.includes(acc.id) ? (
                          <CheckSquare className="h-4 w-4 text-[#7f5539]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    {showStatusColumn && (
                      <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                        {acc.status === "active" ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">Active</span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-red-100 dark:bg-red-900/40 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">Inactive</span>
                        )}
                      </td>
                    )}
                    {showApplicationColumn && (
                      <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                        <span className={`inline-flex items-center gap-1.5 rounded-md ${bg} ${text} px-2.5 py-1 text-xs font-medium`}>
                          <UserCog className="h-3 w-3 shrink-0" />
                          {acc.application}
                        </span>
                      </td>
                    )}
                    {showLineColumn && <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{acc.line}</td>}
                    {showUsernameColumn && <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{acc.username}</td>}
                    {showPasswordColumn && (
                      <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{showPassword[acc.id] ? acc.password : "••••••••"}</span>
                          <button onClick={() => togglePassword(acc.id)} className="text-[#5d5d5d] dark:text-gray-400 hover:text-[#1e1e1e] dark:hover:text-gray-200">
                            {showPassword[acc.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    )}
                    {showDepartmentColumn && <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{acc.department}</td>}
                    {showRoleColumn && <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{acc.role}</td>}
                    {showRemarkColumn && <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{acc.remark || "-"}</td>}
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-[#7F5539]/20 dark:border-[#7F5539]/40">
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
        <DialogContent className="max-w-2xl bg-white border border-[rgba(127,85,57,0.2)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e]" style={{ fontFamily: 'Inter, sans-serif' }}>Add New Account</DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d]">Create a new account entry</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Application</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}>
                <option value="">Select Application</option>
                {applications.map((app: { id: string; code: string; name: string }) => (<option key={app.id} value={app.id}>{app.name}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Line</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.lineId} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}>
                <option value="">Select Line</option>
                {lines.map((line: { id: string; code: string; name: string }) => (<option key={line.id} value={line.id}>{line.name}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Username *</Label>
              <Input className="h-9 text-sm text-[#1e1e1e]" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. SBMYHOD001" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Password *</Label>
              <Input type="text" className="h-9 text-sm text-[#1e1e1e]" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Department</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((dept: { id: string; code: string; name: string }) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Role</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                <option value="">Select Role</option>
                {roles.map((role: { id: string; code: string; name: string }) => (<option key={role.id} value={role.id}>{role.name}</option>))}
              </select>
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Remark</Label>
              <Textarea className="min-h-[80px] text-sm text-[#1e1e1e] resize-none" value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} placeholder="Optional remark" />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90" onClick={handleAdd} disabled={!formData.username || !formData.password}>Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-white border border-[rgba(127,85,57,0.2)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e]" style={{ fontFamily: 'Inter, sans-serif' }}>Edit Account</DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d]">Update account information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Application</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.applicationId} onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}>
                <option value="">Select Application</option>
                {applications.map((app: { id: string; code: string; name: string }) => (<option key={app.id} value={app.id}>{app.name}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Line</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.lineId} onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}>
                <option value="">Select Line</option>
                {lines.map((line: { id: string; code: string; name: string }) => (<option key={line.id} value={line.id}>{line.name}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Username *</Label>
              <Input className="h-9 text-sm text-[#1e1e1e]" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Password *</Label>
              <Input type="text" className="h-9 text-sm text-[#1e1e1e]" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Department</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.departmentId} onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((dept: { id: string; code: string; name: string }) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Role</Label>
              <select className="h-9 w-full rounded-md border border-[rgba(127,85,57,0.25)] bg-white px-3 py-2 text-sm text-[#1e1e1e] focus:outline-none focus:ring-1 focus:ring-[#7f5539]/40" value={formData.roleId} onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}>
                <option value="">Select Role</option>
                {roles.map((role: { id: string; code: string; name: string }) => (<option key={role.id} value={role.id}>{role.name}</option>))}
              </select>
            </div>
            <div className="col-span-2 grid gap-1.5">
              <Label className="text-sm font-medium text-[#1e1e1e]">Remark</Label>
              <Textarea className="min-h-[80px] text-sm text-[#1e1e1e] resize-none" value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="min-w-[130px] bg-[#7f5539] hover:bg-[#7f5539]/90" onClick={handleEdit} disabled={!formData.username || !formData.password}>Update Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white border border-[rgba(127,85,57,0.2)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e]" style={{ fontFamily: 'Inter, sans-serif' }}>Delete Account</DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d]">
              Are you sure you want to delete account <strong className="text-[#1e1e1e]">{selected?.username}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="min-w-[88px]" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="bg-white border border-[rgba(127,85,57,0.2)]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e]" style={{ fontFamily: 'Inter, sans-serif' }}>Delete Multiple Accounts</DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d]">
              Are you sure you want to delete <strong className="text-[#1e1e1e]">{selectedIds.length} account(s)</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-700">⚠️ Warning</p>
            <p className="text-sm text-[#5d5d5d] mt-1">
              You are about to permanently delete {selectedIds.length} account(s). This will remove all account data and cannot be recovered.
            </p>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="min-w-[140px]" onClick={bulkDelete}>
              Delete {selectedIds.length} Account(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-xl border border-[rgba(127,85,57,0.18)] bg-white p-0 shadow-xl">
          {/* Header strip */}
          <div className="border-b border-[rgba(127,85,57,0.1)] bg-gradient-to-b from-[#7f5539]/8 to-transparent px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7f5539]/15">
                <Upload className="h-5 w-5 text-[#7f5539]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-medium text-[#1e1e1e]" style={{ fontFamily: 'Inter, sans-serif' }}>Import from Excel</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-[#5d5d5d]">
                  Bulk add accounts using .xlsx or .xls
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Step 1: Template */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 rounded-lg border border-[#e8e0d5]/80 bg-[#faf8f6] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7f5539] text-xs font-semibold text-white">1</span>
                <div>
                  <p className="text-sm font-medium text-[#1e1e1e]">Get the template</p>
                  <p className="text-xs text-[#5d5d5d] mt-0.5">Example rows and correct columns</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-[#7f5539]/35 bg-white px-4 text-[#7f5539] hover:bg-[#7f5539]/10"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="rounded-lg border border-[#e8e0d5]/80 bg-[#faf8f6] p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7f5539] text-xs font-semibold text-white">2</span>
                <p className="text-sm font-medium text-[#1e1e1e]">Upload your file</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[rgba(127,85,57,0.25)] bg-white py-8 transition-colors hover:border-[#7f5539]/50 hover:bg-[#7f5539]/5 disabled:opacity-60 disabled:pointer-events-none"
              >
                <Upload className="h-8 w-8 text-[#7f5539]/70" />
                <span className="text-sm font-medium text-[#1e1e1e]">
                  {isImporting ? "Importing…" : "Click to choose file"}
                </span>
                <span className="text-xs text-[#5d5d5d]">.xlsx or .xls</span>
              </button>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className={`rounded-lg border p-4 ${
                importResult.success
                  ? "border-[#7f5539]/30 bg-[#7f5539]/5"
                  : "border-red-200 bg-red-50"
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${importResult.success ? "bg-[#7f5539]/20 text-[#7f5539]" : "bg-red-100 text-red-700"}`}>
                    {importResult.success ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${importResult.success ? "text-[#7f5539]" : "text-red-700"}`}>
                      {importResult.success ? "Import complete" : "Import failed"}
                    </p>
                    <p className="text-sm text-[#1e1e1e] mt-0.5">{importResult.message}</p>
                    {importResult.imported !== undefined && (
                      <p className="text-xs text-[#5d5d5d] mt-1">
                        {importResult.imported} of {importResult.total} accounts
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Format reference */}
            <details className="group rounded-lg border border-[rgba(127,85,57,0.12)] bg-white">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-[#1e1e1e] [&::-webkit-details-marker]:hidden">
                <span className="text-[#5d5d5d]">📋</span>
                Column format reference
              </summary>
              <div className="border-t border-[rgba(127,85,57,0.08)] px-4 py-3">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Application</dt>
                    <dd className="text-[#5d5d5d]">HWBO, SCRM, OFFICE_GRAM</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Line</dt>
                    <dd className="text-[#5d5d5d]">SBMY, LVMY, MYR, SGD</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Username</dt>
                    <dd className="text-[#5d5d5d]">Required, must be unique</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Password</dt>
                    <dd className="text-[#5d5d5d]">Required</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Department</dt>
                    <dd className="text-[#5d5d5d]">e.g. CRM_HOD, SE2</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Role</dt>
                    <dd className="text-[#5d5d5d]">e.g. HOD_M1, SQUAD_LEAD</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-24 shrink-0 font-medium text-[#1e1e1e]">Remark</dt>
                    <dd className="text-[#5d5d5d]">Optional</dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-3 border-t border-[rgba(127,85,57,0.1)] bg-[#faf8f6] px-6 py-4">
            <Button
              variant="outline"
              className="min-w-[88px] border-[#7f5539]/25 text-[#1e1e1e] hover:bg-[#7f5539]/10"
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
    </PermissionGuard>
  );
}
