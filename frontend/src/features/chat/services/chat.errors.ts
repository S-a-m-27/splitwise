export type ChatErrorCode =
  | "NO_SESSION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "DUPLICATE_CONVERSATION"
  | "ALREADY_MEMBER"
  | "MESSAGE_TOO_LONG"
  | "INVALID_CONVERSATION_TYPE"
  | "NETWORK_ERROR"
  | "SUPABASE_ERROR"
  | "UNKNOWN";

export interface NormalizedChatError {
  code: ChatErrorCode;
  message: string;
}

const POSTGRES_MESSAGES: Record<string, ChatErrorCode> = {
  "Not authenticated": "NO_SESSION",
  "Other user is required": "VALIDATION_ERROR",
  "Cannot create a direct conversation with yourself": "VALIDATION_ERROR",
  "User not found": "NOT_FOUND",
  "Group conversation not found": "NOT_FOUND",
  "You do not have access to this group conversation": "FORBIDDEN",
  "Conversation not found": "NOT_FOUND",
  "You do not have access to this conversation": "FORBIDDEN",
  "Message is too long": "MESSAGE_TOO_LONG",
  "Invalid conversation type": "INVALID_CONVERSATION_TYPE",
};

export class ChatServiceError extends Error {
  constructor(
    public readonly code: ChatErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

export class ConversationNotFoundError extends ChatServiceError {
  constructor(message = "Conversation not found.") {
    super("NOT_FOUND", message);
    this.name = "ConversationNotFoundError";
  }
}

export class UnauthorizedConversationAccessError extends ChatServiceError {
  constructor(message = "You do not have access to this conversation.") {
    super("UNAUTHORIZED", message);
    this.name = "UnauthorizedConversationAccessError";
  }
}

export class DuplicateConversationError extends ChatServiceError {
  constructor(message = "A conversation already exists between these users.") {
    super("DUPLICATE_CONVERSATION", message);
    this.name = "DuplicateConversationError";
  }
}

export class AlreadyConversationMemberError extends ChatServiceError {
  constructor(message = "User is already a member of this conversation.") {
    super("ALREADY_MEMBER", message);
    this.name = "AlreadyConversationMemberError";
  }
}

export class MessageTooLongError extends ChatServiceError {
  constructor(message = "Message is too long.") {
    super("MESSAGE_TOO_LONG", message);
    this.name = "MessageTooLongError";
  }
}

export class InvalidConversationTypeError extends ChatServiceError {
  constructor(message = "Invalid conversation type.") {
    super("INVALID_CONVERSATION_TYPE", message);
    this.name = "InvalidConversationTypeError";
  }
}

function mapPostgresMessage(message: string): ChatErrorCode | null {
  for (const [fragment, code] of Object.entries(POSTGRES_MESSAGES)) {
    if (message.includes(fragment)) return code;
  }
  return null;
}

function getDefaultMessage(code: ChatErrorCode): string {
  switch (code) {
    case "NO_SESSION":
      return "Your session has expired. Please sign in again.";
    case "NOT_FOUND":
      return "Conversation not found or you do not have access.";
    case "FORBIDDEN":
    case "UNAUTHORIZED":
      return "You do not have permission to access this conversation.";
    case "DUPLICATE_CONVERSATION":
      return "A conversation already exists between these users.";
    case "ALREADY_MEMBER":
      return "User is already a member of this conversation.";
    case "MESSAGE_TOO_LONG":
      return "Message is too long.";
    case "INVALID_CONVERSATION_TYPE":
      return "Invalid conversation type.";
    case "VALIDATION_ERROR":
      return "Please check your input and try again.";
    case "NETWORK_ERROR":
      return "Unable to reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function normalizeChatError(error: unknown): NormalizedChatError {
  if (error instanceof ChatServiceError) {
    return { code: error.code, message: error.message };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    const mapped = mapPostgresMessage(message);

    if (mapped) {
      return { code: mapped, message: getDefaultMessage(mapped) };
    }

    if (message.toLowerCase().includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: getDefaultMessage("NETWORK_ERROR"),
      };
    }

    if (
      message.includes("PGRST116") ||
      message.includes("Cannot coerce the result to a single JSON object") ||
      message.includes("0 rows")
    ) {
      return { code: "NOT_FOUND", message: getDefaultMessage("NOT_FOUND") };
    }

    return { code: "SUPABASE_ERROR", message };
  }

  return { code: "UNKNOWN", message: getDefaultMessage("UNKNOWN") };
}

export function getChatErrorMessage(error: unknown): string {
  return normalizeChatError(error).message;
}

export function isChatSessionError(error: unknown): boolean {
  return normalizeChatError(error).code === "NO_SESSION";
}
