export interface JobStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: any;
}
