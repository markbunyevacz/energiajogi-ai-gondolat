
export interface StoredDocument {
  id: string;
  title: string;
  type: string;
  file_size: number;
  upload_date: string;
  content: string | null;
  analysis_status: 'not_analyzed' | 'analyzing' | 'completed' | 'failed';
  analysis_error: string | null;
}
