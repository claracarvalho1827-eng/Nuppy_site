-- =====================================================================
-- Nuppy — painel administrador (adaptado ao schema atual do app)
-- Supabase > SQL Editor > New query > cole tudo > Run.
-- Pode rodar mais de uma vez. Não altera nada do que já existe, só
-- acrescenta (partnership_requests, reclamacoes, coluna places.site,
-- policies e funções do painel).
--
-- Reaproveita o que o app já tem:
--   * quem é administrador  -> user_roles (role = 'admin') + has_role()
--   * estabelecimentos      -> tabela places (já é só-admin para escrever)
-- =====================================================================

-- 1) SOLICITAÇÕES DE PARCERIA (formulário público do site) ------------
create table if not exists public.partnership_requests (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null check (char_length(company_name) <= 120),
  contact_name text not null check (char_length(contact_name) <= 120),
  email        text not null check (char_length(email) <= 160),
  phone        text check (char_length(phone) <= 30),
  segment      text not null check (char_length(segment) <= 60),
  city_state   text not null check (char_length(city_state) <= 100),
  address      text check (char_length(address) <= 200),
  site         text check (char_length(site) <= 200),
  services     text not null check (char_length(services) <= 1500),
  notes        text check (char_length(notes) <= 1500),
  consent      boolean not null check (consent = true),
  created_at   timestamptz not null default now()
);

-- Visitante (anon) só consegue ENVIAR. Administrador lê e exclui.
grant insert on public.partnership_requests to anon;
grant select, delete on public.partnership_requests to authenticated;
grant all on public.partnership_requests to service_role;
alter table public.partnership_requests enable row level security;

drop policy if exists "anon envia solicitacao" on public.partnership_requests;
create policy "anon envia solicitacao"
  on public.partnership_requests for insert to anon
  with check (consent = true);

drop policy if exists "admin le solicitacoes" on public.partnership_requests;
create policy "admin le solicitacoes"
  on public.partnership_requests for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin exclui solicitacoes" on public.partnership_requests;
create policy "admin exclui solicitacoes"
  on public.partnership_requests for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 2) PLACES: guarda o site da empresa aprovada ------------------------
-- (e-mail e nome do responsável NÃO vão para places, porque places é
--  público: qualquer visitante do app lê essa tabela.)
alter table public.places add column if not exists site text;

-- 3) ACEITAR / RECUSAR ------------------------------------------------
-- Aceitar: cria o registro em places e apaga da fila, tudo ou nada.
-- places exige latitude e longitude; o formulário não tem, então o
-- administrador informa no momento de aceitar.
create or replace function public.aprovar_solicitacao(
  p_id text, p_category text, p_lat double precision, p_lng double precision
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare r public.partnership_requests%rowtype;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if p_category is null or btrim(p_category) = '' then
    raise exception 'Categoria obrigatória' using errcode = '22023';
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Coordenadas inválidas' using errcode = '22023';
  end if;

  select * into r from public.partnership_requests where id::text = p_id for update;
  if not found then
    raise exception 'Solicitação não encontrada' using errcode = 'P0002';
  end if;

  insert into public.places
    (name, category, description, address, city, lat, lng, phone, site, created_by)
  values
    (r.company_name, btrim(p_category),
     r.services || coalesce(E'\n\n' || r.notes, ''),
     r.address, r.city_state, p_lat, p_lng, r.phone, r.site, auth.uid());

  delete from public.partnership_requests where id = r.id;
end;
$$;

-- Recusar: exclui os dados da solicitação (sem volta).
create or replace function public.recusar_solicitacao(p_id text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  delete from public.partnership_requests where id::text = p_id;
  if not found then
    raise exception 'Solicitação não encontrada' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.aprovar_solicitacao(text, text, double precision, double precision) from public, anon;
revoke all on function public.recusar_solicitacao(text) from public, anon;
grant execute on function public.aprovar_solicitacao(text, text, double precision, double precision) to authenticated;
grant execute on function public.recusar_solicitacao(text) to authenticated;

-- 4) RECLAMAÇÕES (o app grava, o painel lê e resolve) -----------------
-- Seu schema ainda não tem tabela de reclamações; esta é nova.
create table if not exists public.reclamacoes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null default auth.uid(),
  nome          text,
  email         text,
  assunto       text,
  mensagem      text not null check (char_length(mensagem) <= 3000),
  status        text not null default 'aberta' check (status in ('aberta', 'resolvida')),
  created_at    timestamptz not null default now(),
  resolvida_em  timestamptz,
  resolvida_por uuid references auth.users(id) on delete set null
);
create index if not exists reclamacoes_status_idx on public.reclamacoes (status, created_at desc);

grant select, insert, update on public.reclamacoes to authenticated;
grant all on public.reclamacoes to service_role;
alter table public.reclamacoes enable row level security;

-- Usuário logado no app envia (sempre como "aberta" e em nome dele).
drop policy if exists "usuarios enviam reclamacao" on public.reclamacoes;
create policy "usuarios enviam reclamacao"
  on public.reclamacoes for insert to authenticated
  with check (status = 'aberta' and user_id = auth.uid());

drop policy if exists "admin le reclamacoes" on public.reclamacoes;
create policy "admin le reclamacoes"
  on public.reclamacoes for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin resolve reclamacoes" on public.reclamacoes;
create policy "admin resolve reclamacoes"
  on public.reclamacoes for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 5) TORNAR ALGUÉM ADMINISTRADOR ---------------------------------------
-- Se a sua conta já é admin em user_roles, pule este passo.
-- Senão: crie o usuário em Authentication > Users (ou use um existente),
-- troque o e-mail abaixo e rode SÓ este trecho:
--
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'seu-email@exemplo.com'
-- on conflict (user_id, role) do nothing;
