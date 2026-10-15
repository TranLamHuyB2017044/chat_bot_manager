import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Activity,
  Bot,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface AuditLogItem {
  id?: string;
  _id?: string;
  action?: string;
  event?: string;
  category?: string;
  workspace_id?: string;
  chatbot_id?: string;
  user_id?: string;
  user_email?: string;
  message?: string;
  description?: string;
  details?: any;
  data?: any;
  created_at?: string;
  timestamp?: string;
}

export default function AdminAuditLogsPage() {
  const navigate = useNavigate();
  const chatbots = useChatbotStore((s) => s.chatbots);
  const isHydrated = useStoreHydration();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let combinedLogs: AuditLogItem[] = [];

      // If specific workspace selected, fetch for that workspace
      if (selectedWorkspace !== "all") {
        const res = await apiFetch(`/api/chatbot/workspaces/${selectedWorkspace}/audit-logs`);
        const data = await res.json();
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        combinedLogs = list.map((item: any) => ({
          ...item,
          workspace_id: item.workspace_id || selectedWorkspace,
        }));
      } else {
        // Try admin endpoint first if backend has one, or aggregate across known workspaces
        let fetchedFromAdminEndpoint = false;
        try {
          const adminRes = await apiFetch(`/api/admin/audit-logs`);
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            const list = Array.isArray(adminData?.data)
              ? adminData.data
              : Array.isArray(adminData)
              ? adminData
              : [];
            combinedLogs = list;
            fetchedFromAdminEndpoint = true;
          }
        } catch {
          // fallback to chatbot workspaces
        }

        if (!fetchedFromAdminEndpoint) {
          // Aggregate logs across all available chatbots/workspaces
          const workspaceIds = Array.from(
            new Set(
              chatbots
                .map((b) => b.workspaceId || b.id)
                .filter(Boolean)
            )
          );

          const responses = await Promise.allSettled(
            workspaceIds.map(async (wsId) => {
              const res = await apiFetch(`/api/chatbot/workspaces/${wsId}/audit-logs`);
              if (!res.ok) return [];
              const json = await res.json();
              const list = Array.isArray(json?.data)
                ? json.data
                : Array.isArray(json)
                ? json
                : [];
              return list.map((item: any) => ({
                ...item,
                workspace_id: item.workspace_id || wsId,
              }));
            })
          );

          responses.forEach((res) => {
            if (res.status === "fulfilled" && Array.isArray(res.value)) {
              combinedLogs.push(...res.value);
            }
          });
        }
      }

      // Sort newest first
      combinedLogs.sort((a, b) => {
        const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      setLogs(combinedLogs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedWorkspace]);

  // Extract distinct actions for filtering
  const distinctActions = Array.from(
    new Set(
      logs
        .map((l) => (l.action || l.event || "").trim())
        .filter(Boolean)
    )
  );

  // Filter logs by search keyword and action
  const filteredLogs = logs.filter((log) => {
    const act = (log.action || log.event || "").toLowerCase();
    const msg = (
      log.message ||
      log.description ||
      JSON.stringify(log.details || log.data || "")
    ).toLowerCase();
    const user = (log.user_email || log.user_id || "").toLowerCase();
    const ws = (log.workspace_id || "").toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      act.includes(query) ||
      msg.includes(query) ||
      user.includes(query) ||
      ws.includes(query);

    const matchesAction =
      actionFilter === "all" ||
      (log.action || log.event || "").toLowerCase() === actionFilter.toLowerCase();

    return matchesSearch && matchesAction;
  });

  const getWorkspaceName = (wsId?: string) => {
    if (!wsId) return "N/A";
    const found = chatbots.find((b) => (b.workspaceId || b.id) === wsId);
    return found ? found.name : wsId;
  };

  const getActionBadgeVariant = (action?: string) => {
    const a = (action || "").toUpperCase();
    if (a.includes("DELETE") || a.includes("DESTROY") || a.includes("REMOVE")) return "danger";
    if (a.includes("CREATE") || a.includes("INSERT") || a.includes("ADD")) return "success";
    if (a.includes("UPDATE") || a.includes("EDIT") || a.includes("RESTORE")) return "warning";
    return "info";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand/15 dark:bg-brand/10 text-brand flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
                Nhật ký kiểm toán (Audit Logs)
              </h1>
              <p className="text-xs text-text-muted dark:text-textDark-secondary">
                Quản lý và giám sát các thao tác, sự kiện thay đổi của hệ thống (Dành cho Quản trị viên)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs"
            icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
          >
            Làm mới
          </Button>
          <span className="text-xs px-2.5 py-1 rounded-pill bg-brand-soft text-brand font-semibold border border-brand/20">
            {logs.length} bản ghi
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
            <input
              type="text"
              placeholder="Tìm theo thao tác, nội dung, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-btn bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand transition"
            />
          </div>

          {/* Workspace Filter */}
          <div className="relative">
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-btn bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand transition"
            >
              <option value="all">Tất cả Workspaces / Chatbots</option>
              {chatbots.map((b) => (
                <option key={b.id} value={b.workspaceId || b.id}>
                  Workspace: {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-btn bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand transition"
            >
              <option value="all">Tất cả loại hành động</option>
              {distinctActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-brand">
            <Loader2 size={28} className="animate-spin mb-2" />
            <span className="text-xs text-text-muted">Đang tải nhật ký kiểm toán...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-text-muted dark:text-textDark-secondary">
            <AlertCircle size={32} className="mx-auto text-text-muted/60 mb-2" />
            <p className="text-sm font-medium">Không tìm thấy nhật ký audit log nào</p>
            <p className="text-xs text-text-muted mt-1">
              {search || actionFilter !== "all" || selectedWorkspace !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Chưa có hoạt động nào được ghi nhận trên hệ thống"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-border dark:border-dark-border bg-surface-page/50 dark:bg-dark-page/50 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">Workspace / Bot</th>
                  <th className="px-4 py-3">Chi tiết & Nội dung</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50 dark:divide-dark-border/50 text-xs">
                {filteredLogs.map((log, idx) => {
                  const actionName = log.action || log.event || "LOG";
                  const dateStr = log.created_at || log.timestamp;
                  const dateObj = dateStr ? new Date(dateStr) : null;
                  const messageText =
                    log.message ||
                    log.description ||
                    (log.details
                      ? typeof log.details === "string"
                        ? log.details
                        : JSON.stringify(log.details)
                      : log.data
                      ? JSON.stringify(log.data)
                      : "—");

                  return (
                    <tr
                      key={log._id || log.id || idx}
                      className="hover:bg-surface-page dark:hover:bg-dark-page/50 transition-colors"
                    >
                      {/* Thời gian */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px]">
                          <Clock size={12} className="text-text-muted/70 shrink-0" />
                          <span>{dateObj ? dateObj.toLocaleString("vi-VN") : "—"}</span>
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getActionBadgeVariant(actionName)} className="font-mono uppercase text-[10px]">
                          {actionName}
                        </Badge>
                      </td>

                      {/* Workspace */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-text-primary dark:text-textDark-primary">
                          <Bot size={13} className="text-brand shrink-0" />
                          <span className="font-medium truncate max-w-[150px]">
                            {getWorkspaceName(log.workspace_id)}
                          </span>
                        </div>
                      </td>

                      {/* Chi tiết nội dung */}
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-text-primary dark:text-textDark-primary font-normal leading-relaxed break-words">
                          {messageText}
                        </p>
                      </td>

                      {/* Người thực hiện */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-text-muted">
                          <User size={13} className="shrink-0 text-text-muted/70" />
                          <span className="truncate max-w-[160px] text-[11px]">
                            {log.user_email || log.user_id || "System"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
