// Hand-written Supabase-style database types for I'm Realtor.
//
// This mirrors the shape produced by `supabase gen types typescript` so it
// can be swapped for a generated file later without touching call sites.
// Keep this in sync with src/lib/db/schema.sql whenever the schema changes.
//
// TODO(phase-3+): once the Supabase CLI is wired into this project, replace
// this file with the generated output (`supabase gen types typescript
// --linked > src/lib/database.types.ts`).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "agent" | "owner" | "buyer" | "support";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";
export type ListingStatus = "draft" | "pending" | "approved" | "rejected" | "archived";
export type PropertyPurpose = "sell" | "rent";
export type EnquiryStatus = "new" | "contacted" | "closed" | "spam";
export type AccessRequestStatus = "pending" | "approved" | "rejected";
export type ImportStatus = "parsed" | "needs_review" | "saved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          role: UserRole;
          status: ApprovalStatus;
          city: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          role?: UserRole;
          status?: ApprovalStatus;
          city?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          role?: UserRole;
          status?: ApprovalStatus;
          city?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      access_requests: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          requested_role: UserRole;
          city: string | null;
          message: string | null;
          status: AccessRequestStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email: string;
          requested_role: UserRole;
          city?: string | null;
          message?: string | null;
          status?: AccessRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string;
          requested_role?: UserRole;
          city?: string | null;
          message?: string | null;
          status?: AccessRequestStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      properties: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          purpose: PropertyPurpose;
          type: string;
          city: string;
          locality: string;
          price: number;
          bedrooms: number | null;
          bathrooms: number | null;
          area: string | null;
          description: string | null;
          amenities: string[];
          status: ListingStatus;
          featured: boolean;
          owner_id: string | null;
          created_by: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejected_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string | null;
          purpose: PropertyPurpose;
          type: string;
          city: string;
          locality: string;
          price: number;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area?: string | null;
          description?: string | null;
          amenities?: string[];
          status?: ListingStatus;
          featured?: boolean;
          owner_id?: string | null;
          created_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string | null;
          purpose?: PropertyPurpose;
          type?: string;
          city?: string;
          locality?: string;
          price?: number;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area?: string | null;
          description?: string | null;
          amenities?: string[];
          status?: ListingStatus;
          featured?: boolean;
          owner_id?: string | null;
          created_by?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "properties_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      property_images: {
        Row: {
          id: string;
          property_id: string;
          storage_path: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          storage_path: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          storage_path?: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };

      enquiries: {
        Row: {
          id: string;
          property_id: string;
          buyer_id: string | null;
          buyer_name: string;
          email: string | null;
          phone: string;
          message: string | null;
          status: EnquiryStatus;
          assigned_agent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          buyer_id?: string | null;
          buyer_name: string;
          email?: string | null;
          phone: string;
          message?: string | null;
          status?: EnquiryStatus;
          assigned_agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          buyer_id?: string | null;
          buyer_name?: string;
          email?: string | null;
          phone?: string;
          message?: string | null;
          status?: EnquiryStatus;
          assigned_agent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiries_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      saved_properties: {
        Row: {
          id: string;
          buyer_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_properties_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_properties_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };

      agent_assignments: {
        Row: {
          id: string;
          property_id: string;
          agent_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          agent_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          agent_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_assignments_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_assignments_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      listing_imports: {
        Row: {
          id: string;
          raw_text: string;
          parsed_data: Json;
          status: ImportStatus;
          created_by: string | null;
          created_property_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          raw_text: string;
          parsed_data?: Json;
          status?: ImportStatus;
          created_by?: string | null;
          created_property_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          raw_text?: string;
          parsed_data?: Json;
          status?: ImportStatus;
          created_by?: string | null;
          created_property_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_imports_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_imports_created_property_id_fkey";
            columns: ["created_property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      approval_status: ApprovalStatus;
      listing_status: ListingStatus;
      property_purpose: PropertyPurpose;
      enquiry_status: EnquiryStatus;
      access_request_status: AccessRequestStatus;
      import_status: ImportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
