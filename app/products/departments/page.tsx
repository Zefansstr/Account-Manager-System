"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";

type Department = { id: string; code: string; name: string; description?: string; accountCount: number };

export default function ProductsDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products/departments");
      const json = await res.json();
      if (res.ok) {
        setDepartments(json.data || []);
      } else {
        toast.error(json.error || "Failed to fetch departments");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      fetchDepartments();
    });
  }, []);

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "" });
  };

  const handleAdd = async () => {
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch("/api/products/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Department "${formData.name}" created successfully!`);
        fetchDepartments();
        setIsAddOpen(false);
        resetForm();
      } else {
        if (result.error && (result.error.includes("duplicate key") || result.error?.includes("unique"))) {
          toast.error(`Code "${formData.code}" already exists. Please use a different code.`);
        } else {
          toast.error(result.error || "Failed to create department. Please try again.");
        }
        console.error("Error response:", result);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to create department. Please try again.");
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch(`/api/products/departments/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Department "${formData.name}" updated successfully!`);
        fetchDepartments();
        setIsEditOpen(false);
        setSelected(null);
        resetForm();
      } else {
        if (result.error && (result.error.includes("duplicate key") || result.error?.includes("unique"))) {
          toast.error(`Code "${formData.code}" already exists. Please use a different code.`);
        } else {
          toast.error(result.error || "Failed to update department. Please try again.");
        }
        console.error("Error response:", result);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to update department. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch(`/api/products/departments/${selected.id}?userId=${operator?.id || ""}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Department "${selected.name}" deleted successfully!`);
        fetchDepartments();
        setIsDeleteOpen(false);
        setSelected(null);
      } else {
        toast.error(result.error || "Failed to delete department. Please try again.");
        console.error("Error response:", result);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to delete department. Please try again.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Department</Button>
      </div>
      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[15%]">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[40%]">Department Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[25%]">Total Accounts</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : departments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No departments found</td></tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><Badge variant="secondary">{dept.code}</Badge></td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{dept.name}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{dept.accountCount}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => { setSelected(dept); setFormData({ code: dept.code, name: dept.name, description: dept.description || "" }); setIsEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10" onClick={() => { setSelected(dept); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Department</DialogTitle><DialogDescription>Create a new department entry</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="code">Code *</Label><Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. CRM_HOD" /></div>
            <div className="grid gap-2"><Label htmlFor="name">Department Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. CRM HOD" /></div>
            <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.code || !formData.name}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Department</DialogTitle><DialogDescription>Update department information</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="edit-code">Code *</Label><Input id="edit-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-name">Department Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.code || !formData.name}>Update Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Department</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setSelected(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
