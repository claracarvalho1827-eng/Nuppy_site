/* Nuppy — núcleo compartilhado do login e do painel: conexão com o Supabase e checagem de administrador */
(() => {
  "use strict";
  const url = window.NUPPY_SUPABASE_URL, key = window.NUPPY_SUPABASE_ANON_KEY;
  const configurado = Boolean(url && key && window.supabase);
  const FLAG = "nuppy-admin-lembrar";

  // "Lembre-me" marcado: sessão fica no navegador (localStorage).
  // Desmarcado: a sessão acaba quando a aba é fechada (sessionStorage).
  const lembrando = () => { try { return localStorage.getItem(FLAG) === "1"; } catch (e) { return false; } };
  const conectar = () => configurado
    ? window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, storage: lembrando() ? window.localStorage : window.sessionStorage }
      })
    : null;

  let db = conectar();

  // Chamado pelo login antes de entrar, conforme a caixa "Lembre-me"
  function definirLembrar(sim) {
    try {
      localStorage.setItem(FLAG, sim ? "1" : "0");
      if (!sim) Object.keys(localStorage).filter((k) => /^sb-.*-auth-token/.test(k)).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    db = conectar();
  }

  // true somente se o usuário tiver o papel "admin" na tabela user_roles (a mesma do app).
  // (A proteção de verdade está nas políticas RLS do banco; esta checagem só decide qual tela mostrar.)
  async function ehAdmin(userId) {
    const { data, error } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    return !error && Boolean(data);
  }

  // Retorna { user, nome } se há sessão válida de administrador; senão, null.
  async function sessaoAdmin() {
    if (!db) return null;
    const { data } = await db.auth.getSession();
    const user = data && data.session && data.session.user;
    if (!user) return null;
    return (await ehAdmin(user.id)) ? user : null;
  }

  window.Nuppy = { get db() { return db; }, configurado, ehAdmin, sessaoAdmin, definirLembrar, lembrando };
})();
