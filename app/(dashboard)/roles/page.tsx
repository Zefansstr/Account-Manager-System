"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, CODE_BADGE_VARIANTS } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/use-roles";

type Role = { id: string; code: string; name: string; description?: string; accountCount: number };

export default function RolesPage() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const { data: roles = [], isLoading: loading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const handleAdd = async () => {
    try {
      await createRole.mutateAsync(formData);
      setIsAddOpen(false);
      setFormData({ code: "", name: "", description: "" });
    } catch { /* toast in hook */ }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      await updateRole.mutateAsync({ id: selected.id, data: formData });
      setIsEditOpen(false);
      setSelected(null);
      setFormData({ code: "", name: "", description: "" });
    } catch { /* toast in hook */ }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteRole.mutateAsync(selected.id);
      setIsDeleteOpen(false);
      setSelected(null);
    } catch { /* toast in hook */ }
  };

  return (
    <div className="flex flex-col w-full bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
      <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Roles</h1>
            <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">{roles.length}</span>
          </div>
          <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">Manage role entries and their account counts</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-[#7f5539] hover:bg-[#7f5539]/90 text-white dark:bg-[#7f5539] dark:hover:bg-[#a06540]"><Plus className="mr-2 h-4 w-4" />Add Role</Button>
      </div>
      <div className="min-h-[280px] max-h-[calc(100vh-320px)] overflow-auto border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-lg scrollbar-invisible bg-white dark:bg-[#101211]">
        <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[15%] bg-[#f0eae4] dark:bg-[#101211]">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[40%] bg-[#f0eae4] dark:bg-[#101211]">Role Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[25%] bg-[#f0eae4] dark:bg-[#101211]">Total Accounts</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#1e1e1e] dark:text-white w-[20%] bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#101211]">
              {loading ? (
                <tr className="bg-white dark:bg-[#101211]"><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground dark:text-gray-400">Loading...</td></tr>
              ) : roles.length === 0 ? (
                <tr className="bg-white dark:bg-[#101211]"><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground dark:text-gray-400">No roles found</td></tr>
              ) : (
                roles.map((role: Role, index: number) => (
                  <tr key={role.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><Badge variant={CODE_BADGE_VARIANTS[index % 4]}>{role.code}</Badge></td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{role.name}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><Badge variant="count">{role.accountCount}</Badge></td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
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
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
          <DialogHeader><DialogTitle className="text-[#1e1e1e] dark:text-white">Add New Role</DialogTitle><DialogDescription className="dark:text-gray-400">Create a new role entry</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="code" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Code *</Label><Input id="code" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. HOD_M1" /></div>
            <div className="grid gap-2"><Label htmlFor="name" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Role Name *</Label><Input id="name" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HOD - M1 Above" /></div>
            <div className="grid gap-2"><Label htmlFor="description" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Description</Label><Textarea id="description" className="min-h-[80px] text-sm text-[#1e1e1e] dark:text-gray-200 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]"><Button variant="outline" className="min-w-[88px]" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button onClick={handleAdd} disabled={!formData.code || !formData.name || createRole.isPending} className="min-w-[100px] bg-[#7f5539] hover:bg-[#7f5539]/90 text-white">Add Role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
          <DialogHeader><DialogTitle className="text-[#1e1e1e] dark:text-white">Edit Role</DialogTitle><DialogDescription className="dark:text-gray-400">Update role information</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label htmlFor="edit-code" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Code *</Label><Input id="edit-code" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-name" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Role Name *</Label><Input id="edit-name" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="grid gap-2"><Label htmlFor="edit-description" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Description</Label><Textarea id="edit-description" className="min-h-[80px] text-sm text-[#1e1e1e] dark:text-gray-200 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]"><Button variant="outline" className="min-w-[88px]" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button onClick={handleEdit} disabled={!formData.code || !formData.name || updateRole.isPending} className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90 text-white">Update Role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
          <DialogHeader><DialogTitle className="text-[#1e1e1e] dark:text-white">Delete Role</DialogTitle><DialogDescription className="dark:text-gray-400">Are you sure you want to delete <strong className="text-[#1e1e1e] dark:text-white">{selected?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]"><Button variant="outline" className="min-w-[88px]" onClick={() => setIsDeleteOpen(false)}>Cancel</Button><Button variant="destructive" className="min-w-[88px]" onClick={handleDelete} disabled={deleteRole.isPending}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
