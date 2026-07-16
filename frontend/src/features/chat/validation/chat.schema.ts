import { z } from "zod";

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_CONVERSATION_PREVIEW_LENGTH = 280;

const uuidSchema = z.string().uuid("Invalid identifier");

export const conversationTypeSchema = z.enum([
  "group",
  "direct",
  "announcement",
  "community",
]);

export const messageTypeSchema = z.enum([
  "text",
  "image",
  "video",
  "file",
  "voice",
  "location",
  "system",
]);

export const conversationIdSchema = uuidSchema;

export const groupIdSchema = uuidSchema;

export const userIdSchema = uuidSchema;

export const messageIdSchema = uuidSchema;

export const listConversationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const listMessagesSchema = z.object({
  conversationId: conversationIdSchema,
  limit: z.number().int().min(1).max(100).default(50),
  before: z
    .object({
      createdAt: z.string().datetime(),
      id: messageIdSchema,
    })
    .optional(),
});

export const directConversationSchema = z.object({
  otherUserId: userIdSchema,
});

export const messageContentSchema = z
  .string()
  .min(1, "Message cannot be empty")
  .max(MAX_MESSAGE_LENGTH, `Message must be ${MAX_MESSAGE_LENGTH} characters or less`)
  .transform((value) => value.trim());

export const clientMessageIdSchema = uuidSchema.optional();

export const sendMessageSchema = z.object({
  conversationId: conversationIdSchema,
  content: messageContentSchema,
  clientMessageId: uuidSchema,
  messageType: messageTypeSchema.default("text"),
  mentionedUserIds: z.array(userIdSchema).max(50).default([]),
});

export const markConversationReadSchema = z.object({
  conversationId: conversationIdSchema,
  messageId: messageIdSchema,
});

export const editMessageSchema = z.object({
  messageId: messageIdSchema,
  content: messageContentSchema,
});

export const deleteMessageSchema = z.object({
  messageId: messageIdSchema,
});

export const chatRealtimeRowSchema = z.object({
  id: uuidSchema,
  conversation_id: conversationIdSchema,
}).passthrough();

export const chatPresencePayloadSchema = z.object({
  userId: userIdSchema,
  onlineAt: z.string().datetime(),
});

export const chatTypingPayloadSchema = z.object({
  userId: userIdSchema,
  isTyping: z.boolean(),
  sentAt: z.string().datetime(),
});

export type ListConversationsInput = z.infer<typeof listConversationsSchema>;
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
export type DirectConversationInput = z.infer<typeof directConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkConversationReadInput = z.infer<typeof markConversationReadSchema>;

export function buildDmPairKey(userA: string, userB: string): string {
  return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
}

export function parseListConversationsInput(
  input: Partial<ListConversationsInput>,
): ListConversationsInput {
  return listConversationsSchema.parse(input);
}

export function parseListMessagesInput(
  input: Partial<ListMessagesInput>,
): ListMessagesInput {
  return listMessagesSchema.parse(input);
}

export function parseDirectConversationInput(
  input: Partial<DirectConversationInput>,
): DirectConversationInput {
  return directConversationSchema.parse(input);
}
