-- Phase 8 addition: a public storage bucket for organisation logos, so
-- managers can upload a logo in Settings. Public because a logo needs to be
-- shown in the app header with no auth required to render the <img>. Run
-- this once, in addition to schema.sql and phase2_storage.sql.
--
-- Files are stored at the path "<org_id>/<filename>".

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

drop policy if exists "org-logos: staff write" on storage.objects;
drop policy if exists "org-logos: staff update" on storage.objects;

create policy "org-logos: staff write" on storage.objects
  for insert with check (
    bucket_id = 'org-logos'
    and profile_role() in ('manager', 'worker')
    and (storage.foldername(name))[1] = profile_org_id()::text
  );

create policy "org-logos: staff update" on storage.objects
  for update using (
    bucket_id = 'org-logos'
    and profile_role() in ('manager', 'worker')
    and (storage.foldername(name))[1] = profile_org_id()::text
  );
