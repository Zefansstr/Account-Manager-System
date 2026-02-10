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

    // Fetch asset information
    const { data, error } = await supabase
      .from("asset_accounts")
      .select(`
        id,
        code,
        item
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
        typeName: null, // Type field has been removed, return null
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
