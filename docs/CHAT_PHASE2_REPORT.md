# Chat System — Phase 2 UI Report

**Scope:** Premium mobile-first Chat UI with mock data. No backend wiring.

---

## 1. Component Tree

```
features/chat/
├── components/
│   ├── conversations-page-content.tsx    # Messages list screen
│   ├── chat-thread-page-content.tsx      # DM / group thread screen
│   ├── chat-screen.tsx                   # Reusable chat layout (header + list + composer)
│   ├── group-chat-tab.tsx                # Embedded group chat in group detail
│   ├── conversation-list.tsx
│   ├── conversation-card.tsx
│   ├── conversation-avatar.tsx
│   ├── conversation-search.tsx
│   ├── chat-header.tsx
│   ├── message-list.tsx
│   ├── message-bubble.tsx                # OwnMessageBubble + OtherMessageBubble
│   ├── message-composer.tsx
│   ├── date-separator.tsx
│   ├── unread-divider.tsx
│   ├── typing-indicator.tsx              # Placeholder
│   ├── online-badge.tsx                  # Placeholder
│   ├── chat-skeleton.tsx
│   ├── empty-conversation-state.tsx
│   ├── empty-chat-state.tsx
│   ├── chat-error-state.tsx
│   ├── chat-fab.tsx
│   └── new-chat-sheet.tsx
├── hooks/                                # Mock data only
├── mocks/chat.mock.ts
├── types/ui.ts
└── utils/
    ├── format-chat-time.ts
    └── group-messages.ts
```

---

## 2. Routes Added

| Route | Page | Description |
|-------|------|-------------|
| `/chat` | `(protected)/chat/page.tsx` | Conversation list |
| `/chat/[conversationId]` | `(protected)/chat/[conversationId]/page.tsx` | Thread view |

**Route helpers:** `ROUTES.chat`, `chatThreadRoute(id)` in `constants/routes.ts`

**Protected:** `/chat` added to `PROTECTED_ROUTES`

---

## 3. Components Created

28 UI components (listed above). Key reusable primitives:

- **ConversationCard** — preview row with unread, pin/mute placeholders
- **MessageBubble** — own/other variants, grouped consecutive messages
- **MessageComposer** — auto-grow textarea, disabled send/attach/emoji/voice
- **ChatScreen** — sticky header + scrollable messages + composer
- **ConversationSearch** — search UI with recent searches (no API)

---

## 4. Hooks Prepared (Mock Only)

| Hook | Purpose |
|------|---------|
| `useConversations()` | Sorted list (pinned → unread → recency) |
| `useConversation(id)` | Single conversation metadata |
| `useMessages(id)` | Message history |
| `useConversationSearch(query)` | Debounced mock search |
| `useUnreadCount()` | Nav badge total |
| `useTypingIndicator(id)` | Placeholder typing animation |

---

## 5. Mobile UX Decisions

1. **Messages tab** in bottom nav with unread badge — replaces Feed tab in primary nav
2. **Center + button** elevated in bottom bar for quick expense add (Home | Groups | **+** | Messages | You)
3. **Full-screen thread** — bottom nav hidden (`DashboardShell hideNav`) for immersive chat
4. **FAB on Messages** — bottom-right “New chat” opens user search sheet
5. **Touch targets** — min 44px (h-11) on tabs, composer actions, nav items
6. **Safe areas** — composer and nav respect `env(safe-area-inset-bottom)`
7. **Group chat tab** — embedded `ChatScreen` inside group detail (no route change)
8. **Consecutive message grouping** — reduces clutter; avatars/names only on first in group

---

## 6. Desktop Adaptations

- Bottom nav hidden at `xl:` — sidebar unchanged (Messages added to nav items)
- `DashboardShell` keeps `xl:px-8` padding on list; thread uses full height
- Conversation list uses card layout up to 430px column; expands in desktop main area
- Group chat tab uses bordered card container at `rounded-2xl`

---

## 7. Future Integration Points (Phase 3)

| UI surface | Replace mock with |
|------------|-------------------|
| `useConversations` | `conversationService.listConversations()` + React Query |
| `useMessages` | `messageService.listMessages()` + realtime subscription |
| `useConversationSearch` | User/group search RPC |
| `useUnreadCount` | Sum from `conversation_members.unread_count` |
| `useTypingIndicator` | Supabase Realtime Presence |
| `MessageComposer` send | `send_message` RPC |
| `GroupChatTab` | `get_group_conversation(groupId)` |
| `NewChatSheet` | `get_or_create_direct_conversation` |
| Nav badge | Live unread from DB |
| Toast placeholders | `CHAT_TOAST_MESSAGES` via sonner on send/error |

**Do not modify:** backend services, migrations, or RLS — wire hooks to existing `features/chat/services/*` in Phase 3.

---

## Navigation Integration

- `DASHBOARD_NAV_ITEMS` — Messages tab (`ROUTES.chat`)
- `dashboard-navigation.tsx` — center + button, unread badge on Messages
- `group-detail-tabs.tsx` — Chat tab added
- `group-detail-page-content.tsx` — renders `GroupChatTab`

---

**Phase 2 complete.** Ready for Phase 3 backend integration.
