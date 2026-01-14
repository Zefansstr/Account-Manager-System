"use client";

import { MessageSquare, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ProductsSupportChatPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="border-border bg-card shadow-lg max-w-md w-full">
        <CardContent className="p-12 text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 border border-primary/30 mb-6 mx-auto">
            <MessageSquare className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Support Chat
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
            <Clock className="h-5 w-5" />
            <p className="text-lg">Coming Soon</p>
          </div>
          <p className="text-sm text-muted-foreground">
            This module is currently under development. Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
