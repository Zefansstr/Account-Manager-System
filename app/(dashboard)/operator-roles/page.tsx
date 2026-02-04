"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Shield, Eye, Download, Upload, Power, Lock, Filter, UserCog, Package, Smartphone, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

type Permission = {
  menu_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_enable_disable: boolean;
  can_import: boolean;
  can_export: boolean;
  visible_columns: string[];
  // Dashboard specific
  view_all_data?: boolean;
  view_segment_data?: boolean;
  // Audit Logs specific
  can_filter?: boolean;
  can_view_details?: boolean;
  // Data-level filters
  allowed_applications?: string[];
  allowed_lines?: string[];
  allowed_departments?: string[];
};

type OperatorRole = {
  id: string;
  role_code: string;
  role_name: string;
  description: string;
  is_system_role: boolean;
  status: string;
  created_at: string;
  operator_count?: number;
};

// Menu configuration with available columns and actions
const MENU_CONFIG: Record<string, { 
  label: string; 
  actions: { key: string; label: string; }[];
  columns: { key: string; label: string; }[];
  hasDataSegment?: boolean;
}> = {
  dashboard: {
    label: "Dashboard",
    actions: [
      { key: "view_all_data", label: "View All Data" },
      { key: "view_segment_data", label: "View Segment Data" },
    ],
    columns: [],
    hasDataSegment: true,
  },
  accounts: {
    label: "Accounts",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
      { key: "enable_disable", label: "Enable/Disable" },
      { key: "import", label: "Import" },
    ],
    columns: [
      { key: "application", label: "Application" },
      { key: "line", label: "Line" },
      { key: "username", label: "Username" },
      { key: "password", label: "Password" },
      { key: "department", label: "Department" },
      { key: "role", label: "Role" },
      { key: "remark", label: "Remark" },
      { key: "status", label: "Status" },
      { key: "action", label: "Action" },
    ],
  },
  applications: {
    label: "Applications",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Application Name" },
      { key: "total_accounts", label: "Total Accounts" },
      { key: "action", label: "Action" },
    ],
  },
  lines: {
    label: "Lines",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Line Name" },
      { key: "total_accounts", label: "Total Accounts" },
      { key: "action", label: "Action" },
    ],
  },
  departments: {
    label: "Departments",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Department Name" },
      { key: "total_accounts", label: "Total Accounts" },
      { key: "action", label: "Action" },
    ],
  },
  roles: {
    label: "Roles",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
    columns: [
      { key: "code", label: "Code" },
      { key: "name", label: "Role Name" },
      { key: "total_accounts", label: "Total Accounts" },
      { key: "action", label: "Action" },
    ],
  },
  operators: {
    label: "Operators",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
      { key: "enable_disable", label: "Enable/Disable" },
    ],
    columns: [
      { key: "full_name", label: "Full Name" },
      { key: "username", label: "Username" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
      { key: "action", label: "Action" },
    ],
  },
  "operator roles": {
    label: "Operator Roles",
    actions: [
      { key: "view", label: "View" },
      { key: "create", label: "Create" },
      { key: "edit", label: "Edit" },
      { key: "delete", label: "Delete" },
    ],
    columns: [
      { key: "role_code", label: "Role Code" },
      { key: "role_name", label: "Role Name" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
      { key: "action", label: "Action" },
    ],
  },
  "audit logs": {
    label: "Audit Logs",
    actions: [
      { key: "view", label: "View" },
      { key: "export", label: "Export CSV" },
      { key: "filter", label: "Filter" },
      { key: "details", label: "Audit Log Details" },
    ],
    columns: [
      { key: "user_id", label: "User ID" },
      { key: "action", label: "Action" },
      { key: "table_name", label: "Table Name" },
      { key: "created_at", label: "Date" },
    ],
  },
};

export default function OperatorRolesPage() {
  const [roles, setRoles] = useState<OperatorRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPermissionOpen, setIsPermissionOpen] = useState(false);
  const [isDataFilterOpen, setIsDataFilterOpen] = useState(false); // NEW: Data Filter Dialog
  const [isModuleSelectorOpen, setIsModuleSelectorOpen] = useState(false);
  const [isDataFilterModuleSelectorOpen, setIsDataFilterModuleSelectorOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OperatorRole | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedDataFilterModule, setSelectedDataFilterModule] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  
  // Lookup data for data filters
  const [applications, setApplications] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [accountRoles, setAccountRoles] = useState<any[]>([]);
  
  // Product Management lookup data
  const [productApplications, setProductApplications] = useState<any[]>([]);
  const [productLines, setProductLines] = useState<any[]>([]);
  const [productDepartments, setProductDepartments] = useState<any[]>([]);
  const [productRoles, setProductRoles] = useState<any[]>([]);
  
  // Asset Management lookup data
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [assetBrands, setAssetBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    role_code: "",
    role_name: "",
    description: "",
    status: "active",
  });

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/operator-roles");
      const json = await res.json();
      setRoles(json.data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLookups = async () => {
    try {
      // Account Management lookups
      const [appRes, lineRes, deptRes, roleRes] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/lines"),
        fetch("/api/departments"),
        fetch("/api/roles"),
      ]);
      const [appData, lineData, deptData, roleData] = await Promise.all([
        appRes.json(),
        lineRes.json(),
        deptRes.json(),
        roleRes.json(),
      ]);
      setApplications(appData.data || []);
      setLines(lineData.data || []);
      setDepartments(deptData.data || []);
      setAccountRoles(roleData.data || []);
      
      // Product Management lookups
      try {
        const [productAppRes, productLineRes, productDeptRes, productRoleRes] = await Promise.all([
          fetch("/api/products/applications"),
          fetch("/api/products/lines"),
          fetch("/api/products/departments"),
          fetch("/api/products/roles"),
        ]);
        const [productAppData, productLineData, productDeptData, productRoleData] = await Promise.all([
          productAppRes.json(),
          productLineRes.json(),
          productDeptRes.json(),
          productRoleRes.json(),
        ]);
        // Only set if response is successful and has data
        if (productAppRes.ok) {
          setProductApplications(productAppData.data || []);
        }
        if (productLineRes.ok) {
          setProductLines(productLineData.data || []);
        }
        if (productDeptRes.ok) {
          setProductDepartments(productDeptData.data || []);
        }
        if (productRoleRes.ok) {
          setProductRoles(productRoleData.data || []);
        }
      } catch (productError) {
        console.error("Error fetching product lookups:", productError);
        // Set empty arrays if error
        setProductApplications([]);
        setProductLines([]);
        setProductDepartments([]);
        setProductRoles([]);
      }
      
      // Asset Management lookups
      try {
        const [assetTypeRes, assetBrandRes] = await Promise.all([
          fetch("/api/asset-management/applications"),
          fetch("/api/asset-management/lines"),
        ]);
        const [assetTypeData, assetBrandData] = await Promise.all([
          assetTypeRes.json(),
          assetBrandRes.json(),
        ]);
        // Only set if response is successful and has data
        if (assetTypeRes.ok) {
          setAssetTypes(assetTypeData.data || []);
        }
        if (assetBrandRes.ok) {
          setAssetBrands(assetBrandData.data || []);
        }
      } catch (assetError) {
        console.error("Error fetching asset lookups:", assetError);
        // Set empty arrays if error
        setAssetTypes([]);
        setAssetBrands([]);
      }
    } catch (error) {
      console.error("Error fetching lookups:", error);
    }
  };

  useEffect(() => {
    // Use requestAnimationFrame for smoother initial load
    requestAnimationFrame(() => {
      fetchRoles();
      fetchLookups();
    });
  }, []);

  const resetForm = () => {
    setFormData({
      role_code: "",
      role_name: "",
      description: "",
      status: "active",
    });
  };

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/operator-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchRoles();
        setIsAddOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error adding role:", error);
    }
  };

  const handleEdit = async () => {
    if (!selectedRole) return;

    try {
      const res = await fetch(`/api/operator-roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchRoles();
        setIsEditOpen(false);
        setSelectedRole(null);
        resetForm();
      }
    } catch (error) {
      console.error("Error editing role:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    try {
      const res = await fetch(`/api/operator-roles/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchRoles();
        setIsDeleteOpen(false);
        setSelectedRole(null);
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const openEditDialog = (role: OperatorRole) => {
    setSelectedRole(role);
    setFormData({
      role_code: role.role_code,
      role_name: role.role_name,
      description: role.description,
      status: role.status,
    });
    setIsEditOpen(true);
  };

  const openModuleSelector = (role: OperatorRole) => {
    setSelectedRole(role);
    setIsModuleSelectorOpen(true);
  };

  const openPermissionDialog = async (role: OperatorRole, module: string) => {
    setSelectedRole(role);
    setSelectedModule(module);
    
    // Fetch permissions for this role and module
    try {
      const res = await fetch(`/api/operator-roles/${role.id}/permissions?module=${module}`);
      const json = await res.json();
      
      const permissionsMap: Record<string, Permission> = {};
      if (json.data) {
        json.data.forEach((perm: Permission & { module?: string }) => {
          permissionsMap[perm.menu_name] = perm;
        });
      }
      
      // Initialize empty permissions for menus that don't have any
      Object.keys(MENU_CONFIG).forEach((menuName) => {
        if (!permissionsMap[menuName]) {
          permissionsMap[menuName] = {
            menu_name: menuName,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_enable_disable: false,
            can_import: false,
            can_export: false,
            visible_columns: [],
            // Initialize data filters with empty arrays
            allowed_applications: [],
            allowed_lines: [],
            allowed_departments: [],
          };
        } else {
          // Ensure existing permissions have data filter arrays initialized
          if (!permissionsMap[menuName].allowed_applications) {
            permissionsMap[menuName].allowed_applications = [];
          }
          if (!permissionsMap[menuName].allowed_lines) {
            permissionsMap[menuName].allowed_lines = [];
          }
          if (!permissionsMap[menuName].allowed_departments) {
            permissionsMap[menuName].allowed_departments = [];
          }
        }
      });
      
      setPermissions(permissionsMap);
      setIsModuleSelectorOpen(false);
      setIsPermissionOpen(true);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };
  
  const openDataFilterModuleSelector = (role: OperatorRole) => {
    setSelectedRole(role);
    setIsDataFilterModuleSelectorOpen(true);
  };

  const openDataFilterDialog = async (role: OperatorRole, module: string) => {
    setSelectedRole(role);
    setSelectedDataFilterModule(module);
    
    // Fetch permissions for this role and module
    try {
      const res = await fetch(`/api/operator-roles/${role.id}/permissions?module=${module}`);
      const json = await res.json();
      
      const permissionsMap: Record<string, Permission> = {};
      if (json.data) {
        json.data.forEach((perm: Permission & { module?: string }) => {
          permissionsMap[perm.menu_name] = perm;
        });
      }
      
      // Initialize empty permissions for menus that don't have any
      Object.keys(MENU_CONFIG).forEach((menuName) => {
        if (!permissionsMap[menuName]) {
          permissionsMap[menuName] = {
            menu_name: menuName,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
            can_enable_disable: false,
            can_import: false,
            can_export: false,
            visible_columns: [],
            allowed_applications: [],
            allowed_lines: [],
            allowed_departments: [],
          };
        } else {
          // Ensure existing permissions have data filter arrays initialized
          if (!permissionsMap[menuName].allowed_applications) {
            permissionsMap[menuName].allowed_applications = [];
          }
          if (!permissionsMap[menuName].allowed_lines) {
            permissionsMap[menuName].allowed_lines = [];
          }
          if (!permissionsMap[menuName].allowed_departments) {
            permissionsMap[menuName].allowed_departments = [];
          }
        }
      });
      
      setPermissions(permissionsMap);
      setIsDataFilterModuleSelectorOpen(false);
      setIsDataFilterOpen(true);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  const updatePermission = (menuName: string, field: keyof Permission, value: any) => {
    setPermissions((prev) => ({
      ...prev,
      [menuName]: {
        ...prev[menuName],
        [field]: value,
      },
    }));
  };

  const toggleColumn = (menuName: string, columnKey: string) => {
    setPermissions((prev) => {
      const currentColumns = prev[menuName].visible_columns || [];
      const newColumns = currentColumns.includes(columnKey)
        ? currentColumns.filter((col) => col !== columnKey)
        : [...currentColumns, columnKey];
      
      return {
        ...prev,
        [menuName]: {
          ...prev[menuName],
          visible_columns: newColumns,
        },
      };
    });
  };
  
  // Data filter toggle functions
  const toggleDataFilter = (menuName: string, filterType: 'applications' | 'lines' | 'departments', filterId: string) => {
    setPermissions((prev) => {
      const filterKey = `allowed_${filterType}` as keyof Permission;
      const currentFilters = (prev[menuName][filterKey] as string[]) || [];
      const newFilters = currentFilters.includes(filterId)
        ? currentFilters.filter((id) => id !== filterId)
        : [...currentFilters, filterId];
      
      return {
        ...prev,
        [menuName]: {
          ...prev[menuName],
          [filterKey]: newFilters,
        },
      };
    });
  };

  const savePermissions = async () => {
    if (!selectedRole || !selectedModule) return;

    try {
      const res = await fetch(`/api/operator-roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          permissions: Object.values(permissions),
          module: selectedModule
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setIsPermissionOpen(false);
        setSelectedRole(null);
        setSelectedModule(null);
        toast.success("Permissions saved successfully!");
      } else {
        console.error("Failed to save permissions:", result);
        toast.error(result.error || "Failed to save permissions");
      }
    } catch (error: any) {
      console.error("Error saving permissions:", error);
      toast.error(error.message || "Error saving permissions");
    }
  };
  
  const saveDataFilters = async () => {
    if (!selectedRole || !selectedDataFilterModule) return;

    try {
      const res = await fetch(`/api/operator-roles/${selectedRole.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          permissions: Object.values(permissions),
          module: selectedDataFilterModule
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setIsDataFilterOpen(false);
        setSelectedRole(null);
        setSelectedDataFilterModule(null);
        toast.success("Data filters saved successfully!");
      } else {
        console.error("Failed to save data filters:", result);
        toast.error(result.error || "Failed to save data filters");
      }
    } catch (error: any) {
      console.error("Error saving data filters:", error);
      toast.error(error.message || "Error saving data filters");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading roles...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Operator Roles</h2>
          <p className="text-sm text-muted-foreground">
            Manage role templates with predefined permissions
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-foreground">Code</th>
                <th className="w-[20%] px-4 py-3 text-left text-sm font-semibold text-foreground">Role Name</th>
                <th className="w-[30%] px-4 py-3 text-left text-sm font-semibold text-foreground">Description</th>
                <th className="w-[10%] px-4 py-3 text-left text-sm font-semibold text-foreground">Users</th>
                <th className="w-[10%] px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="w-[15%] px-4 py-3 text-center text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role, index) => (
                <tr
                  key={role.id}
                  className={`border-b border-border transition-colors hover:bg-secondary/30 ${
                    index % 2 === 0 ? "bg-card" : "bg-secondary/10"
                  }`}
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-primary">{role.role_code}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {role.is_system_role && (
                        <div title="System Role - Cannot be deleted">
                          <Lock className="h-3 w-3 text-destructive" />
                        </div>
                      )}
                      <span className="font-medium text-foreground">{role.role_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{role.description}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {role.operator_count || 0}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      variant={role.status === "active" ? "default" : "secondary"}
                      className={
                        role.status === "active"
                          ? "bg-primary/20 text-primary border border-primary"
                          : "bg-secondary text-muted-foreground"
                      }
                    >
                      {role.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModuleSelector(role)}
                        className="hover:bg-primary/10 hover:text-primary"
                        title="Manage Permissions"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDataFilterModuleSelector(role)}
                        className="hover:bg-primary/10 hover:text-primary"
                        title="Data Filter"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                        className="hover:bg-primary/10 hover:text-primary"
                        disabled={role.is_system_role}
                        title="Edit Role"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsDeleteOpen(true);
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                        disabled={role.is_system_role || (role.operator_count ? role.operator_count > 0 : false)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-code">Role Code</Label>
              <Input
                id="add-code"
                value={formData.role_code}
                onChange={(e) => setFormData({ ...formData, role_code: e.target.value.toUpperCase() })}
                placeholder="e.g., MANAGER"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Role Name</Label>
              <Input
                id="add-name"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                placeholder="e.g., Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this role's purpose"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <select
                id="add-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90">
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Role Code</Label>
              <Input
                id="edit-code"
                value={formData.role_code}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={formData.role_name}
                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Selector Dialog */}
      <Dialog open={isModuleSelectorOpen} onOpenChange={setIsModuleSelectorOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Select Module - {selectedRole?.role_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Account Management */}
            <button
              onClick={() => selectedRole && openPermissionDialog(selectedRole, "account-management")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Account Management</h3>
                <p className="text-sm text-muted-foreground">Manage Account Management permissions</p>
              </div>
            </button>

            {/* Product Management */}
            <button
              onClick={() => selectedRole && openPermissionDialog(selectedRole, "product-management")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Product Management</h3>
                <p className="text-sm text-muted-foreground">Manage Product Management permissions</p>
              </div>
            </button>

            {/* Asset Management */}
            <button
              onClick={() => selectedRole && openPermissionDialog(selectedRole, "asset-management")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Asset Management</h3>
                <p className="text-sm text-muted-foreground">Manage Asset Management permissions</p>
              </div>
            </button>

            {/* Operator Setting */}
            <button
              onClick={() => selectedRole && openPermissionDialog(selectedRole, "operator-setting")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Operator Setting</h3>
                <p className="text-sm text-muted-foreground">Manage Operator Setting permissions</p>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModuleSelectorOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Editor Dialog - SAMA SEPERTI DI OPERATORS PAGE */}
      <Dialog open={isPermissionOpen} onOpenChange={(open) => {
        setIsPermissionOpen(open);
        if (!open) {
          setSelectedModule(null);
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Manage Permissions - {selectedRole?.role_name} ({selectedModule === "account-management" ? "Account Management" : selectedModule === "product-management" ? "Product Management" : selectedModule === "asset-management" ? "Asset Management" : selectedModule === "operator-setting" ? "Operator Setting" : selectedModule})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {Object.entries(MENU_CONFIG).map(([menuName, config]) => {
              const perm = permissions[menuName];
              if (!perm) return null;
              
              // Filter menus based on selected module
              if (selectedModule === "account-management") {
                // Account Management: show dashboard, accounts, applications, lines, departments, roles
                if (!["dashboard", "accounts", "applications", "lines", "departments", "roles"].includes(menuName)) {
                  return null;
                }
              } else if (selectedModule === "product-management") {
                // Product Management: show dashboard, accounts, applications, lines, departments, roles (same structure)
                if (!["dashboard", "accounts", "applications", "lines", "departments", "roles"].includes(menuName)) {
                  return null;
                }
              } else if (selectedModule === "asset-management") {
                // Asset Management: show dashboard, accounts, applications (Type), lines (Brand)
                if (!["dashboard", "accounts", "applications", "lines"].includes(menuName)) {
                  return null;
                }
              } else if (selectedModule === "operator-setting") {
                // Operator Setting: show operators, operator roles, audit logs
                if (!["operators", "operator roles", "audit logs"].includes(menuName)) {
                  return null;
                }
              }

              // Get module-specific config
              const getModuleConfig = () => {
                if (selectedModule === "asset-management") {
                  if (menuName === "accounts") {
                    return {
                      ...config,
                      label: "Assets",
                      columns: [
                        { key: "status", label: "Status" },
                        { key: "code", label: "Code" },
                        { key: "type", label: "Type" },
                        { key: "brand", label: "Brand" },
                        { key: "item", label: "Item" },
                        { key: "specification", label: "Specification" },
                        { key: "user_use", label: "User Use" },
                        { key: "note", label: "Note" },
                        { key: "action", label: "Action" },
                      ],
                      actions: config.actions.filter(a => a.key !== "import"), // Remove import for Assets
                    };
                  }
                  if (menuName === "applications") {
                    return {
                      ...config,
                      label: "Type",
                      columns: [
                        { key: "code", label: "Code" },
                        { key: "name", label: "Type Name" },
                        { key: "total_assets", label: "Total Assets" },
                        { key: "action", label: "Action" },
                      ],
                    };
                  }
                  if (menuName === "lines") {
                    return {
                      ...config,
                      label: "Brand",
                      columns: [
                        { key: "code", label: "Code" },
                        { key: "name", label: "Brand Name" },
                        { key: "total_assets", label: "Total Assets" },
                        { key: "action", label: "Action" },
                      ],
                    };
                  }
                }
                return config;
              };

              const moduleConfig = getModuleConfig();

              return (
                <div key={menuName} className="border border-border rounded-lg p-4 bg-secondary/10">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-md">
                      {moduleConfig.label}
                    </span>
                  </h3>
                  
                  {/* Action Permissions */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-foreground">Actions:</h4>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                        <input
                          type="checkbox"
                          checked={moduleConfig.actions.every(action => {
                            // Dashboard & Audit Logs have special field names (no "can_" prefix for some)
                            const key = (menuName === 'dashboard' && (action.key === 'view_all_data' || action.key === 'view_segment_data'))
                              ? action.key 
                              : `can_${action.key}` as keyof Permission;
                            return perm[key] === true;
                          })}
                          onChange={(e) => {
                            moduleConfig.actions.forEach(action => {
                              const key = (menuName === 'dashboard' && (action.key === 'view_all_data' || action.key === 'view_segment_data'))
                                ? action.key 
                                : `can_${action.key}` as keyof Permission;
                              updatePermission(menuName, key, e.target.checked);
                            });
                          }}
                          className="w-3 h-3 accent-primary"
                        />
                        <span className="font-medium">Select All</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {moduleConfig.actions.map((action) => {
                        // Dashboard & Audit Logs have special field names (no "can_" prefix for some)
                        const key = (menuName === 'dashboard' && (action.key === 'view_all_data' || action.key === 'view_segment_data'))
                          ? action.key 
                          : `can_${action.key}` as keyof Permission;
                        return (
                          <label key={action.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm[key] === true}
                              onChange={(e) => updatePermission(menuName, key, e.target.checked)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm text-foreground">{action.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column Visibility */}
                  {moduleConfig.columns.length > 0 && (
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-foreground">Visible Columns:</h4>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                          <input
                            type="checkbox"
                            checked={moduleConfig.columns.every(col => perm.visible_columns?.includes(col.key))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Select all columns
                                setPermissions((prev) => ({
                                  ...prev,
                                  [menuName]: {
                                    ...prev[menuName],
                                    visible_columns: moduleConfig.columns.map(c => c.key),
                                  },
                                }));
                              } else {
                                // Deselect all columns
                                setPermissions((prev) => ({
                                  ...prev,
                                  [menuName]: {
                                    ...prev[menuName],
                                    visible_columns: [],
                                  },
                                }));
                              }
                            }}
                            className="w-3 h-3 accent-primary"
                          />
                          <span className="font-medium">Select All</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {moduleConfig.columns.map((column) => (
                          <label key={column.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.visible_columns?.includes(column.key) || false}
                              onChange={() => toggleColumn(menuName, column.key)}
                              className="w-4 h-4 accent-primary"
                            />
                            <span className="text-xs text-muted-foreground">{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePermissions} className="bg-primary hover:bg-primary/90">
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Filter Module Selector Dialog */}
      <Dialog open={isDataFilterModuleSelectorOpen} onOpenChange={setIsDataFilterModuleSelectorOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Select Module for Data Filter - {selectedRole?.role_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Account Management */}
            <button
              onClick={() => selectedRole && openDataFilterDialog(selectedRole, "account-management")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <UserCog className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Account Management</h3>
                <p className="text-sm text-muted-foreground">Manage Account Management data filters</p>
              </div>
            </button>

            {/* Product Management */}
            <button
              onClick={() => selectedRole && openDataFilterDialog(selectedRole, "product-management")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Product Management</h3>
                <p className="text-sm text-muted-foreground">Manage Product Management data filters</p>
              </div>
            </button>

            {/* Asset Management */}
            <button
              onClick={() => selectedRole && openDataFilterDialog(selectedRole, "asset-management")}
              className="w-full flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-secondary/50 hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 border border-primary/30">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Asset Management</h3>
                <p className="text-sm text-muted-foreground">Manage Asset Management data filters</p>
              </div>
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDataFilterModuleSelectorOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Filter Dialog */}
      <Dialog open={isDataFilterOpen} onOpenChange={(open) => {
        setIsDataFilterOpen(open);
        if (!open) {
          setSelectedDataFilterModule(null);
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Data Filter - {selectedRole?.role_name} ({selectedDataFilterModule === "account-management" ? "Account Management" : selectedDataFilterModule === "product-management" ? "Product Management" : selectedDataFilterModule === "asset-management" ? "Asset Management" : selectedDataFilterModule === "operator-setting" ? "Operator Setting" : selectedDataFilterModule})
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Control which data this role can see. <strong>Empty selection = Show NO data</strong>
            </p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Account Management Data Filter */}
            {selectedDataFilterModule === "account-management" && permissions['accounts'] && (
              <div className="border border-border rounded-lg p-4 bg-secondary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-md">
                    Accounts Data Filter
                  </span>
                </h3>
                
                {/* Applications Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Applications:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={applications.every(app => permissions['accounts'].allowed_applications?.includes(app.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_applications: applications.map(a => a.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_applications: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {applications.map((app) => (
                      <label key={app.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={permissions['accounts'].allowed_applications?.includes(app.id) || false}
                          onChange={() => toggleDataFilter('accounts', 'applications', app.id)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-foreground">{app.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Lines Filter */}
                <div className="mb-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Lines:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={lines.every(line => permissions['accounts'].allowed_lines?.includes(line.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_lines: lines.map(l => l.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_lines: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {lines.map((line) => (
                      <label key={line.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={permissions['accounts'].allowed_lines?.includes(line.id) || false}
                          onChange={() => toggleDataFilter('accounts', 'lines', line.id)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-foreground">{line.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Departments Filter */}
                <div className="mb-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Departments:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={departments.every(dept => permissions['accounts'].allowed_departments?.includes(dept.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_departments: departments.map(d => d.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_departments: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {departments.map((dept) => (
                      <label key={dept.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={permissions['accounts'].allowed_departments?.includes(dept.id) || false}
                          onChange={() => toggleDataFilter('accounts', 'departments', dept.id)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-foreground">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Product Management Data Filter */}
            {selectedDataFilterModule === "product-management" && permissions['accounts'] && (
              <div className="border border-border rounded-lg p-4 bg-secondary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-md">
                    Product Accounts Data Filter
                  </span>
                </h3>
                
                {/* Applications Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Applications:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={productApplications.every(app => permissions['accounts'].allowed_applications?.includes(app.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_applications: productApplications.map(a => a.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_applications: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {productApplications.length === 0 ? (
                      <div className="col-span-3 text-sm text-muted-foreground py-2">
                        No product applications found. Please add applications in Product Management module first.
                      </div>
                    ) : (
                      productApplications.map((app) => (
                        <label key={app.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={permissions['accounts'].allowed_applications?.includes(app.id) || false}
                            onChange={() => toggleDataFilter('accounts', 'applications', app.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-foreground">{app.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Lines Filter */}
                <div className="mb-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Lines:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={productLines.every(line => permissions['accounts'].allowed_lines?.includes(line.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_lines: productLines.map(l => l.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_lines: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {productLines.length === 0 ? (
                      <div className="col-span-3 text-sm text-muted-foreground py-2">
                        No product lines found. Please add lines in Product Management module first.
                      </div>
                    ) : (
                      productLines.map((line) => (
                        <label key={line.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={permissions['accounts'].allowed_lines?.includes(line.id) || false}
                            onChange={() => toggleDataFilter('accounts', 'lines', line.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-foreground">{line.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Departments Filter */}
                <div className="mb-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Departments:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={productDepartments.every(dept => permissions['accounts'].allowed_departments?.includes(dept.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_departments: productDepartments.map(d => d.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_departments: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {productDepartments.length === 0 ? (
                      <div className="col-span-3 text-sm text-muted-foreground py-2">
                        No product departments found. Please add departments in Product Management module first.
                      </div>
                    ) : (
                      productDepartments.map((dept) => (
                        <label key={dept.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={permissions['accounts'].allowed_departments?.includes(dept.id) || false}
                            onChange={() => toggleDataFilter('accounts', 'departments', dept.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-foreground">{dept.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Asset Management Data Filter */}
            {selectedDataFilterModule === "asset-management" && permissions['accounts'] && (
              <div className="border border-border rounded-lg p-4 bg-secondary/10">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-md">
                    Asset Accounts Data Filter
                  </span>
                </h3>
                
                {/* Types Filter */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Types:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={assetTypes.every(type => permissions['accounts'].allowed_applications?.includes(type.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_applications: assetTypes.map(t => t.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_applications: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {assetTypes.length === 0 ? (
                      <div className="col-span-3 text-sm text-muted-foreground py-2">
                        No asset types found. Please add types in Asset Management module first.
                      </div>
                    ) : (
                      assetTypes.map((type) => (
                        <label key={type.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={permissions['accounts'].allowed_applications?.includes(type.id) || false}
                            onChange={() => toggleDataFilter('accounts', 'applications', type.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-foreground">{type.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Brands Filter */}
                <div className="mb-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-foreground">Allowed Brands:</h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary">
                      <input
                        type="checkbox"
                        checked={assetBrands.every(brand => permissions['accounts'].allowed_lines?.includes(brand.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_lines: assetBrands.map(b => b.id),
                              },
                            }));
                          } else {
                            setPermissions((prev) => ({
                              ...prev,
                              accounts: {
                                ...prev.accounts,
                                allowed_lines: [],
                              },
                            }));
                          }
                        }}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="font-medium">Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {assetBrands.length === 0 ? (
                      <div className="col-span-3 text-sm text-muted-foreground py-2">
                        No asset brands found. Please add brands in Asset Management module first.
                      </div>
                    ) : (
                      assetBrands.map((brand) => (
                        <label key={brand.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={permissions['accounts'].allowed_lines?.includes(brand.id) || false}
                            onChange={() => toggleDataFilter('accounts', 'lines', brand.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-foreground">{brand.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDataFilterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDataFilters} className="bg-primary hover:bg-primary/90">
              Save Data Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete role <strong className="text-foreground">{selectedRole?.role_name}</strong>? 
              {selectedRole?.is_system_role && (
                <span className="block mt-2 text-destructive font-semibold">
                  This is a system role and cannot be deleted.
                </span>
              )}
              {selectedRole?.operator_count && selectedRole.operator_count > 0 && (
                <span className="block mt-2 text-destructive font-semibold">
                  This role is currently assigned to {selectedRole.operator_count} operator(s) and cannot be deleted.
                </span>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={selectedRole?.is_system_role || (selectedRole?.operator_count ? selectedRole.operator_count > 0 : false)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

