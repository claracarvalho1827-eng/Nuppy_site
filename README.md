# Nuppy — site de marketing

Site estático (HTML, CSS e JavaScript puros). Sem build, sem framework e sem dependências.

## Estrutura

- `index.html` — página única
- `a11y.css` / `a11y.js` — barra de acessibilidade
- `premium.css` / `premium.js` — efeitos visuais
- `img/` — fotos e mascotes
- `vercel.json` — redirecionamentos e cache

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
