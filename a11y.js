/* Nuppy — módulo de acessibilidade: Libras (VLibras), leitor em voz alta, ajustes visuais, navegação */
(()=>{"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY="nuppy-a11y-v2",B=document.body,H=document.documentElement;
const D={fs:100,lh:0,ls:0,ws:0,font:"def",theme:"def",filter:"none",left:false,links:false,heads:false,focus:false,cursor:false,ruler:false,rm:false,noimg:false,hover:false,rate:1,voice:""};
let S={...D},first=true;
try{const raw=localStorage.getItem(KEY);if(raw){S={...D,...JSON.parse(raw)};first=false}else if(matchMedia("(prefers-contrast: more)").matches)S.theme="hc"}catch(e){}
const calm=()=>B.classList.contains("rm")||matchMedia("(prefers-reduced-motion: reduce)").matches;
const ic=p=>`<svg class="a-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${p}</svg>`;
const I={
 libras:'<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 5V3.5a1.5 1.5 0 0 1 3 0V11M14 6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.4-1.8L8 14"/>',
 voice:'<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 eyeoff:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><path d="M3 3l18 18"/>',
 play:'<path d="M7 4v16l13-8z"/>',pause:'<path d="M8 5v14M16 5v14"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="1"/>',
 prev:'<path d="M19 5v14L8 12zM5 5v14"/>',next:'<path d="M5 5v14l11-7zM19 5v14"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>'
};
const live=Object.assign(document.createElement("div"),{className:"a-sr"});live.setAttribute("aria-live","polite");
const say=m=>{live.textContent="";setTimeout(()=>live.textContent=m,60)};

/* ---------- aplicar configurações ---------- */
const FILT={none:"none",gray:"grayscale(1)",inv:"invert(1) hue-rotate(180deg)",low:"saturate(.45)",high:"saturate(1.8)"};
function apply(){
 H.style.setProperty("--a-fs",S.fs);H.style.setProperty("--a-filter",FILT[S.filter]||"none");H.dataset.filter=S.filter;
 B.dataset.lh=S.lh;B.dataset.ls=S.ls;B.dataset.ws=S.ws;B.dataset.font=S.font;
 B.classList.toggle("hc",S.theme==="hc");B.classList.toggle("hcl",S.theme==="hcl");
 [["left","a-left"],["heads","a-heads"],["focus","a-focus"],["cursor","a-cur"],["rm","rm"],["noimg","noimg"],["links","links"],["ruler","a-ruler-on"]].forEach(([k,c])=>B.classList.toggle(c,!!S[k]));
 try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
}

/* ---------- interface ---------- */
const FM={fs:v=>v+"%",lh:v=>["Padrão","Médio","Grande","Máximo"][v],ls:v=>["Padrão","Médio","Grande","Máximo"][v],ws:v=>["Padrão","Médio","Grande","Máximo"][v]};
const sw=(k,l)=>`<label class="a-sw"><input type="checkbox" role="switch" data-k="${k}"><span>${l}</span></label>`;
const rg=(k,l,min,max,step)=>`<label class="a-rg">${l}<output id="o-${k}"></output><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}"></label>`;
const rd=(k,l,o)=>`<fieldset><legend>${l}</legend>${o.map(([v,t])=>`<label class="a-rd"><input type="radio" name="a-${k}" data-k="${k}" value="${v}"><span>${t}</span></label>`).join("")}</fieldset>`;
const PRE={lowvision:{fs:150,theme:"hc",links:true,focus:true,cursor:true},dys:{font:"dys",ls:2,ws:2,lh:2,left:true,ruler:true},motion:{rm:true,noimg:false},focus:{ruler:true,heads:true,rm:true,left:true}};
const html=`
<div id="a11y-rail" role="toolbar" aria-label="Acessibilidade" aria-orientation="vertical">
 <button data-act="libras" aria-label="Libras: abrir o tradutor com avatar (VLibras)" data-l="Libras (Alt+Shift+7)">${ic(I.libras)}</button>
 <button data-act="reader" aria-expanded="false" aria-controls="a11y-reader" aria-label="Leitor em voz alta" data-l="Voz (Alt+Shift+6)">${ic(I.voice)}</button>
 <button data-act="settings" aria-expanded="false" aria-controls="a11y-settings" aria-label="Ajustes de acessibilidade" data-l="Ajustes (Alt+Shift+5)">${ic(I.gear)}</button>
 <button data-act="hide" aria-label="Recolher a barra de acessibilidade" data-l="Recolher">${ic(I.eye)}</button>
</div>
<section id="a11y-reader" class="a-panel" aria-labelledby="rd-h" hidden>
 <header><h2 id="rd-h" tabindex="-1">Leitor em voz alta</h2><button class="a-x" data-act="close-reader" aria-label="Fechar leitor">${ic(I.close)}</button></header>
 <div class="a-body">
  <div class="a-now-box" id="rd-now" aria-hidden="true">Escolha o que ler abaixo.</div>
  <div class="a-reader-ctl" role="group" aria-label="Controles de reprodução">
   <button class="a-btn" data-r="prev" aria-label="Bloco anterior">${ic(I.prev)}</button>
   <button class="a-btn" data-r="play" id="rd-play" aria-label="Ler a página">${ic(I.play)}</button>
   <button class="a-btn" data-r="stop" aria-label="Parar">${ic(I.stop)}</button>
   <button class="a-btn" data-r="next" aria-label="Próximo bloco">${ic(I.next)}</button>
  </div>
  <div class="a-btns"><button class="a-btn" data-r="page">Ler a página</button><button class="a-btn" data-r="section">Ler a seção atual</button><button class="a-btn" data-r="sel">Ler a seleção</button></div>
  <label class="a-rg">Velocidade<output id="o-rate"></output><input type="range" data-k="rate" min="0.6" max="1.8" step="0.1"></label>
  <label class="a-rg" for="rd-voice">Voz</label><select id="rd-voice" data-k="voice" style="width:100%;margin-bottom:.8rem"></select>
  ${sw("hover","Ler ao passar o mouse ou focar com o teclado")}
  <p class="a-note" id="rd-msg"></p>
 </div>
</section>
<section id="a11y-settings" class="a-panel" aria-labelledby="st-h" hidden>
 <header><h2 id="st-h" tabindex="-1">Acessibilidade</h2><button class="a-x" data-act="close-settings" aria-label="Fechar ajustes">${ic(I.close)}</button></header>
 <div class="a-body">
  <fieldset><legend>Perfis rápidos</legend><div class="a-btns" style="margin:0">
   <button class="a-btn" data-p="lowvision">Baixa visão</button><button class="a-btn" data-p="dys">Dislexia</button><button class="a-btn" data-p="motion">Sensível a movimento</button><button class="a-btn" data-p="focus">Foco na leitura</button></div></fieldset>
  <fieldset><legend>Libras</legend><p class="a-note" style="margin:0 0 .6rem">Tradutor VLibras, do governo federal: um avatar 3D traduz o texto para Libras. Com a janela aberta, clique no texto que deseja traduzir. As configurações da própria janela permitem trocar de avatar.</p><button class="a-btn" data-act="libras">${ic(I.libras)} Abrir tradutor de Libras</button></fieldset>
  <fieldset><legend>Texto</legend>${rg("fs","Tamanho do texto",80,200,10)}${rg("lh","Espaço entre linhas",0,3,1)}${rg("ls","Espaço entre letras",0,3,1)}${rg("ws","Espaço entre palavras",0,3,1)}
   ${rd("font","Fonte",[["def","Padrão"],["leg","Legível (Verdana)"],["dys","Letras bem distintas"]])}${sw("left","Alinhar o texto à esquerda")}</fieldset>
  <fieldset><legend>Cores</legend>${rd("theme","Contraste",[["def","Padrão"],["hc","Alto contraste escuro (amarelo no preto)"],["hcl","Alto contraste claro (preto no branco)"]])}
   ${rd("filter","Filtro de cor",[["none","Nenhum"],["gray","Tons de cinza"],["inv","Cores invertidas"],["low","Cores suaves"],["high","Cores vivas"]])}</fieldset>
  <fieldset><legend>Leitura e foco</legend>${sw("links","Destacar links")}${sw("heads","Destacar títulos")}${sw("focus","Foco do teclado reforçado")}${sw("cursor","Cursor grande")}${sw("ruler","Régua de leitura")}</fieldset>
  <fieldset><legend>Movimento e imagens</legend>${sw("rm","Reduzir movimento e animações")}${sw("noimg","Ocultar fotos")}</fieldset>
  <fieldset><legend>Navegar na página</legend><ul class="a-list" id="st-map"></ul>
   <p class="a-note">Atalhos: <kbd>Alt+Shift+1</kbd> conteúdo, <kbd>2</kbd> menu, <kbd>3</kbd> formulário, <kbd>4</kbd> rodapé, <kbd>5</kbd> ajustes, <kbd>6</kbd> voz, <kbd>7</kbd> Libras.</p></fieldset>
  <button class="a-btn" data-act="reset">${ic('<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>')} Restaurar padrão</button>
 </div>
</section>
<div class="a-ruler" id="ru-t"></div><div class="a-ruler" id="ru-b"></div>`;
const wrap=document.createElement("div");wrap.innerHTML=html;B.append(...wrap.children,live);
const ST=$("#a11y-settings"),RD=$("#a11y-reader");

function sync(){
 $$("[data-k]").forEach(el=>{const k=el.dataset.k,v=S[k];
  if(el.type==="checkbox")el.checked=!!v;else if(el.type==="radio")el.checked=String(v)===el.value;else el.value=v;
  const o=$("#o-"+k);if(o)o.textContent=FM[k]?FM[k](+v):(+v).toFixed(1)+"x"})
}
function onInput(e){const el=e.target,k=el.dataset?.k;if(!k)return;
 if(el.type==="checkbox")S[k]=el.checked;else if(el.type==="radio"){if(!el.checked)return;S[k]=el.value}else if(el.type==="range")S[k]=+el.value;else S[k]=el.value;
 apply();sync();if(el.type!=="range")say(el.closest("label")?.innerText.trim()+(el.type==="checkbox"?(el.checked?": ativado":": desativado"):" selecionado"))}
ST.addEventListener("input",onInput);RD.addEventListener("input",onInput);ST.addEventListener("change",onInput);RD.addEventListener("change",onInput);
ST.addEventListener("click",e=>{const p=e.target.closest("[data-p]");if(p){S={...D,...PRE[p.dataset.p],hover:S.hover,rate:S.rate,voice:S.voice};apply();sync();say("Perfil aplicado: "+p.textContent)}});

/* mapa da página */
$("#st-map").innerHTML=$$("main section[id]").map(s=>{const h=$("h1,h2",s);return `<li><a href="#${s.id}">${(h?h.textContent:s.id).trim()}</a></li>`}).join("");

/* ---------- painéis ---------- */
function panel(name,force){const p=$("#a11y-"+name),b=$(`[data-act=${name}]`),open=force??p.hidden;p.hidden=!open;b.setAttribute("aria-expanded",open);
 if(open){B.classList.remove("a-rail-off");$("h2",p).focus()}else b.focus()}
function libras(){const v=$("[vw-access-button]");if(v){v.click();say("Tradutor de Libras aberto. Clique no texto que deseja traduzir.")}else say("O tradutor de Libras não carregou. Verifique a conexão com a internet.")}
document.addEventListener("click",e=>{const a=e.target.closest("[data-act]")?.dataset.act;if(!a)return;
 if(a==="libras")libras();else if(a==="reader"||a==="settings")panel(a);
 else if(a==="close-reader")panel("reader",false);else if(a==="close-settings")panel("settings",false);
 else if(a==="hide"){const off=B.classList.toggle("a-rail-off");const b=e.target.closest("button");b.innerHTML=ic(off?I.eyeoff:I.eye);b.setAttribute("aria-label",off?"Mostrar a barra de acessibilidade":"Recolher a barra de acessibilidade");stopTTS()}
 else if(a==="reset"){S={...D};apply();sync();stopTTS();say("Configurações restauradas")}});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){const open=[["settings",ST],["reader",RD]].find(([n,p])=>!p.hidden&&p.contains(document.activeElement))||[["settings",ST],["reader",RD]].find(([n,p])=>!p.hidden);if(open)panel(open[0],false)}
 if(e.altKey&&e.shiftKey){const m={Digit1:()=>$("#conteudo").focus?.(),Digit2:()=>$("nav a")?.focus(),Digit3:()=>{location.hash="#formulario";setTimeout(()=>$("#company_name")?.focus(),400)},Digit4:()=>location.hash="#rodape",Digit5:()=>panel("settings"),Digit6:()=>panel("reader"),Digit7:libras}[e.code];
  if(m){e.preventDefault();if(e.code==="Digit1"){const c=$("#conteudo");c.tabIndex=-1;c.focus()}else m()}}});

/* ---------- leitor em voz alta ---------- */
const T={q:[],i:-1,on:false,paused:false,tok:0},synth=window.speechSynthesis;
const clean=s=>(s||"").replace(/\s+/g," ").trim();
const vis=el=>!el.closest("[aria-hidden=true],[hidden],.hp,.a-panel,#a11y-rail")&&el.getClientRects().length>0;
const collect=r=>$$("h1,h2,h3,p,li,summary,legend,label,blockquote",r).filter(vis).map(el=>({el,t:clean(el.innerText||el.textContent)})).filter(b=>b.t.length>1);
function setMsg(t){$("#rd-msg").textContent=t||""}
if(!synth){setMsg("Este navegador não oferece leitura em voz alta. Tente o Chrome, Edge ou Safari atualizados.")}
function voices(){if(!synth)return;const vs=synth.getVoices().filter(v=>/^pt/i.test(v.lang)),sel=$("#rd-voice");
 sel.innerHTML=vs.length?vs.map(v=>`<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join(""):'<option value="">Voz padrão do aparelho</option>';
 if(S.voice&&vs.some(v=>v.voiceURI===S.voice))sel.value=S.voice;else if(vs[0]&&!S.voice){S.voice=vs[0].voiceURI}
 if(!vs.length)setMsg("Nenhuma voz em português foi encontrada neste aparelho. A leitura usará a voz padrão, que pode não pronunciar bem o português.")}
if(synth){voices();synth.addEventListener?.("voiceschanged",voices)}
function utter(t){const u=new SpeechSynthesisUtterance(t);u.lang="pt-BR";u.rate=S.rate;const v=synth.getVoices().find(x=>x.voiceURI===S.voice);if(v)u.voice=v;return u}
function mark(el){$$(".a-now").forEach(x=>x.classList.remove("a-now"));if(el){el.classList.add("a-now");const r=el.getBoundingClientRect();if(r.top<80||r.bottom>innerHeight-80)el.scrollIntoView({block:"center",behavior:calm()?"auto":"smooth"})}}
function ui(){const pl=$("#rd-play");if(!pl)return;const playing=T.on&&!T.paused;pl.innerHTML=ic(playing?I.pause:I.play);pl.setAttribute("aria-label",playing?"Pausar":T.paused?"Continuar":"Ler a página")}
function speak(i){if(!synth)return;const q=T.q;if(i<0||i>=q.length){stopTTS();say("Leitura concluída");return}
 synth.cancel();T.i=i;T.on=true;T.paused=false;const my=++T.tok,b=q[i];mark(b.el);$("#rd-now").textContent=b.t;
 const u=utter(b.t);u.onend=()=>{if(T.on&&my===T.tok)speak(i+1)};synth.speak(u);ui()}
function stopTTS(){T.on=false;T.paused=false;T.tok++;synth?.cancel();mark(null);ui()}
function start(mode){if(!synth)return;let q=[];
 if(mode==="sel"){const t=clean(String(getSelection()));if(!t){setMsg("Selecione um trecho de texto na página e toque em Ler a seleção.");say("Nenhum texto selecionado");return}q=[{el:null,t}]}
 else if(mode==="section"){const s=$$("main section").find(x=>{const r=x.getBoundingClientRect();return r.top<=innerHeight*.4&&r.bottom>innerHeight*.4})||$("main section");q=collect(s)}
 else q=collect(document.body);
 setMsg("");T.q=q;speak(0)}
RD.addEventListener("click",e=>{const r=e.target.closest("[data-r]")?.dataset.r;if(!r)return;
 if(r==="play"){if(!T.on)start("page");else if(T.paused){synth.resume();T.paused=false;ui()}else{synth.pause();T.paused=true;ui()}}
 else if(r==="stop")stopTTS();else if(r==="prev")speak(Math.max(0,T.i-1));else if(r==="next")speak(T.i+1);else start(r)});
RD.addEventListener("change",e=>{if(e.target.dataset.k==="rate"&&T.on&&!T.paused)speak(T.i)});
/* ler ao passar o mouse / focar */
let ht;function one(el){const t=clean(el.getAttribute("aria-label")||el.innerText||el.value||el.placeholder);if(!t||!synth)return;T.on=false;T.tok++;synth.cancel();synth.speak(utter(t))}
const RS="h1,h2,h3,p,li,a,button,summary,label,legend,input,select,textarea";
document.addEventListener("pointerover",e=>{if(!S.hover)return;clearTimeout(ht);const el=e.target.closest?.(RS);if(el)ht=setTimeout(()=>one(el),450)});
document.addEventListener("focusin",e=>{if(!S.hover)return;const el=e.target.closest?.(RS);if(el)one(el)});

/* ---------- régua de leitura ---------- */
const rt=$("#ru-t"),rb=$("#ru-b"),BAND=64;
function ruler(y){rt.style.top="0";rt.style.height=Math.max(0,y-BAND/2)+"px";rb.style.top=(y+BAND/2)+"px";rb.style.bottom="0"}
ruler(innerHeight/2);
document.addEventListener("pointermove",e=>{if(S.ruler)ruler(e.clientY)},{passive:true});
document.addEventListener("focusin",e=>{if(!S.ruler||e.target.closest(".a-panel"))return;const r=e.target.getBoundingClientRect();ruler(r.top+r.height/2)});

apply();sync();ui();
})();
