# Phase 3 — Invitation Execution Plan

Execute in this **exact order**. Do not skip ahead. Each step should be fully testable before moving on.

---

## Step 1 — Invite Registered User

**Goal:** Owner invites a user who already has an account.

```
Invite Registered User
        ↓
Create invitation (Edge Function → RPC)
        ↓
Send email (Resend — "You've been invited to {group}")
        ↓
Realtime notification (DB INSERT → postgres_changes)
        ↓
Update pending card (group detail) + bell badge (invitee)
```

### Checklist

- [ ] Wire `InviteModal` → `invitationService.createInvitation()` (replace mock)
- [ ] Edge handler `create_member_invitation` sends **registered** email template
- [ ] `invited_user_id` populated on row
- [ ] `delivery_channels` includes `email` + `in_app`
- [ ] Realtime invalidates `invitationsKeys` + group pending section
- [ ] Invitee sees item in **Notifications panel** (bell)
- [ ] Owner sees item in **Pending Invitations** on group detail
- [ ] Accept / Decline still manual (Step 1 does not require accept flow)

### Test scenario

1. User A (owner) invites `nimra@email.com` (registered User B)
2. User B receives email
3. User B opens app → bell shows (2) → panel shows invitation
4. User A sees pending card on group detail

### Debug points

| Layer | What to verify |
|-------|----------------|
| Edge Function logs | RPC success, Resend response |
| `group_invitations` row | `status=pending`, `invited_user_id` set |
| Realtime | INSERT event on `group_invitations` |
| Frontend | Query invalidation, not manual refetch |

---

## Step 2 — Invite Unregistered User

**Goal:** Owner invites an email with no account yet.

```
Invite Unregistered User
        ↓
Create invitation (same Edge action, `invited_user_id` null)
        ↓
Send registration email (Resend — "Sign up to join {group}")
        ↓
Waiting for Registration (status chip on pending card)
        ↓
Pending card updates for owner (no in-app for invitee yet)
```

### Checklist

- [ ] `UnregisteredUserCard` → `createInvitation()` with email only
- [ ] Edge handler branches: no `invited_user_id` → **registration** email template
- [ ] `delivery_channels` = `['email']` only (no `in_app` until registered)
- [ ] Owner pending card shows **Waiting for Registration** chip
- [ ] No bell notification for invitee (they have no account)

### Test scenario

1. User A invites `newfriend@gmail.com` (not registered)
2. Email contains sign-up link with return path
3. Owner sees pending card with "Waiting for Registration"
4. No row in invitee notifications (expected)

### Debug points

| Layer | What to verify |
|-------|----------------|
| Edge email branch | `sendRegistrationInvite` called, not `sendRegisteredInvite` |
| DB row | `invited_user_id` IS NULL |
| Owner UI | Registration status chip |

---

## Step 3 — User Registers

**Goal:** New user signs up; pending email invitations attach automatically. **No group join.**

```
User Registers
        ↓
handle_new_user trigger
        ↓
link_pending_invitations_to_user (DB)
        ↓
Attach invitation (`invited_user_id` set, `in_app` added to channels)
        ↓
Bell notification appears (realtime UPDATE)
        ↓
User must Accept to join group
```

### Checklist

- [ ] Registration flow preserves redirect (optional polish)
- [ ] Trigger links invitations by email (already in migration)
- [ ] `delivery_channels` gains `in_app` after link
- [ ] Realtime UPDATE invalidates invitee pending queries
- [ ] Bell badge increments
- [ ] **No** `group_members` INSERT on registration
- [ ] Accept flow (separate sub-step after Step 3) calls `accept_member_invitation`

### Test scenario

1. Complete Step 2 (invite `newfriend@gmail.com`)
2. User registers with that email
3. User logs in → bell shows invitation
4. User is **not** in `group_members` until Accept

### Debug points

| Layer | What to verify |
|-------|----------------|
| `auth.users` INSERT | Trigger fired |
| `link_pending_invitations_to_user` | Returns count ≥ 1 |
| Row after link | `invited_user_id` set, still `status=pending` |
| `group_members` | No new row |

---

## After Steps 1–3

| Feature | When |
|---------|------|
| Accept / Decline (full) | After Step 3 verified |
| Cancel / Resend | After accept flow |
| Replace mock hooks | Per step above |
| Move reads to Edge | Optional optimization |

---

## Do NOT do in Phase 3 initial pass

- Auto-join on registration
- Client-side Resend calls
- Service role key in frontend
- Implementing all steps in one PR

---

## Suggested PR order

1. `feat/invitations-step-1-registered` — Edge create + email + realtime + UI wire
2. `feat/invitations-step-2-unregistered` — Registration email branch
3. `feat/invitations-step-3-registration-link` — Verify trigger + bell + no auto-join
4. `feat/invitations-accept-decline` — Accept/decline Edge handlers + UI
