"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChatbotStore } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Settings, Trash2, Save, Loader2, AlertTriangle } from "lucide-react";

export default function BotSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const { chatbots, updateChatbot, deleteChatbot } = useChatbotStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Sync hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const bot = isHydrated ? chatbots.find((b) => b.id === botId) : null;

  useEffect(() => {
    if (bot) {
      setName(bot.name);
      setDescription(bot.description || "");
    }
  }, [bot]);

  if (!isHydrated || !bot) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const updatedBot = {
      ...bot,
      name,
      description,
    };

    updateChatbot(botId, { name, description });

    try {
      await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBot),
      });
    } catch (e) {
      console.error("Error saving chatbot settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa chatbot này? Mọi dữ liệu tri thức và cấu hình widget sẽ bị xóa vĩnh viễn và không thể khôi phục.")) {
      deleteChatbot(botId);
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Settings Form Card */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-surface-border dark:border-dark-border pb-3">
          <Settings size={16} className="text-brand" />
          <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
            Cài đặt cơ bản
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Tên chatbot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Trợ lý bán hàng"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary dark:text-textDark-secondary">
              Mô tả ngắn gọn
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Mô tả nhiệm vụ của bot..."
              className="w-full px-3 py-2.5 rounded-btn text-sm bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
            />
          </div>
        </div>

        <div className="border-t border-surface-border dark:border-dark-border pt-4 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            icon={<Save size={13} />}
            className="text-xs font-semibold px-6 shadow-md"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-danger-bg/20 border border-danger/10 rounded-card p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle size={16} />
          <h2 className="text-sm font-bold">Vùng nguy hiểm (Danger Zone)</h2>
        </div>
        
        <p className="text-xs text-text-secondary dark:text-textDark-primary leading-relaxed">
          Xóa chatbot sẽ loại bỏ hoàn toàn các tài liệu tri thức đã học và dừng hoạt động của widget chat nhúng trên các website của bạn ngay lập tức.
        </p>

        <div className="pt-2">
          <Button
            variant="danger"
            onClick={handleDelete}
            icon={<Trash2 size={13} />}
            className="text-xs font-bold px-6 border border-danger/30 hover:bg-danger hover:text-white"
          >
            Xóa Chatbot Này
          </Button>
        </div>
      </div>
    </div>
  );
}
