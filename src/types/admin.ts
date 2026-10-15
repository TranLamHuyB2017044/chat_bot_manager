export interface UserStats {
  total_extractions: number;
  last_extraction_at: string;
  doc_type_stats: {
    idCard: number;
    driverLicense: number;
    invoice: number;
    document: number;
    vehicleDocuments: number;
    vehicle: number;
  };
}

export interface User {
  id?: string;
  _id?: string;
  user_id?: number;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: number;
  active: boolean;
  account_id: string;
  created_at: string;
  updated_at: string;
  chatbot_count?: number;
  total_messages?: number;
  latest_message_at?: string;
  stats?: UserStats;
  chatbots?: Chatbot[];
  message_stats?: {
    total: number;
    this_month: number;
    this_week: number;
  };
}

export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  color?: number;
  domain?: string;
  greeting?: string;
  workspace_id?: string;
  account_id: string;
  public_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  workflow_webhook_url?: string;
  collect_contact_info?: boolean;
  show_sources?: boolean;
  message_count?: number;
  latest_message_at?: string;
  user?: {
    id: string;
    fullname: string;
    email: string;
  };
  stats?: {
    total_messages: number;
    today: number;
    this_week: number;
    this_month: number;
  };
  latest_messages?: Message[];
}

export interface Message {
  id: string;
  workspace_id: string;
  user_id?: string;
  session_id: string;
  question: string;
  answer: string;
  timestamp: string;
  customer_info?: Record<string, any>;
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_chatbots: number;
  active_chatbots: number;
  total_messages: number;
  messages_today: number;
  messages_this_week: number;
  messages_this_month: number;
  latest_active_chatbots: Array<{
    id: string;
    name: string;
    user_name: string;
    last_active_at: string;
    message_count: number;
  }>;
  top_users_by_messages: Array<{
    id: string;
    fullname: string;
    email: string;
    message_count: number;
  }>;
}

export interface MessageStatsData {
  date: string;
  count: number;
}

export interface MessageStatsResponse {
  period: string;
  data: MessageStatsData[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  error?: string;
}
