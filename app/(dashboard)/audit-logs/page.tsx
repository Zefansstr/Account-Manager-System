"use client";

import { useState, useEffect } from "react";
import { Eye, Download, Search, Plus, Edit, Trash2, LogIn, LogOut, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { AuditLogsSkeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

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

  return (
    <div className="flex flex-col w-full bg-[rgba(127,85,57,0.04)] dark:bg-[#101211] border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-2xl p-6">
      <div className="pb-5 border-b border-[#7F5539]/20 dark:border-[#7F5539]/40 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-medium text-[#1e1e1e] dark:text-white tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>Audit Logs</h1>
            <span className="inline-flex items-center justify-center bg-[#3a2314] dark:bg-[#7f5539] text-white text-xs font-medium rounded min-w-[20px] h-5 px-1.5">{pagination.total}</span>
          </div>
          <p className="text-sm text-[rgba(127,85,57,0.62)] dark:text-gray-400 mt-1">Track all system activities and changes</p>
        </div>
      </div>

      {/* Filter Bar - same layout & style as Account Management */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterDropdown
            value={actionFilter}
            onChange={(v) => { setActionFilter(v); setPage(1); }}
            options={[
              { value: "all", label: "All Actions" },
              { value: "CREATE", label: "Create" },
              { value: "UPDATE", label: "Update" },
              { value: "DELETE", label: "Delete" },
              { value: "LOGIN", label: "Login" },
              { value: "LOGOUT", label: "Logout" },
            ]}
            placeholder="All Actions"
            minWidth="140px"
          />
          <FilterDropdown
            value={tableFilter}
            onChange={(v) => { setTableFilter(v); setPage(1); }}
            options={[
              { value: "all", label: "All Tables" },
              { value: "accounts", label: "Accounts" },
              { value: "operators", label: "Operators" },
              { value: "operator_roles", label: "Roles" },
              { value: "applications", label: "Applications" },
              { value: "lines", label: "Lines" },
              { value: "departments", label: "Departments" },
              { value: "roles", label: "Account Roles" },
            ]}
            placeholder="All Tables"
            minWidth="140px"
          />
          <FilterDropdown
            value={dateFilter}
            onChange={(v) => { setDateFilter(v); setPage(1); }}
            options={[
              { value: "1", label: "Last 24 Hours" },
              { value: "7", label: "Last 7 Days" },
              { value: "30", label: "Last 30 Days" },
              { value: "90", label: "Last 90 Days" },
              { value: "all", label: "All Time" },
            ]}
            placeholder="Last 7 Days"
            minWidth="140px"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 w-80 h-9 border border-[#7F5539]/25 dark:border-[#7F5539]/50 rounded-md px-3.5 bg-[#faf8f6] dark:bg-[#1a1a1a] flex-shrink-0 shadow-[0_2px_6px_rgba(127,85,57,0.1)]">
            <Search className="h-4 w-4 flex-shrink-0 text-[rgba(127,85,57,0.35)] dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by action, table, user, or IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-sm font-medium text-[#1e1e1e] dark:text-gray-200 min-w-0 placeholder:text-[rgba(127,85,57,0.4)] dark:placeholder:text-gray-500"
            />
          </div>
          <div className="h-8 w-px flex-shrink-0 bg-[rgba(127,85,57,0.2)]" aria-hidden />
          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center gap-2 h-8 px-4 bg-[#3a2314] dark:bg-transparent dark:border dark:border-[#2a2a2a] dark:text-white rounded border-0 cursor-pointer text-white text-sm font-medium whitespace-nowrap hover:opacity-90 dark:hover:bg-white/10 transition-colors shadow-[0_2px_6px_rgba(127,85,57,0.12)]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="min-h-[280px] max-h-[calc(100vh-320px)] overflow-auto border border-[#7F5539]/20 dark:border-[#7F5539]/40 rounded-lg scrollbar-invisible bg-white dark:bg-[#101211]">
        {loading ? (
          <div className="p-8"><AuditLogsSkeleton count={10} /></div>
        ) : filteredLogs.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground dark:text-gray-400">No audit logs found</div>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <thead className="sticky top-0 z-10 bg-[#f0eae4] dark:bg-[#101211] shadow-[0_1px_0_0_rgba(127,85,57,0.2)] dark:shadow-[0_1px_0_0_rgba(127,85,57,0.4)]">
              <tr>
                <th className="w-[18%] px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white bg-[#f0eae4] dark:bg-[#101211]">Date</th>
                <th className="w-[15%] px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white bg-[#f0eae4] dark:bg-[#101211]">User</th>
                <th className="w-[12%] px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white bg-[#f0eae4] dark:bg-[#101211]">Action</th>
                <th className="w-[18%] px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white bg-[#f0eae4] dark:bg-[#101211]">Table</th>
                <th className="w-[22%] px-4 py-3 text-left text-sm font-semibold text-[#1e1e1e] dark:text-white bg-[#f0eae4] dark:bg-[#101211]">IP Address</th>
                <th className="w-[15%] px-4 py-3 text-center text-sm font-semibold text-[#1e1e1e] dark:text-white bg-[#f0eae4] dark:bg-[#101211]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#101211]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-[#7F5539]/15 dark:border-[#7F5539]/30 bg-white dark:bg-[#101211] hover:bg-[#f5f0eb] dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{formatDate(log.created_at)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle"><span className="text-[#7f5539] dark:text-[#a06540]">{log.operator_name || "System"}</span></td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                    <Badge variant="outline" className={getActionBadge(log.action)}>{log.action}</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">{log.table_name}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle font-mono">{log.ip_address}</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#1e1e1e] dark:text-gray-200 align-middle">
                    <div className="flex items-center justify-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(log)} className="hover:bg-primary/10 hover:text-primary"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#7F5539]/20 dark:border-[#7F5539]/40">
        <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} isLoading={loading} pageSize={limit} onPageSizeChange={handlePageSizeChange} totalRecords={pagination.total} />
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-white dark:bg-[#101211] border border-[rgba(127,85,57,0.2)] dark:border-[#1f1f1f] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1e1e1e] dark:text-white flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#f0eae4] dark:bg-[#1a1a1a]">
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
          <DialogFooter className="flex flex-row justify-end gap-3 pt-4 mt-1 border-t border-[rgba(127,85,57,0.12)]">
            <Button variant="outline" className="min-w-[88px]" onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
