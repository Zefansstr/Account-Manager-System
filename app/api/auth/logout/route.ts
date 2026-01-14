import { NextRequest, NextResponse } from "next/server";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/audit-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, username } = body;

    // Log logout activity
    if (userId) {
      await logActivity({
        userId,
        action: "LOGOUT",
        tableName: "operators",
        recordId: userId,
        newValue: { username },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "An error occurred during logout", success: false },
      { status: 500 }
    );
  }
}

