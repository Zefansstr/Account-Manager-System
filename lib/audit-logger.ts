import { supabase } from "@/lib/supabase";

type LogActivityParams = {
  userId?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "ENABLE" | "DISABLE";
  tableName: string;
  recordId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Log activity to activity_logs table
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const {
      userId,
      action,
      tableName,
      recordId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
    } = params;

    const { error } = await supabase.from("activity_logs").insert([
      {
        user_id: userId || null,
        action,
        table_name: tableName,
        record_id: recordId || null,
        old_value: oldValue || null,
        new_value: newValue || null,
        ip_address: ipAddress || "unknown",
        user_agent: userAgent || "unknown",
      },
    ]);

    if (error) {
      console.error("Error logging activity:", error);
    }
  } catch (error) {
    console.error("Error in logActivity:", error);
  }
}

/**
 * Get user ID from localStorage (client-side helper)
 * In production, this should come from server-side session
 */
export function getCurrentUserId(): string | undefined {
  if (typeof window !== "undefined") {
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      const operator = JSON.parse(operatorStr);
      return operator.id;
    }
  }
  return undefined;
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (real) {
    return real;
  }
  
  return "unknown";
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent") || "unknown";
}

