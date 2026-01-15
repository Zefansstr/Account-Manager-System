/**
 * Permission Helper Functions
 * Centralized utility for checking operator permissions
 */

// Get permissions from localStorage
export function getPermissions() {
  if (typeof window === 'undefined') return [];
  
  try {
    const permStr = localStorage.getItem("permissions");
    return permStr ? JSON.parse(permStr) : [];
  } catch {
    return [];
  }
}

// Get current operator
export function getCurrentOperator() {
  if (typeof window === 'undefined') return null;
  
  try {
    const opStr = localStorage.getItem("operator");
    return opStr ? JSON.parse(opStr) : null;
  } catch {
    return null;
  }
}

// Check if a menu is visible
export function canViewMenu(menuName: string): boolean {
  const permissions = getPermissions();
  
  // Dashboard is always visible for all operators
  const alwaysVisibleMenus = ["Dashboard"];
  if (alwaysVisibleMenus.some(menu => menu.toLowerCase() === menuName.toLowerCase())) {
    return true;
  }
  
  // If no permissions, default to false
  if (!permissions || permissions.length === 0) {
    return false;
  }
  
  // Find permission for this menu
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  // If permission exists, check can_view flag
  if (menuPermission) {
    return menuPermission.can_view === true;
  }
  
  // Default to false if no explicit permission
  return false;
}

// Check if can create in a menu
export function canCreate(menuName: string): boolean {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  return menuPermission?.can_create === true;
}

// Check if can edit in a menu
export function canEdit(menuName: string): boolean {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  return menuPermission?.can_edit === true;
}

// Check if can delete in a menu
export function canDelete(menuName: string): boolean {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  return menuPermission?.can_delete === true;
}

// Check if can enable/disable in a menu
export function canEnableDisable(menuName: string): boolean {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  return menuPermission?.can_enable_disable === true;
}

// Check if can import in a menu
export function canImport(menuName: string): boolean {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  return menuPermission?.can_import === true;
}

// Check if can export in a menu
export function canExport(menuName: string): boolean {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  return menuPermission?.can_export === true;
}

// Get visible columns for a menu (for table column visibility)
export function getVisibleColumns(menuName: string): string[] {
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  if (!menuPermission?.visible_columns) {
    return []; // If no visible_columns defined, show none (admin should configure this)
  }
  
  // visible_columns is JSONB array: ["username", "password", "status", ...]
  return menuPermission.visible_columns || [];
}

// Check if a specific column is visible
export function isColumnVisible(menuName: string, columnName: string): boolean {
  const visibleColumns = getVisibleColumns(menuName);
  
  // If no columns specified, default to showing all
  if (visibleColumns.length === 0) {
    return true;
  }
  
  return visibleColumns.includes(columnName.toLowerCase());
}

// Check if operator is Super Admin (bypass all checks)
export function isSuperAdmin(): boolean {
  const operator = getCurrentOperator();
  if (!operator) return false;
  
  // Check if role_name is "Super Admin" or similar
  return operator.role_name?.toLowerCase() === "super admin";
}

// ===== DATA-LEVEL FILTERING =====

// Get allowed filters for a menu
export function getAllowedFilters(menuName: string): {
  applications: string[];
  lines: string[];
  departments: string[];
} {
  // Super Admin can see all data
  if (isSuperAdmin()) {
    return {
      applications: [],
      lines: [],
      departments: [],
    };
  }
  
  const permissions = getPermissions();
  const menuPermission = permissions.find(
    (p: any) => p.menu_name?.toLowerCase() === menuName.toLowerCase()
  );
  
  if (!menuPermission) {
    return {
      applications: [],
      lines: [],
      departments: [],
    };
  }
  
  return {
    applications: menuPermission.allowed_applications || [],
    lines: menuPermission.allowed_lines || [],
    departments: menuPermission.allowed_departments || [],
  };
}

// Check if data filtering is active for a menu
export function hasDataFilters(menuName: string): boolean {
  if (isSuperAdmin()) return false;
  
  const filters = getAllowedFilters(menuName);
  return (
    filters.applications.length > 0 ||
    filters.lines.length > 0 ||
    filters.departments.length > 0
  );
}

// Cache for module access checks to avoid repeated calculations
let moduleAccessCache: Map<string, boolean> = new Map();
let permissionsCache: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds cache

// Clear cache when permissions change
export function clearPermissionCache() {
  moduleAccessCache.clear();
  permissionsCache = null;
  cacheTimestamp = 0;
}

// Check if user has access to a module (optimized with caching)
export function hasModuleAccess(moduleName: string): boolean {
  // Check cache first
  const cacheKey = `${moduleName}_${cacheTimestamp}`;
  if (moduleAccessCache.has(cacheKey)) {
    return moduleAccessCache.get(cacheKey)!;
  }

  // Super Admin has access to all modules
  if (isSuperAdmin()) {
    moduleAccessCache.set(cacheKey, true);
    return true;
  }
  
  // Use cached permissions if available and fresh
  let permissions: any[];
  const now = Date.now();
  if (permissionsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    permissions = permissionsCache;
  } else {
    permissions = getPermissions();
    permissionsCache = permissions;
    cacheTimestamp = now;
  }
  
  // Module mapping to menu names
  const moduleMenus: Record<string, string[]> = {
    "account-management": ["dashboard", "accounts", "applications", "lines", "departments", "roles"],
    "product-management": ["dashboard", "accounts", "applications", "lines", "departments", "roles"],
    "asset-management": ["dashboard", "accounts", "applications", "lines"],
    "operator-setting": ["operators", "operator roles", "audit logs"],
  };
  
  const menusForModule = moduleMenus[moduleName] || [];
  
  // Check if there's at least one permission with can_view = true for this module
  const hasAccess = permissions.some((perm: any) => {
    // Check if permission belongs to this module
    if (perm.module === moduleName) {
      const menuName = perm.menu_name?.toLowerCase();
      if (menusForModule.some(m => m.toLowerCase() === menuName)) {
        // Check if at least one action is enabled
        return (
          perm.can_view === true ||
          perm.can_create === true ||
          perm.can_edit === true ||
          perm.can_delete === true ||
          perm.can_enable_disable === true ||
          perm.can_import === true ||
          perm.can_export === true ||
          perm.view_all_data === true ||
          perm.view_segment_data === true
        );
      }
    }
    return false;
  });
  
  // Cache the result
  moduleAccessCache.set(cacheKey, hasAccess);
  return hasAccess;
}
