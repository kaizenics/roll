// Shape matches `supabase gen types typescript` output for supabase/migrations.
// Regenerate with `pnpm --filter web db:types` after changing the schema.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          aspect_ratio: string | null;
          created_at: string;
          duration_seconds: number | null;
          id: string;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          mux_upload_id: string | null;
          owner_id: string;
          short_id: string;
          status: string;
          title: string;
          updated_at: string;
          view_count: number;
          is_shared: boolean;
        };
        Insert: {
          aspect_ratio?: string | null;
          created_at?: string;
          duration_seconds?: number | null;
          id?: string;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          owner_id: string;
          short_id: string;
          status?: string;
          title?: string;
          updated_at?: string;
          view_count?: number;
          is_shared?: boolean;
        };
        Update: {
          aspect_ratio?: string | null;
          created_at?: string;
          duration_seconds?: number | null;
          id?: string;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          mux_upload_id?: string | null;
          owner_id?: string;
          short_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          view_count?: number;
          is_shared?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "videos_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_view: {
        Args: { short_id: string };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type VideoRow = Database["public"]["Tables"]["videos"]["Row"];
export type VideoUpdate = Database["public"]["Tables"]["videos"]["Update"];
