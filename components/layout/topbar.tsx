"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();
  const [operatorName, setOperatorName] = useState("Admin");

  useEffect(() => {
    // Get operator from localStorage
    const operatorStr = localStorage.getItem("operator");
    if (operatorStr) {
      const operator = JSON.parse(operatorStr);
      setOperatorName(operator.full_name || operator.username);
    }
  }, []);

  const handleLogout = async () => {
    try {
      const operatorStr = localStorage.getItem("operator");
      let userId, username;
      
      if (operatorStr) {
        const operator = JSON.parse(operatorStr);
        userId = operator.id;
        username = operator.username;
      }

      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      
      localStorage.removeItem("operator");
      localStorage.removeItem("permissions");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-lg">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">
            Account Management System
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-1.5">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{operatorName}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

