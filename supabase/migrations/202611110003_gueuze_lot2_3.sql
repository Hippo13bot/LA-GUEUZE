-- LA GUEUZE lots 2-3 : additif uniquement.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.gueuze_items(
 id uuid primary key default gen_random_uuid(),
 production_id uuid not null references public.gueuze_productions(id) on delete cascade,
 kind text not null check (kind in ('location','contact','radio','equipment')),
 data jsonb not null default '{}'::jsonb,
 created_by uuid default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.gueuze_qr_tokens(
 id uuid primary key default gen_random_uuid(),
 production_id uuid not null references public.gueuze_productions(id) on delete cascade,
 label text not null default '', shoot_date date, token_hash text not null unique,
 expires_at timestamptz not null, revoked_at timestamptz,
 created_by uuid default auth.uid(), created_at timestamptz not null default now());
alter table public.gueuze_items enable row level security;
alter table public.gueuze_qr_tokens enable row level security;
create policy g_item_sel on public.gueuze_items for select to authenticated using (deleted_at is null and public.gueuze_role(production_id) is not null);
create policy g_item_ins on public.gueuze_items for insert to authenticated with check (public.gueuze_role(production_id) in ('owner','admin','dept_head'));
create policy g_item_upd on public.gueuze_items for update to authenticated using (public.gueuze_role(production_id) in ('owner','admin','dept_head')) with check (public.gueuze_role(production_id) in ('owner','admin','dept_head'));
create policy g_qr_sel on public.gueuze_qr_tokens for select to authenticated using (public.gueuze_role(production_id) in ('owner','admin'));

create or replace function public.gueuze_qr_create(p uuid, lbl text, day date, hours int) returns text
language plpgsql security definer set search_path=public,extensions as $$
declare t text; begin
 if public.gueuze_role(p) not in ('owner','admin') then raise exception 'forbidden'; end if;
 if hours<1 or hours>720 then raise exception 'invalid duration'; end if;
 t:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 insert into public.gueuze_qr_tokens(production_id,label,shoot_date,token_hash,expires_at)
  values(p,coalesce(lbl,''),day,encode(digest(t,'sha256'),'hex'),now()+make_interval(hours=>hours));
 insert into public.gueuze_audit_log(production_id,action,target) values(p,'qr.create',coalesce(lbl,''));
 return t; end $$;
create or replace function public.gueuze_qr_revoke(tid uuid) returns void
language plpgsql security definer set search_path=public as $$
declare p uuid; begin select production_id into p from public.gueuze_qr_tokens where id=tid;
 if p is null or public.gueuze_role(p) not in ('owner','admin') then raise exception 'forbidden'; end if;
 update public.gueuze_qr_tokens set revoked_at=now() where id=tid;
 insert into public.gueuze_audit_log(production_id,action,target) values(p,'qr.revoke',tid::text); end $$;
-- Validation côté serveur : ne renvoie QUE les feuilles publiées, jamais d'annuaire ni de documents.
create or replace function public.gueuze_qr_open(tok text) returns jsonb
language plpgsql security definer set search_path=public,extensions as $$
declare r public.gueuze_qr_tokens; begin
 select * into r from public.gueuze_qr_tokens where token_hash=encode(digest(coalesce(tok,''),'sha256'),'hex') and revoked_at is null and expires_at>now();
 if not found then return null; end if;
 return jsonb_build_object('production',(select name from public.gueuze_productions where id=r.production_id),'expires_at',r.expires_at,
  'sheets',coalesce((select jsonb_agg(jsonb_build_object('shoot_date',shoot_date,'title',title,'content',content) order by shoot_date)
   from public.gueuze_callsheets where production_id=r.production_id and status='published' and deleted_at is null and (r.shoot_date is null or shoot_date=r.shoot_date)),'[]'::jsonb)); end $$;
revoke all on function public.gueuze_qr_create(uuid,text,date,int), public.gueuze_qr_revoke(uuid), public.gueuze_qr_open(text) from public;
grant execute on function public.gueuze_qr_create(uuid,text,date,int), public.gueuze_qr_revoke(uuid) to authenticated;
grant execute on function public.gueuze_qr_open(text) to anon, authenticated;

-- Documents : bucket privé, dossier = id de production.
insert into storage.buckets(id,name,public) values('gueuze-docs','gueuze-docs',false) on conflict(id) do nothing;
create policy g_doc_sel on storage.objects for select to authenticated using (bucket_id='gueuze-docs' and public.gueuze_role(((storage.foldername(name))[1])::uuid) is not null);
create policy g_doc_ins on storage.objects for insert to authenticated with check (bucket_id='gueuze-docs' and public.gueuze_role(((storage.foldername(name))[1])::uuid) in ('owner','admin','dept_head'));
create policy g_doc_del on storage.objects for delete to authenticated using (bucket_id='gueuze-docs' and public.gueuze_role(((storage.foldername(name))[1])::uuid) in ('owner','admin'));
