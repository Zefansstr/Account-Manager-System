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
  item: string;
  userUse: string;
  note?: string;
  status?: string;
  departmentTeam?: string;
  storageLocation?: string;
  purchaseAmount?: number;
  currency?: string;
  updatedAt?: string;
};

type LookupData = { id: string; code: string; name: string }[];

export default function AssetManagementAccountsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<LookupData>([]);
  const [deviceList, setDeviceList] = useState<LookupData>([]);
  const [brandList, setBrandList] = useState<string[]>([]);
  const [locationList, setLocationList] = useState<string[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  
  const [formData, setFormData] = useState({
    code: "",
    typeId: "",
    brand: "",
    item: "",
    userUse: "",
    note: "",
    departmentTeam: "",
    storageLocation: "",
    purchaseAmount: "",
    currency: "",
  });

  const menuName = "Accounts";

  // Get status badge color
  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">inactive</Badge>;
    }

    const statusLower = status.toLowerCase();
    
    if (statusLower === "active") {
      return <Badge className="bg-green-500 text-white">Active</Badge>;
    } else if (statusLower === "maintenance") {
      return <Badge className="bg-red-500 text-white">Maintenance</Badge>;
    } else if (statusLower === "not_used") {
      return <Badge variant="secondary" className="bg-gray-500 text-white">Not Used</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      typeId: "",
      brand: "",
      item: "",
      userUse: "",
      note: "",
      departmentTeam: "",
      storageLocation: "",
      purchaseAmount: "",
      currency: "",
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

  // Fetch Type for dropdown
  const fetchLookups = async () => {
    try {
      // Fetch departments
      const deptRes = await fetch("/api/asset-management/departments");
      const deptJson = await deptRes.json();
      if (deptRes.ok) {
        setDepartments(deptJson.data || []);
      }
    } catch (error) {
      console.error("Error fetching lookups:", error);
      toast.error("Failed to fetch departments.");
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
      if (filterDevice) params.append("deviceId", filterDevice);
      if (filterBrand) params.append("brand", filterBrand);
      if (filterLocation) params.append("storageLocation", filterLocation);

      const res = await fetch(`/api/asset-management/accounts?${params}`);
      const json = await res.json();

      if (res.ok) {
        setDevices(json.data || []);
        setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      } else {
        toast.error(json.error || "Failed to fetch assets");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast.error("Failed to fetch assets");
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique brands and locations for filter dropdowns
  const fetchFilterOptions = async () => {
    try {
      const res = await fetch("/api/asset-management/accounts?limit=1000");
      const json = await res.json();
      
      if (res.ok && json.data) {
        // Get unique brands
        const brands = new Set<string>();
        const locations = new Set<string>();
        
        json.data.forEach((asset: Device) => {
          if (asset.brand) brands.add(asset.brand);
          if (asset.storageLocation) locations.add(asset.storageLocation);
        });
        
        setBrandList(Array.from(brands).sort());
        setLocationList(Array.from(locations).sort());
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Fetch device list for dropdown
  const fetchDeviceList = async () => {
    try {
      const res = await fetch("/api/asset-management/devices");
      const json = await res.json();
      if (res.ok) {
        setDeviceList(json.data || []);
      }
    } catch (error) {
      console.error("Error fetching device list:", error);
    }
  };

  useEffect(() => {
    fetchLookups();
    fetchDeviceList();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDevices();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [page, searchQuery, filterDevice, filterBrand, filterLocation]);

  // Handle add device
  const handleAdd = async () => {
    if (!formData.code || !formData.item) {
      toast.error("Code and Device are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch("/api/asset-management/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          code: formData.code,
          typeId: formData.typeId || null,
          brand: formData.brand || null,
          item: formData.item,
          userUse: formData.userUse || null,
          note: formData.note || null,
          departmentTeam: formData.departmentTeam || null,
          storageLocation: formData.storageLocation || null,
          purchaseAmount: formData.purchaseAmount ? parseFloat(formData.purchaseAmount) : null,
          currency: formData.currency || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(`Asset "${formData.code}" created successfully!`);
        setIsAddOpen(false);
        resetForm();
        fetchDevices();
      } else {
        toast.error(json.error || "Failed to create asset");
      }
    } catch (error: any) {
      console.error("Error creating device:", error);
      toast.error(error.message || "Failed to create asset. Please try again.");
    }
  };

  // Handle edit device
  const handleEdit = async () => {
    if (!selected || !formData.code || !formData.item) {
      toast.error("Code and Item are required");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          typeId: formData.typeId || null,
          brand: formData.brand || null,
          item: formData.item,
          userUse: formData.userUse || null,
          note: formData.note || null,
          departmentTeam: formData.departmentTeam || null,
          storageLocation: formData.storageLocation || null,
          purchaseAmount: formData.purchaseAmount ? parseFloat(formData.purchaseAmount) : null,
          currency: formData.currency || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(`Asset "${formData.code}" updated successfully!`);
        setIsEditOpen(false);
        resetForm();
        setSelected(null);
        fetchDevices();
      } else {
        toast.error(json.error || "Failed to update asset");
      }
    } catch (error: any) {
      console.error("Error updating asset:", error);
      toast.error(error.message || "Failed to update asset. Please try again.");
    }
  };

  return (
    <PermissionGuard menuName={menuName}>
      <div className="space-y-3">
      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search all fields..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page when search changes
              }}
              className="w-64 pl-9" 
            />
          </div>
          <select 
            value={filterDevice}
            onChange={(e) => {
              setFilterDevice(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Devices</option>
            {deviceList.map((device) => (
              <option key={device.id} value={device.name}>{device.name}</option>
            ))}
          </select>
          <select 
            value={filterBrand}
            onChange={(e) => {
              setFilterBrand(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Brands</option>
            {brandList.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <select 
            value={filterLocation}
            onChange={(e) => {
              setFilterLocation(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All Locations</option>
            {locationList.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          <div className="text-sm text-muted-foreground ml-2">
            {pagination.total} total asset{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Asset ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Device</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Brand</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Location</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Purchase</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Currency</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Last Updated</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Remarks</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">No devices found</td></tr>
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
                      <span className="font-mono text-sm font-medium text-primary">{device.code || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.item || "-"}</td>
                    <td className="px-4 py-3">
                      {device.brand ? (
                        <Badge variant="secondary">{device.brand}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(device.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.userUse || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.departmentTeam || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.storageLocation || "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {device.purchaseAmount ? (
                        <span>{new Intl.NumberFormat('id-ID').format(device.purchaseAmount)}</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{device.currency || "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {device.updatedAt ? (
                        new Date(device.updatedAt).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{device.note || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={() => {
                          setSelected(device);
                          setFormData({
                            code: device.code || "",
                            typeId: device.typeId || "",
                            brand: device.brand || "",
                            item: device.item || "",
                            userUse: device.userUse || "",
                            note: device.note || "",
                            departmentTeam: device.departmentTeam || "",
                            storageLocation: device.storageLocation || "",
                            purchaseAmount: device.purchaseAmount ? device.purchaseAmount.toString() : "",
                            currency: device.currency || "",
                          });
                          setIsEditOpen(true);
                        }}>
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
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>Create a new asset entry</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. DEV001" />
            </div>
            <div className="grid gap-2">
              <Label>Brand</Label>
              <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Apple, Dell, HP" />
            </div>
            <div className="grid gap-2">
              <Label>Device *</Label>
              <select
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Device</option>
                {deviceList.map((device) => (
                  <option key={device.id} value={device.name}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Storage Location</Label>
              <Input value={formData.storageLocation} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} placeholder="e.g. Warehouse A, Room 101" />
            </div>
            <div className="grid gap-2">
              <Label>Purchase Amount</Label>
              <Input type="number" step="0.01" value={formData.purchaseAmount} onChange={(e) => setFormData({ ...formData, purchaseAmount: e.target.value })} placeholder="e.g. 5000000" />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                <option value="">Select Currency</option>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="MYR">MYR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remarks</Label>
              <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Optional remarks" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!formData.code || !formData.item}>Add Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Brand</Label>
              <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Apple, Dell, HP" />
            </div>
            <div className="grid gap-2">
              <Label>Device *</Label>
              <select
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Device</option>
                {deviceList.map((device) => (
                  <option key={device.id} value={device.name}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Storage Location</Label>
              <Input value={formData.storageLocation} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} placeholder="e.g. Warehouse A, Room 101" />
            </div>
            <div className="grid gap-2">
              <Label>Purchase Amount</Label>
              <Input type="number" step="0.01" value={formData.purchaseAmount} onChange={(e) => setFormData({ ...formData, purchaseAmount: e.target.value })} placeholder="e.g. 5000000" />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                <option value="">Select Currency</option>
                <option value="IDR">IDR</option>
                <option value="USD">USD</option>
                <option value="SGD">SGD</option>
                <option value="MYR">MYR</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remarks</Label>
              <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Optional remarks" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!formData.code || !formData.item}>Update Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete asset <strong>{selected?.code}</strong>? This action cannot be undone.
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
