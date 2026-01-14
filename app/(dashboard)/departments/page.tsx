"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Department = { id: string; code: string; name: string; description?: string; accountCount: number };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const json = await res.json();
      setDepartments(json.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use requestAnimationFrame for smoother initial load
    requestAnimationFrame(() => {
      fetchDepartments();
    });
  }, []);

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { fetchDepartments(); setIsAddOpen(false); setFormData({ code: "", name: "", description: "" }); }
    } catch (error) { console.error("Error:", error); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/departments/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { fetchDepartments(); setIsEditOpen(false); setSelected(null); setFormData({ code: "", name: "", description: "" }); }
    } catch (error) { console.error("Error:", error); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/departments/${selected.id}`, { method: "DELETE" });
      if (res.ok) { fetchDepartments(); setIsDeleteOpen(false); setSelected(null); }
    } catch (error) { console.error("Error:", error); }
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
          <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={!formData.code || !formData.name}>Add Department</Button></DialogFooter>
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
          <DialogFooter><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button onClick={handleEdit} disabled={!formData.code || !formData.name}>Update Department</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Department</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
