import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "@/components/ui/Sonner";
import { useChatbotStore, KnowledgeFile, useStoreHydration } from "@/store/chatbotStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  FileText,
  Upload,
  Trash2,
  Loader2,
  Sparkles,
  Database,
  BookOpen,
  RefreshCw,
  FileUp,
  AlertCircle
} from "lucide-react";
import { apiFetch, getBackendUrl, getApiKey } from "@/lib/api";
import { EventSourcePolyfill } from "event-source-polyfill";

export default function BotKnowledgePage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots, updateChatbot } = useChatbotStore();
  // Get the store's get method for fresh state access
  const storeGet = useChatbotStore.getState;

  const isHydrated = useStoreHydration();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const sseConnection = useRef<EventSource | null>(null);

  const bot = chatbots.find((b) => b.id === botId);

  // Fetch actual RAG documents on mount/hydration
  useEffect(() => {
    if (bot && isHydrated) {
      fetchDocuments();
    }
  }, [botId, isHydrated]);

  // Connect to global SSE endpoint
  useEffect(() => {
    if (isHydrated) {
      connectSSE();
    }

    return () => {
      if (sseConnection.current) {
        sseConnection.current.close();
        sseConnection.current = null;
      }
    };
  }, [isHydrated]);

  const connectSSE = () => {
    if (sseConnection.current) {
      sseConnection.current.close();
    }

    const baseUrl = getBackendUrl();
    const apiKey = getApiKey();
    const deviceId = localStorage.getItem("device_id");

    if (!apiKey) {
      console.warn("No API key available, skipping SSE connection");
      return;
    }

    const eventSourceUrl = `${baseUrl}/api/events`;

    // Prepare headers
    const headers: Record<string, string> = {
      "x-api-key": apiKey,
    };

    if (deviceId) {
      headers["x-device-id"] = deviceId;
    }

    // Use EventSourcePolyfill with custom headers
    const eventSource = new EventSourcePolyfill(eventSourceUrl, {
      headers
    });
    sseConnection.current = eventSource;

    eventSource.addEventListener("connection", (event: any) => {
      console.log("SSE Connected:", JSON.parse(event.data));
    });

    eventSource.addEventListener("document_status", (event: any) => {
      try {
        const docData = JSON.parse(event.data);

        const documentId = docData.document_id || docData._id;

        if (!documentId) return;

        // Get FRESH current state from store
        const { chatbots: freshChatbots } = storeGet();

        // Get current bot from store
        const currentBot = freshChatbots.find(b => b.id === botId);
        if (!currentBot) {
          console.log("No current bot found with ID:", botId);
          return;
        }


        // Check if this document belongs to current bot's knowledge base
        const existingFileIndex = currentBot.knowledgeBase.files.findIndex(f =>
          f._id === documentId
        );

        if (existingFileIndex === -1) {
          console.log("Document not found in current files, refreshing all documents");
          fetchDocuments();
          return;
        }


        // Update document status
        const newStatus = (docData.status?.toUpperCase() || currentBot.knowledgeBase.files[existingFileIndex].status) as "UPLOADED" | "PROCESSING" | "READY" | "FAILED";


        const updatedFiles: KnowledgeFile[] = currentBot.knowledgeBase.files.map((file: KnowledgeFile, index: number) => {
          if (index === existingFileIndex) {
            return {
              ...file,
              name: docData.file_name || docData.filename || file.name,
              filename: docData.filename || docData.file_name || file.filename,
              status: newStatus,
              total_chunks: docData.total_chunks,
              error_message: docData.error,
              size: docData.size || file.size,
              progress: newStatus === "READY" ? 100 : newStatus === "FAILED" ? 0 : 50
            };
          }
          return file;
        });


        updateChatbot(botId!, {
          knowledgeBase: {
            ...currentBot.knowledgeBase,
            files: updatedFiles
          }
        });

        // Show notification if status is final
        if (newStatus === "READY" || newStatus === "FAILED") {
          const file = updatedFiles.find(f => f._id === documentId);

          if (file) {
            if (newStatus === "READY") {
              toast.success(`Tài liệu ${file.name} đã sẵn sàng!`);
            } else if (newStatus === "FAILED" && docData.error) {
              toast.error(`Xử lý tài liệu thất bại: ${docData.error}`);
            }
          }
        }
      } catch (err) {
        console.error("Error parsing document_status event:", err);
      }
    });

    eventSource.onerror = (err: any) => {
      console.error("SSE connection error:", err);
      eventSource.close();
      sseConnection.current = null;
    };
  };

  const fetchDocuments = async () => {
    if (!bot) return;
    const workspaceId = bot.workspaceId || bot.id;
    try {
      const res = await apiFetch(`/api/rag/workspaces/${workspaceId}/documents`);
      const data = await res.json();
      if (data && data.data) {
        const mappedDocs: KnowledgeFile[] = data.data.map((d: any) => ({
          name: d.filename || d.name,
          filename: d.filename,
          size: d.size || 0,
          progress: d.status === "READY" || d.status === "ready" ? 100 : d.status === "FAILED" ? 0 : 50,
          type: (d.filename || d.name || "").split(".").pop() || "txt",
          _id: d._id || d.document_id,
          status: (d.status?.toUpperCase() || "UPLOADED") as "UPLOADED" | "PROCESSING" | "READY" | "FAILED",
          total_chunks: d.total_chunks,
          error_message: d.error_message,
          updated_at: d.updated_at
        }));
        updateChatbot(botId!, {
          knowledgeBase: {
            ...bot.knowledgeBase,
            files: mappedDocs,
          }
        });
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const getStatusBadgeProps = (status?: string) => {
    switch (status) {
      case "UPLOADED":
        return { variant: "info" as const, text: "Đã tải lên", icon: <Upload size={10} /> };
      case "PROCESSING":
        return { variant: "warning" as const, text: "Đang xử lý", icon: <Loader2 size={10} className="animate-spin" /> };
      case "READY":
        return { variant: "success" as const, text: "Sẵn sàng", icon: <Sparkles size={10} /> };
      case "FAILED":
        return { variant: "danger" as const, text: "Thất bại", icon: <AlertCircle size={10} /> };
      default:
        return { variant: "default" as const, text: "Đang xử lý", icon: <Loader2 size={10} className="animate-spin" /> };
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !bot) return;
    const uploaded = Array.from(e.target.files);

    setIsUpdating("upload");
    try {
      const workspaceId = bot.workspaceId || bot.id;
      const formData = new FormData();
      uploaded.forEach((file) => {
        formData.append("files", file);
      });

      const res = await apiFetch(`/api/rag/workspaces/${workspaceId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Đã tải file lên! Đang xử lý...");
        await fetchDocuments();
      } else {
        toast.error("Không thể tải file lên. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Error uploading RAG documents:", err);
      toast.error("Có lỗi xảy ra khi tải file lên!");
    } finally {
      setIsUpdating(null);
      // Reset input
      e.target.value = "";
    }
  };

  const handleReplaceFile = async (documentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !bot) return;
    const file = e.target.files[0];

    setIsUpdating(documentId);
    try {
      const workspaceId = bot.workspaceId || bot.id;
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch(`/api/rag/workspaces/${workspaceId}/documents/${documentId}/replace`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        toast.success("Đã thay thế file! Đang xử lý lại...");
        await fetchDocuments(); // Refresh
      } else {
        toast.error("Không thể thay thế file. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Error replacing file:", err);
      toast.error("Có lỗi xảy ra khi thay thế file!");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleReindexDocument = async (documentId: string) => {
    if (!bot) return;
    setIsUpdating(documentId);
    try {
      const res = await apiFetch(`/api/rag/documents/${documentId}/reindex`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Đang reindex tài liệu...");
        await fetchDocuments(); // Refresh
      } else {
        toast.error("Không thể reindex tài liệu. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Error reindexing document:", err);
      toast.error("Có lỗi xảy ra khi reindex!");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!bot) return;
    setIsUpdating(documentId);
    try {
      const workspaceId = bot.workspaceId || bot.id;
      const res = await apiFetch(`/api/rag/workspaces/${workspaceId}/documents/${documentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove from store
        const filteredFiles: KnowledgeFile[] = bot.knowledgeBase.files.filter((f: KnowledgeFile) => f._id !== documentId);
        updateChatbot(botId!, {
          knowledgeBase: {
            ...bot.knowledgeBase,
            files: filteredFiles
          }
        });
        toast.success("Đã xóa tài liệu!");
      } else {
        toast.error("Không thể xóa tài liệu. Vui lòng thử lại!");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      toast.error("Có lỗi xảy ra khi xóa tài liệu!");
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Left Columns: Resource directory */}
      <div className="lg:col-span-2 space-y-5 flex flex-col h-[calc(100vh-var(--topbar-height)-3.5rem)]">
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-between items-center border-b border-surface-border dark:border-dark-border pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-brand" />
              <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                Cơ sở tri thức hiện tại
              </h2>
            </div>
            <Tooltip content="Làm mới danh sách tài liệu">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDocuments}
                className="text-xs h-7"
              >
                <RefreshCw size={12} className="mr-1" />
                Làm mới
              </Button>
            </Tooltip>
          </div>

          {/* List scroll container */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {bot.knowledgeBase.files.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 text-text-muted dark:text-textDark-secondary">
                <BookOpen size={36} className="stroke-[1.2] mb-3 text-brand/30" />
                <p className="text-xs font-semibold">Chưa có tri thức nào được cung cấp</p>
                <p className="text-[10px] mt-1">Sử dụng thanh công cụ bên phải để thêm tài liệu.</p>
              </div>
            ) : (
              bot.knowledgeBase.files.map((file) => {
                const statusProps = getStatusBadgeProps(file.status);
                return (
                  <div
                    key={file._id || file.name}
                    className="group flex flex-col p-4 bg-surface-page dark:bg-dark-page border border-surface-border dark:border-dark-border rounded-card hover:border-brand/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-surface-input dark:bg-dark-input flex items-center justify-center text-text-secondary dark:text-textDark-primary shrink-0 border border-surface-border/50 dark:border-dark-border/50">
                          <FileText size={16} className="text-brand" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-text-primary dark:text-textDark-primary truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={statusProps.variant}>
                              {statusProps.icon}
                              <span className="ml-1">{statusProps.text}</span>
                            </Badge>
                            <span className="text-[10px] text-text-muted dark:text-textDark-secondary font-mono">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                            {file.status === "READY" && file.total_chunks !== undefined && (
                              <span className="text-[10px] text-text-muted dark:text-textDark-secondary">
                                • {file.total_chunks} chunks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {file._id && (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Replace file */}
                          <Tooltip content="Thay thế file">
                            <label className="p-2 rounded-btn text-text-muted hover:text-brand hover:bg-brand/10 cursor-pointer transition-colors">
                              {isUpdating === file._id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <FileUp size={14} />
                              )}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleReplaceFile(file._id!, e)}
                                disabled={isUpdating === file._id}
                              />
                            </label>
                          </Tooltip>

                          {/* Reindex */}
                          <Tooltip content="Reindex tài liệu">
                            <button
                              onClick={() => handleReindexDocument(file._id!)}
                              disabled={isUpdating === file._id}
                              className="p-2 rounded-btn text-text-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw size={14} className={isUpdating === file._id ? "animate-spin" : ""} />
                            </button>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip content="Xóa tài liệu">
                            <button
                              onClick={() => handleDeleteDocument(file._id!)}
                              disabled={isUpdating === file._id}
                              className="p-2 rounded-btn text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </div>

                    {/* Progress bar for processing */}
                    {(file.status === "UPLOADED" || file.status === "PROCESSING") && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-surface-input dark:bg-dark-input rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand transition-all duration-500 animate-pulse"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error message */}
                    {file.status === "FAILED" && file.error_message && (
                      <div className="mt-3 p-2 bg-danger/10 border border-danger/20 rounded-btn">
                        <p className="text-[10px] text-danger flex items-center gap-1">
                          <AlertCircle size={10} />
                          {file.error_message}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Add resources */}
      <div className="space-y-5">
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-text-primary dark:text-textDark-primary uppercase tracking-widest border-b border-surface-border dark:border-dark-border pb-2.5">
            Thêm tri thức mới
          </h3>

          <div className="space-y-4 animate-fadeIn">
            <div className="border-2 border-dashed border-surface-border dark:border-dark-border hover:border-brand/40 rounded-card p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
              <input
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf,.md,.docx,.doc"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUpdating === "upload"}
              />
              {isUpdating === "upload" ? (
                <Loader2 size={24} className="text-brand mb-2 animate-spin" />
              ) : (
                <Upload size={24} className="text-text-muted dark:text-textDark-secondary mb-2" />
              )}
              <span className="text-xs font-bold text-text-primary dark:text-textDark-primary">
                {isUpdating === "upload" ? "Đang xử lý..." : "Chọn file để tải lên"}
              </span>
              <span className="text-[10px] text-text-muted dark:text-textDark-secondary mt-1">
                PNG, JPG, JPEG, PDF, MD, DOCX, DOC
              </span>
            </div>
            <div className="flex gap-2 p-3 bg-brand-soft dark:bg-brand-softDark border border-brand/10 rounded-btn text-[10px] text-brand leading-relaxed">
              <Sparkles size={14} className="shrink-0 mt-0.5" />
              <p>Mô hình AI sẽ tự động học lại ngay khi file tải lên hoàn tất thành công.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
