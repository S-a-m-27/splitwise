/**
 * Supabase database types — mirrors applied migrations.
 *
 * Regenerate after schema changes:
 *   supabase gen types typescript --project-id <ref> > frontend/src/types/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GroupType = "trip" | "home" | "couple" | "friends" | "other";
export type GroupMemberRole = "owner" | "admin" | "member";
export type ExpenseSplitType = "equal";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          preferred_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          preferred_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          preferred_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string;
          type: GroupType;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string;
          type?: GroupType;
          invite_code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string;
          type?: GroupType;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: GroupMemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: GroupMemberRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: GroupMemberRole;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_guests: {
        Row: {
          id: string;
          group_id: string;
          display_name: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          display_name: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          display_name?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_guests_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_guests_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          invite_code: string;
          created_by: string;
          expires_at: string | null;
          created_at: string;
          active: boolean;
        };
        Insert: {
          id?: string;
          group_id: string;
          invite_code: string;
          created_by: string;
          expires_at?: string | null;
          created_at?: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          group_id?: string;
          invite_code?: string;
          created_by?: string;
          expires_at?: string | null;
          created_at?: string;
          active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_invitations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expenses: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          amount: number;
          paid_by: string | null;
          paid_by_guest_id: string | null;
          notes: string | null;
          split_type: ExpenseSplitType;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          amount: number;
          paid_by?: string | null;
          paid_by_guest_id?: string | null;
          notes?: string | null;
          split_type?: ExpenseSplitType;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          amount?: number;
          paid_by?: string | null;
          paid_by_guest_id?: string | null;
          notes?: string | null;
          split_type?: ExpenseSplitType;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_guest_id_fkey";
            columns: ["paid_by_guest_id"];
            isOneToOne: false;
            referencedRelation: "group_guests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_participants: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string | null;
          guest_id: string | null;
          share_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string | null;
          guest_id: string | null;
          share_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          share_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expense_participants_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_participants_guest_id_fkey";
            columns: ["guest_id"];
            isOneToOne: false;
            referencedRelation: "group_guests";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          from_user_id: string | null;
          from_guest_id: string | null;
          to_user_id: string | null;
          to_guest_id: string | null;
          amount: number;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          from_user_id?: string | null;
          from_guest_id?: string | null;
          to_user_id?: string | null;
          to_guest_id?: string | null;
          amount: number;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          from_user_id?: string | null;
          from_guest_id?: string | null;
          to_user_id?: string | null;
          to_guest_id?: string | null;
          amount?: number;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_from_user_id_fkey";
            columns: ["from_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_to_user_id_fkey";
            columns: ["to_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_from_guest_id_fkey";
            columns: ["from_guest_id"];
            isOneToOne: false;
            referencedRelation: "group_guests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_to_guest_id_fkey";
            columns: ["to_guest_id"];
            isOneToOne: false;
            referencedRelation: "group_guests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_new_user: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      handle_updated_at: {
        Args: Record<string, never>;
        Returns: unknown;
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_group_member: {
        Args: { p_group_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_group_owner: {
        Args: { p_group_id: string; p_user_id?: string };
        Returns: boolean;
      };
      create_group: {
        Args: {
          p_name: string;
          p_description?: string | null;
          p_icon?: string;
          p_type?: GroupType;
        };
        Returns: Database["public"]["Tables"]["groups"]["Row"];
      };
      join_group_by_invite: {
        Args: { p_invite_code: string };
        Returns: string;
      };
      regenerate_group_invite: {
        Args: { p_group_id: string };
        Returns: string;
      };
      add_group_member_by_email: {
        Args: { p_group_id: string; p_email: string };
        Returns: string;
      };
      add_group_guest_by_name: {
        Args: { p_group_id: string; p_name: string };
        Returns: string;
      };
      is_group_guest: {
        Args: { p_group_id: string; p_guest_id: string };
        Returns: boolean;
      };
      is_group_participant: {
        Args: { p_group_id: string; p_participant_id: string };
        Returns: boolean;
      };
      calculate_equal_shares: {
        Args: { p_amount: number; p_participant_ids: string[] };
        Returns: { user_id: string; share_amount: number }[];
      };
      create_expense: {
        Args: {
          p_group_id: string;
          p_title: string;
          p_amount: number;
          p_paid_by: string;
          p_participant_ids: string[];
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["expenses"]["Row"];
      };
      update_expense: {
        Args: {
          p_expense_id: string;
          p_title: string;
          p_amount: number;
          p_paid_by: string;
          p_participant_ids: string[];
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["expenses"]["Row"];
      };
      create_settlement: {
        Args: {
          p_group_id: string;
          p_from_participant_id: string;
          p_to_participant_id: string;
          p_amount: number;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["settlements"]["Row"];
      };
      get_profile_stats: {
        Args: Record<string, never>;
        Returns: {
          total_groups: number;
          total_expenses: number;
          total_paid: number;
        }[];
      };
    };
    Enums: {
      group_type: GroupType;
      group_member_role: GroupMemberRole;
      expense_split_type: ExpenseSplitType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMemberRow = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupInvitationRow = Database["public"]["Tables"]["group_invitations"]["Row"];
export type GroupGuestRow = Database["public"]["Tables"]["group_guests"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseParticipantRow =
  Database["public"]["Tables"]["expense_participants"]["Row"];
export type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];
