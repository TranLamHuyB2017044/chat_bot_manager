import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { MessageStatsData } from "@/types/admin";

export default function AdminStatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<MessageStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("week");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      const res = await apiFetch(`/api/admin/stats/messages?${params}`);
      const json = await res.json();
      if (json.data) {
        setStats(json.data.data || json.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin")}
          className="p-2 rounded-btn hover:bg-surface-input dark:hover:bg-dark-input transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
            Thống kê tin nhắn
          </h1>
          <p className="text-sm text-text-muted dark:text-textDark-secondary mt-0.5">
            Phân tích hoạt động theo thời gian
          </p>
        </div>
      </div>

      {/* Period selector */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-text-muted" />
          <div className="flex gap-2">
            {["day", "week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-btn text-sm font-medium transition ${
                  period === p
                    ? "bg-brand text-white"
                    : "text-text-muted dark:text-textDark-secondary hover:bg-surface-input dark:hover:bg-dark-input"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface-card dark:bg-dark-card rounded-card border border-surface-border dark:border-dark-border p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-brand" size={32} />
          </div>
        ) : stats.length === 0 ? (
          <p className="text-center text-text-muted py-12">
            Không có dữ liệu thống kê
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-2 h-64">
              {stats.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-brand rounded-t-lg transition-all hover:bg-brand-hover"
                    style={{
                      height: `${(item.count / maxCount) * 100}%`,
                      minHeight: "4px",
                    }}
                  />
                  <span className="text-xs text-text-muted dark:text-textDark-secondary truncate">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats table */}
            <div className="mt-8 border-t border-surface-border dark:border-dark-border pt-4">
              <h3 className="text-sm font-semibold text-text-primary dark:text-textDark-primary mb-3">
                Chi tiết
              </h3>
              <div className="space-y-2">
                {stats.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-btn hover:bg-surface-input dark:hover:bg-dark-input"
                  >
                    <span className="text-sm text-text-primary dark:text-textDark-primary">
                      {item.date}
                    </span>
                    <span className="text-sm font-bold text-brand">
                      {item.count} tin nhắn
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
