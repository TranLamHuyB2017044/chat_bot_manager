export interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  workspace_id?: string;
  doc_count?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
}

export interface CategoryUpdateRequest {
  name?: string;
  icon?: string;
  description?: string;
  slug?: string;
}
