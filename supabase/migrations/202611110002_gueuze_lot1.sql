-- LA GUEUZE lot 1 : additif uniquement (aucun DROP, aucune table HIPPO CORE / Caverne modifiée).
-- Réutilise auth.users et public.workspaces (HIPPO CORE) ; les rôles de production sont propres à LA GUEUZE.
create table if not exists public.gueuze_productions(
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid references public.workspaces(id),
 name text not null check (length(trim(name))>0),
 status text not null default 'preparation' check (status in ('preparation','tournage','post','archivee')),
 start_date date, end_date date, notes text not null default '',
 created_by uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.gueuze_memberships(
 production_id uuid not null references public.gueuze_productions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'crew' check (role in ('owner','admin','dept_head','crew','viewer')),
 department text not null default '', created_at timestamptz not null default now(),
 primary key(production_id,user_id));
create table if not exists public.gueuze_callsheets(
 id uuid primary key default gen_random_uuid(),
 production_id uuid not null references public.gueuze_productions(id) on delete cascade,
 shoot_date date not null, title text not null default '',
 status text not null default 'draft' check (status in ('draft','validated','published')),
 content jsonb not null default '{}'::jsonb, version int not null default 1,
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table if not exists public.gueuze_callsheet_versions(
 callsheet_id uuid not null references public.gueuze_callsheets(id) on delete cascade,
 version int not null, status text not null, content jsonb not null,
 saved_by uuid default auth.uid(), saved_at timestamptz not null default now(), primary key(callsheet_id,version));
create table if not exists public.gueuze_audit_log(
 id bigint generated always as identity primary key, production_id uuid, actor uuid default auth.uid(),
 action text not null, target text, detail jsonb, at timestamptz not null default now());

create or replace function public.gueuze_role(p uuid) returns text language sql stable security definer set search_path=public as
$$ select role from public.gueuze_memberships where production_id=p and user_id=auth.uid() $$;

create or replace function public.gueuze_touch() returns trigger language plpgsql as
$$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists t_touch_prod on public.gueuze_productions;
create trigger t_touch_prod before update on public.gueuze_productions for each row execute function public.gueuze_touch();

create or replace function public.gueuze_prod_owner() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into public.gueuze_memberships(production_id,user_id,role) values(new.id,new.created_by,'owner');
 insert into public.gueuze_audit_log(production_id,action,target) values(new.id,'production.create',new.id::text); return new; end $$;
drop trigger if exists t_prod_owner on public.gueuze_productions;
create trigger t_prod_owner after insert on public.gueuze_productions for each row execute function public.gueuze_prod_owner();

create or replace function public.gueuze_sheet_hist() returns trigger language plpgsql security definer set search_path=public as
$$ begin
 if tg_op='UPDATE' then new.version=old.version+1; new.updated_at=now(); new.updated_by=auth.uid(); end if;
 insert into public.gueuze_callsheet_versions(callsheet_id,version,status,content) values(new.id,new.version,new.status,new.content);
 insert into public.gueuze_audit_log(production_id,action,target,detail) values(new.production_id,'callsheet.'||lower(tg_op),new.id::text,jsonb_build_object('status',new.status,'version',new.version));
 return new; end $$;
drop trigger if exists t_sheet_ins on public.gueuze_callsheets; drop trigger if exists t_sheet_upd on public.gueuze_callsheets;
create trigger t_sheet_upd before update on public.gueuze_callsheets for each row execute function public.gueuze_sheet_hist();
create or replace function public.gueuze_sheet_hist_ins() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into public.gueuze_callsheet_versions(callsheet_id,version,status,content) values(new.id,new.version,new.status,new.content); return new; end $$;
create trigger t_sheet_ins after insert on public.gueuze_callsheets for each row execute function public.gueuze_sheet_hist_ins();
-- NB : le trigger BEFORE UPDATE ci-dessus insère la version dans l'historique avant la ligne ; l'ordre est géré par la PK (callsheet_id,version).

-- Ajout d'un membre : uniquement un compte Supabase Auth EXISTANT, retrouvé par e-mail, par un admin de la production.
create or replace function public.gueuze_add_member(p uuid, member_email text, member_role text, dept text default '')
returns void language plpgsql security definer set search_path=public,auth as $$
declare u uuid; begin
 if public.gueuze_role(p) not in ('owner','admin') then raise exception 'forbidden'; end if;
 if member_role not in ('admin','dept_head','crew','viewer') then raise exception 'invalid role'; end if;
 select id into u from auth.users where lower(email)=lower(trim(member_email));
 if u is null then raise exception 'no_account'; end if;
 insert into public.gueuze_memberships(production_id,user_id,role,department) values(p,u,member_role,dept)
  on conflict(production_id,user_id) do update set role=excluded.role, department=excluded.department;
 insert into public.gueuze_audit_log(production_id,action,target) values(p,'member.set',u::text); end $$;
revoke all on function public.gueuze_add_member(uuid,text,text,text) from public, anon;
grant execute on function public.gueuze_add_member(uuid,text,text,text) to authenticated;

alter table public.gueuze_productions enable row level security;
alter table public.gueuze_memberships enable row level security;
alter table public.gueuze_callsheets enable row level security;
alter table public.gueuze_callsheet_versions enable row level security;
alter table public.gueuze_audit_log enable row level security;

create policy g_prod_sel on public.gueuze_productions for select to authenticated using (public.gueuze_role(id) is not null);
create policy g_prod_ins on public.gueuze_productions for insert to authenticated with check (created_by=auth.uid());
create policy g_prod_upd on public.gueuze_productions for update to authenticated using (public.gueuze_role(id) in ('owner','admin')) with check (public.gueuze_role(id) in ('owner','admin'));
create policy g_mem_sel on public.gueuze_memberships for select to authenticated using (public.gueuze_role(production_id) is not null);
create policy g_mem_upd on public.gueuze_memberships for update to authenticated using (public.gueuze_role(production_id) in ('owner','admin') and role<>'owner') with check (role<>'owner');
create policy g_mem_del on public.gueuze_memberships for delete to authenticated using (public.gueuze_role(production_id) in ('owner','admin') and role<>'owner');
create policy g_sheet_sel on public.gueuze_callsheets for select to authenticated using (
 deleted_at is null and (public.gueuze_role(production_id) in ('owner','admin','dept_head') or (status='published' and public.gueuze_role(production_id) is not null)));
create policy g_sheet_ins on public.gueuze_callsheets for insert to authenticated with check (public.gueuze_role(production_id) in ('owner','admin','dept_head') and created_by=auth.uid());
create policy g_sheet_upd on public.gueuze_callsheets for update to authenticated using (public.gueuze_role(production_id) in ('owner','admin')) with check (public.gueuze_role(production_id) in ('owner','admin'));
create policy g_hist_sel on public.gueuze_callsheet_versions for select to authenticated using (exists(select 1 from public.gueuze_callsheets s where s.id=callsheet_id and public.gueuze_role(s.production_id) in ('owner','admin')));
create policy g_audit_sel on public.gueuze_audit_log for select to authenticated using (public.gueuze_role(production_id) in ('owner','admin'));

do $$ begin
 alter publication supabase_realtime add table public.gueuze_productions, public.gueuze_callsheets, public.gueuze_memberships;
exception when others then raise notice 'realtime publication: %', sqlerrm; end $$;
