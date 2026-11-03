/* Nuppy — painel administrador: solicitações, reclamações e configurações */
(async () => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { db } = window.Nuppy;

  const VIEWS = ["solicitacoes", "reclamacoes", "configuracoes"];

  /* ---------- utilidades ---------- */
  // Cria elementos com textContent (nunca innerHTML) para que nada digitado por terceiros vire código
  function el(tag, props = {}, ...filhos) {
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    filhos.flat().forEach((f) => f != null && n.append(f));
    return n;
  }
  const data = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };
  const urlSegura = (u) => /^https?:\/\//i.test(u || "");

  let toastTimer;
  function aviso(texto, classe = "ok") {
    const t = $("#toast");
    t.hidden = false; t.className = "toast msg " + classe; t.textContent = texto;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 5000);
  }
  function setMsg(id, texto, classe) {
    const m = $(id); m.hidden = !texto; m.className = "msg " + classe; m.textContent = texto || "";
  }
  function badge(id, n) {
    const b = $(id); b.textContent = n; b.hidden = !n;
    b.setAttribute("aria-label", n + (n === 1 ? " pendente" : " pendentes"));
  }
  function vazio(titulo, texto) {
    return el("div", { class: "empty" }, el("strong", { text: titulo }), texto);
  }

  /* ---------- acesso ---------- */
  if (!window.Nuppy.configurado) {
    $("#verificando").textContent = "O painel ainda não está configurado (preencha o supabase-config.js).";
    return;
  }
  const user = await window.Nuppy.sessaoAdmin();
  if (!user) { location.replace("/entrar"); return; }

  db.auth.onAuthStateChange((evento) => { if (evento === "SIGNED_OUT") location.replace("/entrar"); });

  $("#verificando").hidden = true;
  $("#app").hidden = false;
  const nomeDe = (u) => (u.user_metadata && u.user_metadata.nome) || u.email;
  $("#quem").textContent = nomeDe(user);

  async function sair() { await db.auth.signOut(); location.replace("/entrar"); }
  $("#sair").addEventListener("click", sair);
  $("#sair2").addEventListener("click", sair);

  /* ---------- confirmação (diálogo) ---------- */
  const dlg = $("#dlg");
  function confirmar(titulo, texto, rotulo) {
    $("#dlg-t").textContent = titulo; $("#dlg-p").textContent = texto; $("#dlg-yes").textContent = rotulo;
    return new Promise((resolve) => {
      const fim = (v) => { dlg.close(); $("#dlg-yes").onclick = $("#dlg-no").onclick = null; resolve(v); };
      $("#dlg-yes").onclick = () => fim(true);
      $("#dlg-no").onclick = () => fim(false);
      dlg.addEventListener("cancel", () => resolve(false), { once: true });
      dlg.showModal();
    });
  }

  /* ---------- 1. SOLICITAÇÕES ---------- */
  async function carregarSolicitacoes() {
    const lista = $("#lista-sol");
    lista.replaceChildren(el("p", { class: "loading", text: "Carregando…" }));

    let r = await db.from("partnership_requests").select("*").order("created_at", { ascending: false });
    if (r.error) r = await db.from("partnership_requests").select("*"); // caso a tabela não tenha created_at
    if (r.error) { lista.replaceChildren(el("div", { class: "msg bad", text: "Não foi possível carregar as solicitações." })); return; }

    badge("#b-sol", r.data.length);
    if (!r.data.length) { lista.replaceChildren(vazio("Nenhuma solicitação pendente", "Quando uma empresa enviar o formulário do site, ela aparece aqui.")); return; }
    lista.replaceChildren(...r.data.map(cartaoSolicitacao));
  }

  function linha(rotulo, valor) {
    return valor ? [el("dt", { text: rotulo }), el("dd", { text: valor })] : [];
  }

  // Categorias já usadas na tabela places do app
  const CATEGORIAS = ["Veterinário", "Banho", "Hotel", "Alimentação", "ONG", "Parque", "Outro"];
  const PALPITE = { "Clínica veterinária": "Veterinário" };
  const COORD = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

  function cartaoSolicitacao(s) {
    const site = s.site ? (urlSegura(s.site)
      ? [el("dt", { text: "Site" }), el("dd", {}, el("a", { href: s.site, target: "_blank", rel: "noopener noreferrer", text: s.site }))]
      : linha("Site", s.site)) : [];

    // Painel que abre ao clicar em "Aceitar": places precisa de categoria e coordenadas
    const idc = "cat-" + s.id, idl = "ll-" + s.id;
    const mapa = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([s.address, s.city_state].filter(Boolean).join(", "));
    const erro = el("p", { class: "msg bad", role: "alert", hidden: true });
    const sel = el("select", { id: idc },
      el("option", { value: "", text: "Selecione" }),
      CATEGORIAS.map((c) => el("option", { value: c, text: c, selected: c === PALPITE[s.segment] })));
    const coord = el("input", { id: idl, inputmode: "decimal", autocomplete: "off", placeholder: "-23.5779, -46.6712" });

    const painel = el("form", { class: "aceite", novalidate: true, hidden: true,
      onsubmit: (e) => {
        e.preventDefault();
        const m = COORD.exec(coord.value);
        let msg = "";
        if (!sel.value) msg = "Escolha a categoria.";
        else if (!m) msg = "Informe as coordenadas como latitude e longitude, por exemplo: -23.5779, -46.6712.";
        else if (Math.abs(+m[1]) > 90 || Math.abs(+m[2]) > 180) msg = "Coordenadas fora do intervalo válido.";
        erro.hidden = !msg; erro.textContent = msg;
        if (msg) { (sel.value ? coord : sel).focus(); return; }
        decidir(card, s, "aprovar", e.submitter, { p_category: sel.value, p_lat: +m[1], p_lng: +m[2] });
      } },
      el("p", { class: "hint", text: "Para entrar no mapa do app, informe a categoria e a localização da empresa." }),
      el("div", { class: "field" }, el("label", { for: idc, text: "Categoria" }), sel),
      el("div", { class: "field" },
        el("label", { for: idl, text: "Coordenadas (latitude, longitude)" }), coord,
        el("p", { class: "hint" },
          "No Google Maps, clique com o botão direito no local e copie os números. ",
          el("a", { href: mapa, target: "_blank", rel: "noopener noreferrer", text: "Abrir endereço no Google Maps" }))),
      erro,
      el("div", { class: "actions" },
        el("button", { class: "btn primary sm", type: "submit", text: "Confirmar e aceitar" }),
        el("button", { class: "btn soft sm", type: "button", text: "Cancelar", onclick: () => { painel.hidden = true; aceitar.hidden = false; aceitar.focus(); } })));

    const aceitar = el("button", { class: "btn primary sm", type: "button", text: "Aceitar",
      onclick: () => { painel.hidden = false; aceitar.hidden = true; sel.focus(); } });

    const card = el("article", { class: "card", "aria-label": "Solicitação de " + s.company_name },
      el("div", { class: "card-top" },
        el("div", {},
          el("h3", { text: s.company_name }),
          el("div", { class: "meta" },
            el("span", { class: "tag", text: s.segment }),
            el("span", { class: "tag beige", text: s.city_state }))),
        el("span", { class: "date", text: data(s.created_at) })),
      el("dl", {},
        linha("Responsável", s.contact_name), linha("E-mail", s.email), linha("Telefone", s.phone),
        linha("Endereço", s.address), site, linha("Serviços", s.services), linha("Informações extras", s.notes)),
      el("div", { class: "actions" },
        aceitar,
        el("button", { class: "btn danger sm", type: "button", text: "Recusar", onclick: (e) => decidir(card, s, "recusar", e.currentTarget) })),
      painel);
    return card;
  }

  async function decidir(card, s, acao, botao, extra = {}) {
    if (acao === "recusar") {
      const ok = await confirmar("Recusar solicitação?", "Os dados de " + s.company_name + " serão excluídos e não poderão ser recuperados.", "Excluir dados");
      if (!ok) { botao.focus(); return; }
    }
    $$("button", card).forEach((b) => (b.disabled = true));
    const { error } = await db.rpc(acao === "aprovar" ? "aprovar_solicitacao" : "recusar_solicitacao", { p_id: String(s.id), ...extra });
    if (error) {
      $$("button", card).forEach((b) => (b.disabled = false));
      aviso("Não foi possível concluir. Tente novamente.", "bad");
      return;
    }
    card.remove();
    aviso(acao === "aprovar" ? s.company_name + " foi aceita e enviada para estabelecimentos." : "Solicitação de " + s.company_name + " recusada e excluída.");
    const restantes = $$("#lista-sol article").length;
    badge("#b-sol", restantes);
    if (!restantes) $("#lista-sol").replaceChildren(vazio("Nenhuma solicitação pendente", "Quando uma empresa enviar o formulário do site, ela aparece aqui."));
    $("#h-sol").focus();
  }

  /* ---------- 2. RECLAMAÇÕES ---------- */
  async function carregarReclamacoes() {
    const lista = $("#lista-rec");
    lista.replaceChildren(el("p", { class: "loading", text: "Carregando…" }));

    const { data: rows, error } = await db.from("reclamacoes").select("*").eq("status", "aberta").order("created_at", { ascending: false });
    if (error) { lista.replaceChildren(el("div", { class: "msg bad", text: "Não foi possível carregar as reclamações." })); return; }

    badge("#b-rec", rows.length);
    if (!rows.length) { lista.replaceChildren(vazio("Nenhuma reclamação em aberto", "As reclamações enviadas pelo aplicativo aparecem aqui.")); return; }
    lista.replaceChildren(...rows.map(cartaoReclamacao));
  }

  function cartaoReclamacao(c) {
    const card = el("article", { class: "card", "aria-label": "Reclamação: " + (c.assunto || "sem assunto") },
      el("div", { class: "card-top" },
        el("div", {},
          el("h3", { text: c.assunto || "Sem assunto" }),
          el("div", { class: "meta" },
            c.nome ? el("span", { class: "tag", text: c.nome }) : null,
            c.email ? el("span", { class: "tag beige", text: c.email }) : null)),
        el("span", { class: "date", text: data(c.created_at) })),
      el("p", { class: "msg-text", text: c.mensagem }),
      el("div", { class: "actions" },
        el("button", { class: "btn primary sm", type: "button", text: "Marcar como resolvida", onclick: (e) => resolver(card, c, e.currentTarget) })));
    return card;
  }

  async function resolver(card, c, botao) {
    botao.disabled = true;
    const { data: ok, error } = await db.from("reclamacoes")
      .update({ status: "resolvida", resolvida_em: new Date().toISOString(), resolvida_por: user.id })
      .eq("id", c.id).select("id");
    if (error || !ok || !ok.length) { botao.disabled = false; aviso("Não foi possível marcar como resolvida. Tente novamente.", "bad"); return; }
    card.remove();
    aviso("Reclamação marcada como resolvida.");
    const restantes = $$("#lista-rec article").length;
    badge("#b-rec", restantes);
    if (!restantes) $("#lista-rec").replaceChildren(vazio("Nenhuma reclamação em aberto", "As reclamações enviadas pelo aplicativo aparecem aqui."));
    $("#h-rec").focus();
  }

  /* ---------- 3. CONFIGURAÇÕES ---------- */
  $("#c-email").value = user.email || "";
  $("#c-nome").value = (user.user_metadata && user.user_metadata.nome) || "";

  $("#f-perfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = $("#c-nome").value.trim();
    const { data: r, error } = await db.auth.updateUser({ data: { nome } });
    if (error) { setMsg("#s-perfil", "Não foi possível salvar o nome.", "bad"); return; }
    $("#quem").textContent = nomeDe(r.user);
    setMsg("#s-perfil", "Nome atualizado.", "ok");
  });

  $("#f-senha").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nova = $("#c-nova").value, conf = $("#c-conf").value;
    if (nova.length < 8) { setMsg("#s-senha", "A senha precisa ter pelo menos 8 caracteres.", "bad"); $("#c-nova").focus(); return; }
    if (nova !== conf) { setMsg("#s-senha", "As senhas não são iguais.", "bad"); $("#c-conf").focus(); return; }
    const { error } = await db.auth.updateUser({ password: nova });
    if (error) { setMsg("#s-senha", "Não foi possível alterar a senha. Se a sessão for antiga, saia e entre de novo.", "bad"); return; }
    e.target.reset();
    setMsg("#s-senha", "Senha alterada.", "ok");
  });

  /* ---------- navegação por #hash ---------- */
  function mostrar(v, foco) {
    $$(".view").forEach((s) => (s.hidden = s.id !== v));
    $$(".side nav a").forEach((a) => (a.dataset.v === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    const titulo = $("#" + v + " h2");
    document.title = titulo.textContent + " — Nuppy administrador";
    if (v === "solicitacoes") carregarSolicitacoes();
    if (v === "reclamacoes") carregarReclamacoes();
    if (foco) titulo.focus();
  }
  function rota(foco) {
    const v = location.hash.slice(1);
    mostrar(VIEWS.includes(v) ? v : "solicitacoes", foco);
  }
  window.addEventListener("hashchange", () => rota(true));

  // Números nos selos do menu, antes de abrir cada seção
  (async () => {
    const [a, b] = await Promise.all([
      db.from("partnership_requests").select("*", { count: "exact", head: true }),
      db.from("reclamacoes").select("*", { count: "exact", head: true }).eq("status", "aberta")
    ]);
    if (a.count != null) badge("#b-sol", a.count);
    if (b.count != null) badge("#b-rec", b.count);
  })();

  rota(false);
})();
