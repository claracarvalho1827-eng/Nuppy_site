# Nuppy — site de marketing

Site estático (HTML, CSS e JavaScript puros). Sem build, sem framework e sem dependências.

## Estrutura

- `index.html` — página única
- `a11y.css` / `a11y.js` — barra de acessibilidade
- `premium.css` / `premium.js` — efeitos visuais
- `img/` — fotos e mascotes
- `vercel.json` — redirecionamentos, cache e URLs sem .html
- `entrar.html` — login do administrador (botão "Entrar" do menu, rota `/entrar`)
- `admin.html` / `admin.js` / `admin.css` — painel: solicitações, reclamações, configurações (rota `/admin`)
- `login.css` — visual do login e da tela de nova senha (foto desfocada, cores Nuppy)
- `redefinir.html` — tela aberta pelo link de "Perdeu sua senha?"
- `admin-core.js` — conexão com o Supabase e checagem de administrador
- `supabase-config.js` — URL e chave anon do Supabase para login/painel
- `supabase/admin.sql` — tabelas, políticas RLS e funções do painel

## Rodar localmente

Abra o `index.html` no navegador, ou use um servidor simples:

```sh
npx serve .
```

## Publicar na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: Add New > Project > importe o repositório.
3. Framework Preset: **Other**. Build Command e Output Directory: deixe em branco.
4. Deploy.

## Formulário de parceria

No final do `index.html`, preencha as duas constantes com os dados do seu projeto Supabase:

```js
const SUPABASE_URL = "https://xxxx.supabase.co";
const SUPABASE_ANON_KEY = "chave anon (pública)";
```

Nunca use a `service_role` no frontend. A tabela `partnership_requests` precisa ter RLS com política de INSERT para `anon`.

## Painel administrador

1. Preencha `supabase-config.js` com a mesma URL e chave anon do `index.html`.
2. No Supabase, rode `supabase/admin.sql` no SQL Editor.
3. Garanta que a sua conta tem o papel `admin` em `user_roles` (se já é admin no app, nada a fazer; senão, use o último trecho do SQL).
4. Em Supabase > Authentication > URL Configuration, adicione `https://SEU-DOMINIO/redefinir` em Redirect URLs (necessário para "Perdeu sua senha?").
5. Publique de novo na Vercel. O botão "Entrar" leva a `/entrar`; só contas com papel `admin` em `user_roles` chegam a `/admin`.
