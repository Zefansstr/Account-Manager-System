import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Get all device data with counts
    const [
      devicesRes,
      activeDevicesRes,
      typesRes,
      brandsRes,
      devicesByStatusRes,
      devicesByTypeRes,
      devicesByBrandRes,
      devicesByUserUseRes,
    ] = await Promise.all([
      // Total devices
      supabase.from("device_accounts").select("id", { count: "exact", head: true }),
      // Active devices
      supabase.from("device_accounts").select("id", { count: "exact", head: true }).eq("status", "active"),
      // Total types
      supabase.from("device_types").select("id", { count: "exact", head: true }),
      // Total brands
      supabase.from("device_brands").select("id", { count: "exact", head: true }),
      // Devices by status
      supabase.from("device_accounts").select("status"),
      // Devices by type
      supabase.from("device_accounts").select(`
        type_id,
        device_types:type_id (
          type_name
        )
      `),
      // Devices by brand
      supabase.from("device_accounts").select(`
        brand_id,
        device_brands:brand_id (
          brand_name
        )
      `),
      // Devices by user use
      supabase.from("device_accounts").select("user_use").not("user_use", "is", null),
    ]);

    // Calculate inactive devices
    const inactiveDevices = (devicesRes.count || 0) - (activeDevicesRes.count || 0);

    // Process devices by status
    const statusGroups: any = {};
    devicesByStatusRes.data?.forEach((device: any) => {
      const status = device.status || "inactive";
      const key = status === "active" ? "Active" : "Inactive";
      statusGroups[key] = (statusGroups[key] || 0) + 1;
    });
    const devicesStatus = Object.entries(statusGroups).map(([name, count]) => ({
      name,
      count: count as number,
    }));

    // Process devices by type
    const typeGroups: any = {};
    devicesByTypeRes.data?.forEach((device: any) => {
      if (device.device_types) {
        const typeName = device.device_types.type_name;
        typeGroups[typeName] = (typeGroups[typeName] || 0) + 1;
      }
    });
    const devicesByType = Object.entries(typeGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);

    // Process devices by brand
    const brandGroups: any = {};
    devicesByBrandRes.data?.forEach((device: any) => {
      if (device.device_brands) {
        const brandName = device.device_brands.brand_name;
        brandGroups[brandName] = (brandGroups[brandName] || 0) + 1;
      }
    });
    const devicesByBrand = Object.entries(brandGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);

    // Process devices by user use
    const userUseGroups: any = {};
    devicesByUserUseRes.data?.forEach((device: any) => {
      if (device.user_use) {
        const userUse = device.user_use;
        userUseGroups[userUse] = (userUseGroups[userUse] || 0) + 1;
      }
    });
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
