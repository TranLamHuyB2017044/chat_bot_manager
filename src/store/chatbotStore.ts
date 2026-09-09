import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export const DEFAULT_AVATARS = [
  { color: "#4f46e5", label: "Mặc định", id: "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg", isImage: false }, // DEFAULT = 0
  { color: "#3b82f6", label: "Xanh dương", id: "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg", isImage: false }, // BLUE = 1
  { color: "#10b981", label: "Xanh lá", id: "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg", isImage: false }, // GREEN = 2
  { color: "#8b5cf6", label: "Tím", id: "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg", isImage: false }, // PURPLE = 3
  { color: "#ec4899", label: "Hồng", id: "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg", isImage: false }, // PINK = 4
];

export interface KnowledgeFile {
  name: string;
  size: number;
  progress: number;
  type: string;
  _id?: string;
  filename?: string;
  status?: "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  total_chunks?: number;
  error_message?: string;
  updated_at?: string;
}

export interface WidgetConfig {
  primaryColor: string;
  displayName: string;
  welcomeMessage: string;
  placeholderText?: string;
}

export enum ChatbotDomain {
  ECOMMERCE = "ecommerce",
  OCOP = "ocop",
  CUSTOMER_SUPPORT = "customer_support",
  ADMINISTRATIVE_DOC = "administrative_doc",
  GENERAL = "general",
}

export const CHATBOT_DOMAINS = [
  { value: ChatbotDomain.ECOMMERCE, label: "Thương mại điện tử & Bán hàng (Ecommerce)" },
  { value: ChatbotDomain.OCOP, label: "Sản phẩm OCOP & Nông đặc sản (OCOP)" },
  { value: ChatbotDomain.CUSTOMER_SUPPORT, label: "Chăm sóc & Hỗ trợ khách hàng (Customer Support)" },
  { value: ChatbotDomain.ADMINISTRATIVE_DOC, label: "Văn bản hành chính & eGov (Administrative Doc)" },
  { value: ChatbotDomain.GENERAL, label: "Tổng hợp / Đa năng (General)" },
];

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  color: number;
  domain: string;
  greeting: string;
  status: "active" | "training" | "inactive";
  trainingProgress: number;
  createdAt: string;
  updatedAt: string;
  chatsCount: number;
  messagesCount: number;
  fallbackRate: number;
  creditsUsed: number;
  knowledgeBase: {
    files: KnowledgeFile[];
    text: string;
    websiteUrl: string;
  };
  widgetConfig: WidgetConfig;
  telegramBotToken: string;
  telegramChatId: string;
  telegramConfig?: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  workflowWebhookUrl: string;
  collectContactInfo: boolean;
  workspaceId?: string;
  publicToken: string;
  embedCode: string;
  accountId: string;
}

interface WizardState {
  name: string;
  description: string;
  avatarUrl: string;
  files: KnowledgeFile[];
  text: string;
  websiteUrl: string;
  primaryColor: string;
}

interface ChatbotState {
  chatbots: Chatbot[];
  activeChatbotId: string | null;
  wizard: WizardState;
  isLoading: boolean;
  error: string | null;

  // Chatbot operations
  addChatbot: (bot: Omit<Chatbot, "id" | "createdAt" | "chatsCount" | "messagesCount" | "fallbackRate" | "creditsUsed">) => string;
  updateChatbot: (id: string, updates: Partial<Chatbot>) => void;
  deleteChatbot: (id: string) => void;
  setActiveChatbotId: (id: string | null) => void;

  // Wizard operations
  updateWizard: (updates: Partial<WizardState>) => void;
  resetWizard: () => void;

  // Actions
  startMockTraining: (id: string, onComplete?: () => void) => void;

  // Real Backend API async actions
  fetchChatbots: () => Promise<void>;
  createChatbotApi: (data: {
    name: string;
    description?: string;
    avatarUrl?: string;
    color?: number;
    domain?: string;
    greeting?: string;
    workspaceName?: string;
    files?: File[];
    workflowWebhookUrl?: string;
    collectContactInfo?: boolean;
  }) => Promise<string | null>;
  updateChatbotApi: (id: string, data: Partial<Chatbot>) => Promise<void>;
  deleteChatbotApi: (id: string) => Promise<void>;
}

const DEFAULT_WIZARD: WizardState = {
  name: "",
  description: "",
  avatarUrl: "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg",
  files: [],
  text: "",
  websiteUrl: "",
  primaryColor: "#2DB87A",
};

export function mapBackendBotToFrontend(bot: any): Chatbot {
  // Map files if present
  let mappedFiles: KnowledgeFile[] = [];
  if (bot.knowledgeBase?.files) {
    mappedFiles = bot.knowledgeBase.files;
  } else if (bot.documents) {
    mappedFiles = bot.documents.map((d: any) => ({
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
  }

  // Dùng avatar mặc định từ backend, trừ khi có avatarUrl riêng từ backend
  let avatarUrl = "https://api-ocr.bittechx.cloud/chatbot_logo.jpeg";
  const candidateUrl = bot.avatar_url || bot.avatarUrl;
  if (candidateUrl) {
    if (candidateUrl.startsWith("/") || candidateUrl.startsWith("http://") || candidateUrl.startsWith("https://")) {
      avatarUrl = candidateUrl;
    }
  }

  // Get primary color from bot color index
  let primaryColor = DEFAULT_AVATARS[0].color;
  if (bot.color !== undefined && bot.color >= 0 && bot.color < DEFAULT_AVATARS.length) {
    primaryColor = DEFAULT_AVATARS[bot.color].color;
  }

  return {
    id: bot._id || bot.id,
    name: bot.name,
    description: bot.description || "",
    avatarUrl: avatarUrl,
    color: bot.color || 0,
    greeting: bot.greeting || "Xin chào! Tôi có thể giúp gì cho bạn?",
    status: bot.is_active === false || bot.status === "inactive" ? "inactive" : bot.status || "active",
    trainingProgress: bot.trainingProgress !== undefined ? bot.trainingProgress : 100,
    createdAt: bot.created_at ? new Date(bot.created_at).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN"),
    updatedAt: bot.updated_at ? new Date(bot.updated_at).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN"),
    chatsCount: bot.chatsCount || bot.used_requests || 0,
    messagesCount: bot.messagesCount || 0,
    fallbackRate: bot.fallbackRate || 0,
    creditsUsed: bot.creditsUsed || 0,
    knowledgeBase: {
      files: mappedFiles,
      text: bot.knowledgeBase?.text || "",
      websiteUrl: bot.knowledgeBase?.websiteUrl || bot.websiteUrl || ""
    },
    widgetConfig: {
      primaryColor: primaryColor,
      displayName: bot.name,
      welcomeMessage: bot.greeting || "Xin chào! Tôi có thể giúp gì cho bạn?",
      placeholderText: "Nhập tin nhắn..."
    },
    telegramBotToken: bot.telegram_bot_token || "",
    telegramChatId: bot.telegram_chat_id || "",
    telegramConfig: {
      enabled: bot.telegram_enabled || !!bot.telegram_bot_token,
      botToken: bot.telegram_bot_token || "",
      chatId: bot.telegram_chat_id || ""
    },
    domain: bot.domain || "ecommerce",
    workflowWebhookUrl: bot.workflow_webhook_url || bot.workflowWebhookUrl || "",
    collectContactInfo: bot.collect_contact_info !== undefined
      ? Boolean(bot.collect_contact_info)
      : (bot.collectContactInfo !== undefined ? Boolean(bot.collectContactInfo) : true),
    workspaceId: bot.workspace_id || bot.workspaceId,
    publicToken: bot.public_token || bot.publicToken,
    embedCode: bot.embed_code || "",
    accountId: bot.account_id || bot.accountId
  };
}

// Hydration state tracker (singleton)
let hasHydrated = false;

export const useChatbotStore = create<ChatbotState>()(
  persist(
    immer((set, get) => ({
      chatbots: [],
      activeChatbotId: null,
      wizard: DEFAULT_WIZARD,
      isLoading: false,
      error: null,

      addChatbot: (botData) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newBot: Chatbot = {
          ...botData,
          id,
          createdAt: new Date().toLocaleDateString("vi-VN"),
          chatsCount: 0,
          messagesCount: 0,
          fallbackRate: 0,
          creditsUsed: 0,
        };
        set((s) => {
          s.chatbots.push(newBot);
        });
        return id;
      },

      updateChatbot: (id, updates) =>
        set((s) => {
          const idx = s.chatbots.findIndex((b) => b.id === id);
          if (idx !== -1) {
            s.chatbots[idx] = { ...s.chatbots[idx], ...updates } as any;
          } else if ((updates as any).id) {
            // If the updates has an id (full chatbot object), add it to the store
            s.chatbots.push(updates as any);
          }
        }),

      deleteChatbot: (id) =>
        set((s) => {
          s.chatbots = s.chatbots.filter((b) => b.id !== id);
          if (s.activeChatbotId === id) {
            s.activeChatbotId = null;
          }
        }),

      setActiveChatbotId: (id) =>
        set((s) => {
          s.activeChatbotId = id;
        }),

      updateWizard: (updates) =>
        set((s) => {
          s.wizard = { ...s.wizard, ...updates };
        }),

      resetWizard: () =>
        set((s) => {
          s.wizard = DEFAULT_WIZARD;
        }),

      startMockTraining: (id, onComplete) => {
        let currentProgress = 0;

        const interval = setInterval(() => {
          set((s) => {
            const idx = s.chatbots.findIndex((b) => b.id === id);
            if (idx !== -1) {
              currentProgress += 10;
              s.chatbots[idx].trainingProgress = Math.min(currentProgress, 100);
              if (currentProgress >= 100) {
                s.chatbots[idx].status = "active";
                clearInterval(interval);
                if (onComplete) onComplete();
              }
            } else {
              clearInterval(interval);
            }
          });
        }, 300);
      },

      // Real Backend API async actions
      fetchChatbots: async () => {
        set((s) => { s.isLoading = true; s.error = null; });
        try {
          const res = await apiFetch("/api/chatbot/my-chatbots");
          const resData = await res.json();

          // If 401, clear the chatbots list (since we cleared auth already
          if (res.status === 401) {
            set((s) => {
              s.chatbots = [];
              s.isLoading = false;
              s.error = "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại";
            });
            return;
          }

          if (res.ok && resData.data) {
            // Response mới: data là array chatbot trực tiếp
            const list = Array.isArray(resData.data) ? resData.data : [];
            const mappedList = list.map(mapBackendBotToFrontend);
            set((s) => {
              s.chatbots = mappedList;
              s.isLoading = false;
            });
          } else {
            set((s) => {
              s.error = resData.message || "Không thể tải danh sách chatbot từ server";
              s.isLoading = false;
            });
          }
        } catch (err: any) {
          set((s) => {
            s.error = err.message || "Không thể kết nối tới máy chủ";
            s.isLoading = false;
          });
        }
      },

      createChatbotApi: async (data) => {
        set((s) => { s.isLoading = true; s.error = null; });
        try {
          const formData = new FormData();
          formData.append("name", data.name);
          if (data.description) formData.append("description", data.description);
          if (data.avatarUrl) formData.append("avatar_url", data.avatarUrl);
          if (data.color !== undefined) formData.append("color", data.color.toString());
          if (data.domain) formData.append("domain", data.domain);
          if (data.greeting) formData.append("greeting", data.greeting);
          if (data.workspaceName) formData.append("workspace_name", data.workspaceName);
          if (data.workflowWebhookUrl) formData.append("workflow_webhook_url", data.workflowWebhookUrl);
          if (data.collectContactInfo !== undefined) formData.append("collect_contact_info", data.collectContactInfo.toString());
          if (data.files) {
            data.files.forEach((file) => formData.append("files", file));
          }

          const res = await apiFetch("/api/chatbot", {
            method: "POST",
            body: formData,
          });
          const resData = await res.json();
          if (res.ok && resData.data) {
            // Backend returns chatbot in resData.data or resData.data.chatbot
            const botData = resData.data.chatbot || resData.data;
            if (resData.data.embed_code && !botData.embed_code) {
              botData.embed_code = resData.data.embed_code;
            }
            const mappedBot = mapBackendBotToFrontend(botData);
            set((s) => {
              s.chatbots.push(mappedBot);
              s.isLoading = false;
            });
            return mappedBot.id;
          } else {
            set((s) => {
              s.error = resData.message || "Tạo chatbot thất bại";
              s.isLoading = false;
            });
            return null;
          }
        } catch (err: any) {
          set((s) => {
            s.error = err.message || "Không thể kết nối tới máy chủ";
            s.isLoading = false;
          });
          return null;
        }
      },

      updateChatbotApi: async (id, data) => {
        set((s) => { s.isLoading = true; s.error = null; });
        try {
          const backendUpdates: any = {};
          if (data.name) backendUpdates.name = data.name;
          if (data.description !== undefined) backendUpdates.description = data.description;
          if (data.avatarUrl) backendUpdates.avatar_url = data.avatarUrl;
          if (data.color !== undefined) backendUpdates.color = data.color;
          if (data.greeting) backendUpdates.greeting = data.greeting;
          if (data.widgetConfig) backendUpdates.widgetConfig = data.widgetConfig;
          if (data.knowledgeBase) backendUpdates.knowledgeBase = data.knowledgeBase;
          if (data.status) backendUpdates.is_active = (data.status === "active");
          if (data.telegramBotToken !== undefined) backendUpdates.telegram_bot_token = data.telegramBotToken;
          if (data.telegramChatId !== undefined) backendUpdates.telegram_chat_id = data.telegramChatId;
          if (data.telegramConfig) {
            backendUpdates.telegram_bot_token = data.telegramConfig.botToken;
            backendUpdates.telegram_chat_id = data.telegramConfig.chatId;
            backendUpdates.telegram_enabled = data.telegramConfig.enabled;
          }
          if (data.domain !== undefined) backendUpdates.domain = data.domain;
          if (data.workflowWebhookUrl !== undefined) backendUpdates.workflow_webhook_url = data.workflowWebhookUrl;
          if (data.collectContactInfo !== undefined) backendUpdates.collect_contact_info = data.collectContactInfo;

          const res = await apiFetch(`/api/chatbot/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(backendUpdates),
          });
          const resData = await res.json();
          if (res.ok && resData.data) {
            const mappedBot = mapBackendBotToFrontend(resData.data);
            set((s) => {
              const idx = s.chatbots.findIndex((b) => b.id === id);
              if (idx !== -1) {
                s.chatbots[idx] = mappedBot;
              }
              s.isLoading = false;
            });
          } else {
            set((s) => {
              s.error = resData.message || "Cập nhật chatbot thất bại";
              s.isLoading = false;
            });
          }
        } catch (err: any) {
          set((s) => {
            s.error = err.message || "Không thể kết nối tới máy chủ";
            s.isLoading = false;
          });
        }
      },

      deleteChatbotApi: async (id) => {
        set((s) => { s.isLoading = true; s.error = null; });
        try {
          const res = await apiFetch(`/api/chatbot/${id}`, {
            method: "DELETE",
          });
          const resData = await res.json();
          if (res.ok) {
            set((s) => {
              s.chatbots = s.chatbots.filter((b) => b.id !== id);
              if (s.activeChatbotId === id) {
                s.activeChatbotId = null;
              }
              s.isLoading = false;
            });
          } else {
            set((s) => {
              s.error = resData.message || "Xóa chatbot thất bại";
              s.isLoading = false;
            });
          }
        } catch (err: any) {
          set((s) => {
            s.error = err.message || "Không thể kết nối tới máy chủ";
            s.isLoading = false;
          });
        }
      },
    })),
    {
      name: "chatbot-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return () => {
          hasHydrated = true;
        };
      },
    }
  )
);

// Hook to check hydration once
export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hasHydrated) {
      setHydrated(true);
      return;
    }

    const unsub = useChatbotStore.persist.onFinishHydration(() => {
      hasHydrated = true;
      setHydrated(true);
    });

    return unsub;
  }, []);

  return hydrated;
}
