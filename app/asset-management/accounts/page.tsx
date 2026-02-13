"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Edit, Trash2, Power, CheckSquare, Square, Search, Laptop, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [assetDetail, setAssetDetail] = useState<any>(null);
  
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

  const [detailData, setDetailData] = useState({
    condition: "",
    yearOfPurchase: "",
    yearOfProduction: "",
    cpu: "",
    gpu: "",
    ram: "",
    memory: "",
    item: "",
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
    } else if (statusLower === "inactive") {
      return <Badge variant="secondary" className="bg-gray-600 text-white">Inactive</Badge>;
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
    setDetailData({
      condition: "",
      yearOfPurchase: "",
      yearOfProduction: "",
      cpu: "",
      gpu: "",
      ram: "",
      memory: "",
      item: "",
    });
    setShowDetailForm(false);
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

  // Fetch asset detail
  const fetchAssetDetail = async (assetId: string) => {
    try {
      const res = await fetch(`/api/asset-management/accounts/${assetId}/details`);
      const json = await res.json();
      if (res.ok && json.data) {
        setAssetDetail(json.data);
        // Set detail data if exists
        setDetailData({
          condition: json.data.condition || "",
          yearOfPurchase: json.data.year_of_purchase?.toString() || "",
          yearOfProduction: json.data.year_of_production?.toString() || "",
          cpu: json.data.cpu || "",
          gpu: json.data.gpu || "",
          ram: json.data.ram || "",
          memory: json.data.memory || "",
          item: json.data.item || "",
        });
        setShowDetailForm(true);
      } else {
        setAssetDetail(null);
        setDetailData({
          condition: "",
          yearOfPurchase: "",
          yearOfProduction: "",
          cpu: "",
          gpu: "",
          ram: "",
          memory: "",
          item: "",
        });
        setShowDetailForm(false);
      }
    } catch (error) {
      console.error("Error fetching asset detail:", error);
      setAssetDetail(null);
      setDetailData({
        condition: "",
        yearOfPurchase: "",
        yearOfProduction: "",
        cpu: "",
        gpu: "",
        ram: "",
        memory: "",
        item: "",
      });
      setShowDetailForm(false);
    }
  };

  // Handle add device
  const handleAdd = async () => {
    // Validate required fields
    if (!formData.code || !formData.brand || !formData.item || !formData.purchaseAmount || !formData.currency) {
      toast.error("Code, Brand, Device, Purchase Amount, and Currency are required");
      return;
    }

    // Validate detail form based on device type
    const isLaptopOrComputer = formData.item.toLowerCase().includes("laptop") || formData.item.toLowerCase().includes("computer");
    
    if (isLaptopOrComputer) {
      // For Laptop/Computer: Condition, Year of Production, CPU, GPU, RAM, Memory are required
      if (!detailData.condition || !detailData.yearOfProduction || !detailData.cpu || !detailData.gpu || !detailData.ram || !detailData.memory) {
        toast.error("For Laptop/Computer, Condition, Year of Production, CPU, GPU, RAM, and Memory are required in Asset Detail");
        return;
      }
    } else {
      // For other devices: Condition is required
      if (!detailData.condition) {
        toast.error("Condition is required in Asset Detail");
        return;
      }
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
        // Save detail for all devices
        if (showDetailForm) {
          const detailRes = await fetch(`/api/asset-management/accounts/${json.data.id}/details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              condition: detailData.condition || null,
              yearOfPurchase: detailData.yearOfPurchase || null,
              yearOfProduction: detailData.yearOfProduction || null,
              cpu: detailData.cpu || null,
              gpu: detailData.gpu || null,
              ram: detailData.ram || null,
              memory: detailData.memory || null,
              item: detailData.item || null,
              userId,
            }),
          });

          if (!detailRes.ok) {
            const detailJson = await detailRes.json();
            console.error("Error saving detail:", detailJson.error);
          }
        }

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

  // Handle inactive device
  const handleInactive = async () => {
    if (!selected) return;

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selected.code,
          typeId: selected.typeId || null,
          brand: selected.brand || null,
          item: selected.item,
          userUse: null, // Clear user_use
          note: selected.note || null,
          departmentTeam: null, // Clear department_team
          storageLocation: selected.storageLocation || null,
          purchaseAmount: selected.purchaseAmount || null,
          currency: selected.currency || null,
          status: "inactive", // Set status to inactive
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        toast.success(`Asset "${selected.code}" has been deactivated`);
        setIsInactiveOpen(false);
        setSelected(null);
        fetchDevices();
      } else {
        toast.error(json.error || "Failed to deactivate asset");
      }
    } catch (error: any) {
      console.error("Error deactivating asset:", error);
      toast.error(error.message || "Failed to deactivate asset. Please try again.");
    }
  };

  // Handle edit device
  const handleEdit = async () => {
    if (!selected) {
      toast.error("No asset selected");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      // Only update Storage Location and Remarks
      const res = await fetch(`/api/asset-management/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selected.code, // Keep original code
          typeId: selected.typeId || null,
          brand: selected.brand || null,
          item: selected.item, // Keep original item
          userUse: selected.userUse || null,
          note: formData.note || null, // Only update note
          departmentTeam: selected.departmentTeam || null,
          storageLocation: formData.storageLocation || null, // Only update storageLocation
          purchaseAmount: selected.purchaseAmount || null,
          currency: selected.currency || null,
          userId,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        // Update asset details if form is shown
        if (showDetailForm) {
          const detailRes = await fetch(`/api/asset-management/accounts/${selected.id}/details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              condition: detailData.condition || null,
              yearOfPurchase: detailData.yearOfPurchase || null,
              yearOfProduction: detailData.yearOfProduction || null,
              cpu: detailData.cpu || null,
              gpu: detailData.gpu || null,
              ram: detailData.ram || null,
              memory: detailData.memory || null,
              item: detailData.item || null,
              userId,
            }),
          });

          if (!detailRes.ok) {
            const detailJson = await detailRes.json();
            console.error("Error updating detail:", detailJson.error);
          }
        }

        toast.success(`Asset "${selected.code}" updated successfully!`);
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
                      <button
                        onClick={() => {
                          setSelected(device);
                          fetchAssetDetail(device.id);
                          setIsDetailOpen(true);
                        }}
                        className="font-mono text-sm font-medium text-primary hover:underline cursor-pointer"
                      >
                        {device.code || "-"}
                      </button>
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-primary/10 hover:text-primary"
                          onClick={() => {
                            setSelected(device);
                            setIsInactiveOpen(true);
                          }}
                          disabled={device.status === "inactive"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={async () => {
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
                          // Fetch asset detail
                          await fetchAssetDetail(device.id);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                onChange={(e) => {
                  setFormData({ ...formData, item: e.target.value });
                  // Auto-show detail form when device is selected
                  if (e.target.value) {
                    setShowDetailForm(true);
                  } else {
                    setShowDetailForm(false);
                  }
                }}
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
              <Label>Purchase Amount *</Label>
              <Input type="number" step="0.01" value={formData.purchaseAmount} onChange={(e) => setFormData({ ...formData, purchaseAmount: e.target.value })} placeholder="e.g. 5000000" />
            </div>
            <div className="grid gap-2">
              <Label>Currency *</Label>
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
            {formData.item && (
              <div className="col-span-2 mt-2">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <button
                      type="button"
                      onClick={() => setShowDetailForm(!showDetailForm)}
                      className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                    >
                      <CardTitle className="text-base font-semibold text-primary">Asset Detail</CardTitle>
                      {showDetailForm ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.item.toLowerCase().includes("laptop") || formData.item.toLowerCase().includes("computer")
                        ? "Add detailed specifications (for Laptop/Computer)"
                        : "Add basic details (Condition & Year of Purchase)"}
                    </p>
                  </CardHeader>
                  {showDetailForm && (
                    <CardContent className="pt-0">
                      {formData.item.toLowerCase().includes("laptop") || formData.item.toLowerCase().includes("computer") ? (
                        // Full detail form for Laptop/Computer
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Condition *</Label>
                            <select
                              value={detailData.condition}
                              onChange={(e) => setDetailData({ ...detailData, condition: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Select Condition</option>
                              <option value="New">New</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Year of Purchase</Label>
                            <Input
                              type="number"
                              value={detailData.yearOfPurchase}
                              onChange={(e) => setDetailData({ ...detailData, yearOfPurchase: e.target.value })}
                              placeholder="e.g. 2024"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Year of Production *</Label>
                            <Input
                              type="number"
                              value={detailData.yearOfProduction}
                              onChange={(e) => setDetailData({ ...detailData, yearOfProduction: e.target.value })}
                              placeholder="e.g. 2024"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">CPU *</Label>
                            <Input
                              value={detailData.cpu}
                              onChange={(e) => setDetailData({ ...detailData, cpu: e.target.value })}
                              placeholder="e.g. Intel Core i7-12700H"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">GPU *</Label>
                            <Input
                              value={detailData.gpu}
                              onChange={(e) => setDetailData({ ...detailData, gpu: e.target.value })}
                              placeholder="e.g. NVIDIA RTX 3060"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">RAM *</Label>
                            <Input
                              value={detailData.ram}
                              onChange={(e) => setDetailData({ ...detailData, ram: e.target.value })}
                              placeholder="e.g. 16GB DDR4"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Memory *</Label>
                            <Input
                              value={detailData.memory}
                              onChange={(e) => setDetailData({ ...detailData, memory: e.target.value })}
                              placeholder="e.g. 512GB SSD"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Item</Label>
                            <Input
                              value={detailData.item}
                              onChange={(e) => setDetailData({ ...detailData, item: e.target.value })}
                              placeholder="e.g. Laptop Model XYZ"
                              className="h-10"
                            />
                          </div>
                        </div>
                      ) : (
                        // Limited detail form for other devices (only Condition & Year of Purchase)
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Condition *</Label>
                            <select
                              value={detailData.condition}
                              onChange={(e) => setDetailData({ ...detailData, condition: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Select Condition</option>
                              <option value="New">New</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Year of Purchase</Label>
                            <Input
                              type="number"
                              value={detailData.yearOfPurchase}
                              onChange={(e) => setDetailData({ ...detailData, yearOfPurchase: e.target.value })}
                              placeholder="e.g. 2024"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="h-10"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button 
              onClick={handleAdd} 
              disabled={
                !formData.code || 
                !formData.brand || 
                !formData.item || 
                !formData.purchaseAmount || 
                !formData.currency ||
                (formData.item.toLowerCase().includes("laptop") || formData.item.toLowerCase().includes("computer")
                  ? (!detailData.condition || !detailData.yearOfProduction || !detailData.cpu || !detailData.gpu || !detailData.ram || !detailData.memory)
                  : !detailData.condition)
              }
            >
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset information (only Storage Location and Remarks can be edited)</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="grid gap-2">
              <Label>Code</Label>
              <Input value={formData.code} disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="grid gap-2">
              <Label>Brand</Label>
              <Input value={formData.brand || "-"} disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="grid gap-2">
              <Label>Device</Label>
              <Input value={formData.item || "-"} disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="grid gap-2">
              <Label>Purchase Amount</Label>
              <Input value={formData.purchaseAmount ? new Intl.NumberFormat('id-ID').format(parseFloat(formData.purchaseAmount)) : "-"} disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Input value={formData.currency || "-"} disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="grid gap-2">
              <Label>Storage Location</Label>
              <Input value={formData.storageLocation} onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })} placeholder="e.g. Warehouse A, Room 101" />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Remarks</Label>
              <Textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Optional remarks" />
            </div>
            {selected && (
              <div className="col-span-2 mt-2">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <button
                      type="button"
                      onClick={() => setShowDetailForm(!showDetailForm)}
                      className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                    >
                      <CardTitle className="text-base font-semibold text-primary">Asset Detail</CardTitle>
                      {showDetailForm ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.item.toLowerCase().includes("laptop") || formData.item.toLowerCase().includes("computer")
                        ? "Edit detailed specifications (for Laptop/Computer)"
                        : "Edit basic details (Condition & Year of Purchase)"}
                    </p>
                  </CardHeader>
                  {showDetailForm && (
                    <CardContent className="pt-0">
                      {formData.item.toLowerCase().includes("laptop") || formData.item.toLowerCase().includes("computer") ? (
                        // Full detail form for Laptop/Computer
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Condition</Label>
                            <select
                              value={detailData.condition}
                              onChange={(e) => setDetailData({ ...detailData, condition: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Select Condition</option>
                              <option value="New">New</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Year of Purchase</Label>
                            <Input
                              type="number"
                              value={detailData.yearOfPurchase}
                              onChange={(e) => setDetailData({ ...detailData, yearOfPurchase: e.target.value })}
                              placeholder="e.g. 2024"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Year of Production</Label>
                            <Input
                              type="number"
                              value={detailData.yearOfProduction}
                              onChange={(e) => setDetailData({ ...detailData, yearOfProduction: e.target.value })}
                              placeholder="e.g. 2024"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">CPU</Label>
                            <Input
                              value={detailData.cpu}
                              onChange={(e) => setDetailData({ ...detailData, cpu: e.target.value })}
                              placeholder="e.g. Intel Core i7-12700H"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">GPU</Label>
                            <Input
                              value={detailData.gpu}
                              onChange={(e) => setDetailData({ ...detailData, gpu: e.target.value })}
                              placeholder="e.g. NVIDIA RTX 3060"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">RAM</Label>
                            <Input
                              value={detailData.ram}
                              onChange={(e) => setDetailData({ ...detailData, ram: e.target.value })}
                              placeholder="e.g. 16GB DDR4"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Memory</Label>
                            <Input
                              value={detailData.memory}
                              onChange={(e) => setDetailData({ ...detailData, memory: e.target.value })}
                              placeholder="e.g. 512GB SSD"
                              className="h-10"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Item</Label>
                            <Input
                              value={detailData.item}
                              onChange={(e) => setDetailData({ ...detailData, item: e.target.value })}
                              placeholder="e.g. Laptop Model XYZ"
                              className="h-10"
                            />
                          </div>
                        </div>
                      ) : (
                        // Limited detail form for other devices (only Condition & Year of Purchase)
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Condition</Label>
                            <select
                              value={detailData.condition}
                              onChange={(e) => setDetailData({ ...detailData, condition: e.target.value })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <option value="">Select Condition</option>
                              <option value="New">New</option>
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                              <option value="Poor">Poor</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-sm font-medium">Year of Purchase</Label>
                            <Input
                              type="number"
                              value={detailData.yearOfPurchase}
                              onChange={(e) => setDetailData({ ...detailData, yearOfPurchase: e.target.value })}
                              placeholder="e.g. 2024"
                              min="1900"
                              max={new Date().getFullYear()}
                              className="h-10"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit}>Update Asset</Button>
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

      {/* Inactive Dialog */}
      <Dialog open={isInactiveOpen} onOpenChange={setIsInactiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate asset <strong>{selected?.code}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mt-2">
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Set status to "Inactive"</li>
              <li>Remove user assignment</li>
              <li>Remove department assignment</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInactiveOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleInactive}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asset Detail - {selected?.code}</DialogTitle>
            <DialogDescription>Detailed specifications for this asset</DialogDescription>
          </DialogHeader>
          {assetDetail ? (
            <div className="py-4">
              <div className="rounded-lg border border-border">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50 w-1/3">Condition</td>
                      <td className="px-4 py-3">{assetDetail.condition || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50">Year of Purchase</td>
                      <td className="px-4 py-3">{assetDetail.year_of_purchase || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50">Year of Production</td>
                      <td className="px-4 py-3">{assetDetail.year_of_production || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50">CPU</td>
                      <td className="px-4 py-3">{assetDetail.cpu || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50">GPU</td>
                      <td className="px-4 py-3">{assetDetail.gpu || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50">RAM</td>
                      <td className="px-4 py-3">{assetDetail.ram || "-"}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 font-semibold bg-secondary/50">Memory</td>
                      <td className="px-4 py-3">{assetDetail.memory || "-"}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold bg-secondary/50">Item</td>
                      <td className="px-4 py-3">{assetDetail.item || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No detail information available for this asset.
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGuard>
  );
}
