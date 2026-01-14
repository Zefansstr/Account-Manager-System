/**
 * Display Name Mapping
 * Mengubah nama panjang menjadi singkat untuk tampilan di dashboard
 * Database tetap menyimpan nama lengkap
 */

// Mapping untuk Department Names
export const departmentDisplayNames: Record<string, string> = {
  "CRM HOD": "HOD",
  "SE2": "SE2",
  "GCS/CSS": "GCS",
  "GCS": "GCS",
  "SNR": "SNR",
  "TE": "TE",
  "PPC": "PPC",
  "XBPO SE2": "XT",
  "XBPO Team": "XT",
  "XBPO TEAM": "XT",
  "XBPO Cashier": "XC",
  "XBPO CASHIER": "XC",
  "ALL Line": "AL",
  "CBO": "CBO",
  "CBO TEAM": "CBO",
  "CBO Team": "CBO",
};

// Mapping untuk Role Names
export const roleDisplayNames: Record<string, string> = {
  "HOD - M1 Above": "HOD",
  "Squad Lead": "SL",
  "Squad Team": "ST",
  "PPC Team": "PPC",
  "XBPO Team": "XT",
  "XBPO TEAM": "XT",
  "XBPO Cashier": "XC",
  "XBPO CASHIER": "XC",
  "Admin Team": "AT",
  "Finance Team": "FT",
  "CBO TEAM": "CBO",
  "CBO Team": "CBO",
  "CBO": "CBO",
};

/**
 * Get short display name for department
 * @param fullName - Full department name from database
 * @returns Short display name or original if no mapping found
 */
export function getDepartmentDisplayName(fullName: string): string {
  return departmentDisplayNames[fullName] || fullName;
}

/**
 * Get short display name for role
 * @param fullName - Full role name from database
 * @returns Short display name or original if no mapping found
 */
export function getRoleDisplayName(fullName: string): string {
  return roleDisplayNames[fullName] || fullName;
}

