import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Sonner";
import { Avatar } from "@/components/Avatar";
import { useChatbotStore, KnowledgeFile, DEFAULT_AVATARS } from "@/store/chatbotStore";
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  Upload,
  FileText,
  Sparkles,
  Check,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateBotPage() {
  const navigate = useNavigate();
  const { createChatbotApi, updateChatbotApi } = useChatbotStore();
  const [step, setStep] = useState(1);

  // --- Step States ---
  // Step 1: Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorIndex, setColorIndex] = useState(0);

  // Step 2: Knowledge Base
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [actualFiles, setActualFiles] = useState<File[]>([]);
  const [websiteUrl] = useState("");

  // Step 3: Widget Customizer
  const [greeting, setGreeting] = useState("Xin chào! Tôi có thể giúp gì cho bạn hôm nay?");
  const placeholderText = "Nhập tin nhắn...";

  // Step 4: Training Simulation
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const validateStep = () => {
    if (step === 1 && !name.trim()) {
      toast.error("Vui lòng nhập tên chatbot");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  // Mock upload simulator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const uploadedFiles = Array.from(e.target.files);
    
    // Limit total files to 5
    const maxFiles = 5;
    const currentFilesCount = files.length;
    const newFilesCount = uploadedFiles.length;
    
    if (currentFilesCount + newFilesCount > maxFiles) {
      toast.error(`Tối đa chỉ cho phép ${maxFiles} file`);
      return;
    }
    
    setActualFiles((prev) => [...prev, ...uploadedFiles]);

    uploadedFiles.forEach((file) => {
      const newFile: KnowledgeFile = {
        name: file.name,
        size: file.size,
        progress: 0,
        type: file.name.split(".").pop() || "txt",
      };

      setFiles((prev) => [...prev, newFile]);

      // Simulate upload progress
      let uploadProgress = 0;
      const interval = setInterval(() => {
        uploadProgress += 20;
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, progress: Math.min(uploadProgress, 100) } : f
          )
        );
        if (uploadProgress >= 100) clearInterval(interval);
      }, 200);
    });
  };

  const handleDeleteFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
    setActualFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  // Start training bot
  const handleStartTraining = async () => {
    try {
      setIsTraining(true);

      const newBotId = await createChatbotApi({
        name,
        description,
        avatarUrl: DEFAULT_AVATARS[colorIndex].id,
        color: colorIndex,
        greeting,
        workspaceName: name, // Workspace name maps to bot name
        files: actualFiles,
      });

      if (!newBotId) {
        toast.error("Tạo chatbot thất bại. Vui lòng thử lại!");
        setIsTraining(false);
        return;
      }

      // Animate progress bar
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setTrainingProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
          navigate(`/dashboard/bot/${newBotId}/success`);
        }
      }, 300);
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra. Vui lòng thử lại!");
      setIsTraining(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-text-primary dark:text-textDark-primary">
          Tạo Chatbot AI Cho Website Của Bạn
        </h1>
        <p className="text-xs text-text-muted dark:text-textDark-secondary">
          Hoàn thành 4 bước bên dưới để sở hữu trợ lý ảo thông minh của riêng bạn
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-sm">
        {[
          { num: 1, label: "Thông tin" },
          { num: 2, label: "Tri thức" },
          { num: 3, label: "Widget" },
          { num: 4, label: "Huấn luyện" },
        ].map((s) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300",
                  step === s.num
                    ? "bg-brand text-white ring-4 ring-brand/20 shadow-md"
                    : step > s.num
                      ? "bg-success text-white"
                      : "bg-surface-input dark:bg-dark-input text-text-muted dark:text-textDark-secondary"
                )}
              >
                {step > s.num ? <Check size={14} className="stroke-3" /> : s.num}
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-colors duration-300",
                step === s.num ? "text-brand" : "text-text-muted dark:text-textDark-secondary"
              )}>
                {s.label}
              </span>
            </div>
            {s.num < 4 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-all duration-300",
                  step > s.num ? "bg-success" : "bg-surface-border dark:bg-dark-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-6 shadow-sm min-h-[40vh] flex flex-col justify-between">
        {isTraining ? (
          // Training Screen
          <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
            <div className="relative">
              <Loader2 className="animate-spin text-brand stroke-[1.5]" size={72} />
              <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand" size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-primary dark:text-textDark-primary">
                Đang huấn luyện chatbot...
              </h3>
              <p className="text-xs text-text-muted dark:text-textDark-secondary max-w-xs">
                Chúng tôi đang phân tích các tài liệu và cấu trúc tri thức bạn cung cấp.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-1.5">
              <div className="h-2 rounded-full bg-surface-input dark:bg-dark-input overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-text-muted dark:text-textDark-secondary">
                <span>Trích xuất tri thức</span>
                <span>{trainingProgress}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <Input
                  label="Tên chatbot *"
                  placeholder="Ví dụ: Trợ lý bán hàng, Huy Bot..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary dark:text-textDark-secondary">
                    Mô tả ngắn gọn
                  </label>
                  <textarea
                    placeholder="Mô tả công việc của chatbot (Ví dụ: Hỗ trợ giải đáp thắc mắc về sản phẩm và dịch vụ khách hàng)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-btn text-sm bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border text-text-primary dark:text-textDark-primary focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary dark:text-textDark-secondary">
                    Chọn màu nhận diện chatbot
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {DEFAULT_AVATARS.map((av, index) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setColorIndex(index);
                        }}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-btn border transition-all text-left cursor-pointer",
                          colorIndex === index
                            ? "border-brand bg-brand/5 dark:bg-brand/10 ring-2 ring-brand/25"
                            : "border-surface-border dark:border-dark-border hover:bg-surface-input dark:hover:bg-dark-input"
                        )}
                      >
                        {av.isImage ? (
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 shadow-sm">
                            <img src={av.id} alt={av.label} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: av.color }}
                          />
                        )}
                        <span className="text-xs font-semibold text-text-primary dark:text-textDark-primary truncate">
                          {av.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Knowledge Base */}
            {step === 2 && (
              <div className="space-y-6">
                {/* File upload zone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary dark:text-textDark-secondary">
                    Tải lên file tài liệu (png, jpg, jpeg, pdf, md, docx, doc)
                  </label>
                  <div className="border-2 border-dashed border-surface-border dark:border-dark-border hover:border-brand/50 dark:hover:border-brand/50 rounded-card p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      multiple={true}
                      accept=".png,.jpg,.jpeg,.pdf,.md,.docx,.doc"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={32} className="text-text-muted dark:text-textDark-secondary mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-text-primary dark:text-textDark-primary">
                      Kéo thả hoặc nhấp để chọn nhiều file
                    </span>
                    <span className="text-[10px] text-text-muted dark:text-textDark-secondary mt-1">
                      Hỗ trợ tối đa 5MB mỗi file, tối đa 5 file
                    </span>
                  </div>
                </div>

                {/* Uploading progress list */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary dark:text-textDark-secondary">
                      Tài liệu đã tải lên ({files.length})
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center justify-between p-2.5 bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border rounded-btn"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <FileText size={15} className="text-brand shrink-0" />
                            <span className="text-xs font-semibold text-text-primary dark:text-textDark-primary truncate">
                              {file.name}
                            </span>
                            <span className="text-[9px] text-text-muted dark:text-textDark-secondary">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>

                          {/* File status / delete */}
                          <div className="flex items-center gap-3">
                            {file.progress < 100 ? (
                              <div className="flex items-center gap-1.5">
                                <Loader2 size={11} className="animate-spin text-brand" />
                                <span className="text-[10px] font-bold text-brand">{file.progress}%</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-success">Đã tải lên</span>
                            )}
                            <button
                              onClick={() => handleDeleteFile(file.name)}
                              className="text-text-muted hover:text-danger p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            )}

            {/* Step 3: Widget Config */}
            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form controls */}
                <div className="space-y-4">
                  <Input
                    label="Lời chào mừng"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                  />
                </div>

                {/* Live Preview Container */}
                <div className="flex flex-col border border-surface-border dark:border-dark-border rounded-card bg-surface-page dark:bg-dark-page p-4 items-center justify-center min-h-75">
                  <p className="text-[10px] font-bold text-text-muted dark:text-textDark-secondary mb-4 uppercase tracking-widest">
                    Xem trước Widget
                  </p>

                  {/* Chat Box Mockup */}
                  <div className="w-full max-w-70 bg-white dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card shadow-lg flex flex-col overflow-hidden">
                    {/* Header */}
                    <div
                      className="p-3 text-white flex items-center gap-2"
                      style={{ backgroundColor: DEFAULT_AVATARS[colorIndex].color }}
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0 bg-white/20">
                        {DEFAULT_AVATARS[colorIndex].isImage ? (
                          <img src={DEFAULT_AVATARS[colorIndex].id} alt={name || "AI"} className="w-full h-full object-cover" />
                        ) : (
                          (name || "AI").substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight truncate">
                          {name || "Trợ lý AI"}
                        </p>
                        <p className="text-[8px] opacity-80 leading-none">Trực tuyến</p>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="p-3 space-y-2 h-36 overflow-y-auto bg-slate-50 dark:bg-neutral-900/50">
                      <div className="flex gap-1.5 items-start">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0 bg-slate-200 dark:bg-zinc-800 text-text-muted">
                          {DEFAULT_AVATARS[colorIndex].isImage ? (
                            <img src={DEFAULT_AVATARS[colorIndex].id} alt="AI" className="w-full h-full object-cover" />
                          ) : (
                            "AI"
                          )}
                        </div>
                        <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-btn p-2 text-[10px] text-text-secondary dark:text-textDark-primary leading-relaxed max-w-[85%]">
                          {greeting}
                        </div>
                      </div>
                    </div>

                    {/* Footer Input */}
                    <div className="p-2 border-t border-surface-border dark:border-dark-border bg-white dark:bg-dark-card flex items-center gap-1.5">
                      <div className="flex-1 bg-surface-input dark:bg-dark-input px-2.5 py-1.5 rounded-pill text-[9px] text-text-muted dark:text-textDark-secondary border border-surface-border/50 dark:border-dark-border/50">
                        {placeholderText}
                      </div>
                      <button
                        className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0"
                        style={{ backgroundColor: DEFAULT_AVATARS[colorIndex].color }}
                        type="button"
                      >
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="p-4 bg-brand-soft dark:bg-brand-softDark border border-brand/20 rounded-card flex gap-3.5 items-start">
                  <Sparkles className="text-brand shrink-0 mt-0.5" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-brand">Sẵn sàng huấn luyện</h3>
                    <p className="text-xs text-text-secondary dark:text-textDark-primary mt-0.5 leading-relaxed">
                      Mô hình AI sẽ học trực tiếp các thông tin được cung cấp từ các file tài liệu bạn cung cấp.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Basic summary */}
                  <div className="p-4 bg-surface-input dark:bg-dark-input rounded-card space-y-3.5">
                    <p className="text-xs font-bold text-text-secondary dark:text-textDark-primary border-b border-surface-border dark:border-dark-border pb-1.5">
                      Thông tin chatbot
                    </p>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={DEFAULT_AVATARS[colorIndex].id}
                        alt={name || "Chatbot"}
                        fallbackText={name || "Chatbot"}
                        size="md"
                        backgroundColor={DEFAULT_AVATARS[colorIndex].color}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-text-primary dark:text-textDark-primary truncate">{name}</p>
                        <p className="text-[10px] text-text-muted dark:text-textDark-secondary mt-0.5 truncate">
                          {description || "Không có mô tả."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Knowledge Base summary */}
                  <div className="p-4 bg-surface-input dark:bg-dark-input rounded-card space-y-3.5">
                    <p className="text-xs font-bold text-text-secondary dark:text-textDark-primary border-b border-surface-border dark:border-dark-border pb-1.5">
                      Tài nguyên tri thức
                    </p>
                    <div className="space-y-1.5 text-xs text-text-secondary dark:text-textDark-primary">
                      <div className="flex justify-between">
                        <span>Số file tài liệu:</span>
                        <span className="font-semibold">{files.filter(f => f.type !== "url").length} files</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Website crawl:</span>
                        <span className="font-semibold">{websiteUrl ? "1 website" : "Không có"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Actions Footer */}
        {!isTraining && (
          <div className="flex justify-between items-center border-t border-surface-border dark:border-dark-border mt-6 pt-5">
            <Button
              variant="secondary"
              onClick={step === 1 ? () => navigate("/dashboard") : handleBack}
              icon={<ArrowLeft size={14} />}
            >
              {step === 1 ? "Hủy bỏ" : "Quay lại"}
            </Button>

            <Button
              variant="primary"
              onClick={step === 4 ? handleStartTraining : handleNext}
              icon={step === 4 ? <Sparkles size={14} /> : <ArrowRight size={14} />}
              className="shadow-sm"
            >
              {step === 4 ? "Bắt đầu huấn luyện chatbot" : "Tiếp tục"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
