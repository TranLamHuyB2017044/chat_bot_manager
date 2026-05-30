"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useEffect, useState } from "react";

export interface KnowledgeFile {
  name: string;
  size: number;
  progress: number;
  type: string;
  _id?: string;
  filename?: string;
  status?: string;
}

export interface WidgetConfig {
  primaryColor: string;
  displayName: string;
  welcomeMessage: string;
  placeholderText: string;
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  status: "active" | "training" | "inactive";
  trainingProgress: number;
  createdAt: string;
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
  workspaceId?: string;
  publicToken?: string;
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
    workspaceName?: string;
    files?: File[];
  }) => Promise<string | null>;
  updateChatbotApi: (id: string, data: Partial<Chatbot>) => Promise<void>;
  deleteChatbotApi: (id: string) => Promise<void>;
}

const DEFAULT_WIZARD: WizardState = {
  name: "",
  description: "",
  avatarUrl: "bot-blue",
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
      size: d.size || 0,
      progress: d.status === "ready" ? 100 : 50,
      type: (d.filename || d.name || "").split(".").pop() || "txt",
      _id: d._id,
      status: d.status
    }));
  }

  return {
    id: bot._id || bot.id,
    name: bot.name,
    description: bot.description || "",
    avatarUrl: bot.avatar_url || bot.avatarUrl || "bot-blue",
    status: bot.is_active === false || bot.status === "inactive" ? "inactive" : bot.status || "active",
    trainingProgress: bot.trainingProgress !== undefined ? bot.trainingProgress : 100,
    createdAt: bot.created_at ? new Date(bot.created_at).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN"),
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
      primaryColor: bot.widgetConfig?.primaryColor || bot.avatar_url || "#2DB87A",
      displayName: bot.widgetConfig?.displayName || bot.name,
      welcomeMessage: bot.widgetConfig?.welcomeMessage || "Xin chào! Tôi có thể giúp gì cho bạn?",
      placeholderText: bot.widgetConfig?.placeholderText || "Nhập tin nhắn..."
    },
    workspaceId: bot.workspace_id || bot.workspaceId || bot._id || bot.id,
    publicToken: bot.public_token || bot.publicToken || bot.id
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
          const res = await fetch("/api/chatbot");
          const resData = await res.json();
          if (res.ok && resData.data) {
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
          if (data.workspaceName) formData.append("workspace_name", data.workspaceName);
          if (data.files) {
            data.files.forEach((file) => formData.append("files", file));
          }

          const res = await fetch("/api/chatbot", {
            method: "POST",
            body: formData,
          });
          const resData = await res.json();
          if (res.ok && resData.data) {
            // Backend might return chatbot in different shapes
            const botData = resData.data.chatbot || resData.data;
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
          if (data.widgetConfig) backendUpdates.widgetConfig = data.widgetConfig;
          if (data.knowledgeBase) backendUpdates.knowledgeBase = data.knowledgeBase;
          if (data.status) backendUpdates.is_active = (data.status === "active");

          const res = await fetch(`/api/chatbot/${id}`, {
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
          const res = await fetch(`/api/chatbot/${id}`, {
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
  const [hydrated, setHydrated] = useState(() => {
    // Check if already hydrated from localStorage on initial render
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('chatbot-store');
        return stored !== null || hasHydrated;
      } catch {
        return hasHydrated;
      }
    }
    return hasHydrated;
  });

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
