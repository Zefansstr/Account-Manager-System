import Link from "next/link";
import { AppWindow, Layers, Building2, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingsMenus = [
  {
    title: "Applications",
    description: "Manage applications (HWBO, SCRM, Office Gram)",
    href: "/applications",
    icon: AppWindow,
    color: "text-blue-500",
  },
  {
    title: "Lines",
    description: "Manage lines (SBMY, LVMY, MYR, SGD)",
    href: "/lines",
    icon: Layers,
    color: "text-green-500",
  },
  {
    title: "Departments",
    description: "Manage departments and teams",
    href: "/departments",
    icon: Building2,
    color: "text-purple-500",
  },
  {
    title: "Roles",
    description: "Manage user roles and permissions",
    href: "/roles",
    icon: Shield,
    color: "text-orange-500",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[rgba(127,85,57,0.08)] dark:border-[#1f1f1f] rounded-2xl p-6">
      <div className="pb-5 border-b border-[rgba(30,30,30,0.12)] dark:border-[#1f1f1f]">
        <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Settings</h1>
        <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">
          Manage system configuration and reference data
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {settingsMenus.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link key={menu.href} href={menu.href}>
              <Card className="border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f] bg-white dark:bg-[#101211] hover:bg-[rgba(127,85,57,0.05)] dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-[rgba(127,85,57,0.1)] dark:bg-[rgba(127,85,57,0.2)] p-3 ${menu.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-[#1e1e1e] dark:text-white">{menu.title}</CardTitle>
                      <CardDescription className="text-[rgba(127,85,57,0.62)] dark:text-gray-400">
                        {menu.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

