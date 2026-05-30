export type Role = 0 | 1 | 2; // 0: Admin, 1: Manager, 2: User

export interface Quota {
  plan: number;
  used_requests: number;
  max_requests_per_month: number;
  is_unlimited: boolean;
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  public_token: string;
}

export interface AuthUser {
  id: string;
  user_id: number;
  email: string;
  fullname: string;
  role: Role;
  account_id: string;
  avatar_url?: string;
  quota?: Quota;
  chatbots?: Chatbot[];
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
