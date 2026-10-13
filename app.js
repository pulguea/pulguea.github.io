import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_KEY, TEST_MODE } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
});

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const r2 = (n) => Math.round(n * 100 + 1e-6) / 100;
const money = (n) => "$" + Number(n).toFixed(2);
const fee = (p) => r2(p * 0.05 + 0.7);
const SHIP = 4.5;
const BUNDLE_OFF = 0.1;
const photoUrl = (p) => `${SUPABASE_URL}/storage/v1/object/public/fotos/${p}`;
const uid = () => session?.user?.id;
const SPIN = `<div class="spin">Cargando…</div>`;

const CATS = [["todo", "Todo"], ["ropa", "Ropa"], ["tenis", "Tenis"], ["vestidos", "Vestidos"], ["bultos", "Bultos"], ["gorras", "Gorras"], ["casa", "Casa"], ["otros", "Otros"]];
const CONDS = ["Nuevo con etiqueta", "Como nuevo", "Buen estado", "Usado"];
const TOWNS = ["Adjuntas","Aguada","Aguadilla","Aguas Buenas","Aibonito","Añasco","Arecibo","Arroyo","Barceloneta","Barranquitas","Bayamón","Cabo Rojo","Caguas","Camuy","Canóvanas","Carolina","Cataño","Cayey","Ceiba","Ciales","Cidra","Coamo","Comerío","Corozal","Culebra","Dorado","Fajardo","Florida","Guánica","Guayama","Guayanilla","Guaynabo","Gurabo","Hatillo","Hormigueros","Humacao","Isabela","Jayuya","Juana Díaz","Juncos","Lajas","Lares","Las Marías","Las Piedras","Loíza","Luquillo","Manatí","Maricao","Maunabo","Mayagüez","Moca","Morovis","Naguabo","Naranjito","Orocovis","Patillas","Peñuelas","Ponce","Quebradillas","Rincón","Río Grande","Sabana Grande","Salinas","San Germán","San Juan","San Lorenzo","San Sebastián","Santa Isabel","Toa Alta","Toa Baja","Trujillo Alto","Utuado","Vega Alta","Vega Baja","Vieques","Villalba","Yabucoa","Yauco"];
const KNOWN_SPOTS = {
  "San Juan": ["Plaza Las Américas · entrada principal", "Cuartel de la Policía · Hato Rey"],
  "Bayamón": ["Plaza Río Hondo · food court", "Cuartel de la Policía Municipal de Bayamón"],
  "Carolina": ["Plaza Carolina · entrada de cines", "Cuartel de la Policía de Carolina"],
  "Guaynabo": ["San Patricio Plaza · estacionamiento", "Cuartel de la Policía de Guaynabo"],
  "Caguas": ["Plaza Centro · entrada principal", "Cuartel de la Policía de Caguas"],
  "Ponce": ["Plaza del Caribe · entrada principal", "Cuartel de la Policía de Ponce"],
  "Mayagüez": ["Mayagüez Mall · entrada principal", "Cuartel de la Policía de Mayagüez"],
  "Arecibo": ["Plaza del Atlántico · entrada", "Cuartel de la Policía de Arecibo"],
  "Humacao": ["Palma Real Shopping Village", "Cuartel de la Policía de Humacao"],
};
const spotsFor = (t) => KNOWN_SPOTS[t] || [`Cuartel de la Policía de ${t}`, `Plaza pública de ${t}`];
const TIMES = ["10:00", "13:00", "16:00", "18:30"];
const PAYNAME = { apple: "Apple Pay", google: "Google Pay", card: "tarjeta" };
const LOGO = `<svg viewBox="0 0 60 102" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"><path d="M27 35 L22 21"/><path d="M40 35 L45 21"/></g><circle cx="21.5" cy="19" r="5" fill="currentColor"/><circle cx="45.5" cy="19" r="5" fill="currentColor"/><path d="M10 32 V100" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="33" cy="55" r="21" fill="#FF5A4E" stroke="currentColor" stroke-width="8"/><rect x="0" y="97.2" width="22" height="4.8" fill="currentColor"/><rect x="0" y="32" width="10" height="4.8" fill="currentColor"/></svg>`;
const PLACEHOLDER = `<svg width="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/></svg>`;

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), 3200);
}
const fail = (e) => toast(cleanErr(e));
function cleanErr(e) {
  const m = e?.message || String(e || "Algo salió mal.");
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(m)) return "Confirma tu correo primero. Revisa tu buzón.";
  if (/User already registered/i.test(m)) return "Ya existe una cuenta con ese correo. Entra con tu contraseña.";
  if (/Password should be/i.test(m)) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (/rate limit/i.test(m)) return "Demasiados intentos. Espera unos minutos.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "No hay conexión. Revisa tu internet.";
  return m;
}
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("No se pudo cargar una herramienta. Revisa tu internet."));
    document.head.appendChild(s);
  });
}
const fmtWhen = (ts) =>
  new Intl.DateTimeFormat("es-PR", { timeZone: "America/Puerto_Rico", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(ts));
const fmtAgo = (ts) => {
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Intl.DateTimeFormat("es-PR", { day: "numeric", month: "short" }).format(new Date(ts));
};
const prDay = (offset) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Puerto_Rico", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + offset * 864e5));
const prNowHM = () => new Intl.DateTimeFormat("en-GB", { timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
const initial = (n) => esc((n || "?").trim().charAt(0));
const header = () => `<div class="top"><div class="brand"><a class="logo" href="#/" aria-label="pulguea">${LOGO}<span aria-hidden="true">ulguea</span></a><span class="tag">Segunda mano · Puerto Rico</span></div>${TEST_MODE ? `<div class="testbar">Versión de prueba: los pagos son de mentira</div>` : ""}</div>`;
const back = (href, label = "Volver") => `<a class="back" href="${href}">‹ ${label}</a>`;
const cardHTML = (l) => `
  <a class="card" href="#/item/${l.id}">
    <div class="pic">${l.photos?.[0] ? `<img src="${esc(photoUrl(l.photos[0]))}" alt="" loading="lazy">` : PLACEHOLDER}
      <span class="badge">${esc(l.town)}</span>${l.status !== "active" ? `<span class="badge state">${l.status === "sold" ? "Vendido" : l.status === "reserved" ? "Reservado" : "Quitado"}</span>` : ""}</div>
    <div class="meta"><span class="price">${money(l.price)}</span><span class="ellip">${esc(l.title)}</span><span class="small ellip">${l.size ? "Talla " + esc(l.size) + " · " : ""}${esc(l.condition)}</span></div>
  </a>`;
const thumb = (l) => `<div class="thumb">${l?.photos?.[0] ? `<img src="${esc(photoUrl(l.photos[0]))}" alt="">` : ""}</div>`;
function confirmTap(btn, text) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = "1";
  const old = btn.textContent;
  btn.textContent = text || "Toca otra vez para confirmar";
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 4000);
  return false;
}
async function busy(btn, fn) {
  if (btn.disabled) return;
  btn.disabled = true;
  try { await fn(); } catch (e) { fail(e); } finally { btn.disabled = false; }
}

/* ---------- sesión ---------- */
let session = null;
let me = null;
async function loadMe() {
  me = null;
  if (!session) return;
  const { data } = await sb.from("profiles").select("*").eq("id", uid()).maybeSingle();
  me = data;
}
function needLogin() {
  if (session) return false;
  try { sessionStorage.setItem("next", location.hash); } catch {}
  location.hash = "#/entrar";
  return true;
}

/* ---------- rutas ---------- */
const routes = [
  [/^#\/?$/, home],
  [/^#\/item\/([\w-]+)$/, item],
  [/^#\/lote\/([\w-]+)(?:\?.*)?$/, lote],
  [/^#\/comprar$/, checkout],
  [/^#\/vender$/, () => sellForm(null)],
  [/^#\/editar\/([\w-]+)$/, (id) => sellForm(id)],
  [/^#\/mensajes$/, inbox],
  [/^#\/chat\/([\w-]+)$/, chat],
  [/^#\/pedidos$/, orders],
  [/^#\/pedido\/([\w-]+)$/, order],
  [/^#\/perfil$/, profile],
  [/^#\/u\/([\w-]+)$/, publicProfile],
  [/^#\/entrar$/, auth],
  [/^#\/clave$/, newPassword],
];
const NAVKEY = { "#/": "home", "#/mensajes": "inbox", "#/chat": "inbox", "#/vender": "sell", "#/pedidos": "orders", "#/pedido": "orders", "#/perfil": "profile" };
let renderId = 0;
let cleanups = [];
const stale = (id) => id !== renderId;

async function route() {
  cleanups.forEach((f) => { try { f(); } catch {} });
  cleanups = [];
  document.querySelectorAll(".composer").forEach((e) => e.remove());
  app.onclick = app.onsubmit = app.oninput = app.onchange = null;
  let hash = location.hash || "#/";
  if (/access_token|error_description|type=recovery/.test(hash)) { history.replaceState(null, "", location.pathname + "#/"); hash = "#/"; }
  const id = ++renderId;
  const base = "#/" + (hash.split("/")[1] || "");
  const key = NAVKEY[base] || NAVKEY[hash];
  document.querySelectorAll(".nav a").forEach((a) => (a.dataset.nav === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) {
      window.scrollTo(0, 0);
      try { await fn(...m.slice(1), id); }
      catch (e) { console.error(e); if (!stale(id)) app.innerHTML = `${header()}<div class="empty">Algo salió mal: ${esc(cleanErr(e))}<br><br><a class="btn ghost" href="#/">Ir al inicio</a></div>`; }
      return;
    }
  }
  location.hash = "#/";
}

/* ---------- inicio ---------- */
const homeState = { cat: "todo", town: "", q: "" };
async function home(id) {
  app.innerHTML = `${header()}
    <div class="stack" style="gap:10px">
      <input id="q" type="search" placeholder="Busca tenis, trajes, bultos…" aria-label="Buscar" value="${esc(homeState.q)}">
      <div class="chips" id="cats">${CATS.map(([k, v]) => `<button class="chip" data-c="${k}" aria-pressed="${k === homeState.cat}">${v}</button>`).join("")}</div>
      <div class="row"><span class="label">Cerca de</span>
        <select id="town" aria-label="Municipio" style="width:auto;padding:6px 8px;border-radius:10px"><option value="">Todo Puerto Rico</option>${TOWNS.map((t) => `<option ${t === homeState.town ? "selected" : ""}>${t}</option>`).join("")}</select></div>
    </div>
    <div class="banner"><div>Recógelo <b>hoy</b> en persona. Pagas en la app y el dinero solo se libera cuando el vendedor escanea tu código.</div></div>
    <div class="grid" id="feed">${SPIN}</div>
    <div style="padding-top:14px"><button class="btn ghost" id="more" hidden>Ver más</button></div>`;
  let page = 0;
  const PAGE = 24;
  async function load(reset) {
    if (reset) { page = 0; $("#feed").innerHTML = SPIN; }
    let q = sb.from("listings").select("id,title,price,size,condition,town,photos,status").eq("status", "active").order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (homeState.cat !== "todo") q = q.eq("category", homeState.cat);
    if (homeState.town) q = q.eq("town", homeState.town);
    const term = homeState.q.replace(/[%,()_\\]/g, " ").trim();
    if (term) q = q.ilike("title", `%${term}%`);
    const { data, error } = await q;
    if (stale(id)) return;
    if (error) { $("#feed").innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(cleanErr(error))}</div>`; return; }
    const html = data.map(cardHTML).join("");
    if (page === 0) $("#feed").innerHTML = html || `<div class="empty" style="grid-column:1/-1">Todavía no hay artículos con ese filtro.<br><br><a class="btn primary" href="#/vender">Publica el primero</a></div>`;
    else $("#feed").insertAdjacentHTML("beforeend", html);
    $("#more").hidden = data.length < PAGE;
  }
  app.onclick = (e) => {
    const c = e.target.closest("[data-c]");
    if (c) { homeState.cat = c.dataset.c; document.querySelectorAll("#cats .chip").forEach((x) => x.setAttribute("aria-pressed", x === c)); load(true); }
    if (e.target.id === "more") { page++; load(false); }
  };
  app.onchange = (e) => { if (e.target.id === "town") { homeState.town = e.target.value; load(true); } };
  let deb;
  app.oninput = (e) => { if (e.target.id === "q") { clearTimeout(deb); deb = setTimeout(() => { homeState.q = e.target.value; load(true); }, 350); } };
  await load(true);
}

/* ---------- artículo ---------- */
async function item(lid, id) {
  app.innerHTML = SPIN;
  const { data: l, error } = await sb.from("listings").select("*, seller:profiles!listings_seller_id_fkey(id,display_name,town,rating_avg,rating_count,sales_count)").eq("id", lid).maybeSingle();
  if (stale(id)) return;
  if (error) throw error;
  if (!l) { app.innerHTML = `${back("#/")}<div class="empty">Este artículo ya no existe.</div>`; return; }
  const mine = uid() === l.seller_id;
  const { count: others } = await sb.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", l.seller_id).eq("status", "active").neq("id", lid);
  if (stale(id)) return;
  const s = l.seller || {};
  let offerOpen = false;
  function draw() {
    app.innerHTML = `${back("#/")}
    <div class="stack">
      ${l.photos?.length ? `<div class="gallery">${l.photos.map((p) => `<img src="${esc(photoUrl(p))}" alt="">`).join("")}</div>` : `<div class="pic" style="border-radius:16px;aspect-ratio:1">${PLACEHOLDER}</div>`}
      ${l.photos?.length > 1 ? `<div class="small" style="text-align:center">${l.photos.length} fotos · desliza para verlas</div>` : ""}
      <div class="panel">
        <h2>${esc(l.title)}</h2>
        <div class="row"><span class="price" style="font-size:26px">${money(l.price)}</span><span class="small">+ ${money(fee(l.price))} cargo de servicio</span></div>
        <div class="small">${l.size ? "Talla " + esc(l.size) + " · " : ""}${esc(l.condition)} · ${esc(l.town)}</div>
        ${l.description ? `<div style="white-space:pre-wrap">${esc(l.description)}</div>` : ""}
      </div>
      <a class="panel seller" href="#/u/${s.id}"><div class="avatar">${initial(s.display_name)}</div>
        <div style="flex:1;min-width:0"><b>${esc(s.display_name)}</b><div class="small">${s.rating_count ? "★ " + Number(s.rating_avg).toFixed(1) + " (" + s.rating_count + ")" : "Sin reseñas todavía"} · ${s.sales_count || 0} ventas${s.town ? " · " + esc(s.town) : ""}</div></div></a>
      ${mine ? `
        <div class="btns"><a class="btn ghost small" href="#/editar/${l.id}">Editar</a>${l.status === "active" ? `<button class="btn ghost small" data-act="remove">Quitar de la venta</button>` : ""}</div>
        ${l.status !== "active" ? `<div class="small">Estado: ${l.status === "sold" ? "vendido" : l.status === "reserved" ? "reservado en un pedido" : "quitado de la venta"}.</div>` : ""}`
      : l.status !== "active" ? `<div class="panel"><b>${l.status === "sold" ? "Este artículo ya se vendió." : "Este artículo está reservado en otro pedido."}</b></div>`
      : `
        ${others ? `<div class="hl"><b>Arma un lote con ${esc(s.display_name)}</b><span class="small" style="color:var(--ink)">Tiene ${others} artículo${others > 1 ? "s" : ""} más. Compra 2 o más: 10% menos, un solo cargo y un solo encuentro.</span><a class="btn ghost small" href="#/lote/${s.id}?first=${l.id}">Ver sus artículos</a></div>` : ""}
        ${offerOpen ? `<form class="panel" id="offerForm"><span class="label">Tu oferta</span>
          <div class="chips wrap">${[10, 20, 30].map((p) => `<button type="button" class="chip" data-quick="${r2(l.price * (1 - p / 100))}">${money(r2(l.price * (1 - p / 100)))} (−${p}%)</button>`).join("")}</div>
          <input id="offerAmt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="Escribe tu precio" aria-label="Precio de la oferta">
          <button class="btn sea">Enviar oferta</button></form>` : ""}
        <button class="btn primary" data-act="buy">Comprar</button>
        <div class="btns"><button class="btn ghost small" data-act="offer">Hacer oferta</button><button class="btn ghost small" data-act="msg">Enviar mensaje</button></div>`}
    </div>`;
  }
  draw();
  app.onclick = async (e) => {
    const b = e.target.closest("[data-act],[data-quick]");
    if (!b) return;
    if (b.dataset.quick) { $("#offerAmt").value = b.dataset.quick; return; }
    const act = b.dataset.act;
    if (act === "buy") { if (needLogin()) return; sessionStorage.setItem("checkout", JSON.stringify({ ids: [l.id] })); location.hash = "#/comprar"; }
    if (act === "offer") { if (needLogin()) return; offerOpen = !offerOpen; draw(); if (offerOpen) $("#offerAmt").focus(); }
    if (act === "msg") busy(b, () => openThread(l));
    if (act === "remove") { if (!confirmTap(b, "Toca otra vez para quitarlo")) return; busy(b, async () => { const { error } = await sb.from("listings").update({ status: "removed" }).eq("id", l.id); if (error) throw error; toast("Lo quitaste de la venta."); location.hash = "#/perfil"; }); }
  };
  app.onsubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button:not([type])");
    const v = parseFloat($("#offerAmt").value);
    if (!(v >= 1)) return toast("Escribe cuánto quieres ofrecer.");
    if (v >= l.price) return toast("Tu oferta tiene que ser menor que el precio.");
    busy(btn, async () => {
      const { data: tid, error } = await sb.rpc("make_offer", { p_listing: l.id, p_amount: v });
      if (error) throw error;
      toast("Oferta enviada.");
      location.hash = "#/chat/" + tid;
    });
  };
}
async function openThread(l) {
  if (needLogin()) return;
  let { data: t } = await sb.from("threads").select("id").eq("listing_id", l.id).eq("buyer_id", uid()).maybeSingle();
  if (!t) {
    const r = await sb.from("threads").insert({ listing_id: l.id, buyer_id: uid(), seller_id: l.seller_id }).select("id").single();
    if (r.error) throw r.error;
    t = r.data;
  }
  location.hash = "#/chat/" + t.id;
}

/* ---------- lote ---------- */
async function lote(sellerId, id) {
  const first = new URLSearchParams(location.hash.split("?")[1] || "").get("first");
  app.innerHTML = SPIN;
  const [{ data: list }, { data: s }] = await Promise.all([
    sb.from("listings").select("id,title,price,size,photos,status,town").eq("seller_id", sellerId).eq("status", "active").order("created_at", { ascending: false }),
    sb.from("profiles").select("id,display_name").eq("id", sellerId).maybeSingle(),
  ]);
  if (stale(id)) return;
  const sel = new Set(first && list.some((x) => x.id === first) ? [first] : []);
  function draw() {
    const chosen = list.filter((x) => sel.has(x.id));
    const sub = r2(chosen.reduce((a, x) => a + Number(x.price), 0));
    const off = chosen.length >= 2 ? r2(sub * BUNDLE_OFF) : 0;
    app.innerHTML = `${back(first ? "#/item/" + first : "#/")}
    <div class="stack"><h2>Lote de ${esc(s?.display_name)}</h2><span class="small">Marca lo que quieres. Con 2 o más, 10% menos.</span>
      ${list.map((x) => `<label class="listbtn"><input type="checkbox" data-pick="${x.id}" ${sel.has(x.id) ? "checked" : ""} style="width:22px;height:22px;flex:none;accent-color:var(--flame)">${thumb(x)}
        <div style="flex:1;min-width:0"><div class="ellip"><b>${esc(x.title)}</b></div><div class="small">${x.size ? "Talla " + esc(x.size) : ""}</div></div><b class="price" style="font-size:16px">${money(x.price)}</b></label>`).join("") || `<div class="empty">Este vendedor no tiene artículos disponibles.</div>`}
      <div class="panel lines">
        <div class="row"><span>${chosen.length} artículo${chosen.length === 1 ? "" : "s"}</span><span>${money(sub)}</span></div>
        ${off ? `<div class="row disc"><span>Descuento de lote (10%)</span><span>−${money(off)}</span></div>` : ""}
        <div class="row"><span>Un solo cargo de servicio</span><span>${chosen.length ? money(fee(sub - off)) : "$0.00"}</span></div>
        <div class="row total"><span>Total</span><span>${chosen.length ? money(sub - off + fee(sub - off)) : "$0.00"}</span></div>
      </div>
      <button class="btn primary" data-act="buy" ${chosen.length ? "" : "disabled"}>Comprar lote</button></div>`;
  }
  draw();
  app.onchange = (e) => { const c = e.target.closest("[data-pick]"); if (!c) return; c.checked ? sel.add(c.dataset.pick) : sel.delete(c.dataset.pick); draw(); };
  app.onclick = (e) => {
    if (e.target.closest("[data-act=buy]") && sel.size) {
      if (needLogin()) return;
      if (sellerId === uid()) return toast("No puedes comprar tus propios artículos.");
      sessionStorage.setItem("checkout", JSON.stringify({ ids: [...sel] }));
      location.hash = "#/comprar";
    }
  };
}

/* ---------- pagar ---------- */
async function checkout(id) {
  if (needLogin()) return;
  let ck = null;
  try { ck = JSON.parse(sessionStorage.getItem("checkout") || "null"); } catch {}
  if (!ck?.ids?.length) { location.hash = "#/"; return; }
  app.innerHTML = SPIN;
  const { data: list, error } = await sb.from("listings").select("id,title,price,town,photos,status,seller_id").in("id", ck.ids);
  if (stale(id)) return;
  if (error) throw error;
  if (list.length !== ck.ids.length || list.some((x) => x.status !== "active")) {
    app.innerHTML = `${back("#/")}<div class="empty">Uno de los artículos ya no está disponible.</div>`;
    return;
  }
  let agreed = null;
  if (ck.offer) {
    const { data: m } = await sb.from("messages").select("offer_status,offer_amount,counter_amount").eq("id", ck.offer).maybeSingle();
    if (m?.offer_status === "accepted") agreed = Number(m.offer_amount);
    else if (m?.offer_status === "countered") agreed = Number(m.counter_amount);
  }
  if (stale(id)) return;
  const town = list[0].town;
  const spots = spotsFor(town);
  const st = { mode: "meet", spot: 0, custom: "", day: 0, time: null, address: me?.address || "", pay: "apple" };
  const sub = r2(list.reduce((a, x) => a + Number(x.price), 0));
  const disc = agreed != null ? r2(sub - agreed) : list.length >= 2 ? r2(sub * BUNDLE_OFF) : 0;
  const base = r2(sub - disc);
  const f = fee(base);
  const title = list.length > 1 ? `Lote de ${list.length} artículos` : list[0].title;
  function draw() {
    const del = st.mode === "ship" ? SHIP : 0;
    const total = r2(base + f + del);
    const nowHM = prNowHM();
    const times = TIMES.filter((t) => st.day > 0 || t > nowHM);
    if (st.time && !times.includes(st.time)) st.time = null;
    const spotText = st.spot === -1 ? st.custom.trim() : spots[st.spot];
    const ready = st.mode === "ship" ? st.address.trim().length >= 10 : spotText?.length >= 3 && st.time;
    app.innerHTML = `${back("#/item/" + list[0].id)}
    <div class="stack">
      <h2>¿Cómo lo quieres recibir?</h2>
      <button class="opt" data-mode="meet" aria-pressed="${st.mode === "meet"}"><div class="row"><b>Encuentro en persona</b><span class="small">Gratis</span></div><span class="small">En una zona segura de ${esc(town)}, en los próximos días.</span></button>
      <button class="opt" data-mode="ship" aria-pressed="${st.mode === "ship"}"><div class="row"><b>Envío por correo</b><span class="small">${money(SHIP)}</span></div><span class="small">Llega en 2 o 3 días a tu dirección.</span></button>
      ${st.mode === "meet" ? `
      <div class="panel"><span class="label">Zona segura</span>
        ${spots.map((s, i) => `<button class="opt" data-spot="${i}" aria-pressed="${st.spot === i}"><b>${esc(s)}</b><span class="small">${/Cuartel/.test(s) ? "Frente al cuartel, con vigilancia" : "Lugar público con gente y cámaras"}</span></button>`).join("")}
        <button class="opt" data-spot="-1" aria-pressed="${st.spot === -1}"><b>Otro lugar público</b><span class="small">Escríbelo y confírmalo con el vendedor por mensaje.</span></button>
        ${st.spot === -1 ? `<input id="custom" placeholder="Ej: Walgreens de la Ave. Comerío, Bayamón" value="${esc(st.custom)}">` : ""}
        <span class="label">Día</span>
        <div class="chips wrap">${["Hoy", "Mañana", "Pasado mañana"].map((d, i) => `<button class="chip" data-day="${i}" aria-pressed="${st.day === i}">${d}</button>`).join("")}</div>
        <span class="label">Hora</span>
        <div class="chips wrap">${times.map((t) => `<button class="chip" data-time="${t}" aria-pressed="${st.time === t}">${new Date("2000-01-01T" + t).toLocaleTimeString("es-PR", { hour: "numeric", minute: "2-digit" })}</button>`).join("") || `<span class="small">Ya no quedan horas hoy. Escoge otro día.</span>`}</div>
      </div>` : `
      <div class="panel"><div class="field"><label for="addr">Dirección de envío</label><textarea id="addr" placeholder="Calle, número, urbanización, pueblo y código postal">${esc(st.address)}</textarea></div></div>`}
      <div class="panel"><span class="label">Forma de pago</span>
        ${["apple", "google", "card"].map((p) => `<button class="opt" data-pay="${p}" aria-pressed="${st.pay === p}"><b>${p === "card" ? "Tarjeta de crédito o débito" : PAYNAME[p]}</b></button>`).join("")}
      </div>
      <div class="panel lines">
        <div class="row"><span class="ellip">${esc(title)}</span><span>${money(sub)}</span></div>
        ${disc ? `<div class="row disc"><span>${agreed != null ? "Precio de tu oferta" : "Descuento de lote (10%)"}</span><span>−${money(disc)}</span></div>` : ""}
        <div class="row"><span>Cargo de servicio (5% + $0.70)</span><span>${money(f)}</span></div>
        <div class="row"><span>Envío</span><span>${del ? money(del) : "Gratis"}</span></div>
        <div class="row total"><span>Total</span><span>${money(total)}</span></div>
      </div>
      <p class="small" style="margin:0">El vendedor no recibe el dinero hasta que revises el artículo y confirmes la entrega.</p>
      <button class="btn ${ready && st.pay === "apple" ? "apple" : "primary"}" data-act="pay" ${ready ? "" : "disabled"}>${!ready ? (st.mode === "ship" ? "Escribe tu dirección" : "Escoge lugar y hora") : (st.pay === "card" ? "Pagar " : "Pagar con " + PAYNAME[st.pay] + " · ") + money(total)}</button>
      ${TEST_MODE ? `<p class="small" style="margin:0;text-align:center">Pago de prueba: no se cobra nada de verdad.</p>` : ""}
    </div>`;
  }
  draw();
  app.oninput = (e) => {
    if (e.target.id === "custom") { st.custom = e.target.value; const b = $("[data-act=pay]"); const ok = st.custom.trim().length >= 3 && st.time; b.disabled = !ok; }
    if (e.target.id === "addr") { st.address = e.target.value; const b = $("[data-act=pay]"); b.disabled = st.address.trim().length < 10; }
  };
  app.onchange = (e) => { if (e.target.id === "custom" || e.target.id === "addr") draw(); };
  app.onclick = (e) => {
    const t = e.target.closest("[data-mode],[data-spot],[data-day],[data-time],[data-pay],[data-act]");
    if (!t) return;
    if (t.dataset.mode) st.mode = t.dataset.mode;
    else if (t.dataset.spot != null) st.spot = Number(t.dataset.spot);
    else if (t.dataset.day != null) st.day = Number(t.dataset.day);
    else if (t.dataset.time) st.time = t.dataset.time;
    else if (t.dataset.pay) st.pay = t.dataset.pay;
    else if (t.dataset.act === "pay") {
      return busy(t, async () => {
        const meetAt = st.mode === "meet" ? `${prDay(st.day)}T${st.time}:00-04:00` : null;
        const { data: oid, error } = await sb.rpc("create_order", {
          p_listing_ids: list.map((x) => x.id), p_offer: ck.offer || null, p_mode: st.mode,
          p_spot: st.mode === "meet" ? (st.spot === -1 ? st.custom.trim() : spots[st.spot]) : null,
          p_meet_at: meetAt, p_address: st.mode === "ship" ? st.address.trim() : null,
        });
        if (error) throw error;
        sessionStorage.removeItem("checkout");
        toast("Pago hecho. Tu dinero está protegido.");
        location.hash = "#/pedido/" + oid;
      });
    }
    draw();
  };
}

/* ---------- vender / editar ---------- */
function compress(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1280;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo leer la foto."))), "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Ese archivo no es una foto válida.")); };
    img.src = url;
  });
}
async function sellForm(editId, id) {
  if (needLogin()) return;
  let l = { title: "", description: "", category: "ropa", size: "", condition: "Buen estado", price: "", town: me?.town || "", photos: [] };
  if (editId) {
    app.innerHTML = SPIN;
    const { data } = await sb.from("listings").select("*").eq("id", editId).maybeSingle();
    if (stale(id)) return;
    if (!data || data.seller_id !== uid()) { app.innerHTML = `${back("#/perfil")}<div class="empty">No puedes editar este artículo.</div>`; return; }
    if (data.status === "reserved" || data.status === "sold") { app.innerHTML = `${back("#/item/" + editId)}<div class="empty">Este artículo está en un pedido y no se puede editar.</div>`; return; }
    l = data;
  }
  const photos = [...(l.photos || [])];
  let uploading = 0;
  app.innerHTML = `${editId ? back("#/item/" + editId) : header()}
    <form class="stack" id="sell" novalidate>
      <div><h2>${editId ? "Editar artículo" : "Vender algo"}</h2><span class="small">Publicar es gratis. Te llevas el 100% del precio.</span></div>
      <div class="field"><span class="lbl">Fotos (hasta 8, la primera es la portada)</span><div class="photos" id="photos"></div></div>
      <div class="field"><label for="f-title">Qué vendes</label><input id="f-title" maxlength="80" placeholder="Ej: Jersey de los Cangrejeros, talla L" value="${esc(l.title)}"></div>
      <div class="field"><label for="f-desc">Descripción (opcional)</label><textarea id="f-desc" maxlength="1000" placeholder="Marca, detalles, si tiene algún defecto…">${esc(l.description || "")}</textarea></div>
      <div class="two">
        <div class="field"><label for="f-cat">Categoría</label><select id="f-cat">${CATS.slice(1).map(([k, v]) => `<option value="${k}" ${k === l.category ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="field"><label for="f-size">Talla</label><input id="f-size" maxlength="20" placeholder="M, 9, Única…" value="${esc(l.size || "")}"></div>
      </div>
      <div class="two">
        <div class="field"><label for="f-price">Precio (USD)</label><input id="f-price" type="number" min="1" step="1" inputmode="decimal" placeholder="20" value="${esc(l.price)}"></div>
        <div class="field"><label for="f-town">Municipio</label><select id="f-town"><option value="">Escoge</option>${TOWNS.map((t) => `<option ${t === l.town ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label for="f-cond">Estado</label><select id="f-cond">${CONDS.map((c) => `<option ${c === l.condition ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <p class="err" id="err" hidden></p>
      <button class="btn primary" id="save">${editId ? "Guardar cambios" : "Publicar"}</button>
    </form>`;
  function drawPhotos() {
    $("#photos").innerHTML =
      photos.map((p, i) => `<div class="ph"><img src="${esc(photoUrl(p))}" alt="Foto ${i + 1}"><button type="button" data-rm="${i}" aria-label="Quitar foto">×</button></div>`).join("") +
      (uploading ? `<div class="addph" aria-live="polite" style="font-size:12px">Subiendo…</div>` : "") +
      (photos.length + uploading < 8 ? `<label class="addph" aria-label="Añadir fotos">+<input type="file" accept="image/*" multiple id="pick"></label>` : "");
  }
  drawPhotos();
  app.onchange = async (e) => {
    if (e.target.id !== "pick") return;
    const files = [...e.target.files].slice(0, 8 - photos.length);
    for (const f of files) {
      uploading++; drawPhotos();
      try {
        const blob = await compress(f);
        const path = `${uid()}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (error) throw error;
        photos.push(path);
      } catch (err) { fail(err); }
      uploading--; drawPhotos();
    }
  };
  app.onclick = (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) { e.preventDefault(); const [p] = photos.splice(Number(rm.dataset.rm), 1); drawPhotos(); if (!(l.photos || []).includes(p)) sb.storage.from("fotos").remove([p]); }
  };
  app.onsubmit = (e) => {
    e.preventDefault();
    const err = $("#err");
    const v = {
      title: $("#f-title").value.trim(), description: $("#f-desc").value.trim() || null, category: $("#f-cat").value,
      size: $("#f-size").value.trim() || null, price: parseFloat($("#f-price").value), town: $("#f-town").value, condition: $("#f-cond").value, photos,
    };
    const miss = uploading ? "Espera a que terminen de subir las fotos." : !photos.length ? "Añade al menos una foto." : v.title.length < 3 ? "Escribe qué vendes (3 letras o más)." : !(v.price >= 1) ? "Escribe un precio de $1 o más." : !v.town ? "Escoge tu municipio." : "";
    if (miss) { err.textContent = miss; err.hidden = false; return; }
    err.hidden = true;
    busy($("#save"), async () => {
      if (editId) {
        const { error } = await sb.from("listings").update(v).eq("id", editId);
        if (error) throw error;
        toast("Cambios guardados.");
        location.hash = "#/item/" + editId;
      } else {
        const { data, error } = await sb.from("listings").insert({ ...v, seller_id: uid() }).select("id").single();
        if (error) throw error;
        if (!me?.town) sb.from("profiles").update({ town: v.town }).eq("id", uid()).then(loadMe);
        toast("¡Publicado! Ya aparece en Inicio.");
        location.hash = "#/item/" + data.id;
      }
    });
  };
}

/* ---------- mensajes ---------- */
async function inbox(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top"><h2>Mensajes</h2></div><div class="stack" id="list">${SPIN}</div>`;
  const { data, error } = await sb.from("threads")
    .select("id,last_message_at,buyer_id,seller_id, listing:listings(id,title,photos,price), buyer:profiles!threads_buyer_id_fkey(display_name), seller:profiles!threads_seller_id_fkey(display_name)")
    .or(`buyer_id.eq.${uid()},seller_id.eq.${uid()}`).order("last_message_at", { ascending: false }).limit(100);
  if (stale(id)) return;
  if (error) throw error;
  $("#list").innerHTML = data.length ? data.map((t) => {
    const other = t.buyer_id === uid() ? t.seller : t.buyer;
    return `<a class="listbtn" href="#/chat/${t.id}">${thumb(t.listing)}
      <div style="flex:1;min-width:0"><div class="row"><b class="ellip">${esc(other?.display_name)}</b><span class="small">${fmtAgo(t.last_message_at)}</span></div>
      <div class="small ellip">${t.buyer_id === uid() ? "Comprando" : "Vendiendo"} · ${esc(t.listing?.title || "Artículo")}</div></div></a>`;
  }).join("") : `<div class="empty">No tienes conversaciones todavía.<br>Toca "Enviar mensaje" o "Hacer oferta" en cualquier artículo.</div>`;
}

async function chat(tid, id) {
  if (needLogin()) return;
  app.innerHTML = SPIN;
  const { data: t, error } = await sb.from("threads")
    .select("*, listing:listings(id,title,price,photos,status,seller_id), buyer:profiles!threads_buyer_id_fkey(id,display_name), seller:profiles!threads_seller_id_fkey(id,display_name)")
    .eq("id", tid).maybeSingle();
  if (stale(id)) return;
  if (error) throw error;
  if (!t) { app.innerHTML = `${back("#/mensajes", "Mensajes")}<div class="empty">Conversación no encontrada.</div>`; return; }
  const iAmSeller = t.seller_id === uid();
  const other = iAmSeller ? t.buyer : t.seller;
  const { data: msgs0 } = await sb.from("messages").select("*").eq("thread_id", tid).order("created_at").limit(500);
  if (stale(id)) return;
  const msgs = msgs0 || [];
  const counterOpen = new Set();
  function msgHTML(m) {
    if (m.kind === "system") return `<div class="bub sys">${esc(m.body)}</div>`;
    if (m.kind === "offer") {
      const st = { pending: "Esperando respuesta", accepted: "Aceptada", countered: "Contraoferta: " + money(m.counter_amount || 0), declined: "Rechazada" }[m.offer_status];
      const final = m.offer_status === "accepted" ? m.offer_amount : m.offer_status === "countered" ? m.counter_amount : null;
      return `<div class="offercard"><div class="row"><span class="label">${iAmSeller ? "Oferta recibida" : "Tu oferta"}</span><span class="pillstate ${m.offer_status === "declined" ? "off" : m.offer_status === "pending" ? "wait" : "ok"}">${st}</span></div>
        <div><span class="strike">${money(t.listing?.price || 0)}</span><span class="price">${money(m.offer_amount)}</span></div>
        ${iAmSeller && m.offer_status === "pending" ? `
          <div class="btns"><button class="btn sea small" data-acc="${m.id}">Aceptar</button><button class="btn ghost small" data-dec="${m.id}">Rechazar</button></div>
          ${counterOpen.has(m.id) ? `<form class="row" data-cform="${m.id}"><input type="number" step="0.01" min="1" inputmode="decimal" placeholder="Tu precio" aria-label="Contraoferta"><button class="btn primary small" style="width:auto">Enviar</button></form>` : `<button class="btn ghost small" data-ctr="${m.id}">Hacer contraoferta</button>`}` : ""}
        ${!iAmSeller && final != null && t.listing?.status === "active" ? `<button class="btn primary small" data-buyat="${m.id}">Comprar a ${money(final)}</button>` : ""}</div>`;
    }
    return `<div class="bub ${m.sender_id === uid() ? "me" : "them"}">${esc(m.body)}</div>`;
  }
  function draw() {
    app.innerHTML = `${back("#/mensajes", "Mensajes")}
      <a class="listbtn" href="#/item/${t.listing?.id}">${thumb(t.listing)}<div style="flex:1;min-width:0"><div class="ellip"><b>${esc(t.listing?.title || "Artículo")}</b></div><div class="small">${esc(other?.display_name)} · ${money(t.listing?.price || 0)}</div></div></a>
      <div class="chat" id="chat"><div class="bub sys">Por tu seguridad, paga siempre dentro de la app y nunca compartas códigos fuera de ella.</div>${msgs.map(msgHTML).join("")}</div>`;
    window.scrollTo(0, document.body.scrollHeight);
  }
  draw();
  const comp = document.createElement("div");
  comp.className = "composer";
  comp.innerHTML = `<form><input id="msgIn" placeholder="Escribe un mensaje…" aria-label="Mensaje" autocomplete="off" maxlength="1000"><button>Enviar</button></form>`;
  document.body.appendChild(comp);
  comp.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const inp = $("#msgIn");
    const body = inp.value.trim();
    if (!body) return;
    inp.value = "";
    const { data, error } = await sb.from("messages").insert({ thread_id: tid, sender_id: uid(), body }).select().single();
    if (error) { inp.value = body; return fail(error); }
    if (!msgs.some((x) => x.id === data.id)) { msgs.push(data); draw(); }
  };
  const ch = sb.channel("chat-" + tid)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `thread_id=eq.${tid}` }, (p) => {
      const m = p.new;
      const i = msgs.findIndex((x) => x.id === m.id);
      if (i >= 0) msgs[i] = m; else msgs.push(m);
      draw();
    }).subscribe();
  cleanups.push(() => sb.removeChannel(ch));
  app.onclick = (e) => {
    const b = e.target.closest("[data-acc],[data-dec],[data-ctr],[data-buyat]");
    if (!b) return;
    if (b.dataset.ctr) { counterOpen.add(b.dataset.ctr); draw(); return; }
    if (b.dataset.buyat) { sessionStorage.setItem("checkout", JSON.stringify({ ids: [t.listing_id], offer: b.dataset.buyat })); location.hash = "#/comprar"; return; }
    busy(b, async () => {
      const { error } = await sb.rpc("respond_offer", { p_message: b.dataset.acc || b.dataset.dec, p_action: b.dataset.acc ? "accept" : "decline", p_counter: null });
      if (error) throw error;
      await refresh();
    });
  };
  app.onsubmit = (e) => {
    const f = e.target.closest("[data-cform]");
    if (!f) return;
    e.preventDefault();
    const v = parseFloat(f.querySelector("input").value);
    busy(f.querySelector("button"), async () => {
      const { error } = await sb.rpc("respond_offer", { p_message: f.dataset.cform, p_action: "counter", p_counter: v });
      if (error) throw error;
      counterOpen.delete(f.dataset.cform);
      await refresh();
    });
  };
  async function refresh() {
    const { data } = await sb.from("messages").select("*").eq("thread_id", tid).order("created_at").limit(500);
    msgs.splice(0, msgs.length, ...(data || []));
    draw();
  }
}

/* ---------- pedidos ---------- */
let ordersTab = "buy";
async function orders(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top"><h2>Pedidos</h2><div class="tabs"><button data-tab="buy" aria-pressed="${ordersTab === "buy"}">Mis compras</button><button data-tab="sell" aria-pressed="${ordersTab === "sell"}">Mis ventas</button></div></div><div class="stack" id="list">${SPIN}</div>`;
  app.onclick = (e) => { const b = e.target.closest("[data-tab]"); if (b) { ordersTab = b.dataset.tab; orders(++renderId); } };
  const { data: os, error } = await sb.from("orders").select("*").eq(ordersTab === "buy" ? "buyer_id" : "seller_id", uid()).order("created_at", { ascending: false }).limit(100);
  if (stale(id)) return;
  if (error) throw error;
  const ids = [...new Set(os.flatMap((o) => o.listing_ids))];
  const { data: ls } = ids.length ? await sb.from("listings").select("id,title,photos").in("id", ids) : { data: [] };
  if (stale(id)) return;
  const byId = Object.fromEntries((ls || []).map((x) => [x.id, x]));
  $("#list").innerHTML = os.length ? os.map((o) => {
    const l = byId[o.listing_ids[0]];
    return `<a class="listbtn" href="#/pedido/${o.id}">${thumb(l)}<div style="flex:1;min-width:0"><div class="ellip"><b>${o.listing_ids.length > 1 ? `Lote de ${o.listing_ids.length} artículos` : esc(l?.title || "Artículo")}</b></div>
      <div class="small ellip">${o.delivery_mode === "meet" ? (o.meet_at ? fmtWhen(o.meet_at) + " · " : "") + esc(o.meet_spot) : "Envío por correo"}</div></div>${pill(o)}</a>`;
  }).join("") : `<div class="empty">${ordersTab === "buy" ? "Todavía no has comprado nada." : "Todavía no has vendido nada."}</div>`;
}
function pill(o) {
  if (o.status === "refunded") return `<span class="pillstate off">Reembolsado</span>`;
  if (o.status === "completed") return `<span class="pillstate ok">Completado</span>`;
  if (o.status === "shipped") return `<span class="pillstate wait">En camino</span>`;
  return `<span class="pillstate wait">${o.delivery_mode === "meet" ? "Por encontrar" : "Por enviar"}</span>`;
}

async function order(oid, id) {
  if (needLogin()) return;
  app.innerHTML = SPIN;
  const { data: o, error } = await sb.from("orders").select("*").eq("id", oid).maybeSingle();
  if (stale(id)) return;
  if (error) throw error;
  if (!o) { app.innerHTML = `${back("#/pedidos", "Pedidos")}<div class="empty">Pedido no encontrado.</div>`; return; }
  const iAmBuyer = o.buyer_id === uid();
  const otherId = iAmBuyer ? o.seller_id : o.buyer_id;
  const [{ data: ls }, { data: other }, codeRes, revRes] = await Promise.all([
    sb.from("listings").select("id,title,photos,price").in("id", o.listing_ids),
    sb.from("profiles").select("id,display_name").eq("id", otherId).maybeSingle(),
    iAmBuyer ? sb.from("order_codes").select("code").eq("order_id", oid).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("reviews").select("id").eq("order_id", oid).eq("reviewer_id", uid()).maybeSingle(),
  ]);
  if (stale(id)) return;
  const code = codeRes.data?.code;
  let reviewed = !!revRes.data;
  const open = o.status === "paid" || o.status === "shipped";
  const steps = o.delivery_mode === "meet" ? ["Pagado", "Encuentro", "Entregado"] : ["Pagado", "En camino", "Recibido"];
  const stepN = o.status === "completed" ? 2 : o.status === "shipped" ? 1 : o.status === "paid" ? 0 : -1;
  const title = o.listing_ids.length > 1 ? `Lote de ${o.listing_ids.length} artículos` : ls?.[0]?.title || "Artículo";
  let stars = 0;
  let rejectOpen = false;

  function actions() {
    if (o.status === "refunded") return `<div class="panel"><b>Reembolsado</b><span class="small">${esc(o.refund_reason || "")} Reembolso al comprador: ${money(o.refund_amount || 0)}.</span></div>`;
    if (o.status === "completed") return `
      <div class="panel" style="background:var(--ok-soft)"><b style="color:var(--ok)">Entrega confirmada</b><span class="small" style="color:var(--ink)">${iAmBuyer ? "Se le pagó al vendedor." : "Recibiste " + money(o.subtotal - o.discount) + "."}${TEST_MODE ? " (Prueba: no se movió dinero real.)" : ""}</span></div>
      ${reviewed ? `<div class="small" style="text-align:center">Ya calificaste a ${esc(other?.display_name)}. ¡Gracias!</div>` : `
      <form class="panel" id="review"><span class="label">Califica a ${esc(other?.display_name)}</span>
        <div class="stars" role="radiogroup" aria-label="Estrellas">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-pressed="${n <= stars}" aria-label="${n} estrellas">★</button>`).join("")}</div>
        <input id="rcomment" maxlength="300" placeholder="Comentario (opcional)"><button class="btn sea">Enviar calificación</button></form>`}`;
    if (iAmBuyer) {
      if (o.delivery_mode === "meet") return `
        <div class="panel qrwrap"><span class="label">Tu código de entrega</span><div class="qrbox" id="qr">Cargando…</div>
          <span class="code">${code ? code.slice(0, 3) + " " + code.slice(3) : "—"}</span>
          <span class="small" style="text-align:center">Primero revisa el artículo. Si está bien, deja que el vendedor escanee este código. Si no, toca "No lo acepto". Nunca envíes este código por mensaje.</span></div>
        ${rejectOpen ? rejectForm() : `<button class="btn ghost" data-act="reject">No lo acepto (reembolso inmediato)</button>`}
        <div class="panel"><span class="label">Si algo pasa</span>
          <div class="btns"><button class="btn ghost small" data-act="seller_no_show">El vendedor no llegó</button><button class="btn ghost small" data-act="buyer_cant">No puedo llegar</button></div>
          <button class="btn ghost small" data-act="received">Ya lo recibí y está bien</button></div>`;
      if (o.status === "paid") return `<div class="panel"><b>Esperando que ${esc(other?.display_name)} lo envíe.</b><span class="small">Te avisamos cuando salga.</span></div>
        <button class="btn ghost" data-act="buyer_cant">Cancelar pedido</button>`;
      return `<div class="panel"><b>¡Va en camino!</b><span class="small">Cuando llegue, revísalo y confirma.</span></div>
        <button class="btn sea" data-act="received">Lo recibí y está bien</button>
        ${rejectOpen ? rejectForm() : `<button class="btn ghost" data-act="reject">Hay un problema</button>`}`;
    }
    if (o.delivery_mode === "meet") return `
      <form class="panel" id="codeForm"><span class="label">Confirmar la entrega</span>
        <span class="small">Pídele al comprador su código cuando tenga el artículo en la mano. Escanéalo o escríbelo.</span>
        <input id="codeIn" inputmode="numeric" maxlength="7" placeholder="Código de 6 números" aria-label="Código de entrega">
        <div class="btns"><button type="button" class="btn ghost small" data-act="scan">Escanear código</button><button class="btn sea small">Confirmar entrega</button></div>
        <div id="scanner" hidden></div></form>
      <div class="panel"><span class="label">Si algo pasa</span>
        <div class="btns"><button class="btn ghost small" data-act="buyer_no_show">El comprador no llegó</button><button class="btn ghost small" data-act="seller_cant">No puedo ir</button></div></div>`;
    return `<div class="panel"><span class="label">Enviar a</span><div style="white-space:pre-wrap">${esc(o.ship_address)}</div></div>
      ${o.status === "paid" ? `<button class="btn sea" data-act="shipped">Ya lo envié</button><button class="btn ghost" data-act="seller_cant">No puedo enviarlo</button>` : `<div class="panel"><b>Enviado.</b><span class="small">El dinero se libera cuando el comprador confirme que lo recibió.</span></div>`}`;
  }
  const rejectForm = () => `<form class="panel" id="rejectForm"><span class="label">¿Qué pasó con el artículo?</span><input id="rreason" maxlength="200" placeholder="Ej: no es la talla que decía"><button class="btn primary">Pedir reembolso</button></form>`;

  function draw() {
    app.innerHTML = `${back("#/pedidos", "Pedidos")}
    <div class="stack">
      <div class="status">${steps.map((s, i) => `<div class="${i <= stepN ? "done" : ""}">${s}</div>`).join("")}</div>
      <div class="panel"><div class="row" style="align-items:flex-start">${thumb(ls?.[0])}<div style="flex:1;min-width:0"><h3 style="font-size:18px">${esc(title)}</h3>
        <div class="small">${iAmBuyer ? "Vendedor" : "Comprador"}: <a href="#/u/${otherId}">${esc(other?.display_name)}</a></div></div></div>
        <div class="small">${o.delivery_mode === "meet" ? `<b>${o.meet_at ? fmtWhen(o.meet_at) : ""}</b><br>${esc(o.meet_spot)}` : "Envío por correo"}</div>
        <div class="lines small">
          <div class="row"><span>Artículos</span><span>${money(o.subtotal)}</span></div>
          ${Number(o.discount) ? `<div class="row disc"><span>Descuento</span><span>−${money(o.discount)}</span></div>` : ""}
          <div class="row"><span>Cargo de servicio</span><span>${money(o.service_fee)}</span></div>
          ${Number(o.delivery_fee) ? `<div class="row"><span>Envío</span><span>${money(o.delivery_fee)}</span></div>` : ""}
          <div class="row total"><span>Total pagado</span><span>${money(o.total)}</span></div>
        </div></div>
      ${actions()}
      <a class="btn ghost small" href="#" data-act="chat">Escribirle a ${esc(other?.display_name)}</a>
    </div>`;
    if (iAmBuyer && open && o.delivery_mode === "meet" && code) drawQR(code);
  }
  draw();

  async function drawQR(c) {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js");
      const q = window.qrcode(0, "M");
      q.addData("PULGUEA:" + c);
      q.make();
      const box = $("#qr");
      if (box) box.innerHTML = q.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
    } catch { const box = $("#qr"); if (box) box.textContent = "Muestra el código de abajo."; }
  }
  async function reload() {
    const { data } = await sb.from("orders").select("*").eq("id", oid).maybeSingle();
    if (data) Object.assign(o, data);
    const r = await sb.from("reviews").select("id").eq("order_id", oid).eq("reviewer_id", uid()).maybeSingle();
    if (stale(id)) return;
    reviewed = !!r.data;
    rejectOpen = false;
    stopScan();
    draw();
  }
  const ch = sb.channel("order-" + oid).on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${oid}` }, () => reload()).subscribe();
  cleanups.push(() => sb.removeChannel(ch));
  let scanner = null;
  function stopScan() { if (scanner) { scanner.stop().catch(() => {}); scanner = null; } }
  cleanups.push(stopScan);

  const cancelMsg = { seller_no_show: "Toca otra vez: el vendedor no llegó", buyer_cant: "Toca otra vez para cancelar", buyer_no_show: "Toca otra vez: el comprador no llegó", seller_cant: "Toca otra vez para cancelar" };
  app.onclick = async (e) => {
    const s = e.target.closest("[data-star]");
    if (s) { stars = Number(s.dataset.star); document.querySelectorAll("[data-star]").forEach((x) => x.setAttribute("aria-pressed", Number(x.dataset.star) <= stars)); return; }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "chat") {
      e.preventDefault();
      const { data: t } = await sb.from("threads").select("id").eq("listing_id", o.listing_ids[0]).eq("buyer_id", o.buyer_id).maybeSingle();
      if (t) location.hash = "#/chat/" + t.id;
      return;
    }
    if (act === "reject") { rejectOpen = true; draw(); $("#rreason")?.focus(); return; }
    if (act === "scan") return startScan(b);
    if (cancelMsg[act]) {
      if (!confirmTap(b, cancelMsg[act])) return;
      return busy(b, async () => { const { error } = await sb.rpc("cancel_order", { p_order: oid, p_reason: act }); if (error) throw error; toast("Pedido cancelado."); await reload(); });
    }
    if (act === "received") {
      if (!confirmTap(b, "Toca otra vez: se le paga al vendedor")) return;
      return busy(b, async () => { const { error } = await sb.rpc("confirm_received", { p_order: oid }); if (error) throw error; toast("¡Listo! Pedido completado."); await reload(); });
    }
    if (act === "shipped") return busy(b, async () => { const { error } = await sb.rpc("mark_shipped", { p_order: oid }); if (error) throw error; toast("Marcado como enviado."); await reload(); });
  };
  app.onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector("button:not([type=button])");
    if (f.id === "codeForm") return submitCode($("#codeIn").value, btn);
    if (f.id === "rejectForm") return busy(btn, async () => { const { error } = await sb.rpc("reject_order", { p_order: oid, p_reason: $("#rreason").value }); if (error) throw error; toast("Reembolso hecho."); await reload(); });
    if (f.id === "review") {
      if (!stars) return toast("Escoge de 1 a 5 estrellas.");
      return busy(btn, async () => { const { error } = await sb.rpc("leave_review", { p_order: oid, p_stars: stars, p_comment: $("#rcomment").value }); if (error) throw error; toast("¡Gracias por calificar!"); await reload(); });
    }
  };
  async function submitCode(raw, btn) {
    const c = String(raw || "").replace(/\D/g, "");
    if (c.length !== 6) return toast("El código tiene 6 números.");
    await busy(btn || $("#codeForm button:not([type=button])"), async () => {
      const { data: ok, error } = await sb.rpc("complete_order", { p_order: oid, p_code: c });
      if (error) throw error;
      if (!ok) return toast("Ese código no es correcto. Revísalo con el comprador.");
      toast("¡Entrega confirmada! El dinero es tuyo.");
      await reload();
    });
  }
  async function startScan(btn) {
    const box = $("#scanner");
    if (scanner) { stopScan(); box.hidden = true; btn.textContent = "Escanear código"; return; }
    await busy(btn, async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js");
      box.hidden = false;
      btn.textContent = "Cerrar cámara";
      scanner = new window.Html5Qrcode("scanner");
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 220 }, (text) => {
        const m = /PULGUEA:(\d{6})/.exec(text);
        if (!m) return;
        stopScan();
        box.hidden = true;
        $("#codeIn").value = m[1];
        submitCode(m[1]);
      }).catch((err) => { scanner = null; box.hidden = true; btn.textContent = "Escanear código"; throw new Error("No se pudo abrir la cámara. Escribe el código a mano."); });
    });
  }
}

/* ---------- perfil ---------- */
async function profile(id) {
  if (needLogin()) return;
  await loadMe();
  app.innerHTML = SPIN;
  const { data: mine } = await sb.from("listings").select("id,title,price,size,condition,town,photos,status").eq("seller_id", uid()).neq("status", "removed").order("created_at", { ascending: false });
  if (stale(id)) return;
  app.innerHTML = `<div class="top"><h2>Mi perfil</h2></div>
  <div class="stack">
    <div class="panel"><div class="seller"><div class="avatar" style="background:var(--flame)">${initial(me?.display_name)}</div>
      <div><b>${esc(me?.display_name)}</b><div class="small">${me?.rating_count ? "★ " + Number(me.rating_avg).toFixed(1) + " (" + me.rating_count + " reseñas)" : "Sin reseñas todavía"} · ${me?.sales_count || 0} ventas</div><div class="small">${esc(session.user.email)}</div></div></div></div>
    <form class="panel" id="pform"><span class="label">Tus datos públicos</span>
      <div class="field"><label for="p-name">Nombre que ven los demás</label><input id="p-name" maxlength="40" value="${esc(me?.display_name)}"></div>
      <div class="field"><label for="p-town">Tu pueblo</label><select id="p-town"><option value="">Escoge</option>${TOWNS.map((t) => `<option ${t === me?.town ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="field"><label for="p-bio">Sobre ti (opcional)</label><textarea id="p-bio" maxlength="280" placeholder="Ej: Vendo ropa de mujer talla S y M. Me encuentro en Bayamón.">${esc(me?.bio || "")}</textarea></div>
      <button class="btn sea small">Guardar</button></form>
    <div class="row"><h3 style="font-size:18px">Lo que vendes</h3><a class="small" href="#/vender">+ Publicar</a></div>
    <div class="grid">${mine.map(cardHTML).join("") || `<div class="empty" style="grid-column:1/-1">Todavía no has publicado nada.</div>`}</div>
    <div class="panel"><span class="label">Cómo funciona Pulguea</span>
      <div class="small" style="color:var(--ink)"><b>1.</b> El comprador paga en la app y el dinero queda guardado.<br><b>2.</b> Se encuentran en una zona segura (o se envía por correo).<br><b>3.</b> El comprador revisa. Si está bien, el vendedor escanea su código y cobra al instante. Si no, el comprador recibe su dinero de vuelta.</div></div>
    <div class="panel"><span class="label">Si alguien no aparece</span>
      <div class="small" style="color:var(--ink)"><b>Vendedor:</b> el comprador recibe todo su dinero y el vendedor recibe una falta.<br><b>Comprador:</b> recibe el precio de vuelta, pero el cargo de servicio va al vendedor por su viaje.</div></div>
    <button class="btn ghost" id="out">Cerrar sesión</button>
  </div>`;
  app.onsubmit = (e) => {
    e.preventDefault();
    const name = $("#p-name").value.trim();
    if (!name) return toast("Escribe tu nombre.");
    busy(e.target.querySelector("button"), async () => {
      const { error } = await sb.from("profiles").update({ display_name: name, town: $("#p-town").value || null, bio: $("#p-bio").value.trim() || null }).eq("id", uid());
      if (error) throw error;
      await loadMe();
      toast("Guardado.");
    });
  };
  app.onclick = async (e) => { if (e.target.id === "out") { await sb.auth.signOut(); toast("Cerraste sesión."); location.hash = "#/"; } };
}

async function publicProfile(pid, id) {
  app.innerHTML = SPIN;
  const [{ data: p }, { data: ls }, { data: rv }] = await Promise.all([
    sb.from("profiles").select("id,display_name,town,bio,rating_avg,rating_count,sales_count,created_at").eq("id", pid).maybeSingle(),
    sb.from("listings").select("id,title,price,size,condition,town,photos,status").eq("seller_id", pid).eq("status", "active").order("created_at", { ascending: false }),
    sb.from("reviews").select("stars,comment,created_at, reviewer:profiles!reviews_reviewer_id_fkey(display_name)").eq("reviewee_id", pid).order("created_at", { ascending: false }).limit(20),
  ]);
  if (stale(id)) return;
  if (!p) { app.innerHTML = `${back("#/")}<div class="empty">Perfil no encontrado.</div>`; return; }
  app.innerHTML = `${back("javascript:history.back()")}
  <div class="stack">
    <div class="panel"><div class="seller"><div class="avatar">${initial(p.display_name)}</div><div><b>${esc(p.display_name)}</b>
      <div class="small">${p.rating_count ? "★ " + Number(p.rating_avg).toFixed(1) + " (" + p.rating_count + " reseñas)" : "Sin reseñas todavía"} · ${p.sales_count} ventas${p.town ? " · " + esc(p.town) : ""}</div></div></div>
      ${p.bio ? `<div style="white-space:pre-wrap">${esc(p.bio)}</div>` : ""}
      <div class="small">En Pulguea desde ${new Intl.DateTimeFormat("es-PR", { month: "long", year: "numeric" }).format(new Date(p.created_at))}</div></div>
    ${ls.length > 1 && pid !== uid() ? `<a class="btn ghost small" href="#/lote/${pid}">Armar un lote (10% menos)</a>` : ""}
    <h3 style="font-size:18px">A la venta</h3>
    <div class="grid">${ls.map(cardHTML).join("") || `<div class="empty" style="grid-column:1/-1">No tiene artículos a la venta.</div>`}</div>
    ${rv?.length ? `<h3 style="font-size:18px">Reseñas</h3>${rv.map((r) => `<div class="panel"><div class="row"><b>${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</b><span class="small">${esc(r.reviewer?.display_name)} · ${fmtAgo(r.created_at)}</span></div>${r.comment ? `<div>${esc(r.comment)}</div>` : ""}</div>`).join("")}` : ""}
  </div>`;
}

/* ---------- entrar ---------- */
let authTab = "in";
async function auth() {
  if (session) { location.hash = "#/perfil"; return; }
  app.innerHTML = `${header()}
  <div class="stack">
    <div class="tabs"><button data-tab="in" aria-pressed="${authTab === "in"}">Entrar</button><button data-tab="up" aria-pressed="${authTab === "up"}">Crear cuenta</button></div>
    <form class="panel" id="af" novalidate>
      ${authTab === "up" ? `<div class="field"><label for="a-name">Tu nombre</label><input id="a-name" autocomplete="given-name" maxlength="40" placeholder="Ej: Karla"></div>` : ""}
      <div class="field"><label for="a-mail">Correo electrónico</label><input id="a-mail" type="email" autocomplete="email" placeholder="tu@correo.com"></div>
      <div class="field"><label for="a-pass">Contraseña</label><input id="a-pass" type="password" autocomplete="${authTab === "up" ? "new-password" : "current-password"}" placeholder="Al menos 6 caracteres"></div>
      <p class="err" id="aerr" hidden></p>
      <button class="btn primary" id="ago">${authTab === "up" ? "Crear cuenta" : "Entrar"}</button>
      ${authTab === "in" ? `<button type="button" class="btn ghost small" id="forgot">Olvidé mi contraseña</button>` : `<span class="small">Al crear tu cuenta aceptas usar Pulguea con respeto y vender solo cosas tuyas.</span>`}
    </form>
    <div id="sent" hidden class="panel"><b>Revisa tu correo</b><span class="small" id="senttext"></span></div>
  </div>`;
  const showErr = (m) => { const x = $("#aerr"); x.textContent = m; x.hidden = !m; };
  app.onclick = async (e) => {
    const t = e.target.closest("[data-tab]");
    if (t) { authTab = t.dataset.tab; auth(); return; }
    if (e.target.id === "forgot") {
      const mail = $("#a-mail").value.trim();
      if (!/^\S+@\S+\.\S+$/.test(mail)) return showErr("Escribe tu correo arriba primero.");
      busy(e.target, async () => {
        const { error } = await sb.auth.resetPasswordForEmail(mail, { redirectTo: location.origin + location.pathname });
        if (error) throw error;
        $("#sent").hidden = false;
        $("#senttext").textContent = "Te enviamos un enlace para crear una contraseña nueva.";
      });
    }
  };
  app.onsubmit = (e) => {
    e.preventDefault();
    const mail = $("#a-mail").value.trim();
    const pass = $("#a-pass").value;
    const name = $("#a-name")?.value.trim();
    if (authTab === "up" && !name) return showErr("Escribe tu nombre.");
    if (!/^\S+@\S+\.\S+$/.test(mail)) return showErr("Escribe un correo válido.");
    if (pass.length < 6) return showErr("La contraseña tiene que tener al menos 6 caracteres.");
    showErr("");
    busy($("#ago"), async () => {
      if (authTab === "up") {
        const { data, error } = await sb.auth.signUp({ email: mail, password: pass, options: { data: { display_name: name }, emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        if (!data.session) {
          $("#af").hidden = true;
          $("#sent").hidden = false;
          $("#senttext").textContent = `Te enviamos un enlace a ${mail} para confirmar tu cuenta. Ábrelo desde este mismo teléfono y luego entra con tu contraseña.`;
          return;
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email: mail, password: pass });
        if (error) throw error;
      }
      toast("¡Bienvenido a Pulguea!");
      let next = "#/";
      try { next = sessionStorage.getItem("next") || "#/"; sessionStorage.removeItem("next"); } catch {}
      location.hash = next === "#/entrar" ? "#/" : next;
    });
  };
}
async function newPassword() {
  if (!session) { location.hash = "#/entrar"; return; }
  app.innerHTML = `${header()}<form class="panel" id="np"><span class="label">Crea tu contraseña nueva</span>
    <input id="np1" type="password" autocomplete="new-password" placeholder="Al menos 6 caracteres"><button class="btn primary">Guardar contraseña</button></form>`;
  app.onsubmit = (e) => {
    e.preventDefault();
    const p = $("#np1").value;
    if (p.length < 6) return toast("La contraseña tiene que tener al menos 6 caracteres.");
    busy(e.target.querySelector("button"), async () => { const { error } = await sb.auth.updateUser({ password: p }); if (error) throw error; toast("Contraseña cambiada."); location.hash = "#/"; });
  };
}

/* ---------- arranque ---------- */
(async () => {
  const { data } = await sb.auth.getSession();
  session = data.session;
  await loadMe();
  let recovering = false;
  sb.auth.onAuthStateChange((ev, s) => {
    const had = !!session;
    session = s;
    if (ev === "PASSWORD_RECOVERY") { recovering = true; loadMe().then(() => (location.hash = "#/clave")); return; }
    if (had !== !!s) loadMe().then(() => { if (!recovering) route(); });
  });
  window.addEventListener("hashchange", route);
  route();
})();
