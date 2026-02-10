import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET asset by code
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code parameter is required" },
        { status: 400 }
      );
    }

    // Fetch asset with type information
    const { data, error } = await supabase
      .from("asset_accounts")
      .select(`
        id,
        code,
        item,
        asset_types:type_id (
          id,
          type_name
        )
      `)
      .eq("code", code.trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json({ data: null });
      }
      throw error;
    }

    return NextResponse.json({
      data: {
        id: data.id,
        code: data.code,
        item: data.item,
        typeName: data.asset_types?.type_name || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
