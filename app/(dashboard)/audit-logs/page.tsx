"use client";

import { useState, useEffect } from "react";
import { Eye, Download, Search, Filter, Plus, Edit, Trash2, LogIn, LogOut, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AuditLogsSkeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_value: any;
  new_value: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  operator_name?: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7"); // days

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (tableFilter !== "all") params.append("table", tableFilter);
      if (dateFilter !== "all") params.append("days", dateFilter);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const json = await res.json();
      setLogs(json.data || []);
      setFilteredLogs(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setLimit(newSize);
    setPage(1); // Reset to first page
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter, tableFilter, dateFilter]);

  useEffect(() => {
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      fetchLogs();
    });
  }, [page, limit, actionFilter, tableFilter, dateFilter]);

  useEffect(() => {
    // Client-side search filter
    if (searchQuery.trim() === "") {
      setFilteredLogs(logs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = logs.filter(
        (log) =>
          log.action.toLowerCase().includes(query) ||
          log.table_name.toLowerCase().includes(query) ||
          log.operator_name?.toLowerCase().includes(query) ||
          log.ip_address.toLowerCase().includes(query)
      );
      setFilteredLogs(filtered);
    }
  }, [searchQuery, logs]);

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-primary/20 text-primary border-primary",
      UPDATE: "bg-blue-500/20 text-blue-500 border-blue-500",
      DELETE: "bg-destructive/20 text-destructive border-destructive",
      LOGIN: "bg-green-500/20 text-green-500 border-green-500",
      LOGOUT: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
      ENABLE: "bg-green-500/20 text-green-500 border-green-500",
      DISABLE: "bg-gray-500/20 text-gray-400 border-gray-500",
    };
    return colors[action] || "bg-secondary text-muted-foreground";
  };

  const getActionIcon = (action: string) => {
    const iconClass = "h-4 w-4";
    switch (action) {
      case "CREATE":
        return <Plus className={iconClass} />;
      case "UPDATE":
        return <Edit className={iconClass} />;
      case "DELETE":
        return <Trash2 className={iconClass} />;
      case "LOGIN":
        return <LogIn className={iconClass} />;
      case "LOGOUT":
        return <LogOut className={iconClass} />;
      case "ENABLE":
        return <CheckCircle className={iconClass} />;
      case "DISABLE":
        return <XCircle className={iconClass} />;
      default:
        return <Edit className={iconClass} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Date", "User", "Action", "Table", "IP Address"];
    const rows = filteredLogs.map((log) => [
      formatDate(log.created_at),
      log.operator_name || "System",
      log.action,
      log.table_name,
      log.ip_address,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Note: Don't show full-page skeleton - show inline loading in list instead

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
          <p className="text-sm text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, table, user, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm w-40"
        >
          <option value="all">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm w-40"
        >
          <option value="all">All Tables</option>
          <option value="accounts">Accounts</option>
          <option value="operators">Operators</option>
          <option value="operator_roles">Roles</option>
          <option value="applications">Applications</option>
          <option value="lines">Lines</option>
          <option value="departments">Departments</option>
          <option value="roles">Account Roles</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm w-40"
        >
          <option value="1">Last 24 Hours</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> of{" "}
          <span className="font-semibold text-foreground">{pagination.total}</span> total logs
        </p>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {loading ? (
          <AuditLogsSkeleton count={10} />
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No audit logs found</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-border bg-card p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getActionBadge(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {log.table_name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.created_at)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pl-12">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">User:</span>
                      <span className="text-primary">{log.operator_name || "System"}</span>
                    </div>
                    {log.record_id && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Record ID:</span>
                        <span className="font-mono text-xs">{log.record_id.slice(0, 8)}...</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="font-medium">IP:</span>
                      <span className="font-mono text-xs">{log.ip_address}</span>
                    </div>
                  </div>

                  {/* Changes Preview (for UPDATE) */}
                  {log.action === "UPDATE" && log.old_value && log.new_value && (
                    <div className="pl-12 text-xs text-muted-foreground">
                      <span className="font-medium">Changed:</span>{" "}
                      {Object.keys(log.new_value || {})
                        .filter((key) => log.old_value[key] !== log.new_value[key])
                        .slice(0, 3)
                        .join(", ")}
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDetailDialog(log)}
                  className="hover:bg-primary/10 hover:text-primary"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="rounded-lg border border-border bg-card p-4">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          isLoading={loading}
          pageSize={limit}
          onPageSizeChange={handlePageSizeChange}
          totalRecords={pagination.total}
        />
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary">
                {getActionIcon(selectedLog?.action || "")}
              </div>
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <Badge variant="outline" className={getActionBadge(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Table</p>
                  <p className="text-sm font-semibold text-foreground">{selectedLog.table_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm text-primary font-medium">{selectedLog.operator_name || "System"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="text-sm text-foreground">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono text-foreground">{selectedLog.ip_address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Record ID</p>
                  <p className="text-sm font-mono text-foreground">{selectedLog.record_id}</p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                  <p className="text-xs font-mono text-muted-foreground bg-secondary p-2 rounded">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              {/* Old Value */}
              {selectedLog.old_value && Object.keys(selectedLog.old_value).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Before (Old Value)</p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Value */}
              {selectedLog.new_value && Object.keys(selectedLog.new_value).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">After (New Value)</p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}

              {/* Changes Comparison (for UPDATE) */}
              {selectedLog.action === "UPDATE" && selectedLog.old_value && selectedLog.new_value && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Changes</p>
                  <div className="space-y-2">
                    {Object.keys(selectedLog.new_value).map((key) => {
                      if (selectedLog.old_value[key] !== selectedLog.new_value[key]) {
                        return (
                          <div key={key} className="bg-secondary p-2 rounded">
                            <p className="text-xs font-medium text-foreground">{key}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-destructive">
                                {String(selectedLog.old_value[key])}
                              </span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-primary">
                                {String(selectedLog.new_value[key])}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
