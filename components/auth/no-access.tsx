"use client";

import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoAccessProps {
  moduleName?: string;
}

export function NoAccess({ moduleName }: NoAccessProps) {
  const router = useRouter();

  const getModuleDisplayName = () => {
    switch (moduleName) {
      case "asset-management":
        return "Asset Management";
      case "product-management":
        return "Product Management";
      case "account-management":
        return "Account Management";
      case "operator-setting":
        return "Operator Setting";
      default:
        return "this module";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            No Access
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access {getModuleDisplayName()}.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator if you need access to this module.
          </p>
        </div>
        
        <Button
          onClick={() => router.push("/login")}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Landing Page
        </Button>
      </div>
    </div>
  );
}
