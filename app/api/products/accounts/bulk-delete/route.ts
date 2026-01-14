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

// POST - Bulk delete accounts (only for products)
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

    // Verify all accounts belong to products
    const productApplicationIds = await getProductApplicationIds();
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id")
      .in("id", accountIds)
      .in("application_id", productApplicationIds);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No valid product accounts found" },
        { status: 400 }
      );
    }

    const validAccountIds = accounts.map(acc => acc.id);

    const { data, error } = await supabase
      .from("accounts")
      .delete()
      .in("id", validAccountIds)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `${data.length} account(s) deleted successfully`,
      deleted: data.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

