"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface KnowledgeFile {
  name: string;
  size: number;
  progress: number;
  type: string;
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
}

const DEFAULT_WIZARD: WizardState = {
  name: "",
  description: "",
  avatarUrl: "bot-default-1",
  files: [],
  text: "",
  websiteUrl: "",
  primaryColor: "#2DB87A",
};

export const useChatbotStore = create<ChatbotState>()(
  persist(
    immer((set, get) => ({
      chatbots: [],
      activeChatbotId: null,
      wizard: DEFAULT_WIZARD,

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
    })),
    {
      name: "chatbot-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
