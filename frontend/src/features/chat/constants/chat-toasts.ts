/** Placeholder toast copy — Phase 3 wiring */
export const CHAT_TOAST_MESSAGES = {
  messageSent: "Message sent",
  messageFailed: "Message failed to send",
  conversationCreated: "Conversation created",
  userJoined: "User joined the conversation",
} as const;

export type ChatToastKey = keyof typeof CHAT_TOAST_MESSAGES;
