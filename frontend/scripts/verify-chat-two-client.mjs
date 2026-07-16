import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

function localEnvironment() {
  const executable = process.platform === "win32" ? "powershell.exe" : "supabase";
  const args =
    process.platform === "win32"
      ? ["-NoProfile", "-Command", "supabase status -o env"]
      : ["status", "-o", "env"];
  const output = execFileSync(executable, args, {
    cwd: new URL("../..", import.meta.url),
    encoding: "utf8",
  });
  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .filter((line) => line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index),
          line.slice(index + 1).replace(/^"|"$/g, ""),
        ];
      }),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const env = localEnvironment();
const url = env.API_URL;
const anonKey = env.ANON_KEY;
const serviceKey = env.SERVICE_ROLE_KEY;
assert(url && anonKey && serviceKey, "Local Supabase credentials are unavailable.");

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, options);
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `Local-chat-${suffix}!`;
const users = await Promise.all(
  ["a", "b"].map(async (label) => {
    const { data, error } = await admin.auth.admin.createUser({
      email: `chat-${label}-${suffix}@example.test`,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Chat Client ${label.toUpperCase()}` },
    });
    if (error || !data.user) throw error ?? new Error("Unable to create local user.");
    return data.user;
  }),
);

const clientA = createClient(url, anonKey, options);
const clientB = createClient(url, anonKey, options);
const [
  { data: sessionA, error: signInAError },
  { data: sessionB, error: signInBError },
] = await Promise.all([
  clientA.auth.signInWithPassword({ email: users[0].email, password }),
  clientB.auth.signInWithPassword({ email: users[1].email, password }),
]);
if (signInAError || signInBError) throw signInAError ?? signInBError;
await Promise.all([
  clientA.realtime.setAuth(sessionA.session.access_token),
  clientB.realtime.setAuth(sessionB.session.access_token),
]);

const { data: conversationId, error: conversationError } = await clientA.rpc(
  "get_or_create_direct_conversation",
  { p_other_user_id: users[1].id },
);
if (conversationError || !conversationId) {
  throw conversationError ?? new Error("Unable to create direct conversation.");
}

let resolveRealtime;
const realtimeMessage = new Promise((resolve, reject) => {
  resolveRealtime = resolve;
  setTimeout(() => reject(new Error("Client B did not receive the committed message.")), 30_000);
});
const channel = clientB
  .channel(`verify:${conversationId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    },
    ({ new: row }) => resolveRealtime(row),
  );
await new Promise((resolve, reject) => {
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") resolve();
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      reject(new Error(`Realtime channel failed: ${status}`));
    }
  });
});
await new Promise((resolve) => setTimeout(resolve, 1_500));

const clientMessageId = crypto.randomUUID();
const { data: sent, error: sendError } = await clientA.rpc("send_chat_message", {
  p_conversation_id: conversationId,
  p_content: "Two-client lifecycle verification",
  p_client_message_id: clientMessageId,
  p_message_type: "text",
  p_reply_to_message_id: null,
});
if (sendError || !sent) throw sendError ?? new Error("Send RPC returned no message.");
const received = await realtimeMessage;
assert(received.id === sent.id, "Realtime did not deliver the canonical message.");

const { data: unreadMember, error: unreadError } = await clientB
  .from("conversation_members")
  .select("unread_count")
  .eq("conversation_id", conversationId)
  .eq("user_id", users[1].id)
  .single();
if (unreadError) throw unreadError;
assert(unreadMember.unread_count === 1, "Client B unread count did not increment.");

const { error: readError } = await clientB.rpc("mark_conversation_read", {
  p_conversation_id: conversationId,
  p_message_id: sent.id,
});
if (readError) throw readError;
const { data: readMember, error: readStateError } = await clientB
  .from("conversation_members")
  .select("unread_count, last_read_message_id")
  .eq("conversation_id", conversationId)
  .eq("user_id", users[1].id)
  .single();
if (readStateError) throw readStateError;
assert(readMember.unread_count === 0, "Client B unread count did not reset.");
assert(readMember.last_read_message_id === sent.id, "Read cursor did not advance.");

await clientB.removeChannel(channel);
console.log("Two-client chat lifecycle verification passed.");
