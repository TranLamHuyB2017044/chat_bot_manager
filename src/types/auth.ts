export type Role = 0 | 4; // 0: Admin, 4: User

export interface Quota {
  plan: number;
  used_requests: number;
  max_requests_per_month: number;
  is_unlimited: boolean;
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
  public_token: string;
  account_id?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  workflow_webhook_url?: string;
  collect_contact_info?: boolean;
  show_sources?: boolean;
}

export interface AuthUser {
  id: string;
  user_id: number;
  username?: string;
  email: string;
  fullname: string;
  phone?: string;
  role: Role | number;
  account_id: string;
  avatar_url?: string;
  quota?: Quota;
  chatbots?: Chatbot[];
}

export interface UpdateProfilePayload {
  fullname?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  old_password?: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

export interface AuthResponse {
  api_key: string;
  user: AuthUser;
  google_info?: {
    email: string;
    name: string;
    picture: string;
  };
}
