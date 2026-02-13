import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

// GET asset details by asset_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("asset_details")
      .select("*")
      .eq("asset_id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return NextResponse.json({ data: null }, { status: 200 });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST or PUT asset details (upsert)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      condition,
      yearOfPurchase,
      yearOfProduction,
      cpu,
      gpu,
      ram,
      memory,
      item,
      userId,
    } = body;

    // Check if detail already exists
    const { data: existing } = await supabase
      .from("asset_details")
      .select("id")
      .eq("asset_id", id)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("asset_details")
        .update({
          condition: condition || null,
          year_of_purchase: yearOfPurchase ? parseInt(yearOfPurchase) : null,
          year_of_production: yearOfProduction ? parseInt(yearOfProduction) : null,
          cpu: cpu || null,
          gpu: gpu || null,
          ram: ram || null,
          memory: memory || null,
          item: item || null,
          updated_at: new Date().toISOString(),
          updated_by: userId || null,
        })
        .eq("asset_id", id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity({
        userId,
        action: "UPDATE",
        tableName: "asset_details",
        recordId: data.id,
        newValue: {
          condition,
          yearOfPurchase,
          yearOfProduction,
          cpu,
          gpu,
          ram,
          memory,
          item,
        },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });

      return NextResponse.json({ data }, { status: 200 });
    } else {
      // Create new
      const { data, error } = await supabase
        .from("asset_details")
        .insert([
          {
            asset_id: id,
            condition: condition || null,
            year_of_purchase: yearOfPurchase ? parseInt(yearOfPurchase) : null,
            year_of_production: yearOfProduction ? parseInt(yearOfProduction) : null,
            cpu: cpu || null,
            gpu: gpu || null,
            ram: ram || null,
            memory: memory || null,
            item: item || null,
            created_by: userId || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity({
        userId,
        action: "CREATE",
        tableName: "asset_details",
        recordId: data.id,
        newValue: {
          condition,
          yearOfPurchase,
          yearOfProduction,
          cpu,
          gpu,
          ram,
          memory,
          item,
        },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });

      return NextResponse.json({ data }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE asset details
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const operatorStr = request.headers.get("operator");
    const userId = operatorStr ? JSON.parse(operatorStr).id : null;

    // Get existing data for audit log
    const { data: existing } = await supabase
      .from("asset_details")
      .select("*")
      .eq("asset_id", id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("asset_details")
        .delete()
        .eq("asset_id", id);

      if (error) throw error;

      // Log activity
      await logActivity({
        userId,
        action: "DELETE",
        tableName: "asset_details",
        recordId: existing.id,
        oldValue: existing,
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
