import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assets, userId } = body;

    if (!assets || !Array.isArray(assets)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Validate and prepare data
    const validAssets = assets.filter((asset: any) => 
      asset.code && asset.item
    );

    if (validAssets.length === 0) {
      return NextResponse.json(
        { error: "No valid assets to import. Code and Item are required." },
        { status: 400 }
      );
    }

    // Prepare data for bulk insert
    const assetsToInsert = validAssets.map((asset: any) => ({
      code: asset.code,
      type_id: asset.typeId || null,
      brand: asset.brand || null,
      item: asset.item,
      user_use: asset.userUse || null,
      note: asset.note || null,
      department_team: asset.departmentTeam || null,
      storage_location: asset.storageLocation || null,
      purchase_amount: asset.purchaseAmount ? parseFloat(asset.purchaseAmount.toString()) : null,
      currency: asset.currency || null,
      status: asset.status || "not_used",
      created_by: userId || null,
    }));

    // Bulk insert to Supabase
    const { data, error } = await supabase
      .from("asset_accounts")
      .insert(assetsToInsert)
      .select();

    if (error) {
      // Handle duplicate code errors
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Some asset codes already exist. Please check your data." },
          { status: 409 }
        );
      }
      throw error;
    }

    // Save asset details if provided
    if (data && data.length > 0) {
      const detailsToInsert: any[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const asset = data[i];
        const originalAsset = validAssets[i];
        
        if (originalAsset.details && (
          originalAsset.details.condition ||
          originalAsset.details.yearOfPurchase ||
          originalAsset.details.yearOfProduction ||
          originalAsset.details.cpu ||
          originalAsset.details.gpu ||
          originalAsset.details.ram ||
          originalAsset.details.memory ||
          originalAsset.details.item
        )) {
          detailsToInsert.push({
            asset_id: asset.id,
            condition: originalAsset.details.condition || null,
            year_of_purchase: originalAsset.details.yearOfPurchase ? parseInt(originalAsset.details.yearOfPurchase.toString()) : null,
            year_of_production: originalAsset.details.yearOfProduction ? parseInt(originalAsset.details.yearOfProduction.toString()) : null,
            cpu: originalAsset.details.cpu || null,
            gpu: originalAsset.details.gpu || null,
            ram: originalAsset.details.ram || null,
            memory: originalAsset.details.memory || null,
            item: originalAsset.details.item || null,
            created_by: userId || null,
          });
        }
      }

      // Insert asset details if any
      if (detailsToInsert.length > 0) {
        const { error: detailsError } = await supabase
          .from("asset_details")
          .insert(detailsToInsert);

        if (detailsError) {
          console.error("Error inserting asset details:", detailsError);
          // Don't fail the import if details fail, just log it
        }
      }
    }

    // Log activity for bulk import
    if (userId && data && data.length > 0) {
      await logActivity({
        userId,
        action: "IMPORT",
        tableName: "asset_accounts",
        recordId: data[0].id,
        newValue: { importedCount: data.length },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${data.length} asset(s)`,
      imported: data.length,
      total: assets.length,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import assets" },
      { status: 500 }
    );
  }
}
