import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get all assets with necessary fields for charts (include all assets, not just those with brand)
    const assetsQuery = supabase
      .from("asset_accounts")
      .select(`
        id,
        status,
        item,
        brand,
        department_team,
        storage_location,
        user_use
      `);

    // Get all counts in parallel - optimized queries
    const [
      assetsRes,
      brandsDistinctRes,
      departmentsDistinctRes,
      assetsDataRes,
    ] = await Promise.all([
      // Total devices (count only)
      supabase.from("asset_accounts").select("id", { count: "exact", head: true }),
      // Total brands (distinct count from brand column)
      supabase.from("asset_accounts").select("brand").not("brand", "is", null),
      // Total departments (distinct count from department_team column)
      supabase.from("asset_accounts").select("department_team").not("department_team", "is", null),
      // All assets data for charts (we'll calculate active count from this)
      assetsQuery,
    ]);

    // Check for errors in queries
    if (assetsRes.error) {
      console.error("Error fetching total assets:", assetsRes.error);
    }
    if (assetsDataRes.error) {
      console.error("Error fetching assets data:", assetsDataRes.error);
    }

    // Calculate active count from full data (case-insensitive)
    const activeCount = assetsDataRes.data?.filter((asset: any) => 
      asset.status?.toLowerCase() === "active"
    ).length || 0;

    // Calculate total brands (distinct)
    const brandsSet = new Set<string>();
    brandsDistinctRes.data?.forEach((asset: any) => {
      if (asset.brand) {
        brandsSet.add(asset.brand);
      }
    });
    const totalBrands = brandsSet.size;

    // Calculate total departments (distinct)
    const departmentsSet = new Set<string>();
    departmentsDistinctRes.data?.forEach((asset: any) => {
      if (asset.department_team) {
        departmentsSet.add(asset.department_team);
      }
    });
    const totalDepartments = departmentsSet.size;

    // Process chart data
    const activeInactiveByDevice: any = {}; // { deviceName: { active: count, inactive: count } }
    const usedByDepartment: any = {}; // { department: count }
    const totalActiveByBrand: any = {}; // { brand: count }
    const totalByStorageArea: any = {}; // { storage: count }
    
    assetsDataRes.data?.forEach((asset: any) => {
      const deviceName = asset.item || "Unknown";
      // Case-insensitive status comparison
      const isActive = asset.status?.toLowerCase() === "active";
      const isUsed = !!asset.user_use;
      const department = asset.department_team || "Unknown";
      const brand = asset.brand || "Unknown";
      const storage = asset.storage_location || "Unknown";

      // Chart 1: Active/Inactive Device per Device
      if (!activeInactiveByDevice[deviceName]) {
        activeInactiveByDevice[deviceName] = { active: 0, inactive: 0 };
      }
      if (isActive) {
        activeInactiveByDevice[deviceName].active += 1;
      } else {
        activeInactiveByDevice[deviceName].inactive += 1;
      }

      // Chart 2: Used Device Per Department (only if used)
      if (isUsed && department !== "Unknown") {
        usedByDepartment[department] = (usedByDepartment[department] || 0) + 1;
      }

      // Chart 3: Total Active Per Brand (only if active)
      if (isActive && brand !== "Unknown") {
        totalActiveByBrand[brand] = (totalActiveByBrand[brand] || 0) + 1;
      }

      // Chart 4: Total Device Used On Storage Area
      if (storage !== "Unknown") {
        totalByStorageArea[storage] = (totalByStorageArea[storage] || 0) + 1;
      }
    });

    // Format chart data
    const activeInactiveByDeviceChart = Object.entries(activeInactiveByDevice)
      .map(([name, data]: [string, any]) => ({
        name,
        active: data.active,
        inactive: data.inactive,
      }))
      .sort((a, b) => (b.active + b.inactive) - (a.active + a.inactive))
      .slice(0, 10); // Top 10 devices

    const usedByDepartmentChart = Object.entries(usedByDepartment)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);

    const totalActiveByBrandChart = Object.entries(totalActiveByBrand)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);

    const totalByStorageAreaChart = Object.entries(totalByStorageArea)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 storage areas

    return NextResponse.json({
      kpis: {
        totalDevices: assetsRes.count || 0,
        totalBrands: totalBrands,
        totalActiveStatus: activeCount,
        totalDepartments: totalDepartments,
      },
      charts: {
        activeInactiveByDevice: activeInactiveByDeviceChart,
        usedByDepartment: usedByDepartmentChart,
        totalActiveByBrand: totalActiveByBrandChart,
        totalByStorageArea: totalByStorageAreaChart,
      },
    });
  } catch (error: any) {
    console.error("Error fetching asset management stats:", error);
    return NextResponse.json(
      {
        error: error.message,
        kpis: {
          totalDevices: 0,
          totalBrands: 0,
          totalActiveStatus: 0,
          totalDepartments: 0,
        },
        charts: {
          activeInactiveByDevice: [],
          usedByDepartment: [],
          totalActiveByBrand: [],
          totalByStorageArea: [],
        },
      },
      { status: 500 }
    );
  }
}
