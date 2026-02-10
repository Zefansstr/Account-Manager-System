"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Edit, Trash2, CheckSquare, Square, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";

type MaintenanceLog = {
  id: string;
  date: string;
  assetId: string | null;
  assetCode: string | null;
  assetItem: string | null;
  issueDescription: string;
  currentStatus: string;
  maintenanceResult: string | null;
  cost: number | null;
  maintenanceUnit: string | null;
  operator: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function MaintenanceLogPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<MaintenanceLog | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const assetLookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    date: "",
    assetId: "",
    issueDescription: "",
    currentStatus: "pending",
    maintenanceResult: "",
    cost: "",
    maintenanceUnit: "",
    operator: "",
    remark: "",
  });

  const menuName = "MaintenanceLog";

  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-500" },
    { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
    { value: "completed", label: "Completed", color: "bg-green-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  ];

  const resetForm = () => {
    setFormData({
      date: "",
      assetId: "",
      issueDescription: "",
      currentStatus: "pending",
      maintenanceResult: "",
      cost: "",
      maintenanceUnit: "",
      operator: "",
      remark: "",
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === logs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(logs.map(log => log.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Fetch maintenance logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);
      if (filterStatus) params.append("status", filterStatus);

      const res = await fetch(`/api/asset-management/maintenance-log?${params}`);
      const json = await res.json();

      if (res.ok) {
        setLogs(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      } else {
        toast.error(json.error || "Failed to fetch maintenance logs");
      }
    } catch (error) {
      console.error("Error fetching maintenance logs:", error);
      toast.error("Failed to fetch maintenance logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLogs();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [page, searchQuery, filterStatus]);

  // Handle add log
  const handleAdd = async () => {
    if (!formData.date || !formData.issueDescription) {
      toast.error("Date and Issue Description are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch("/api/asset-management/maintenance-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          assetId: formData.assetId || null,
          issueDescription: formData.issueDescription,
          currentStatus: formData.currentStatus,
          maintenanceResult: formData.maintenanceResult || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          maintenanceUnit: formData.maintenanceUnit || null,
          operator: formData.operator || null,
          remark: formData.remark || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success("Maintenance log created successfully!");
        setIsAddOpen(false);
        resetForm();
        fetchLogs();
      } else {
        toast.error(json.error || "Failed to create maintenance log");
      }
    } catch (error: any) {
      console.error("Error creating maintenance log:", error);
      toast.error(error.message || "Failed to create maintenance log. Please try again.");
    }
  };

  // Handle edit log
  const handleEdit = async () => {
    if (!selected || !formData.date || !formData.issueDescription) {
      toast.error("Date and Issue Description are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/maintenance-log/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          assetId: formData.assetId || null,
          issueDescription: formData.issueDescription,
          currentStatus: formData.currentStatus,
          maintenanceResult: formData.maintenanceResult || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          maintenanceUnit: formData.maintenanceUnit || null,
          operator: formData.operator || null,
          remark: formData.remark || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success("Maintenance log updated successfully!");
        setIsEditOpen(false);
        resetForm();
        setSelected(null);
        fetchLogs();
      } else {
        toast.error(json.error || "Failed to update maintenance log");
      }
    } catch (error: any) {
      console.error("Error updating maintenance log:", error);
      toast.error(error.message || "Failed to update maintenance log. Please try again.");
    }
  };

  // Handle delete log
  const handleDelete = async () => {
    if (!selected) return;

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/maintenance-log/${selected.id}?userId=${userId || ""}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (res.ok) {
        toast.success("Maintenance log deleted successfully!");
        setIsDeleteOpen(false);
        setSelected(null);
        fetchLogs();
      } else {
        toast.error(json.error || "Failed to delete maintenance log");
      }
    } catch (error: any) {
      console.error("Error deleting maintenance log:", error);
      toast.error(error.message || "Failed to delete maintenance log. Please try again.");
    }
  };

  const openEditDialog = (log: MaintenanceLog) => {
    setSelected(log);
    setFormData({
      date: log.date,
      assetId: log.assetCode || log.assetId || "", // Use assetCode if available, fallback to assetId
      issueDescription: log.issueDescription,
      currentStatus: log.currentStatus,
      maintenanceResult: log.maintenanceResult || "",
      cost: log.cost ? log.cost.toString() : "",
      maintenanceUnit: log.maintenanceUnit || "",
      operator: log.operator || "",
      remark: log.remark || "",
    });
    setIsEditOpen(true);
  };

  // Fetch asset details by code and auto-fill maintenanceUnit
  const fetchAssetDetails = async (code: string) => {
    if (!code || !code.trim()) {
      return;
    }

    try {
      const res = await fetch(`/api/asset-management/accounts/by-code?code=${encodeURIComponent(code.trim())}`);
      const json = await res.json();

      if (res.ok && json.data && json.data.typeName) {
        // Auto-fill maintenanceUnit with type name
        setFormData(prev => ({
          ...prev,
          maintenanceUnit: json.data.typeName,
        }));
      }
    } catch (error) {
      console.error("Error fetching asset details:", error);
      // Silently fail - user can still manually enter maintenanceUnit
    }
  };

  // Handle asset ID input change with debounce
  const handleAssetIdChange = (value: string) => {
    setFormData(prev => ({ ...prev, assetId: value }));

    // Clear previous timeout
    if (assetLookupTimeoutRef.current) {
      clearTimeout(assetLookupTimeoutRef.current);
    }

    // Debounce asset lookup
    assetLookupTimeoutRef.current = setTimeout(() => {
      if (value && value.trim()) {
        fetchAssetDetails(value);
      } else {
        // Clear maintenanceUnit if assetId is cleared
        setFormData(prev => ({ ...prev, maintenanceUnit: "" }));
      }
    }, 500);
  };

  const openDeleteDialog = (log: MaintenanceLog) => {
    setSelected(log);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <Badge className={`${statusOption.color} text-white`}>
        {statusOption.label}
      </Badge>
    );
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
              placeholder="Search issue, result, operator, unit..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9" 
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
          <div className="text-sm text-muted-foreground ml-2">
            {pagination.total} total log{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Log
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
                    {selectedIds.length === logs.length && logs.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Asset ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Issue Description</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Current Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Maintenance Result</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Cost</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Maintenance Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Operator</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Remark</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">No maintenance logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSelect(log.id)} className="hover:text-primary">
                        {selectedIds.includes(log.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.date ? new Date(log.date).toLocaleDateString('id-ID') : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {log.assetCode ? (
                        <span className="font-mono text-sm font-medium text-primary">{log.assetCode}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.issueDescription || "-"}</td>
                    <td className="px-4 py-3">{getStatusBadge(log.currentStatus)}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.maintenanceResult || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.cost ? (
                        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(log.cost)}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.maintenanceUnit || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.operator || "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.remark || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => openEditDialog(log)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10" onClick={() => openDeleteDialog(log)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Maintenance Log</DialogTitle>
            <DialogDescription>Create a new maintenance log entry</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <DatePicker value={formData.date} onChange={(date) => setFormData({ ...formData, date })} placeholder="Select date" />
            </div>
            <div className="grid gap-2">
              <Label>Asset ID</Label>
              <Input 
                value={formData.assetId} 
                onChange={(e) => handleAssetIdChange(e.target.value)} 
                placeholder="Enter Asset ID (e.g. MYR - GM - 001)" 
              />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Issue Description *</Label>
              <Textarea value={formData.issueDescription} onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })} placeholder="Describe the maintenance issue" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Current Status</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.currentStatus} onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Cost (USD) (Optional)</Label>
              <Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} placeholder="e.g. 500.00" />
            </div>
            <div className="grid gap-2">
              <Label>Maintenance Unit</Label>
              <Input value={formData.maintenanceUnit} onChange={(e) => setFormData({ ...formData, maintenanceUnit: e.target.value })} placeholder="e.g. IT Department" />
            </div>
            <div className="grid gap-2">
              <Label>Operator</Label>
              <Input value={formData.operator} onChange={(e) => setFormData({ ...formData, operator: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Maintenance Result</Label>
              <Textarea value={formData.maintenanceResult} onChange={(e) => setFormData({ ...formData, maintenanceResult: e.target.value })} placeholder="Result of the maintenance" rows={3} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remark</Label>
              <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} placeholder="Optional remark" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.date || !formData.issueDescription}>Add Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Log</DialogTitle>
            <DialogDescription>Update maintenance log information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <DatePicker value={formData.date} onChange={(date) => setFormData({ ...formData, date })} placeholder="Select date" />
            </div>
            <div className="grid gap-2">
              <Label>Asset ID</Label>
              <Input 
                value={formData.assetId} 
                onChange={(e) => handleAssetIdChange(e.target.value)} 
                placeholder="Enter Asset ID (e.g. MYR - GM - 001)" 
              />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Issue Description *</Label>
              <Textarea value={formData.issueDescription} onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Current Status</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.currentStatus} onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Cost (Optional)</Label>
              <Input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Maintenance Unit</Label>
              <Input value={formData.maintenanceUnit} onChange={(e) => setFormData({ ...formData, maintenanceUnit: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Operator</Label>
              <Input value={formData.operator} onChange={(e) => setFormData({ ...formData, operator: e.target.value })} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Maintenance Result</Label>
              <Textarea value={formData.maintenanceResult} onChange={(e) => setFormData({ ...formData, maintenanceResult: e.target.value })} rows={3} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remark</Label>
              <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.date || !formData.issueDescription}>Update Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Maintenance Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this maintenance log? This action cannot be undone.
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
