-- Enable Supabase Realtime for collaborative tables.
-- RLS still applies — users only receive events for rows they can read.

alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_participants;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.group_guests;
alter publication supabase_realtime add table public.groups;
