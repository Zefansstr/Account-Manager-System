"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";

type Brand = { id: string; code: string; name: string; description?: string; status?: string; accountCount: number };

export default function AssetManagementBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const menuName = "Brands";

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/asset-management/brands");
      
      let json;
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        json = { error: "Invalid response from server" };
      }
      
      if (res.ok) {
        setBrands(json.data || []);
      } else {
        console.error("Error response status:", res.status);
        console.error("Error response:", json);
        if (json.error) {
          toast.error(json.error);
        } else {
          toast.error(`Failed to fetch brands. Status: ${res.status}`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      fetchBrands();
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

      const res = await fetch("/api/asset-management/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });

      let result;
      try {
        const text = await res.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        result = { error: "Invalid response from server" };
      }

      if (res.ok) {
        toast.success(`Brand "${formData.name}" created successfully!`);
        fetchBrands();
        setIsAddOpen(false);
        resetForm();
      } else {
        console.error("Error response status:", res.status);
        console.error("Error response:", result);
        
        if (result.error) {
          if (result.error.includes("duplicate key") || result.error?.includes("unique")) {
            toast.error(`Code "${formData.code}" already exists. Please use a different code.`);
          } else if (result.error.includes("does not exist")) {
            toast.error("Database table not found. Please contact administrator.");
          } else {
            toast.error(result.error);
          }
        } else {
          toast.error(`Failed to create brand. Status: ${res.status}`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to create brand. Please try again.");
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch(`/api/asset-management/brands/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: operator?.id,
        }),
      });

      let result;
      try {
        const text = await res.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        result = { error: "Invalid response from server" };
      }

      if (res.ok) {
        toast.success(`Brand "${formData.name}" updated successfully!`);
        fetchBrands();
        setIsEditOpen(false);
        setSelected(null);
        resetForm();
      } else {
        console.error("Error response status:", res.status);
        console.error("Error response:", result);
        
        if (result.error) {
          if (result.error.includes("duplicate key") || result.error?.includes("unique")) {
            toast.error(`Code "${formData.code}" already exists. Please use a different code.`);
          } else {
            toast.error(result.error);
          }
        } else {
          toast.error(`Failed to update brand. Status: ${res.status}`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to update brand. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch(`/api/asset-management/brands/${selected.id}?userId=${operator?.id || ""}`, {
        method: "DELETE",
      });

      let result;
      try {
        const text = await res.text();
        result = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        result = { error: "Invalid response from server" };
      }

      if (res.ok) {
        toast.success(`Brand "${selected.name}" deleted successfully!`);
        fetchBrands();
        setIsDeleteOpen(false);
        setSelected(null);
      } else {
        console.error("Error response status:", res.status);
        console.error("Error response:", result);
        toast.error(result.error || `Failed to delete brand. Status: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to delete brand. Please try again.");
    }
  };

  return (
    <PermissionGuard menuName={menuName}>
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" />Add Brand</Button>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[15%]">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[40%]">Brand Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground w-[25%]">Total Assets</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-foreground w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : brands.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No brands found</td></tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3"><Badge variant="secondary">{brand.code}</Badge></td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{brand.name}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">{brand.accountCount}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => { setSelected(brand); setFormData({ code: brand.code, name: brand.name, description: brand.description || "" }); setIsEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:bg-destructive/10" onClick={() => { setSelected(brand); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <DialogHeader><DialogTitle>Add New Brand</DialogTitle><DialogDescription>Create a new brand entry</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="code">Code *</Label><Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. APPLE_001" /></div>
              <div className="grid gap-2"><Label htmlFor="name">Brand Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Apple" /></div>
              <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!formData.code || !formData.name}>Add Brand</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Brand</DialogTitle><DialogDescription>Update brand information</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="edit-code">Code *</Label><Input id="edit-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-name">Brand Name *</Label><Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelected(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleEdit} disabled={!formData.code || !formData.name}>Update Brand</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete Brand</DialogTitle><DialogDescription>Are you sure you want to delete <strong>{selected?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setSelected(null); }}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
