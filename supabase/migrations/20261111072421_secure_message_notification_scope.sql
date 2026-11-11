-- Development-only hardening for recipient privacy and message authorship.
-- Production is intentionally not touched by this migration.

-- Notifications: recipients can see their own notifications and update only read state.
drop policy if exists active_members_select_notifications on public.notifications;
drop policy if exists active_members_insert_notifications on public.notifications;
drop policy if exists active_members_update_notifications on public.notifications;
drop policy if exists active_members_delete_notifications on public.notifications;

create policy notifications_select_recipient
on public.notifications
for select to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_org_member(organization_id))
);

create policy notifications_insert_self
on public.notifications
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select private.is_active_org_member(organization_id))
);

create policy notifications_update_read_state
on public.notifications
for update to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_active_org_member(organization_id))
)
with check (
  user_id = (select auth.uid())
  and (select private.is_active_org_member(organization_id))
);

revoke update on table public.notifications from authenticated;
grant update (is_read, read_at) on table public.notifications to authenticated;
revoke delete on table public.notifications from authenticated;

-- Messages: only sender/recipient can read. The current UI creates drafts only.
drop policy if exists active_members_select_messages on public.messages;
drop policy if exists active_members_insert_messages on public.messages;
drop policy if exists active_members_update_messages on public.messages;
drop policy if exists active_members_delete_messages on public.messages;

create policy messages_select_participant
on public.messages
for select to authenticated
using (
  (sender_user_id = (select auth.uid()) or recipient_user_id = (select auth.uid()))
  and (select private.is_active_org_member(organization_id))
);

create policy messages_insert_as_sender
on public.messages
for insert to authenticated
with check (
  sender_user_id = (select auth.uid())
  and (select private.is_active_org_member(organization_id))
  and (
    recipient_user_id is null
    or exists (
      select 1
      from public.organization_members recipient
      where recipient.organization_id = messages.organization_id
        and recipient.user_id = messages.recipient_user_id
        and recipient.status = 'active'
    )
  )
);

-- Client-side editing/deletion remains disabled until draft/delivery lifecycle
-- and recipient read-receipt behaviour are implemented and tested.
revoke update, delete on table public.messages from authenticated;
