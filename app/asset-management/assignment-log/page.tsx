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
      <div className="flex flex-col w-full bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
        <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Assignment Log</h1>
              <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">
                {pagination.total}
              </span>
            </div>
            <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">
              View and manage asset assignment history.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-6 mb-6">
          <div className="flex items-center gap-3 flex-wrap" />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 w-80 h-9 border border-[#7F5539]/25 dark:border-[#7F5539]/50 rounded-md px-3.5 bg-[#faf8f6] dark:bg-[#1a1a1a] flex-shrink-0 shadow-[0_2px_6px_rgba(127,85,57,0.1)]">
              <Search className="h-4 w-4 flex-shrink-0 text-[rgba(127,85,57,0.35)] dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search assigned to, department, handled by..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-[#1e1e1e] dark:text-gray-200 min-w-0 placeholder:text-[rgba(127,85,57,0.4)] dark:placeholder:text-gray-500"
              />
            </div>
            <div className="h-8 w-px flex-shrink-0 bg-[rgba(127,85,57,0.2)]" aria-hidden />
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="h-8 px-4 bg-[#3a2314] dark:bg-transparent dark:border dark:border-[#2a2a2a] dark:text-white rounded border-0 cursor-pointer text-white text-sm font-medium whitespace-nowrap hover:opacity-90 dark:hover:bg-white/10 transition-colors shadow-[0_2px_6px_rgba(127,85,57,0.12)]"
            >
              <span className="dark:text-[#a06540]">+</span> Add Log
            </button>
          </div>
        </div>

        <div className="min-h-[280px] max-h-[calc(100vh-320px)] overflow-auto border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-lg scrollbar-invisible bg-white dark:bg-[#101211]">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
              <tr>
                <th className="text-center text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 w-14 bg-[#f0eae4] dark:bg-[#101211]">
                  <button onClick={toggleSelectAll} className="hover:text-[#7f5539]">
                    {selectedIds.length === logs.length && logs.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Date</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Asset ID</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Assigned To</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Department</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Reason</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Handled By</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Remark</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#101211]">
              {loading ? (
                <tr className="bg-white dark:bg-[#101211]">
                  <td colSpan={9} className="p-4 bg-white dark:bg-[#101211] text-center text-muted-foreground dark:text-gray-400">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr className="bg-white dark:bg-[#101211]">
                  <td colSpan={9} className="p-0 align-middle bg-white dark:bg-[#101211]">
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-4 py-12 text-center sm:min-h-[260px]">
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">No assignment logs found</p>
                      <p className="mt-1 max-w-sm text-xs text-[rgba(127,85,57,0.55)] dark:text-gray-500">
                        Add an assignment or adjust your search to see records here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle text-center">
                      <button onClick={() => toggleSelect(log.id)} className="hover:text-[#7f5539]">
                        {selectedIds.includes(log.id) ? (
                          <CheckSquare className="h-4 w-4 text-[#7f5539]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                      {log.date ? new Date(log.date).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                      {log.assetCode ? (
                        <span className="font-mono text-sm font-medium text-[#7f5539] dark:text-[#a06540]">{log.assetCode}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{log.assignedTo || "-"}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{log.department || "-"}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{log.reason || "-"}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{log.handledBy || "-"}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{log.remark || "-"}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
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

        <div className="mt-6 pt-4 border-t border-[#7F5539]/20 dark:border-[#7F5539]/40">
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90" onClick={handleAdd} disabled={!formData.date || !formData.assignedTo}>Add Log</Button>
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsEditOpen(false); resetForm(); setSelected(null); }}>Cancel</Button>
            <Button className="min-w-[130px] bg-[#7f5539] hover:bg-[#7f5539]/90" onClick={handleEdit} disabled={!formData.date || !formData.assignedTo}>Update Log</Button>
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
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="min-w-[88px]" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
