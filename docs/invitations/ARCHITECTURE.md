# Invitation System Architecture

Production SaaS architecture for the invitation domain. Business logic and secrets stay on the server; the frontend is a thin client.

## Layer diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  UI Components → Hooks → InvitationService (thin orchestrator)   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ supabase.functions.invoke()
                                │ (user JWT — no API keys)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Edge Function: invitations                 │
│  Action router → Handlers → Invitation Domain (server)           │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│   Supabase DB (RPC/RLS)   │   │   Email Provider (Resend)      │
│   group_invitations       │   │   API key in Edge secrets only │
└───────────────┬───────────┘   └───────────────────────────────┘
                │
                │ postgres_changes (supabase_realtime)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Realtime Sync                        │
│  invalidateQueries → Pending cards, Bell badge, Notifications     │
└─────────────────────────────────────────────────────────────────┘
```

## Principles

| Principle | Implementation |
|-----------|----------------|
| No business logic in React | UI calls `invitationService` only |
| No email from browser | Resend runs in Edge Functions |
| No service role on client | User JWT forwarded to Edge Function |
| One invitation entity | `group_invitations` with `kind = 'member'` |
| No auto-join on register | `handle_new_user` links only; accept creates membership |
| Replaceable email vendor | `EmailProvider` interface on server |

## Request flow (mutations)

1. User action in UI (e.g. Invite button)
2. `invitationService.createInvitation()` validates with Zod
3. `invitationEdgeTransport.invoke('create_member_invitation', payload)`
4. Edge Function verifies JWT, runs domain handler
5. Handler calls `create_member_invitation` RPC (user-scoped client)
6. Handler sends email via Resend (if `email` channel)
7. DB row inserted → Realtime event → frontend cache invalidation
8. UI updates pending card / notification panel

## Read flow (Phase 3 interim)

Reads (`get_pending`, `get_group`) may use authenticated RPCs directly from the client until moved behind Edge Functions. Mutations **must** use Edge Functions.

## Directory layout

```
supabase/functions/
  invitations/index.ts          # HTTP entry + action router
  _shared/
    cors.ts
    supabase-user-client.ts
    invitation/
      types.ts
      errors.ts
      repository.ts
      handlers/
        create-member-invitation.ts   # Step 1
        index.ts

frontend/src/features/invitations/
  transport/
    invitation-edge.transport.ts    # invoke Edge Function
    types.ts
  services/
    invitation.service.ts           # thin client — no email, no RPC mutations
```

## Environment & secrets

| Variable | Where | Purpose |
|----------|-------|---------|
| `RESEND_API_KEY` | Supabase Edge secrets | Resend API |
| `RESEND_FROM_EMAIL` | Supabase Edge secrets | Sender address |
| `NEXT_PUBLIC_APP_URL` | Frontend + Edge | Invite / register links |
| `SUPABASE_URL` | Edge (auto) | Database |
| `SUPABASE_ANON_KEY` | Edge (auto) | User-scoped client |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge only if needed | Never expose to client |

Set Edge secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxx RESEND_FROM_EMAIL="Bitwisse <invites@yourdomain.com>"
```

Deploy:

```bash
supabase functions deploy invitations
```

## Realtime

Table `group_invitations` is in `supabase_realtime` publication. On INSERT/UPDATE:

- Invalidate `invitationsKeys.pending(userId)` for invitee
- Invalidate group pending invitations for owners
- Notification bell count refreshes via `useInvitationBadge` query

## What stays in the database

- State machine enforcement: RPCs (`create_member_invitation`, `accept_member_invitation`, etc.)
- Registration linking: `handle_new_user` → `link_pending_invitations_to_user`
- RLS: recipient / admin visibility

Edge Functions orchestrate; Postgres remains source of truth.
