import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Bulk delete accounts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountIds } = body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid accountIds. Must be a non-empty array" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("accounts")
      .delete()
      .in("id", accountIds)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${accountIds.length} account(s) deleted successfully`,
      deleted: accountIds.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

