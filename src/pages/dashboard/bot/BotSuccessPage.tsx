import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { Check, CheckCircle2, Bot, LayoutDashboard, Code } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrainingSuccessPage() {
  const navigate = useNavigate();
  const { id: botId } = useParams<{ id: string }>();
  const chatbots = useChatbotStore((s) => s.chatbots);
  const isHydrated = useStoreHydration();

  const bot = chatbots.find((b) => b.id === botId);

  const handleGoDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoEmbed = () => {
    navigate(`/dashboard/bot/${botId}/embed`);
  };

  if (!bot) {
    if (!isHydrated || chatbots.length === 0) {
      return (
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin text-brand" size={32} />
        </div>
      );
    }
  }

  if (!bot) return null;

  const fileCount = bot.knowledgeBase.files.filter((f) => f.type !== "url").length;
  const pageCount = bot.knowledgeBase.files.filter((f) => f.type === "url").length;

  let resourceSummary = "";
  if (fileCount > 0 && pageCount > 0) {
    resourceSummary = `đã học xong ${fileCount} tài liệu và ${pageCount} trang từ website`;
  } else if (fileCount > 0) {
    resourceSummary = `đã học xong ${fileCount} tài liệu tri thức`;
  } else if (pageCount > 0) {
    resourceSummary = `đã học xong ${pageCount} trang từ website`;
  } else {
    resourceSummary = "đã học xong tri thức bạn cung cấp";
  }

  return (
    <div className="max-w-xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Top logo & Wizard step indicators */}
      <div className="text-center space-y-2">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary dark:text-textDark-primary">BitTech</span>
        </div>
        <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary">
          Tạo chatbot cho website của bạn
        </h1>
        <p className="text-xs text-text-muted dark:text-textDark-secondary">
          Chi mất vài phút để có chatbot AI thông minh
        </p>
      </div>

      {/* Finished Steps Row */}
      <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex items-center last:flex-none flex-1">
            <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <Check size={12} className="stroke-[3]" />
            </div>
            {num < 4 && (
              <div className="h-[2px] bg-brand flex-1 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Main Success Card */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-8 shadow-md flex flex-col items-center text-center space-y-6">
        {/* Large Green Check Icon */}
        <div className="w-16 h-16 rounded-full bg-success-bg dark:bg-success/15 border border-success/20 flex items-center justify-center text-success animate-scaleIn">
          <CheckCircle2 size={40} className="stroke-[1.5]" />
        </div>

        {/* Status titles */}
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-text-primary dark:text-textDark-primary">
            Chatbot đã sẵn sàng!
          </h2>
          <p className="text-xs text-text-muted dark:text-textDark-secondary">
            Bot {resourceSummary} của bạn
          </p>
        </div>

        {/* Bot Information Card */}
        <div className="w-full p-4 bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border rounded-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner"
              style={{ backgroundColor: bot.widgetConfig.primaryColor }}
            >
              {bot.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-text-primary dark:text-textDark-primary">{bot.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
                  Đang hoạt động
                </span>
              </div>
            </div>
          </div>

          {/* Resource tag */}
          <div className="px-2.5 py-1 rounded-pill bg-brand-soft dark:bg-brand-softDark border border-brand/10 text-brand text-[10px] font-bold">
            {fileCount + pageCount} tài nguyên
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="w-full grid grid-cols-2 gap-4 pt-2">
          <Button
            variant="secondary"
            onClick={handleGoDashboard}
            icon={<LayoutDashboard size={14} />}
            className="w-full text-xs font-semibold py-2.5"
          >
            Trở về Dashboard
          </Button>
          <Button
            variant="primary"
            onClick={handleGoEmbed}
            icon={<Code size={14} />}
            className="w-full text-xs font-semibold py-2.5 shadow-md shadow-brand/20 transition-all hover:scale-[1.02]"
          >
            Cài đặt Widget
          </Button>
        </div>
      </div>
    </div>
  );
}

function Loader2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
