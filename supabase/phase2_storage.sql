-- Phase 2 addition: a private storage bucket for job photos/documents, plus
-- access rules mirroring the job_photos table's RLS (staff see their org's
-- jobs, customers see only their own). Run this ONCE, in addition to the
-- original schema.sql (it does not touch any existing tables/data).
--
-- Files are stored at the path "<job_id>/<filename>" inside the bucket, which
-- is how these policies know which job a file belongs to.

insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

drop policy if exists "job-photos: staff read" on storage.objects;
drop policy if exists "job-photos: customer read own" on storage.objects;
drop policy if exists "job-photos: staff write" on storage.objects;
drop policy if exists "job-photos: staff delete" on storage.objects;

create policy "job-photos: staff read" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and profile_role() in ('manager', 'worker')
    and exists (
      select 1 from jobs j
      where j.id::text = (storage.foldername(name))[1]
        and j.org_id = profile_org_id()
    )
  );

create policy "job-photos: customer read own" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and exists (
      select 1 from jobs j
      where j.id::text = (storage.foldername(name))[1]
        and j.customer_id = profile_customer_id()
    )
  );

create policy "job-photos: staff write" on storage.objects
  for insert with check (
    bucket_id = 'job-photos'
    and profile_role() in ('manager', 'worker')
    and exists (
      select 1 from jobs j
      where j.id::text = (storage.foldername(name))[1]
        and j.org_id = profile_org_id()
    )
  );

create policy "job-photos: staff delete" on storage.objects
  for delete using (
    bucket_id = 'job-photos'
    and profile_role() in ('manager', 'worker')
    and exists (
      select 1 from jobs j
      where j.id::text = (storage.foldername(name))[1]
        and j.org_id = profile_org_id()
    )
  );
