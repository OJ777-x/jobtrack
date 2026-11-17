-- Fixes a bug: the original schema.sql never gave staff permission to
-- UPDATE their own organisation's row, so the new Settings page (company
-- name / colours / logo) silently did nothing. Run this once, in addition
-- to the earlier SQL files already run.

drop policy if exists "own organisation updatable by staff" on organisations;

create policy "own organisation updatable by staff" on organisations
  for update using (id = profile_org_id() and profile_role() in ('manager', 'worker'))
  with check (id = profile_org_id() and profile_role() in ('manager', 'worker'));
