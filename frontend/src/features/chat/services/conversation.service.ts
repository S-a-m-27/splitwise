import {
  ChatServiceError,
  ConversationNotFoundError,
  normalizeChatError,
} from "@/features/chat/services/chat.errors";
import type {
  ConversationDetail,
  ConversationListItem,
  ConversationMember,
} from "@/features/chat/types";
import {
  groupIdSchema,
  parseDirectConversationInput,
  parseListConversationsInput,
  userIdSchema,
} from "@/features/chat/validation/chat.schema";
import {
  mapConversationDetail,
  mapConversationListItem,
  mapConversationMember,
} from "@/features/chat/utils/map-conversation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  requireChatUserId,
  throwIfChatDataError,
} from "@/features/chat/services/chat-session";
import { buildDmPairKey } from "@/features/chat/validation/chat.schema";

export { getChatErrorMessage } from "@/features/chat/services/chat.errors";

const CONVERSATION_DETAIL_SELECT = `
  id,
  type,
  group_id,
  created_by,
  dm_pair_key,
  last_message_at,
  last_message_preview,
  metadata,
  created_at,
  updated_at
`;

const CONVERSATION_MEMBERS_SELECT = `
  id,
  conversation_id,
  user_id,
  role,
  joined_at,
  last_read_message_id,
  unread_count,
  muted_at,
  archived_at,
  left_at,
  profile:profiles!conversation_members_user_id_fkey(full_name, avatar_url)
`;

function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const normalized = normalizeChatError(error);
  throw new ChatServiceError(normalized.code, normalized.message);
}

export class ConversationService {
  async searchUsers(query: string): Promise<
    Array<{ id: string; fullName: string; avatarUrl: string | null }>
  > {
    const userId = await requireChatUserId();
    const normalized = query.trim();
    if (normalized.length < 2) return [];
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .neq("id", userId)
      .ilike("full_name", `%${normalized.replace(/[%_]/g, "\\$&")}%`)
      .limit(10);
    throwIfChatDataError(error);
    return (data ?? []).map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
    }));
  }

  async listConversations(
    input: Partial<{ limit: number; offset: number }> = {},
  ): Promise<ConversationListItem[]> {
    const userId = await requireChatUserId();
    const { limit, offset } = parseListConversationsInput(input);
    const supabase = createBrowserClient();

    const { data, error } = await supabase.rpc("list_user_conversations", {
      p_limit: limit,
      p_offset: offset,
    });

    throwIfChatDataError(error);

    const items = (data ?? []).map((row) => mapConversationListItem(row));
    if (items.length === 0) return items;

    const groupIds = items.flatMap((item) => (item.groupId ? [item.groupId] : []));
    const conversationIds = items.map((item) => item.id);
    const [{ data: groups, error: groupsError }, { data: members, error: membersError }] =
      await Promise.all([
        groupIds.length
          ? supabase.from("groups").select("id, name, icon").in("id", groupIds)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("conversation_members")
          .select(
            "conversation_id, user_id, profile:profiles!conversation_members_user_id_fkey(full_name, avatar_url)",
          )
          .in("conversation_id", conversationIds)
          .is("left_at", null),
      ]);
    throwIfChatDataError(groupsError);
    throwIfChatDataError(membersError);

    const groupMap = new Map(
      (groups ?? []).map((group) => [group.id, group] as const),
    );
    const peerMap = new Map<
      string,
      { id: string; full_name: string; avatar_url: string | null }
    >();
    const participantMap = new Map<string, string[]>();
    for (const member of members ?? []) {
      const participantIds = participantMap.get(member.conversation_id) ?? [];
      participantIds.push(member.user_id);
      participantMap.set(member.conversation_id, participantIds);
      if (member.user_id !== userId && member.profile) {
        const profile = member.profile as {
          full_name: string;
          avatar_url: string | null;
        };
        peerMap.set(member.conversation_id, { id: member.user_id, ...profile });
      }
    }

    return items.map((item) => {
      const group = item.groupId ? groupMap.get(item.groupId) : undefined;
      const peer = peerMap.get(item.id);
      return {
        ...item,
        title: group?.name ?? peer?.full_name ?? "Conversation",
        avatarIcon: group?.icon,
        avatarUrl: peer?.avatar_url ?? null,
        peerUserId: peer?.id,
        participantUserIds: participantMap.get(item.id) ?? [],
      };
    });
  }

  async getConversation(conversationId: string): Promise<ConversationDetail> {
    const userId = await requireChatUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("conversations")
      .select(CONVERSATION_DETAIL_SELECT)
      .eq("id", conversationId)
      .is("deleted_at", null)
      .maybeSingle();

    throwIfSupabaseError(error);

    if (!data) {
      throw new ConversationNotFoundError();
    }

    const detail = mapConversationDetail(data);
    if (detail.groupId) {
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("name, icon")
        .eq("id", detail.groupId)
        .maybeSingle();
      throwIfChatDataError(groupError);
      return { ...detail, title: group?.name ?? "Group", avatarIcon: group?.icon };
    }

    const { data: peer, error: peerError } = await supabase
      .from("conversation_members")
      .select(
        "user_id, profile:profiles!conversation_members_user_id_fkey(full_name, avatar_url)",
      )
      .eq("conversation_id", conversationId)
      .neq("user_id", userId)
      .is("left_at", null)
      .limit(1)
      .maybeSingle();
    throwIfChatDataError(peerError);
    const profile = peer?.profile as { full_name: string; avatar_url: string | null } | null;
    return {
      ...detail,
      title: profile?.full_name ?? "Direct message",
      avatarUrl: profile?.avatar_url ?? null,
    };
  }

  async getGroupConversation(groupId: string): Promise<ConversationDetail> {
    const parsedGroupId = groupIdSchema.parse(groupId);
    await requireChatUserId();
    const supabase = createBrowserClient();

    const { data: conversationId, error: rpcError } = await supabase.rpc(
      "get_group_conversation",
      { p_group_id: parsedGroupId },
    );

    throwIfSupabaseError(rpcError);

    if (!conversationId) {
      throw new ConversationNotFoundError("Group conversation not found.");
    }

    return this.getConversation(conversationId);
  }

  async getOrCreateDirectConversation(otherUserId: string): Promise<ConversationDetail> {
    const { otherUserId: parsedOtherUserId } = parseDirectConversationInput({
      otherUserId,
    });
    await requireChatUserId();
    const supabase = createBrowserClient();

    const { data: conversationId, error } = await supabase.rpc(
      "get_or_create_direct_conversation",
      { p_other_user_id: parsedOtherUserId },
    );

    throwIfSupabaseError(error);

    if (!conversationId) {
      throw new ConversationNotFoundError("Unable to open direct conversation.");
    }

    return this.getConversation(conversationId);
  }

  async listConversationMembers(conversationId: string): Promise<ConversationMember[]> {
    await requireChatUserId();

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("conversation_members")
      .select(CONVERSATION_MEMBERS_SELECT)
      .eq("conversation_id", conversationId)
      .is("left_at", null)
      .order("joined_at", { ascending: true });

    throwIfSupabaseError(error);

    return (data ?? []).map((row) => mapConversationMember(row as never));
  }

  async findDirectConversationWithUser(
    otherUserId: string,
  ): Promise<ConversationDetail | null> {
    const parsedOtherUserId = userIdSchema.parse(otherUserId);
    const userId = await requireChatUserId();
    const supabase = createBrowserClient();

    const pairKey = buildDmPairKey(userId, parsedOtherUserId);

    const { data, error } = await supabase
      .from("conversations")
      .select(CONVERSATION_DETAIL_SELECT)
      .eq("type", "direct")
      .eq("dm_pair_key", pairKey)
      .is("deleted_at", null)
      .maybeSingle();

    throwIfSupabaseError(error);

    if (!data) return null;

    return mapConversationDetail(data);
  }
}

export const conversationService = new ConversationService();
