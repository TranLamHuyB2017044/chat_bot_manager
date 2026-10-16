export interface SourceFile {
  file_name: string;
  storage_path: string;
}

export interface DocumentRawTextData {
  document_id: string;
  filename: string;
  original_filename?: string;
  workspace_id?: string;
  category?: string;
  status?: string;
  total_chunks?: number;
  total_characters?: number;
  total_words?: number;
  raw_text: string;
  source_files?: SourceFile[];
  created_at?: string;
  updated_at?: string;
}

export interface DocumentChunkItem {
  chunk_id: string;
  chunk_index: number;
  page_num?: number;
  section_title?: string;
  chapter_title?: string;
  category?: string;
  char_count?: number;
  text: string;
}

export interface DocumentChunksData {
  document_id: string;
  document_name?: string;
  category?: string;
  total_chunks: number;
  chunks: DocumentChunkItem[];
}
