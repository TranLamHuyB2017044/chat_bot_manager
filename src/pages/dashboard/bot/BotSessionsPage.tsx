import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChatbotStore, useStoreHydration } from "@/store/chatbotStore";
import { Loader2, MessageSquare, User, Clock, ChevronLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface Session {
  session_id: string;
  latest_timestamp: string;
  latest_question: string;
  customer_info: { email?: string; phone?: string };
  message_count: number;
}

interface ChatMessage {
  _id: string;
  question?: string;
  answer?: string;
  timestamp: string;
  customer_info?: { email?: string; phone?: string };
}

export default function BotSessionsPage() {
  const { id: botId } = useParams<{ id: string }>();
  const { chatbots } = useChatbotStore();
  const isHydrated = useStoreHydration();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const bot = chatbots.find((b) => b.id === botId);

  // Fetch sessions
  useEffect(() => {
    if (botId && isHydrated) {
      setLoadingSessions(true);
      apiFetch(`/api/chatbot/${botId}/sessions`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data) {
            setSessions(data.data);
          }
          setLoadingSessions(false);
        })
        .catch((err) => {
          console.error("Error fetching sessions:", err);
          setLoadingSessions(false);
        });
    }
  }, [botId, isHydrated]);

  // Fetch chat history for selected session
  const fetchChatHistory = async (sessionId: string) => {
    setLoadingChat(true);
    setSelectedSession(sessionId);
    try {
      const res = await apiFetch(`/api/chatbot/${botId}/sessions/${sessionId}`);
      const data = await res.json();
      if (data && data.data) {
        setChatHistory(data.data);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    } finally {
      setLoadingChat(false);
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

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn h-[80vh]">
      <h1 className="text-xl font-bold text-text-primary dark:text-textDark-primary mb-6">
        Quản lý phiên trò chuyện
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Sessions List */}
        <div className="bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-brand" />
            Danh sách phiên ({sessions.length})
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-brand" size={20} />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-text-muted dark:text-textDark-muted text-center py-8">
                Chưa có phiên trò chuyện nào
              </p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => fetchChatHistory(session.session_id)}
                  className={`w-full text-left p-3 rounded-btn transition-all ${
                    selectedSession === session.session_id
                      ? "bg-brand/10 border border-brand/30"
                      : "bg-surface-input dark:bg-dark-input border border-surface-border dark:border-dark-border hover:border-brand/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-primary dark:text-textDark-primary">
                      Phiên #{session.session_id.slice(-6)}
                    </span>
                    <span className="text-[10px] text-text-muted dark:text-textDark-muted">
                      {session.message_count} tin
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary dark:text-textDark-secondary truncate mb-2">
                    {session.latest_question}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted dark:text-textDark-muted">
                    <Clock size={10} />
                    {new Date(session.latest_timestamp).toLocaleString("vi-VN")}
                  </div>
                  {session.customer_info.email || session.customer_info.phone ? (
                    <div className="mt-2 pt-2 border-t border-surface-border dark:border-dark-border">
                      {session.customer_info.email && (
                        <p className="text-[10px] text-success">
                          Email: {session.customer_info.email}
                        </p>
                      )}
                      {session.customer_info.phone && (
                        <p className="text-[10px] text-success">
                          SĐT: {session.customer_info.phone}
                        </p>
                      )}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="lg:col-span-2 bg-surface-card dark:bg-dark-card border border-surface-border dark:border-dark-border rounded-card p-4 shadow-sm overflow-hidden flex flex-col">
          {selectedSession ? (
            <>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-surface-border dark:border-dark-border">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedSession(null);
                    setChatHistory([]);
                  }}
                  className="p-1"
                >
                  <ChevronLeft size={16} />
                </Button>
                <h2 className="text-sm font-bold text-text-primary dark:text-textDark-primary">
                  Lịch sử trò chuyện - Phiên #{selectedSession.slice(-6)}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {loadingChat ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-brand" size={20} />
                  </div>
                ) : chatHistory.length === 0 ? (
                  <p className="text-xs text-text-muted dark:text-textDark-muted text-center py-8">
                    Chưa có tin nhắn trong phiên này
                  </p>
                ) : (
                  chatHistory.map((msg) => (
                    <div key={msg._id} className="space-y-3">
                      {msg.question && (
                        <div className="flex gap-3 items-start justify-end">
                          <div className="flex flex-col gap-1 items-end max-w-[80%]">
                            <div className="bg-brand text-white rounded-2xl rounded-tr-none p-3 shadow-sm">
                              <p className="text-sm">{msg.question}</p>
                            </div>
                            <span className="text-[10px] text-text-muted dark:text-textDark-muted">
                              {new Date(msg.timestamp).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-surface-input dark:bg-dark-input flex items-center justify-center shrink-0">
                            <User size={14} className="text-text-muted dark:text-textDark-muted" />
                          </div>
                        </div>
                      )}

                      {msg.answer && (
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                            <MessageSquare size={14} className="text-brand" />
                          </div>
                          <div className="flex flex-col gap-1 max-w-[80%]">
                            <div className="bg-white dark:bg-zinc-800 border border-surface-border dark:border-dark-border rounded-2xl rounded-tl-none p-3 shadow-sm">
                              <p className="text-sm text-text-secondary dark:text-textDark-primary">
                                {msg.answer}
                              </p>
                            </div>
                            <span className="text-[10px] text-text-muted dark:text-textDark-muted">
                              {new Date(msg.timestamp).toLocaleString("vi-VN")}
                            </span>
                            {msg.customer_info?.email || msg.customer_info?.phone ? (
                              <div className="mt-1 p-2 bg-success/10 rounded-btn border border-success/20">
                                <p className="text-[10px] font-semibold text-success">
                                  Thông tin khách hàng:
                                </p>
                                {msg.customer_info.email && (
                                  <p className="text-[10px] text-success">
                                    Email: {msg.customer_info.email}
                                  </p>
                                )}
                                {msg.customer_info.phone && (
                                  <p className="text-[10px] text-success">
                                    SĐT: {msg.customer_info.phone}
                                  </p>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={48} className="text-text-muted dark:text-textDark-muted mb-4 opacity-50" />
              <p className="text-sm text-text-secondary dark:text-textDark-secondary">
                Chọn một phiên để xem lịch sử trò chuyện
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
