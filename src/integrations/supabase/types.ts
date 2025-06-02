export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contract_analyses: {
        Row: {
          analyzed_by: string | null
          contract_id: string | null
          created_at: string | null
          id: string
          recommendations: string[] | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          summary: string | null
        }
        Insert: {
          analyzed_by?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          recommendations?: string[] | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          summary?: string | null
        }
        Update: {
          analyzed_by?: string | null
          contract_id?: string | null
          created_at?: string | null
          id?: string
          recommendations?: string[] | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_analyses_analyzed_by_fkey"
            columns: ["analyzed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_analyses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_tracking: {
        Row: {
          cost_amount: number
          cost_per_unit: number | null
          created_at: string
          id: string
          service_type: string
          usage_units: number | null
          user_id: string | null
        }
        Insert: {
          cost_amount: number
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          service_type: string
          usage_units?: number | null
          user_id?: string | null
        }
        Update: {
          cost_amount?: number
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          service_type?: string
          usage_units?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          analysis_error: string | null
          analysis_status: string | null
          content: string | null
          created_at: string | null
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string | null
          upload_date: string | null
          uploaded_by: string | null
          vector_id: string | null
        }
        Insert: {
          analysis_error?: string | null
          analysis_status?: string | null
          content?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          vector_id?: string | null
        }
        Update: {
          analysis_error?: string | null
          analysis_status?: string | null
          content?: string | null
          created_at?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
          vector_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      qa_sessions: {
        Row: {
          agent_type: string | null
          answer: string
          confidence: number | null
          conversation_context: Json | null
          created_at: string | null
          id: string
          question: string
          sources: string[] | null
          user_id: string
        }
        Insert: {
          agent_type?: string | null
          answer: string
          confidence?: number | null
          conversation_context?: Json | null
          created_at?: string | null
          id?: string
          question: string
          sources?: string[] | null
          user_id: string
        }
        Update: {
          agent_type?: string | null
          answer?: string
          confidence?: number | null
          conversation_context?: Json | null
          created_at?: string | null
          id?: string
          question?: string
          sources?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qa_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          analysis_id: string | null
          created_at: string | null
          description: string
          id: string
          recommendation: string | null
          section: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          type: Database["public"]["Enums"]["risk_type"]
        }
        Insert: {
          analysis_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          recommendation?: string | null
          section?: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          type: Database["public"]["Enums"]["risk_type"]
        }
        Update: {
          analysis_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          recommendation?: string | null
          section?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          type?: Database["public"]["Enums"]["risk_type"]
        }
        Relationships: [
          {
            foreignKeyName: "risks_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "contract_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      legal_sources: {
        Row: {
          id: string;
          name: string;
          type: Database['public']['Enums']['legal_source_type'];
          base_url: string;
          last_crawled_at: string | null;
          crawl_frequency_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: Database['public']['Enums']['legal_source_type'];
          base_url: string;
          last_crawled_at?: string | null;
          crawl_frequency_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: Database['public']['Enums']['legal_source_type'];
          base_url?: string;
          last_crawled_at?: string | null;
          crawl_frequency_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crawler_jobs: {
        Row: {
          id: string;
          source_id: string;
          status: Database['public']['Enums']['crawler_status'];
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          documents_found: number;
          documents_processed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          status?: Database['public']['Enums']['crawler_status'];
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          documents_found?: number;
          documents_processed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          status?: Database['public']['Enums']['crawler_status'];
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          documents_found?: number;
          documents_processed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crawler_jobs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "legal_sources";
            referencedColumns: ["id"];
          }
        ];
      };
      crawler_proxies: {
        Row: {
          id: string;
          host: string;
          port: number;
          username: string | null;
          password: string | null;
          is_active: boolean;
          last_used_at: string | null;
          failure_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host: string;
          port: number;
          username?: string | null;
          password?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          failure_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host?: string;
          port?: number;
          username?: string | null;
          password?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          failure_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_documents: {
        Row: {
          id: string
          title: string
          content: string
          document_type: Database['public']['Enums']['legal_document_type']
          source_url: string | null
          publication_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          document_type: Database['public']['Enums']['legal_document_type']
          source_url?: string | null
          publication_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          document_type?: Database['public']['Enums']['legal_document_type']
          source_url?: string | null
          publication_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_changes: {
        Row: {
          id: string
          document_id: string
          change_type: Database['public']['Enums']['change_type']
          description: string
          impact_level: Database['public']['Enums']['impact_level']
          detected_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          change_type: Database['public']['Enums']['change_type']
          description: string
          impact_level: Database['public']['Enums']['impact_level']
          detected_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          change_type?: Database['public']['Enums']['change_type']
          description?: string
          impact_level?: Database['public']['Enums']['impact_level']
          detected_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_changes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          contract_name: string
          content: string
          contract_type: Database['public']['Enums']['contract_type']
          risk_level: Database['public']['Enums']['impact_level']
          last_reviewed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_name: string
          content: string
          contract_type: Database['public']['Enums']['contract_type']
          risk_level: Database['public']['Enums']['impact_level']
          last_reviewed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_name?: string
          content?: string
          contract_type?: Database['public']['Enums']['contract_type']
          risk_level?: Database['public']['Enums']['impact_level']
          last_reviewed?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_impacts: {
        Row: {
          id: string
          contract_id: string
          change_id: string
          impact_description: string
          action_required: string
          priority_level: Database['public']['Enums']['priority_level']
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          change_id: string
          impact_description: string
          action_required: string
          priority_level: Database['public']['Enums']['priority_level']
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          change_id?: string
          impact_description?: string
          action_required?: string
          priority_level?: Database['public']['Enums']['priority_level']
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_impacts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_impacts_change_id_fkey"
            columns: ["change_id"]
            isOneToOne: false
            referencedRelation: "legal_changes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_real_time_analytics: {
        Args: { time_range_hours?: number }
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      search_documents: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          chunk_id: string
          document_id: string
          document_title: string
          chunk_text: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      document_type: 'szerződés' | 'rendelet' | 'szabályzat' | 'törvény' | 'határozat' | 'egyéb';
      risk_level: 'low' | 'medium' | 'high';
      risk_type: 'legal' | 'financial' | 'operational' | 'compliance' | 'security' | 'privacy' | 'intellectual_property' | 'other';
      user_role: 'jogász' | 'tulajdonos' | 'admin';
      legal_source_type: 'magyar_kozlony' | 'official_journal' | 'court_decision' | 'legislation' | 'other';
      crawler_status: 'pending' | 'running' | 'completed' | 'failed' | 'rate_limited';
      legal_document_type: 'law' | 'regulation' | 'policy' | 'decision' | 'other'
      change_type: 'amendment' | 'repeal' | 'new' | 'interpretation' | 'other'
      impact_level: 'low' | 'medium' | 'high' | 'critical'
      contract_type: 'employment' | 'service' | 'sales' | 'lease' | 'nda' | 'other'
      priority_level: 'low' | 'medium' | 'high' | 'urgent'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_type: [
        "szerződés",
        "rendelet",
        "szabályzat",
        "törvény",
        "határozat",
        "egyéb",
      ],
      risk_level: ["low", "medium", "high"],
      risk_type: ["legal", "financial", "operational"],
      user_role: ["jogász", "it_vezető", "tulajdonos"],
    },
  },
} as const
