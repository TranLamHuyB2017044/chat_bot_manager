export interface PlaygroundChunk {
  chunk_id: string;
  document_id: string;
  document_name: string;
  page_num: number;
  chunk_index: number;
  section_title?: string | null;
  chapter_title?: string | null;
  category?: string | null;
  score: number;
  snippet?: string;
  text: string;
}

export interface PlaygroundStats {
  total_chunks_found: number;
  highest_score: number;
  lowest_score: number;
  min_score_threshold: number;
  embed_time_ms: number;
  search_time_ms: number;
  llm_time_ms: number;
  total_time_ms: number;
}

export interface PlaygroundResponse {
  query: string;
  cleaned_query?: string;
  workspace_id: string;
  category?: string;
  domain?: string;
  stats: PlaygroundStats;
  retrieved_chunks: PlaygroundChunk[];
  full_context_sent_to_llm: string;
  llm_answer?: string | null;
  has_answer: boolean;
  reason: "ANSWER_FOUND" | "NOT_FOUND_IN_DOCUMENT_CONTENT" | "LOW_SIMILARITY_SCORE" | "NO_CHUNKS_FOUND" | string;
  reason_vi: string;
}

export interface PlaygroundSearchParams {
  workspace_id: string;
  query: string;
  category?: string;
  limit?: number;
  min_score?: number;
  domain?: string;
  generate_answer?: boolean;
}
