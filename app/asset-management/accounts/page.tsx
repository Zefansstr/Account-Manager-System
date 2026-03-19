"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Plus, Edit, Trash2, Power, CheckSquare, Square, Search, Upload, ChevronDown, ChevronUp, Download } from "lucide-react";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGuard } from "@/components/auth/permission-guard";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

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
  const [brandList, setBrandList] = useState<LookupData>([]);
  const [brandFilterList, setBrandFilterList] = useState<string[]>([]);
  const [locationList, setLocationList] = useState<string[]>([]);
  const [types, setTypes] = useState<LookupData>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isInactiveOpen, setIsInactiveOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [assetDetail, setAssetDetail] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; imported?: number; total?: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  // Helper function to check if item requires full detail form (Laptop, All In One, Computer)
  const requiresFullDetail = (item: string): boolean => {
    if (!item) return false;
    const itemLower = item.toLowerCase();
    return (
      itemLower.includes("laptop") ||
      itemLower.includes("all in one") ||
      itemLower.includes("all-in-one") ||
      itemLower.includes("computer")
    );
  };

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
      // Fetch types for import mapping
      const typesRes = await fetch("/api/asset-management/applications");
      const typesJson = await typesRes.json();
      if (typesRes.ok) {
        setTypes(typesJson.data || []);
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
      if (filterDepartment) params.append("departmentTeam", filterDepartment);

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
        // Get unique brands for filter (from existing assets)
        const brands = new Set<string>();
        const locations = new Set<string>();
        
        json.data.forEach((asset: Device) => {
          if (asset.brand) brands.add(asset.brand);
          if (asset.storageLocation) locations.add(asset.storageLocation);
        });
        
        setBrandFilterList(Array.from(brands).sort());
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
        const data = json.data || [];
        // Sort devices by name alphabetically
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setDeviceList(sorted);
      }
    } catch (error) {
      console.error("Error fetching device list:", error);
    }
  };

  // Fetch brand list for dropdown
  const fetchBrandList = async () => {
    try {
      const res = await fetch("/api/asset-management/brands");
      const json = await res.json();
      if (res.ok) {
        const data = json.data || [];
        // Sort brands by name alphabetically
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setBrandList(sorted);
      }
    } catch (error) {
      console.error("Error fetching brand list:", error);
    }
  };

  useEffect(() => {
    fetchLookups();
    fetchDeviceList();
    fetchBrandList();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDevices();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [page, limit, searchQuery, filterDevice, filterBrand, filterLocation, filterDepartment]);

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Map Excel columns to database fields
      const assetsToImport = jsonData.map((row: any) => {
        // Find type ID by code/name
        const type = types.find((t: { id: string; code: string; name: string }) => 
          t.code === row.Type || t.name === row.Type
        );

        const item = row.Item || row.Device || null;
        const needsFullDetail = requiresFullDetail(item || "");

        return {
          code: row.Code || row["Asset ID"],
          typeId: type?.id || null,
          brand: row.Brand || null,
          item: item,
          userUse: row["User Use"] || row.User || null,
          note: row.Note || row.Remarks || null,
          departmentTeam: row["Department Team"] || row.Department || null,
          storageLocation: row["Storage Location"] || row.Location || null,
          purchaseAmount: row["Purchase Amount"] || row.Purchase || null,
          currency: row.Currency || null,
          status: row.Status || "not_used",
          // Asset Details (optional, but required for Laptop/All In One/Computer)
          details: needsFullDetail ? {
            condition: row.Condition || null,
            yearOfPurchase: row["Year of Purchase"] || row["Year Of Purchase"] || null,
            yearOfProduction: row["Year of Production"] || row["Year Of Production"] || null,
            cpu: row.CPU || null,
            gpu: row.GPU || null,
            ram: row.RAM || null,
            memory: row.Memory || null,
            item: row["Detail Item"] || row["Detail Item Name"] || null,
          } : {
            condition: row.Condition || null,
            yearOfPurchase: row["Year of Purchase"] || row["Year Of Purchase"] || null,
            yearOfProduction: null,
            cpu: null,
            gpu: null,
            ram: null,
            memory: null,
            item: null,
          },
        };
      }).filter((asset: any) => asset.code && asset.item); // Filter out invalid rows

      if (assetsToImport.length === 0) {
      setImportResult({
          success: false,
          message: "No valid assets found. Please ensure Code and Item columns are filled.",
          total: jsonData.length,
        imported: 0,
      });
      setIsImportOpen(true);
        return;
      }

      // Get user ID
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      // Send to API
      const res = await fetch("/api/asset-management/accounts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assets: assetsToImport, userId }),
      });

      const result = await res.json();

      if (res.ok) {
        setImportResult({
          success: true,
          message: result.message,
          imported: result.imported,
          total: result.total,
        });
        fetchDevices(); // Refresh table
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed",
          total: assetsToImport.length,
          imported: 0,
        });
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        message: error.message || "Failed to parse Excel file",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Download Excel template
  const downloadTemplate = () => {
    const template = [
      {
        "Asset ID": "ASSET001",
        "Type": "Laptop",
        "Brand": "Dell",
        "Item": "Laptop Dell XPS 15",
        "User Use": "John Doe",
        "Department Team": "IT Department",
        "Storage Location": "Warehouse A",
        "Purchase Amount": "15000000",
        "Currency": "IDR",
        "Note": "Example asset",
        "Status": "not_used",
        // Asset Details (optional, required for Laptop/All In One/Computer)
        "Condition": "New",
        "Year of Purchase": "2024",
        "Year of Production": "2024",
        "CPU": "Intel Core i7-12700H",
        "GPU": "NVIDIA RTX 3060",
        "RAM": "16GB DDR4",
        "Memory": "512GB SSD",
        "Detail Item": "Dell XPS 15 9520",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets Template");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // Asset ID
      { wch: 15 }, // Type
      { wch: 15 }, // Brand
      { wch: 30 }, // Item
      { wch: 20 }, // User Use
      { wch: 20 }, // Department Team
      { wch: 20 }, // Storage Location
      { wch: 18 }, // Purchase Amount
      { wch: 12 }, // Currency
      { wch: 30 }, // Note
      { wch: 12 }, // Status
      { wch: 12 }, // Condition
      { wch: 18 }, // Year of Purchase
      { wch: 18 }, // Year of Production
      { wch: 25 }, // CPU
      { wch: 25 }, // GPU
      { wch: 15 }, // RAM
      { wch: 15 }, // Memory
      { wch: 30 }, // Detail Item
    ];

    XLSX.writeFile(workbook, "Assets_Master_Import_Template.xlsx");
  };

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
    const needsFullDetail = requiresFullDetail(formData.item);
    
    if (needsFullDetail) {
      // For Laptop/All In One/Computer: Condition, Year of Production, CPU, GPU, RAM, Memory are required
      if (!detailData.condition || !detailData.yearOfProduction || !detailData.cpu || !detailData.gpu || !detailData.ram || !detailData.memory) {
        toast.error("For Laptop/All In One/Computer, Condition, Year of Production, CPU, GPU, RAM, and Memory are required in Asset Detail");
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

  // Handle delete device
  const handleDelete = async () => {
    if (!selected) {
      toast.error("No asset selected");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      const res = await fetch(`/api/asset-management/accounts/${selected.id}?userId=${userId || ""}`, {
        method: "DELETE",
      });

      let json;
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        json = { error: "Invalid response from server" };
      }

      if (res.ok) {
        toast.success(`Asset "${selected.code}" deleted successfully!`);
        setIsDeleteOpen(false);
        setSelected(null);
        fetchDevices();
      } else {
        console.error("Delete error response:", res.status, json);
        toast.error(json.error || `Failed to delete asset. Status: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      toast.error(error.message || "Failed to delete asset. Please try again.");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("No assets selected");
      return;
    }

    try {
      const operatorStr = localStorage.getItem("operator");
      const userId = operatorStr ? JSON.parse(operatorStr).id : null;

      console.log("Bulk delete request:", { selectedIdsCount: selectedIds.length, userId });

      const res = await fetch("/api/asset-management/accounts/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selectedIds, userId }),
      });

      let json;
      try {
        const text = await res.text();
        json = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        json = { error: "Invalid response from server" };
      }

      if (res.ok) {
        const deletedCount = json.deleted || selectedIds.length;
        toast.success(`Successfully deleted ${deletedCount} asset(s)!`);
        setSelectedIds([]);
        setIsBulkDeleteOpen(false);
        fetchDevices();
      } else {
        console.error("Bulk delete error response:", res.status, json);
        toast.error(json.error || `Failed to delete assets. Status: ${res.status}`);
      }
    } catch (error: any) {
      console.error("Error bulk deleting:", error);
      toast.error(error.message || "An error occurred while deleting assets. Please try again.");
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

      const res = await fetch(`/api/asset-management/accounts/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: selected.code, // Keep original code
          typeId: selected.typeId || null,
          brand: selected.brand || null,
          item: selected.item, // Keep original item
          userUse: formData.userUse?.trim() ? formData.userUse.trim() : null,
          note: formData.note || null,
          departmentTeam: selected.departmentTeam || null,
          storageLocation: formData.storageLocation || null,
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

  const deviceOptions = deviceList.map((d) => ({ value: d.name, label: d.name }));
  const brandOptions = brandFilterList.map((b) => ({ value: b, label: b }));
  const locationOptions = locationList.map((l) => ({ value: l, label: l }));
  const departmentOptions = departments.map((d) => ({ value: d.name, label: d.name }));

  return (
    <PermissionGuard menuName={menuName}>
      <div className="flex-1 flex flex-col min-h-0 bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
        <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Asset Master</h1>
              <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">
                {pagination.total}
              </span>
            </div>
            <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">
              Manage assets, devices, and inventory here.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-6 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <FilterDropdown value={filterDevice} onChange={(v) => { setFilterDevice(v); setPage(1); }} options={deviceOptions} placeholder="All Devices" minWidth="140px" />
            <FilterDropdown value={filterBrand} onChange={(v) => { setFilterBrand(v); setPage(1); }} options={brandOptions} placeholder="All Brands" minWidth="120px" />
            <FilterDropdown value={filterDepartment} onChange={(v) => { setFilterDepartment(v); setPage(1); }} options={departmentOptions} placeholder="All Departments" minWidth="140px" />
            <FilterDropdown value={filterLocation} onChange={(v) => { setFilterLocation(v); setPage(1); }} options={locationOptions} placeholder="All Locations" minWidth="120px" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 w-80 h-9 border border-[#7F5539]/25 dark:border-[#7F5539]/50 rounded-md px-3.5 bg-[#faf8f6] dark:bg-[#1a1a1a] flex-shrink-0 shadow-[0_2px_6px_rgba(127,85,57,0.1)]">
              <Search className="h-4 w-4 flex-shrink-0 text-[rgba(127,85,57,0.35)] dark:text-gray-500" />
              <input type="text" placeholder="Search code, brand, device..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-[#1e1e1e] dark:text-gray-200 min-w-0 placeholder:text-[rgba(127,85,57,0.4)] dark:placeholder:text-gray-500" />
            </div>
            <div className="h-8 w-px flex-shrink-0 bg-[rgba(127,85,57,0.2)]" aria-hidden />
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 h-8 px-4 bg-[#a06540] rounded border-0 cursor-pointer text-white text-sm font-medium whitespace-nowrap hover:opacity-90 transition-opacity shadow-[0_2px_6px_rgba(127,85,57,0.12)]"
            >
              <Upload className="h-4 w-4" />
              Import Excel
            </button>
            <button type="button" onClick={() => setIsAddOpen(true)} className="h-8 px-4 bg-[#3a2314] dark:bg-transparent dark:border dark:border-[#2a2a2a] dark:text-white rounded border-0 cursor-pointer text-white text-sm font-medium whitespace-nowrap hover:opacity-90 dark:hover:bg-white/10 transition-colors shadow-[0_2px_6px_rgba(127,85,57,0.12)]">
              <span className="dark:text-[#a06540]">+</span> Add Asset
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 py-3 px-4 rounded bg-[#7f5539]/5 dark:bg-[#7f5539]/15 border border-[#7f5539]/20 dark:border-[#7f5539]/30 mb-4">
            <span className="text-sm font-medium bg-[#7f5539]/10 dark:bg-[#7f5539]/20 text-[#7f5539] dark:text-[#a06540] px-3 py-1.5 rounded">
              {selectedIds.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="border-2 border-red-600 bg-red-600 hover:bg-red-700 text-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}

        <div className="min-h-[280px] max-h-[calc(100vh-320px)] overflow-auto border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-lg scrollbar-invisible bg-white dark:bg-[#101211]">
          <table className="w-full border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
              <tr>
                <th className="text-center text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 w-14 bg-[#f0eae4] dark:bg-[#101211]">
                  <button onClick={toggleSelectAll} className="hover:text-[#7f5539]">
                    {selectedIds.length === devices.length && devices.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Asset ID</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Device</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Brand</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Status</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">User</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Department</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Location</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Purchase</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Currency</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Last Updated</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Remarks</th>
                <th className="text-left text-sm font-semibold text-[#1e1e1e] dark:text-white py-3 px-4 bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#101211]">
              {loading ? (
                <tr className="bg-white dark:bg-[#101211]">
                  <td colSpan={13} className="p-4 bg-white dark:bg-[#101211] text-center text-muted-foreground dark:text-gray-400">Loading...</td>
                </tr>
              ) : devices.length === 0 ? (
                <tr className="bg-white dark:bg-[#101211]"><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground dark:text-gray-400 bg-white dark:bg-[#101211]">No assets found</td></tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle text-center">
                      <button onClick={() => toggleSelect(device.id)} className="hover:text-[#7f5539]">
                        {selectedIds.includes(device.id) ? (
                          <CheckSquare className="h-4 w-4 text-[#7f5539]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                      <button
                        onClick={() => {
                          setSelected(device);
                          fetchAssetDetail(device.id);
                          setIsDetailOpen(true);
                        }}
                        className="font-mono text-sm font-medium text-[#7f5539] dark:text-[#a06540] hover:underline cursor-pointer transition-colors"
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
                          className={device.status === "inactive" ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-primary/10 hover:text-primary"}
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
                        <Button variant="ghost" size="sm" className="hover:bg-destructive/10"
                          onClick={() => { setSelected(device); setIsDeleteOpen(true); }}
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

        <div className="mt-6 pt-4 border-t border-[#7F5539]/20 dark:border-[#7F5539]/40">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            isLoading={loading}
            pageSize={limit}
            onPageSizeChange={handlePageSizeChange}
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
            <div className="col-span-2 grid gap-2">
              <Label className="text-base font-semibold text-[#7f5539] dark:text-[#a06540]">User</Label>
              <Input
                value={formData.userUse}
                onChange={(e) => setFormData({ ...formData, userUse: e.target.value })}
                placeholder="Nama pengguna aset (utama) — contoh: John Doe"
                className="h-11 border-[#7F5539]/25 dark:border-[#7F5539]/40 focus-visible:ring-[#7f5539]/40"
              />
            </div>
            <div className="grid gap-2">
              <Label>Code *</Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. DEV001" />
            </div>
            <div className="grid gap-2">
              <Label>Brand *</Label>
              <select
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-[#101211] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-[#1e1e1e] dark:text-gray-200"
                style={{ color: formData.brand ? '#1e1e1e' : 'rgba(127, 85, 57, 0.4)' }}
              >
                <option value="" style={{ color: 'rgba(127, 85, 57, 0.4)' }}>Select Brand</option>
                {brandList.map((brand) => (
                  <option key={brand.id} value={brand.name} style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>
                    {brand.name}
                  </option>
                ))}
              </select>
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
                className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-[#101211] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-[#1e1e1e] dark:text-gray-200"
                style={{ color: formData.item ? '#1e1e1e' : 'rgba(127, 85, 57, 0.4)' }}
              >
                <option value="" style={{ color: 'rgba(127, 85, 57, 0.4)' }}>Select Device</option>
                {deviceList.map((device) => (
                  <option key={device.id} value={device.name} style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>
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
              <select 
                className="rounded-md border border-input bg-white dark:bg-[#101211] px-3 py-2 text-sm text-[#1e1e1e] dark:text-gray-200 h-10" 
                value={formData.currency} 
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                style={{ color: formData.currency ? '#1e1e1e' : 'rgba(127, 85, 57, 0.4)' }}
              >
                <option value="" style={{ color: 'rgba(127, 85, 57, 0.4)' }}>Select Currency</option>
                <option value="IDR" style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>IDR</option>
                <option value="USD" style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>USD</option>
                <option value="SGD" style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>SGD</option>
                <option value="MYR" style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>MYR</option>
                <option value="EUR" style={{ color: '#1e1e1e', backgroundColor: '#ffffff' }}>EUR</option>
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
                      <CardTitle className="text-base font-semibold text-[#7f5539] dark:text-[#a06540]">Asset Detail</CardTitle>
                      {showDetailForm ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {requiresFullDetail(formData.item)
                        ? "Add detailed specifications (for Laptop/All In One/Computer)"
                        : "Add basic details (Condition & Year of Purchase)"}
                    </p>
                  </CardHeader>
                  {showDetailForm && (
                    <CardContent className="pt-0">
                      {requiresFullDetail(formData.item) ? (
                        // Full detail form for Laptop/All In One/Computer
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsAddOpen(false); resetForm(); }}>Cancel</Button>
            <Button 
              className="min-w-[120px] bg-[#7f5539] hover:bg-[#7f5539]/90"
              onClick={handleAdd} 
              disabled={
                !formData.code || 
                !formData.brand || 
                !formData.item || 
                !formData.purchaseAmount || 
                !formData.currency ||
                (requiresFullDetail(formData.item)
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
            <DialogDescription>Update User, Storage Location, Remarks, and Asset Detail where applicable</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 grid gap-2">
              <Label className="text-base font-semibold text-[#7f5539] dark:text-[#a06540]">User</Label>
              <Input
                value={formData.userUse}
                onChange={(e) => setFormData({ ...formData, userUse: e.target.value })}
                placeholder="Nama pengguna aset (utama) — contoh: John Doe"
                className="h-11 border-[#7F5539]/25 dark:border-[#7F5539]/40 focus-visible:ring-[#7f5539]/40"
              />
            </div>
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
                      <CardTitle className="text-base font-semibold text-[#7f5539] dark:text-[#a06540]">Asset Detail</CardTitle>
                      {showDetailForm ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                      {requiresFullDetail(formData.item)
                        ? "Edit detailed specifications (for Laptop/All In One/Computer)"
                        : "Edit basic details (Condition & Year of Purchase)"}
                    </p>
                  </CardHeader>
                  {showDetailForm && (
                    <CardContent className="pt-0">
                      {requiresFullDetail(formData.item) ? (
                        // Full detail form for Laptop/All In One/Computer
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="min-w-[130px] bg-[#7f5539] hover:bg-[#7f5539]/90" onClick={handleEdit}>Update Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Delete Multiple Assets</DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d] dark:text-gray-400">
              Are you sure you want to delete <strong className="text-[#1e1e1e] dark:text-white">{selectedIds.length} asset(s)</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">⚠️ Warning</p>
            <p className="text-sm text-[#5d5d5d] dark:text-gray-400 mt-1">
              You are about to permanently delete {selectedIds.length} asset(s). This will remove all asset data and cannot be recovered.
            </p>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f]">
            <Button 
              variant="outline" 
              className="min-w-[88px] border-[rgba(127,85,57,0.2)] dark:border-[#2a2a2a] text-[#1e1e1e] dark:text-white hover:bg-[#7f5539]/10 dark:hover:bg-white/10" 
              onClick={() => setIsBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="min-w-[140px] bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" 
              onClick={handleBulkDelete}
            >
              Delete {selectedIds.length} Asset(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Delete Asset</DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d] dark:text-gray-400">
              Are you sure you want to delete asset <strong className="text-[#1e1e1e] dark:text-white">{selected?.code}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">⚠️ Warning</p>
            <p className="text-sm text-[#5d5d5d] dark:text-gray-400 mt-1">
              You are about to permanently delete this asset. This will remove all asset data and cannot be recovered.
            </p>
          </div>
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f]">
            <Button 
              variant="outline" 
              className="min-w-[88px] border-[rgba(127,85,57,0.2)] dark:border-[#2a2a2a] text-[#1e1e1e] dark:text-white hover:bg-[#7f5539]/10 dark:hover:bg-white/10" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              className="min-w-[88px] bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700" 
              onClick={handleDelete}
            >
              Delete
            </Button>
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsInactiveOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="min-w-[88px]" onClick={handleInactive}>Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-medium text-[#1e1e1e] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
              Asset Detail - {selected?.code}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5d5d5d] dark:text-gray-400">
              {selected?.item && requiresFullDetail(selected.item)
                ? "Detailed specifications for this asset"
                : "Basic information for this asset"}
            </DialogDescription>
          </DialogHeader>
          {assetDetail ? (
            <div className="py-4">
              <div className="rounded-lg border border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f] bg-[#faf8f6] dark:bg-[#1a1a1a]">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                      <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] w-1/3 text-[#1e1e1e] dark:text-white">Condition</td>
                      <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.condition || "-"}</td>
                    </tr>
                    <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                      <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">Year of Purchase</td>
                      <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.year_of_purchase || "-"}</td>
                    </tr>
                    {selected?.item && requiresFullDetail(selected.item) && (
                      <>
                        <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                          <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">Year of Production</td>
                          <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.year_of_production || "-"}</td>
                    </tr>
                        <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                          <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">CPU</td>
                          <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.cpu || "-"}</td>
                    </tr>
                        <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                          <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">GPU</td>
                          <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.gpu || "-"}</td>
                    </tr>
                        <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                          <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">RAM</td>
                          <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.ram || "-"}</td>
                    </tr>
                        <tr className="border-b border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                          <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">Memory</td>
                          <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.memory || "-"}</td>
                    </tr>
                    <tr>
                          <td className="px-4 py-3 font-semibold bg-[#e8e0d5]/50 dark:bg-[#2a2a2a] text-[#1e1e1e] dark:text-white">Item</td>
                          <td className="px-4 py-3 text-[#1e1e1e] dark:text-white">{assetDetail.item || "-"}</td>
                    </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#5d5d5d] dark:text-gray-400">
              No detail information available for this asset.
            </div>
          )}
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f]">
            <Button 
              variant="outline" 
              className="min-w-[88px] border-[rgba(127,85,57,0.2)] dark:border-[#2a2a2a] text-[#1e1e1e] dark:text-white hover:bg-[#7f5539]/10 dark:hover:bg-white/10" 
              onClick={() => setIsDetailOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-xl border border-[rgba(127,85,57,0.18)] dark:border-[#1f1f1f] bg-white dark:bg-[#101211] p-0 shadow-xl">
          {/* Header strip */}
          <div className="border-b border-[rgba(127,85,57,0.1)] dark:border-[#1f1f1f] bg-gradient-to-b from-[#7f5539]/8 to-transparent dark:from-[#7f5539]/15 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7f5539]/15 dark:bg-[#7f5539]/25">
                <Upload className="h-5 w-5 text-[#7f5539] dark:text-[#a06540]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-medium text-[#1e1e1e] dark:text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Import from Excel</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-[#5d5d5d] dark:text-gray-400">
                  Bulk add assets using .xlsx or .xls
            </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            {/* Step 1: Template */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 rounded-lg border border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-[#faf8f6] dark:bg-[#1a1a1a] p-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7f5539] dark:bg-[#a06540] text-xs font-semibold text-white">1</span>
                <div>
                  <p className="text-sm font-medium text-[#1e1e1e] dark:text-white">Get the template</p>
                  <p className="text-xs text-[#5d5d5d] dark:text-gray-400 mt-0.5">Example rows and correct columns</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-[#7f5539]/35 dark:border-[#7f5539]/50 bg-white dark:bg-[#101211] px-4 text-[#7f5539] dark:text-[#a06540] hover:bg-[#7f5539]/10 dark:hover:bg-[#7f5539]/20"
                onClick={downloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            {/* Step 2: Upload */}
            <div className="rounded-lg border border-[#e8e0d5]/80 dark:border-[#1f1f1f] bg-[#faf8f6] dark:bg-[#1a1a1a] p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#7f5539] dark:bg-[#a06540] text-xs font-semibold text-white">2</span>
                <p className="text-sm font-medium text-[#1e1e1e] dark:text-white">Upload your file</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[rgba(127,85,57,0.25)] dark:border-[#2a2a2a] bg-white dark:bg-[#101211] py-8 transition-colors hover:border-[#7f5539]/50 dark:hover:border-[#7f5539]/50 hover:bg-[#7f5539]/5 dark:hover:bg-[#7f5539]/10 disabled:opacity-60 disabled:pointer-events-none"
              >
                <Upload className="h-8 w-8 text-[#7f5539]/70 dark:text-[#a06540]/70" />
                <span className="text-sm font-medium text-[#1e1e1e] dark:text-white">
                  {isImporting ? "Importing…" : "Click to choose file"}
                </span>
                <span className="text-xs text-[#5d5d5d] dark:text-gray-400">.xlsx or .xls</span>
              </button>
            </div>

            {/* Import Result */}
          {importResult && (
              <div className={`rounded-lg border p-4 ${
                importResult.success
                  ? "border-[#7f5539]/30 dark:border-[#7f5539]/50 bg-[#7f5539]/5 dark:bg-[#7f5539]/10"
                  : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    importResult.success 
                      ? "bg-[#7f5539]/20 dark:bg-[#7f5539]/30 text-[#7f5539] dark:text-[#a06540]" 
                      : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                  }`}>
                    {importResult.success ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${
                      importResult.success 
                        ? "text-[#7f5539] dark:text-[#a06540]" 
                        : "text-red-700 dark:text-red-400"
                    }`}>
                      {importResult.success ? "Import complete" : "Import failed"}
                    </p>
                    <p className="text-sm text-[#1e1e1e] dark:text-white mt-0.5">{importResult.message}</p>
                    {importResult.imported !== undefined && (
                      <p className="text-xs text-[#5d5d5d] dark:text-gray-400 mt-1">
                        {importResult.imported} of {importResult.total} asset(s)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Format reference */}
            <details className="group rounded-lg border border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f] bg-white dark:bg-[#101211]">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-[#1e1e1e] dark:text-white [&::-webkit-details-marker]:hidden">
                <span className="text-[#5d5d5d] dark:text-gray-400">📋</span>
                Column format reference
              </summary>
              <div className="border-t border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f] px-4 py-3">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Asset ID</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Required: Unique asset code</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Type</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Asset type code or name</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Brand</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Brand name</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Item</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Required: Device/item name</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">User Use</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Current user</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Department Team</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Department name</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Storage Location</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Storage location</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Purchase Amount</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Purchase price</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Currency</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: IDR, USD, SGD, MYR, EUR</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Note</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Remarks</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Status</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: active, inactive, not_used (default: not_used)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4 pt-2 border-t border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f]">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Condition</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: New, Good, Fair, Poor (required for Laptop/All In One/Computer)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Year of Purchase</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Purchase year (e.g. 2024)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Year of Production</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Production year (required for Laptop/All In One/Computer)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">CPU</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: CPU specification (required for Laptop/All In One/Computer)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">GPU</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: GPU specification (required for Laptop/All In One/Computer)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">RAM</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: RAM specification (required for Laptop/All In One/Computer)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Memory</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Storage specification (required for Laptop/All In One/Computer)</dd>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <dt className="w-32 shrink-0 font-medium text-[#1e1e1e] dark:text-white">Detail Item</dt>
                    <dd className="text-[#5d5d5d] dark:text-gray-400">Optional: Detailed item name/model</dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 pb-6 px-6 border-t border-[rgba(127,85,57,0.12)] dark:border-[#1f1f1f]">
            <Button 
              variant="outline" 
              className="min-w-[88px] border-[rgba(127,85,57,0.2)] dark:border-[#2a2a2a] text-[#1e1e1e] dark:text-white hover:bg-[#7f5539]/10 dark:hover:bg-white/10" 
              onClick={() => {
                setIsImportOpen(false);
                setImportResult(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
