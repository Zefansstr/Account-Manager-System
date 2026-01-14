import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accounts } = body;

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Validate and prepare data
    const validAccounts = accounts.filter((acc: any) => 
      acc.username && acc.password
    );

    if (validAccounts.length === 0) {
      return NextResponse.json(
        { error: "No valid accounts to import" },
        { status: 400 }
      );
    }

    // Bulk insert to Supabase
    const { data, error } = await supabase
      .from("accounts")
      .insert(validAccounts)
      .select();

    if (error) {
      // Handle duplicate username errors
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Some usernames already exist. Please check your data." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${data.length} accounts`,
      imported: data.length,
      total: accounts.length,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import accounts" },
      { status: 500 }
    );
  }
}

