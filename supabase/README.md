# Supabase — Authentication Backend

SQL migrations for the Splitwise-inspired app. Apply via Supabase CLI or Dashboard SQL editor.

## Schema overview

```
auth.users (managed by Supabase Auth)
    │
    │  ON DELETE CASCADE
    ▼
public.profiles
    │
    ├── groups (created_by → profiles.id)
    │       ├── group_members (user_id → profiles.id)
    │       ├── group_guests (name-only participants, no account)
    │       ├── group_invitations (share-link invites)
    │       └── expenses (group_id → groups.id)
    │               ├── expense_participants (user_id OR guest_id)
    │               └── settlements (from_user_id, to_user_id → profiles)
    └── ...
```

### Guest participants

Name-only people (`group_guests`) can be added to a group without registering. They:

- Appear in member lists and expense participant pickers
- Participate in equal splits and balance calculations
- Can be selected as the payer on an expense

Registered members are still added by email or invite link.

### Expenses tables

| Table | Purpose |
|-------|---------|
| `expenses` | Shared group expenses (`split_type` = `equal` only in MVP) |
| `expense_participants` | Per-user `share_amount` for each expense |

### Groups tables

| Table | Purpose |
|-------|---------|
| `groups` | Expense-sharing groups with unique `invite_code` |
| `group_members` | Membership with roles: `owner`, `admin`, `member` |
| `group_guests` | Name-only participants without registered accounts |
| `group_invitations` | Active share-link invitations (one active per group) |

### RPC functions

| Function | Purpose |
|----------|---------|
| `create_group` | Creates group, owner membership, and active invite |
| `join_group_by_invite` | Adds authenticated user via invite code |
| `regenerate_group_invite` | Owner rotates the active invite link |
| `add_group_member_by_email` | Owner adds a registered user by email (no outbound email) |
| `add_group_guest_by_name` | Any member adds a name-only guest to the group |
| `create_expense` | Creates expense with equal split shares for members and guests |
| `update_expense` | Updates expense and rebuilds participant shares |
| `create_settlement` | Records a payment between group members |
| `get_profile_stats` | Returns group, expense, and total-paid counts for the current user |

### Settlements table

| Table | Purpose |
|-------|---------|
| `settlements` | Payments recorded between registered members to settle balances |

## RLS policies (profiles)

| Policy | Operation | Rule |
|--------|-----------|------|
| `profiles_select_own` | SELECT | `auth.uid() = id` |
| `profiles_select_group_peers` | SELECT | Users in the same group can read each other's profile |
| `profiles_update_own` | UPDATE | `auth.uid() = id` |

Profile **INSERT** is not granted to clients. The `handle_new_user` trigger (SECURITY DEFINER) creates rows on registration.

## Automatic profile creation

`on_auth_user_created` trigger fires `AFTER INSERT ON auth.users` and inserts into `public.profiles` using `raw_user_meta_data.full_name`.

## Apply migrations

### Option A — Supabase CLI (recommended)

```bash
# From repo root
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B — Dashboard

Run each file in `migrations/` in order in the Supabase SQL Editor.

## Regenerate TypeScript types

After applying migrations:

```bash
supabase gen types typescript --project-id <ref> > frontend/src/types/database.types.ts
```

## Auth redirect URLs (Supabase Dashboard → Authentication → URL Configuration)

| Type | URL |
|------|-----|
| Site URL | `http://localhost:3000` (dev) |
| Redirect URLs | `http://localhost:3000/auth/callback` |

## Security notes

- Never expose the **service role key** in the frontend.
- Only the **anon key** is used client-side.
- RLS is enabled on day one.
- Passwords are stored only in `auth.users` (Supabase-managed).
