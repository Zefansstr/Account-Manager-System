import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Products mapping to applications in database
const PRODUCTS_MAPPING: { [key: string]: string[] } = {
  "PK Mechanism Dashboard": ["PK_MECHANISM", "PK Mechanism Dashboard"],
  "USDT Tracker": ["USDT_TRACKER", "USDT Tracker"],
  "Efficiency Insight Dashboard": ["EFFICIENCY_INSIGHT", "Efficiency Insight Dashboard"],
  "nexplan": ["NEXPLAN", "nexplan"],
  "X ARENA": ["X_ARENA", "X ARENA"],
  "SCRM Dashboard": ["SCRM_DASHBOARD", "SCRM Dashboard"],
};

// Get application IDs that match products
async function getProductApplicationIds() {
  const productNames = Object.keys(PRODUCTS_MAPPING);
  const allCodes = productNames.flatMap(name => PRODUCTS_MAPPING[name]);
  
  const { data: applications } = await supabase
    .from("applications")
    .select("id, app_code, app_name")
    .or(allCodes.map(code => `app_code.ilike.%${code}%,app_name.ilike.%${code}%`).join(','));
  
  return applications?.map(app => app.id) || [];
}

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

    // Get product application IDs
    const productApplicationIds = await getProductApplicationIds();

    // Validate and prepare data - only allow product applications
    const validAccounts = accounts.filter((acc: any) => {
      if (!acc.username || !acc.password) return false;
      // Only allow if application_id is in products list
      if (acc.application_id && !productApplicationIds.includes(acc.application_id)) {
        return false;
      }
      return true;
    });

    if (validAccounts.length === 0) {
      return NextResponse.json(
        { error: "No valid accounts to import. All accounts must use product applications." },
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

