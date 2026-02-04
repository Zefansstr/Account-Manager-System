import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Optimize: Use single query for assets with all relations to reduce round trips
    const assetsWithRelationsQuery = supabase
      .from("asset_accounts")
      .select(`
        id,
        status,
        type_id,
        brand_id,
        user_use,
        asset_types:type_id(type_name),
        asset_brands:brand_id(brand_name)
      `);

    // Get all asset data with counts in parallel - optimized queries
    const [
      assetsRes,
      activeAssetsRes,
      typesRes,
      brandsRes,
      assetsWithRelationsRes,
    ] = await Promise.all([
      // Total assets (count only)
      supabase.from("asset_accounts").select("id", { count: "exact", head: true }),
      // Active assets (count only)
      supabase.from("asset_accounts").select("id", { count: "exact", head: true }).eq("status", "active"),
      // Total types (count only)
      supabase.from("asset_types").select("id", { count: "exact", head: true }),
      // Total brands (count only)
      supabase.from("asset_brands").select("id", { count: "exact", head: true }),
      // Assets with all relations (single query for charts)
      assetsWithRelationsQuery,
    ]);

    // Calculate inactive assets
    const inactiveAssets = (assetsRes.count || 0) - (activeAssetsRes.count || 0);

    // Process all chart data from single query result
    const statusGroups: any = {};
    const typeGroups: any = {};
    const brandGroups: any = {};
    const userUseGroups: any = {};
    
    assetsWithRelationsRes.data?.forEach((asset: any) => {
      // Process by status
      const status = asset.status || "inactive";
      const key = status === "active" ? "Active" : "Inactive";
      statusGroups[key] = (statusGroups[key] || 0) + 1;
      
      // Process by type
      if (asset.asset_types) {
        const typeName = asset.asset_types.type_name;
        typeGroups[typeName] = (typeGroups[typeName] || 0) + 1;
      }
      
      // Process by brand
      if (asset.asset_brands) {
        const brandName = asset.asset_brands.brand_name;
        brandGroups[brandName] = (brandGroups[brandName] || 0) + 1;
      }
      
      // Process by user use
      if (asset.user_use) {
        const userUse = asset.user_use;
        userUseGroups[userUse] = (userUseGroups[userUse] || 0) + 1;
      }
    });
    
    const assetsStatus = Object.entries(statusGroups).map(([name, count]) => ({
      name,
      count: count as number,
    }));
    
    const assetsByType = Object.entries(typeGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);
    
    const assetsByBrand = Object.entries(brandGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count);
    
    const assetsByUserUse = Object.entries(userUseGroups)
      .map(([name, count]) => ({
        name,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Limit to top 10

    return NextResponse.json({
      kpis: {
        totalAssets: assetsRes.count || 0,
        activeAssets: activeAssetsRes.count || 0,
        totalTypes: typesRes.count || 0,
        totalBrands: brandsRes.count || 0,
      },
      charts: {
        assetsStatus: assetsStatus.length > 0 ? assetsStatus : [
          { name: "Active", count: 0 },
          { name: "Inactive", count: 0 },
        ],
        assetsByType: assetsByType,
        assetsByBrand: assetsByBrand,
        assetsByUserUse: assetsByUserUse,
      },
    });
  } catch (error: any) {
    console.error("Error fetching asset management stats:", error);
    return NextResponse.json(
      {
        error: error.message,
        kpis: {
          totalAssets: 0,
          activeAssets: 0,
          totalTypes: 0,
          totalBrands: 0,
        },
        charts: {
          assetsStatus: [
            { name: "Active", count: 0 },
            { name: "Inactive", count: 0 },
          ],
          assetsByType: [],
          assetsByBrand: [],
          assetsByUserUse: [],
        },
      },
      { status: 500 }
    );
  }
}
