import { UserRole } from './index';

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
          user_name?: string;
          status?: ActivityStatus;
          user_role: UserRole;
        };
        Insert: {
          id?: string;
          type: ActivityType;
          title: string;
          description: string;
          created_at?: string;
          user_name?: string;
          status?: ActivityStatus;
          user_role: UserRole;
        };
        Update: {
          id?: string;
          type?: ActivityType;
          title?: string;
          description?: string;
          created_at?: string;
          user_name?: string;
          status?: ActivityStatus;
          user_role?: UserRole;
        };
      };
    };
  };
} 