import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Optimize: Use single query for devices with all relations to reduce round trips
    const devicesWithRelationsQuery = supabase
      .from("device_accounts")
      .select(`
        id,
        status,
        type_id,
        brand_id,
        user_use,
        device_types:type_id(type_name),
        device_brands:brand_id(brand_name)
      `);

    // Get all device data with counts in parallel - optimized queries
    const [
      devicesRes,
      activeDevicesRes,
      typesRes,
      brandsRes,
      devicesWithRelationsRes,
    ] = await Promise.all([
      // Total devices (count only)
      supabase.from("device_accounts").select("id", { count: "exact", head: true }),
      // Active devices (count only)
      supabase.from("device_accounts").select("id", { count: "exact", head: true }).eq("status", "active"),
      // Total types (count only)
      supabase.from("device_types").select("id", { count: "exact", head: true }),
      // Total brands (count only)
      supabase.from("device_brands").select("id", { count: "exact", head: true }),
      // Devices with all relations (single query for charts)
      devicesWithRelationsQuery,
    ]);

    // Calculate inactive devices
    const inactiveDevices = (devicesRes.count || 0) - (activeDevicesRes.count || 0);

    // Process all chart data from single query result
    const statusGroups: any = {};
    const typeGroups: any = {};
    const brandGroups: any = {};
    const userUseGroups: any = {};
    
    devicesWithRelationsRes.data?.forEach((device: any) => {
      // Process by status
      const status = device.status || "inactive";
      const key = status === "active" ? "Active" : "Inactive";
      statusGroups[key] = (statusGroups[key] || 0) + 1;
      
      // Process by type
      if (device.device_types) {
        const typeName = device.device_types.type_name;
        typeGroups[typeName] = (typeGroups[typeName] || 0) + 1;
      }
      
      // Process by brand
      if (device.device_brands) {
        const brandName = device.device_brands.brand_name;
        brandGroups[brandName] = (brandGroups[brandName] || 0) + 1;
      }
      
      // Process by user use
      if (device.user_use) {
        const userUse = device.user_use;
        userUseGroups[userUse] = (userUseGroups[userUse] || 0) + 1;
      }
    });
    
    const devicesStatus = Object.entries(statusGroups).map(([name, count]) => ({
      name,
      count: count as number,
    }));
    
    const devicesByType = Object.entries(typeGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);
    
    const devicesByBrand = Object.entries(brandGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);
    
    const devicesByUserUse = Object.entries(userUseGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Limit to top 10

    return NextResponse.json({
      kpis: {
        totalDevices: devicesRes.count || 0,
        activeDevices: activeDevicesRes.count || 0,
        totalTypes: typesRes.count || 0,
        totalBrands: brandsRes.count || 0,
      },
      charts: {
        devicesStatus: devicesStatus.length > 0 ? devicesStatus : [
          { name: "Active", count: 0 },
          { name: "Inactive", count: 0 },
        ],
        devicesByType: devicesByType,
        devicesByBrand: devicesByBrand,
        devicesByUserUse: devicesByUserUse,
      },
    });
  } catch (error: any) {
    console.error("Error fetching device management stats:", error);
    return NextResponse.json(
      {
        error: error.message,
        kpis: {
          totalDevices: 0,
          activeDevices: 0,
          totalTypes: 0,
          totalBrands: 0,
        },
        charts: {
          devicesStatus: [
            { name: "Active", count: 0 },
            { name: "Inactive", count: 0 },
          ],
          devicesByType: [],
          devicesByBrand: [],
          devicesByUserUse: [],
        },
      },
      { status: 500 }
    );
  }
}
