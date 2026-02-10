"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Edit, Trash2, CheckSquare, Square, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";

type AssignmentLog = {
  id: string;
  date: string;
  assetId: string | null;
  assetCode: string | null;
  assetItem: string | null;
  assignedTo: string;
  department: string | null;
  reason: string | null;
  handledBy: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

type Department = {
  id: string;
  code: string;
  name: string;
  description?: string;
  accountCount?: number;
};

export default function AssignmentLogPage() {
  const [logs, setLogs] = useState<AssignmentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<AssignmentLog | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  const [formData, setFormData] = useState({
    date: "",
    assetId: "",
    assignedTo: "",
    department: "",
    reason: "",
    handledBy: "",
    remark: "",
  });

  const menuName = "AssignmentLog";

  const resetForm = () => {
    setFormData({
      date: "",
      assetId: "",
      assignedTo: "",
      department: "",
      reason: "",
      handledBy: "",
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

  // Fetch departments for dropdown
  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/asset-management/departments");
      const json = await res.json();
      if (res.ok) {
        setDepartments(json.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Fetch assignment logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/asset-management/assignment-log?${params}`);
      const json = await res.json();

      if (res.ok) {
        setLogs(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      } else {
        toast.error(json.error || "Failed to fetch assignment logs");
      }
    } catch (error) {
      console.error("Error fetching assignment logs:", error);
      toast.error("Failed to fetch assignment logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLogs();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [page, searchQuery]);

  // Handle add log
  const handleAdd = async () => {
    if (!formData.date || !formData.assignedTo) {
      toast.error("Date and Assigned To are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch("/api/asset-management/assignment-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          assetId: formData.assetId || null,
          assignedTo: formData.assignedTo,
          department: formData.department || null,
          reason: formData.reason || null,
          handledBy: formData.handledBy || null,
          remark: formData.remark || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success("Assignment log created successfully!");
        setIsAddOpen(false);
        resetForm();
        fetchLogs();
      } else {
        const errorMsg = json.error || "Failed to create assignment log";
        const details = json.details ? ` (${json.details})` : "";
        toast.error(`${errorMsg}${details}`);
      }
    } catch (error: any) {
      console.error("Error creating assignment log:", error);
      toast.error(error.message || "Failed to create assignment log. Please try again.");
    }
  };

  // Handle edit log
  const handleEdit = async () => {
    if (!selected || !formData.date || !formData.assignedTo) {
      toast.error("Date and Assigned To are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/assignment-log/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          assetId: formData.assetId || null,
          assignedTo: formData.assignedTo,
          department: formData.department || null,
          reason: formData.reason || null,
          handledBy: formData.handledBy || null,
          remark: formData.remark || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success("Assignment log updated successfully!");
        setIsEditOpen(false);
        resetForm();
        setSelected(null);
        fetchLogs();
      } else {
        const errorMsg = json.error || "Failed to update assignment log";
        const details = json.details ? ` (${json.details})` : "";
        toast.error(`${errorMsg}${details}`);
      }
    } catch (error: any) {
      console.error("Error updating assignment log:", error);
      toast.error(error.message || "Failed to update assignment log. Please try again.");
    }
  };

  // Handle delete log
  const handleDelete = async () => {
    if (!selected) return;

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/assignment-log/${selected.id}?userId=${userId || ""}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (res.ok) {
        toast.success("Assignment log deleted successfully!");
        setIsDeleteOpen(false);
        setSelected(null);
        fetchLogs();
      } else {
        toast.error(json.error || "Failed to delete assignment log");
      }
    } catch (error: any) {
      console.error("Error deleting assignment log:", error);
      toast.error(error.message || "Failed to delete assignment log. Please try again.");
    }
  };

  const openEditDialog = (log: AssignmentLog) => {
    setSelected(log);
    setFormData({
      date: log.date,
      assetId: log.assetId || "",
      assignedTo: log.assignedTo,
      department: log.department || "",
      reason: log.reason || "",
      handledBy: log.handledBy || "",
      remark: log.remark || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (log: AssignmentLog) => {
    setSelected(log);
    setIsDeleteOpen(true);
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
              placeholder="Search assigned to, department, handled by..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9" 
            />
          </div>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Assigned To</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Handled By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Remark</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No assignment logs found</td></tr>
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
                    <td className="px-4 py-3 text-sm text-foreground">{log.assignedTo || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.department || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.reason || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{log.handledBy || "-"}</td>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Assignment Log</DialogTitle>
            <DialogDescription>Create a new assignment log entry</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <DatePicker value={formData.date} onChange={(date) => setFormData({ ...formData, date })} placeholder="Select date" />
            </div>
            <div className="grid gap-2">
              <Label>Asset ID</Label>
              <Input value={formData.assetId} onChange={(e) => setFormData({ ...formData, assetId: e.target.value })} placeholder="Enter Asset ID (e.g. ASSET001)" />
            </div>
            <div className="grid gap-2">
              <Label>Assigned To *</Label>
              <Input value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Reason</Label>
              <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for assignment" />
            </div>
            <div className="grid gap-2">
              <Label>Handled By</Label>
              <Input value={formData.handledBy} onChange={(e) => setFormData({ ...formData, handledBy: e.target.value })} placeholder="e.g. Admin Name" />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remark</Label>
              <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} placeholder="Optional remark" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.date || !formData.assignedTo}>Add Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment Log</DialogTitle>
            <DialogDescription>Update assignment log information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <DatePicker value={formData.date} onChange={(date) => setFormData({ ...formData, date })} placeholder="Select date" />
            </div>
            <div className="grid gap-2">
              <Label>Asset ID</Label>
              <Input value={formData.assetId} onChange={(e) => setFormData({ ...formData, assetId: e.target.value })} placeholder="Enter Asset ID (e.g. ASSET001)" />
            </div>
            <div className="grid gap-2">
              <Label>Assigned To *</Label>
              <Input value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Department</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Reason</Label>
              <Textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Handled By</Label>
              <Input value={formData.handledBy} onChange={(e) => setFormData({ ...formData, handledBy: e.target.value })} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remark</Label>
              <Textarea value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.date || !formData.assignedTo}>Update Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment log? This action cannot be undone.
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
