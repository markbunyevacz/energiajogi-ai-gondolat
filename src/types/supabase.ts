export type ActivityType = 'document' | 'question' | 'analysis' | 'upload' | 'search' | 'alert';
export type ActivityStatus = 'success' | 'warning' | 'error';

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string;
          type: ActivityType;
          title: string;
          description: string;
          created_at: string;
          user_role: string;
          user_name?: string;
          status?: ActivityStatus;
        };
        Insert: {
          id?: string;
          type: ActivityType;
          title: string;
          description: string;
          created_at?: string;
          user_role: string;
          user_name?: string;
          status?: ActivityStatus;
        };
        Update: {
          id?: string;
          type?: ActivityType;
          title?: string;
          description?: string;
          created_at?: string;
          user_role?: string;
          user_name?: string;
          status?: ActivityStatus;
        };
      };
    };
  };
} 