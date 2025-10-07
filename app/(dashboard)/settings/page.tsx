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
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage system configuration and reference data
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsMenus.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link key={menu.href} href={menu.href}>
              <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-primary/10 p-3 ${menu.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{menu.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
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

