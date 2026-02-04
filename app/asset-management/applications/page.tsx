"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

type Application = {
  id: string;
  code: string;
  name: string;
  description?: string;
  accountCount: number;
};

export default function AssetManagementApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  // Fetch types
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/asset-management/applications");
      const json = await res.json();
      if (res.ok) {
        setApplications(json.data || []);
      } else {
        toast.error(json.error || "Failed to fetch types");
      }
    } catch (error) {
      console.error("Error fetching types:", error);
      toast.error("Failed to fetch types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use requestAnimationFrame for smoother initial load
    requestAnimationFrame(() => {
      fetchApplications();
    });
  }, []);

  // Handle Add
  const handleAdd = async () => {
    try {
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch("/api/asset-management/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success("Type added successfully");
        fetchApplications();
        setIsAddOpen(false);
        setFormData({ code: "", name: "", description: "" });
      } else {
        toast.error(result.error || "Failed to add type");
      }
    } catch (error) {
      console.error("Error adding type:", error);
      toast.error("Failed to add type");
    }
  };

  // Handle Edit
  const handleEdit = async () => {
    if (!selectedApp) return;
    try {
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch(`/api/asset-management/applications/${selectedApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success("Type updated successfully");
        fetchApplications();
        setIsEditOpen(false);
        setSelectedApp(null);
        setFormData({ code: "", name: "", description: "" });
      } else {
        toast.error(result.error || "Failed to update type");
      }
    } catch (error) {
      console.error("Error updating type:", error);
      toast.error("Failed to update type");
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedApp) return;
    try {
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;
      
      const res = await fetch(`/api/asset-management/applications/${selectedApp.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: operator?.id,
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success("Type deleted successfully");
        fetchApplications();
        setIsDeleteOpen(false);
        setSelectedApp(null);
      } else {
        toast.error(result.error || "Failed to delete type");
      }
    } catch (error) {
      console.error("Error deleting type:", error);
      toast.error("Failed to delete type");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Type
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[15%]">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[40%]">
                  Type Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[25%]">
                  Total Devices
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-[20%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No types found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{app.code}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {app.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                        {app.accountCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelectedApp(app);
                            setFormData({ code: app.code, name: app.name, description: app.description || "" });
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
                            setSelectedApp(app);
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
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Type</DialogTitle>
            <DialogDescription>Create a new type entry</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. LAPTOP"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Type Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Laptop"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formData.code || !formData.name}>
              Add Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Type</DialogTitle>
            <DialogDescription>Update type information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Type Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.code || !formData.name}>
              Update Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedApp?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
