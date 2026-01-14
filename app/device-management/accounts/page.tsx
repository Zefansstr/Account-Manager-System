"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Edit, Trash2, Power, CheckSquare, Square, Search, Laptop } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";

type Device = {
  id: string;
  code: string;
  type: string;
  typeId?: string;
  brand: string;
  brandId?: string;
  item: string;
  specification: string;
  userUse: string;
  note?: string;
  status?: string;
};

type LookupData = { id: string; code: string; name: string }[];

export default function DeviceManagementAccountsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState<LookupData>([]);
  const [brands, setBrands] = useState<LookupData>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  const [formData, setFormData] = useState({
    code: "",
    typeId: "",
    brandId: "",
    item: "",
    specification: "",
    userUse: "",
    note: "",
  });

  const menuName = "Accounts";

  const resetForm = () => {
    setFormData({
      code: "",
      typeId: "",
      brandId: "",
      item: "",
      specification: "",
      userUse: "",
      note: "",
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === devices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(devices.map(device => device.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Fetch Type and Brand for dropdowns
  const fetchLookups = async () => {
    try {
      // Use combined lookup endpoint to reduce API calls from 2 to 1
      const res = await fetch("/api/lookups?module=device-management");
      const json = await res.json();
      setTypes(json.data?.applications || []); // Applications = Types for device management
      setBrands(json.data?.lines || []); // Lines = Brands for device management
    } catch (error) {
      console.error("Error fetching lookups:", error);
      toast.error("Failed to fetch types and brands.");
    }
  };

  // Fetch devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/device-management/accounts?${params}`);
      const json = await res.json();

      if (res.ok) {
        setDevices(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      } else {
        toast.error(json.error || "Failed to fetch devices");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast.error("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
    fetchDevices();
  }, [page, searchQuery]);

  // Handle add device
  const handleAdd = async () => {
    if (!formData.code || !formData.item) {
      toast.error("Code and Item are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch("/api/device-management/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          typeId: formData.typeId || null,
          brandId: formData.brandId || null,
          item: formData.item,
          specification: formData.specification || null,
          userUse: formData.userUse || null,
          note: formData.note || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(`Device "${formData.code}" created successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchDevices();
      } else {
        toast.error(json.error || "Failed to create device");
      }
    } catch (error: any) {
      console.error("Error creating device:", error);
      toast.error(error.message || "Failed to create device. Please try again.");
    }
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
              placeholder="Search code, item, atau note..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9" 
            />
          </div>
          <div className="text-sm text-muted-foreground ml-2">
            {pagination.total} total device{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Import Excel
          </Button>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
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
                    {selectedIds.length === devices.length && devices.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Brand</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Item</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Specification</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">User Use</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Note</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No devices found</td></tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleSelect(device.id)} className="hover:text-primary">
                        {selectedIds.includes(device.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={device.status === "active" ? "default" : "secondary"} className={device.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                        {device.status || "inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-primary">{device.code || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {device.type ? (
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary flex items-center gap-2">
                          <Laptop className="h-3 w-3 text-white" />
                          {device.type}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {device.brand ? (
                        <Badge variant="secondary">{device.brand}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.item || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.specification || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.userUse || "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{device.note || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10">
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
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Create a new device entry</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. DEV001" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}>
                <option value="">Select Type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Brand</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}>
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Item *</Label>
              <Input value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} placeholder="e.g. Laptop" />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Specification</Label>
              <Textarea value={formData.specification} onChange={(e) => setFormData({ ...formData, specification: e.target.value })} placeholder="Device specifications" />
            </div>
            <div className="grid gap-2">
              <Label>User Use</Label>
              <Input value={formData.userUse} onChange={(e) => setFormData({ ...formData, userUse: e.target.value })} placeholder="e.g. John Doe" />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Note</Label>
              <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Optional note" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.code || !formData.item}>Add Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}>
                <option value="">Select Type</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Brand</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}>
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Item *</Label>
              <Input value={formData.item} onChange={(e) => setFormData({ ...formData, item: e.target.value })} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Specification</Label>
              <Textarea value={formData.specification} onChange={(e) => setFormData({ ...formData, specification: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>User Use</Label>
              <Input value={formData.userUse} onChange={(e) => setFormData({ ...formData, userUse: e.target.value })} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Note</Label>
              <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => setIsEditOpen(false)} disabled={!formData.code || !formData.item}>Update Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete device <strong>{selected?.code}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(false)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
}
