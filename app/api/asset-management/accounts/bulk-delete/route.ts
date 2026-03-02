import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// POST - Bulk delete asset accounts
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { assetIds, userId } = body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid assetIds. Must be a non-empty array" },
        { status: 400 }
      );
    }

    console.log("Bulk delete request:", { assetIdsCount: assetIds.length, userId, firstFewIds: assetIds.slice(0, 5) });

    // Validate and filter out invalid IDs
    const validIds = assetIds.filter(id => id && typeof id === 'string' && id.length > 0);
    
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No valid asset IDs provided" },
        { status: 400 }
      );
    }

    if (validIds.length !== assetIds.length) {
      console.warn(`Filtered out ${assetIds.length - validIds.length} invalid IDs`);
    }

    // Get old values before delete for audit log
    // Note: Supabase .in() has a limit, so we batch fetch if too many IDs
    const BATCH_SIZE = 100;
    let allOldData: any[] = [];
    
    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
      const batch = validIds.slice(i, i + BATCH_SIZE);
      const { data: batchData, error: fetchError } = await supabase
        .from("asset_accounts")
        .select("id, code, item")
        .in("id", batch);

      if (fetchError) {
        console.error(`Error fetching batch ${Math.floor(i / BATCH_SIZE) + 1}:`, fetchError);
        return NextResponse.json(
          { error: `Failed to fetch assets: ${fetchError.message}` },
          { status: 500 }
        );
      }

      if (batchData) {
        allOldData = [...allOldData, ...batchData];
      }
    }

    const oldData = allOldData;
    const foundCount = oldData?.length || 0;
    console.log(`Found ${foundCount} assets out of ${assetIds.length} requested`);

    if (foundCount === 0) {
      return NextResponse.json(
        { error: "No assets found to delete. The selected assets may have already been deleted." },
        { status: 404 }
      );
    }

    // Delete asset_details first (if exists) to avoid foreign key constraint
    // Batch delete asset_details
    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
      const batch = validIds.slice(i, i + BATCH_SIZE);
      const { error: detailsError } = await supabase
        .from("asset_details")
        .delete()
        .in("asset_id", batch);

      if (detailsError) {
        console.error(`Error deleting asset_details batch ${Math.floor(i / BATCH_SIZE) + 1}:`, detailsError);
        // Continue with asset_accounts delete even if details delete fails
      }
    }
    
    console.log("Completed asset_details deletion attempt");

    // Delete asset accounts in batches
    let deletedCount = 0;
    
    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
      const batch = validIds.slice(i, i + BATCH_SIZE);
      const { error: batchError } = await supabase
        .from("asset_accounts")
        .delete()
        .in("id", batch);

      if (batchError) {
        console.error(`Error deleting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batchError);
        // Check for foreign key constraint error
        if (batchError.code === "23503" || batchError.message?.includes("foreign key")) {
          return NextResponse.json(
            { error: "Cannot delete assets: Some assets are referenced by other records. Please remove all references first." },
            { status: 400 }
          );
        }
        // For other errors, continue with next batch but log the error
        console.warn(`Failed to delete batch ${Math.floor(i / BATCH_SIZE) + 1}, continuing...`);
      } else {
        deletedCount += batch.length;
      }
    }

    console.log(`Successfully deleted ${foundCount} asset(s) from database`);

    // Log activity for bulk delete
    if (userId && oldData && oldData.length > 0) {
      try {
        let ipAddress = "unknown";
        let userAgent = "unknown";
        
        try {
          ipAddress = getIpAddress(request);
          userAgent = getUserAgent(request);
        } catch (headerError) {
          console.warn("Error getting IP/UserAgent:", headerError);
        }

        await logActivity({
          userId,
          action: "DELETE",
          tableName: "asset_accounts",
          recordId: oldData[0].id,
          oldValue: { 
            bulkDelete: true,
            deletedCount: oldData.length,
            codes: oldData.map(a => a.code)
          },
          ipAddress,
          userAgent,
        });
      } catch (logError) {
        console.error("Error logging activity:", logError);
        // Don't fail the delete if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `${foundCount} asset(s) deleted successfully`,
      deleted: foundCount,
      requested: assetIds.length,
    });
  } catch (error: any) {
    console.error("Bulk delete error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { 
        error: error.message || "Failed to delete assets",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
