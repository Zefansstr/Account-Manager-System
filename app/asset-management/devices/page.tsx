"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge, CODE_BADGE_VARIANTS } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";

type Device = { id: string; code: string; name: string; description?: string; accountCount: number };

export default function AssetManagementDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const menuName = "Devices";

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/asset-management/devices");
      
      let json;
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        json = { error: "Invalid response from server" };
      }
      
      if (res.ok) {
        const data = json.data || [];
        setDevices(data);
        setFilteredDevices(data);
      } else {
        console.error("Error response status:", res.status);
        console.error("Error response:", json);
        if (json.error) {
          toast.error(json.error);
        } else {
          toast.error(`Failed to fetch devices. Status: ${res.status}`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      fetchDevices();
    });
  }, []);

  // Filter devices based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDevices(devices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = devices.filter(
        (device) =>
          device.code.toLowerCase().includes(query) ||
          device.name.toLowerCase().includes(query) ||
          (device.description && device.description.toLowerCase().includes(query))
      );
      setFilteredDevices(filtered);
    }
  }, [searchQuery, devices]);

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "" });
  };

  const handleAdd = async () => {
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch("/api/asset-management/devices", {
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
        toast.success(`Device "${formData.name}" created successfully!`);
        fetchDevices();
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
          toast.error(`Failed to create device. Status: ${res.status}`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to create device. Please try again.");
    }
  };

  const handleEdit = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch(`/api/asset-management/devices/${selected.id}`, {
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
        toast.success(`Device "${formData.name}" updated successfully!`);
        fetchDevices();
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
          toast.error(`Failed to update device. Status: ${res.status}`);
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to update device. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      // Get operator ID from localStorage
      const operatorStr = localStorage.getItem("operator");
      const operator = operatorStr ? JSON.parse(operatorStr) : null;

      const res = await fetch(`/api/asset-management/devices/${selected.id}?userId=${operator?.id || ""}`, {
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
        toast.success(`Device "${selected.name}" deleted successfully!`);
        fetchDevices();
        setIsDeleteOpen(false);
        setSelected(null);
      } else {
        console.error("Error response status:", res.status);
        console.error("Error response:", result);
        toast.error(result.error || `Failed to delete device. Status: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Failed to delete device. Please try again.");
    }
  };

  return (
    <PermissionGuard menuName={menuName}>
      <div className="flex flex-col w-full bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
        <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Device</h1>
              <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">{devices.length}</span>
            </div>
            <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">Manage device types and their asset counts</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} className="bg-[#7f5539] hover:bg-[#7f5539]/90 text-white dark:bg-[#7f5539] dark:hover:bg-[#a06540]"><Plus className="mr-2 h-4 w-4" />Add Device</Button>
        </div>

        {/* Search Box */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(127,85,57,0.4)] dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search code, device name, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-white dark:bg-[#101211] border-[#7F5539]/20 dark:border-[#7F5539]/40 text-[#1e1e1e] dark:text-gray-200 placeholder:text-[rgba(127,85,57,0.4)] dark:placeholder:text-gray-500 focus-visible:ring-[#7f5539]"
            />
          </div>
        </div>

        <div className="mt-6 overflow-auto max-h-[calc(100vh-380px)] rounded-lg border border-[#7F5539]/20 dark:border-[#7F5539]/40 bg-white dark:bg-[#101211] scrollbar-invisible">
          <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[15%] bg-[#f0eae4] dark:bg-[#101211]">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[40%] bg-[#f0eae4] dark:bg-[#101211]">Device Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white w-[25%] bg-[#f0eae4] dark:bg-[#101211]">Total Assets</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#1e1e1e] dark:text-white w-[20%] bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#101211]">
              {loading ? (
                <tr className="bg-white dark:bg-[#101211]"><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground dark:text-gray-400">Loading...</td></tr>
              ) : filteredDevices.length === 0 ? (
                <tr className="bg-white dark:bg-[#101211]"><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground dark:text-gray-400">{searchQuery ? "No devices found matching your search" : "No devices found"}</td></tr>
              ) : (
                filteredDevices.map((device, index) => (
                  <tr key={device.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><Badge variant={CODE_BADGE_VARIANTS[index % 4]}>{device.code}</Badge></td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{device.name}</td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><Badge variant="count">{device.accountCount}</Badge></td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => { setSelected(device); setFormData({ code: device.code, name: device.name, description: device.description || "" }); setIsEditOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10" onClick={() => { setSelected(device); setIsDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
            <DialogHeader><DialogTitle className="text-[#1e1e1e] dark:text-white">Add New Device</DialogTitle><DialogDescription className="dark:text-gray-400">Create a new device entry</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="code" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Code *</Label><Input id="code" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. LAPTOP_001" /></div>
              <div className="grid gap-2"><Label htmlFor="name" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Device Name *</Label><Input id="name" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Laptop" /></div>
              <div className="grid gap-2"><Label htmlFor="description" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Description</Label><Textarea id="description" className="text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
              <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
              <Button className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90 text-white" onClick={handleAdd} disabled={!formData.code || !formData.name}>Add Device</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
            <DialogHeader><DialogTitle className="text-[#1e1e1e] dark:text-white">Edit Device</DialogTitle><DialogDescription className="dark:text-gray-400">Update device information</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="edit-code" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Code *</Label><Input id="edit-code" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-name" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Device Name *</Label><Input id="edit-name" className="h-9 text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="grid gap-2"><Label htmlFor="edit-description" className="text-sm font-medium text-[#1e1e1e] dark:text-white">Description</Label><Textarea id="edit-description" className="text-sm text-[#1e1e1e] dark:text-gray-200" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            </div>
            <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
              <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsEditOpen(false); setSelected(null); resetForm(); }}>Cancel</Button>
              <Button className="min-w-[130px] bg-[#7f5539] hover:bg-[#7f5539]/90 text-white" onClick={handleEdit} disabled={!formData.code || !formData.name}>Update Device</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
            <DialogHeader><DialogTitle className="text-[#1e1e1e] dark:text-white">Delete Device</DialogTitle><DialogDescription className="dark:text-gray-400">Are you sure you want to delete <strong className="text-[#1e1e1e] dark:text-white">{selected?.name}</strong>? This action cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
              <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsDeleteOpen(false); setSelected(null); }}>Cancel</Button>
              <Button variant="destructive" className="min-w-[88px]" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
