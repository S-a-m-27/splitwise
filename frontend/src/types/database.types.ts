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
export type InvitationKind = "share_link" | "member";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";
export type InvitationDeliveryChannel =
  | "email"
  | "in_app"
  | "push"
  | "sms"
  | "whatsapp"
  | "qr_code"
  | "share_link";
export type InvitationAcceptedVia = "email" | "application" | "share_link";
export type NotificationType =
  | "invitation_received"
  | "invitation_linked"
  | "invitation_accepted"
  | "invitation_declined"
  | "chat_message";

export type GroupActivityType =
  | "invitation_sent"
  | "invitation_accepted"
  | "invitation_declined"
  | "invitation_cancelled"
  | "invitation_expired"
  | "member_joined";

export type ConversationType = "group" | "direct" | "announcement" | "community";
export type ConversationMemberRole = "owner" | "admin" | "member" | "moderator";
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "file"
  | "voice"
  | "location"
  | "system";
export type ChatAuditEventType =
  | "conversation_created"
  | "conversation_archived"
  | "member_joined"
  | "member_left"
  | "message_created"
  | "message_updated"
  | "message_deleted";

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
          kind: InvitationKind;
          status: InvitationStatus | null;
          invite_code: string | null;
          invited_email: string | null;
          invited_user_id: string | null;
          created_by: string;
          expires_at: string | null;
          active: boolean;
          delivery_channels: InvitationDeliveryChannel[];
          accepted_via: InvitationAcceptedVia | null;
          created_at: string;
          updated_at: string;
          responded_at: string | null;
          last_reminder_sent_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          group_id: string;
          kind?: InvitationKind;
          status?: InvitationStatus | null;
          invite_code?: string | null;
          invited_email?: string | null;
          invited_user_id?: string | null;
          created_by: string;
          expires_at?: string | null;
          active?: boolean;
          delivery_channels?: InvitationDeliveryChannel[];
          accepted_via?: InvitationAcceptedVia | null;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
          last_reminder_sent_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          group_id?: string;
          kind?: InvitationKind;
          status?: InvitationStatus | null;
          invite_code?: string | null;
          invited_email?: string | null;
          invited_user_id?: string | null;
          created_by?: string;
          expires_at?: string | null;
          active?: boolean;
          delivery_channels?: InvitationDeliveryChannel[];
          accepted_via?: InvitationAcceptedVia | null;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
          last_reminder_sent_at?: string | null;
          metadata?: Json;
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
          {
            foreignKeyName: "group_invitations_invited_user_id_fkey";
            columns: ["invited_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          invitation_id: string | null;
          group_id: string | null;
          conversation_id: string | null;
          message_id: string | null;
          title: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          invitation_id?: string | null;
          group_id?: string | null;
          conversation_id?: string | null;
          message_id?: string | null;
          title: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          invitation_id?: string | null;
          group_id?: string | null;
          conversation_id?: string | null;
          message_id?: string | null;
          title?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_invitation_id_fkey";
            columns: ["invitation_id"];
            isOneToOne: false;
            referencedRelation: "group_invitations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      group_activities: {
        Row: {
          id: string;
          group_id: string;
          actor_user_id: string | null;
          type: GroupActivityType;
          invitation_id: string | null;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          actor_user_id?: string | null;
          type: GroupActivityType;
          invitation_id?: string | null;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          actor_user_id?: string | null;
          type?: GroupActivityType;
          invitation_id?: string | null;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_activities_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
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
          client_settlement_id: string | null;
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
          client_settlement_id?: string | null;
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
          client_settlement_id?: string | null;
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
      conversations: {
        Row: {
          id: string;
          type: ConversationType;
          group_id: string | null;
          created_by: string;
          dm_pair_key: string | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          type: ConversationType;
          group_id?: string | null;
          created_by: string;
          dm_pair_key?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          type?: ConversationType;
          group_id?: string | null;
          created_by?: string;
          dm_pair_key?: string | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_members: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: ConversationMemberRole;
          joined_at: string;
          last_read_message_id: string | null;
          unread_count: number;
          muted_at: string | null;
          archived_at: string | null;
          left_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role?: ConversationMemberRole;
          joined_at?: string;
          last_read_message_id?: string | null;
          unread_count?: number;
          muted_at?: string | null;
          archived_at?: string | null;
          left_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: ConversationMemberRole;
          joined_at?: string;
          last_read_message_id?: string | null;
          unread_count?: number;
          muted_at?: string | null;
          archived_at?: string | null;
          left_at?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_members_last_read_message_id_fkey";
            columns: ["last_read_message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          message_type: MessageType;
          content: string | null;
          reply_to_message_id: string | null;
          client_message_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          message_type?: MessageType;
          content?: string | null;
          reply_to_message_id?: string | null;
          client_message_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          message_type?: MessageType;
          content?: string | null;
          reply_to_message_id?: string | null;
          client_message_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      message_reads: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          message_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          message_id: string;
          read_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          message_id?: string;
          read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reads_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reads_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_audit_events: {
        Row: {
          id: string;
          conversation_id: string | null;
          actor_user_id: string | null;
          event_type: ChatAuditEventType;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id?: string | null;
          actor_user_id?: string | null;
          event_type: ChatAuditEventType;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string | null;
          actor_user_id?: string | null;
          event_type?: ChatAuditEventType;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_audit_events_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_audit_events_actor_user_id_fkey";
            columns: ["actor_user_id"];
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
      is_group_admin_or_owner: {
        Args: { p_group_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_invitation_recipient: {
        Args: {
          p_invited_user_id: string | null;
          p_invited_email: string | null;
          p_user_id?: string;
        };
        Returns: boolean;
      };
      link_pending_invitations_to_user: {
        Args: { p_user_id: string; p_email: string };
        Returns: number;
      };
      create_member_invitation: {
        Args: {
          p_group_id: string;
          p_invited_email: string;
          p_delivery_channels?: InvitationDeliveryChannel[];
          p_expires_at?: string | null;
          p_metadata?: Json;
        };
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"];
      };
      accept_member_invitation: {
        Args: {
          p_invitation_id: string;
          p_accepted_via?: InvitationAcceptedVia;
        };
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"];
      };
      decline_member_invitation: {
        Args: { p_invitation_id: string };
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"];
      };
      cancel_member_invitation: {
        Args: { p_invitation_id: string };
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"];
      };
      expire_member_invitation: {
        Args: { p_invitation_id: string };
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"];
      };
      get_pending_member_invitations: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"][];
      };
      get_group_member_invitations: {
        Args: { p_group_id: string };
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"][];
      };
      search_invite_candidates: {
        Args: { p_group_id: string; p_query: string };
        Returns: {
          id: string;
          display_name: string;
          email: string | null;
          avatar_url: string | null;
          is_registered: boolean;
          state: string;
        }[];
      };
      get_unread_notification_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_invitation_notifications: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["notifications"]["Row"][];
      };
      is_email_registered: {
        Args: { p_email: string };
        Returns: boolean;
      };
      get_received_member_invitations: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["group_invitations"]["Row"][];
      };
      get_group_activities: {
        Args: { p_group_id: string; p_limit?: number };
        Returns: Database["public"]["Tables"]["group_activities"]["Row"][];
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
          p_client_settlement_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["settlements"]["Row"];
      };
      calculate_group_net_balances: {
        Args: { p_group_id: string };
        Returns: {
          participant_id: string;
          net_cents: number;
        }[];
      };
      get_profile_stats: {
        Args: Record<string, never>;
        Returns: {
          total_groups: number;
          total_expenses: number;
          total_paid: number;
        }[];
      };
      build_dm_pair_key: {
        Args: { p_user_a: string; p_user_b: string };
        Returns: string;
      };
      is_conversation_member: {
        Args: { p_conversation_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_conversation_admin: {
        Args: { p_conversation_id: string; p_user_id?: string };
        Returns: boolean;
      };
      can_view_chat_profile: {
        Args: { p_profile_user_id: string };
        Returns: boolean;
      };
      get_conversation_member_details: {
        Args: { p_conversation_id: string };
        Returns: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: ConversationMemberRole;
          joined_at: string;
          last_read_message_id: string | null;
          unread_count: number;
          muted_at: string | null;
          archived_at: string | null;
          left_at: string | null;
          full_name: string;
          avatar_url: string | null;
          email: string;
        }[];
      };
      get_or_create_direct_conversation: {
        Args: { p_other_user_id: string };
        Returns: string;
      };
      get_group_conversation: {
        Args: { p_group_id: string };
        Returns: string;
      };
      list_user_conversations: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          type: ConversationType;
          group_id: string | null;
          created_by: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          unread_count: number;
          muted_at: string | null;
          archived_at: string | null;
        }[];
      };
      send_chat_message: {
        Args: {
          p_conversation_id: string;
          p_content: string;
          p_client_message_id: string;
          p_message_type?: MessageType;
          p_reply_to_message_id?: string | null;
          p_mentioned_user_ids?: string[];
        };
        Returns: Database["public"]["Tables"]["messages"]["Row"];
      };
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_message_id: string };
        Returns: undefined;
      };
      edit_chat_message: {
        Args: { p_message_id: string; p_content: string };
        Returns: Database["public"]["Tables"]["messages"]["Row"];
      };
      delete_chat_message: {
        Args: { p_message_id: string };
        Returns: Database["public"]["Tables"]["messages"]["Row"];
      };
    };
    Enums: {
      group_type: GroupType;
      group_member_role: GroupMemberRole;
      expense_split_type: ExpenseSplitType;
      invitation_kind: InvitationKind;
      invitation_status: InvitationStatus;
      invitation_delivery_channel: InvitationDeliveryChannel;
      invitation_accepted_via: InvitationAcceptedVia;
      notification_type: NotificationType;
      group_activity_type: GroupActivityType;
      conversation_type: ConversationType;
      conversation_member_role: ConversationMemberRole;
      message_type: MessageType;
      chat_audit_event_type: ChatAuditEventType;
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
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type GroupGuestRow = Database["public"]["Tables"]["group_guests"]["Row"];
export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseParticipantRow =
  Database["public"]["Tables"]["expense_participants"]["Row"];
export type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationMemberRow =
  Database["public"]["Tables"]["conversation_members"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessageReadRow = Database["public"]["Tables"]["message_reads"]["Row"];
export type ChatAuditEventRow = Database["public"]["Tables"]["chat_audit_events"]["Row"];
