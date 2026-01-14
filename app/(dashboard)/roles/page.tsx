"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Role = { id: string; code: string; name: string; description?: string; accountCount: number };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");
      const json = await res.json();
      setRoles(json.data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use requestAnimationFrame for smoother initial load
    requestAnimationFrame(() => {
      fetchRoles();
    });
  }, []);

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { fetchRoles(); setIsAddOpen(false); setFormData({ code: "", name: "", description: "" }); }
    } catch (error) { console.error("Error:", error); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/roles/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (res.ok) { fetchRoles(); setIsEditOpen(false); setSelected(null); setFormData({ code: "", name: "", description: "" }); }
    } catch (error) { console.error("Error:", error); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/roles/${selected.id}`, { method: "DELETE" });
      if (res.ok) { fetchRoles(); setIsDeleteOpen(false); setSelected(null); }
    } catch (error) { console.error("Error:", error); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Role</Button>
      </div>
      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[15%]">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[40%]">Role Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[25%]">Total Accounts</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No roles found</td></tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><Badge variant="secondary">{role.code}</Badge></td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{role.name}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{role.accountCount}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => { setSelected(role); setFormData({ code: role.code, name: role.name, description: role.description || "" }); setIsEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10" onClick={() => { setSelected(role); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
          <DialogHeader><DialogTitle>Add New Role</DialogTitle><DialogDescription>Create a new role entry</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="code">Code *</Label><Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. HOD_M1" /></div>
            <div className="grid gap-2"><Label htmlFor="name">Role Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HOD - M1 Above" /></div>
            <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={!formData.code || !formData.name}>Add Role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Role</DialogTitle><DialogDescription>Update role information</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="edit-code">Code *</Label><Input id="edit-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-name">Role Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button onClick={handleEdit} disabled={!formData.code || !formData.name}>Update Role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Role</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
