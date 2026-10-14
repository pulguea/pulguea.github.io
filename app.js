import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_KEY, TEST_MODE } from "./config.js";
import { SECTIONS, SIZE_GROUPS, CONDS, COLORS, MATERIALS, BRANDS, PARCELS, GENDER_GROUPS, ALL_LEAVES, sectionName, sectionKey, nodeAt, childrenAt, isLeaf, sizeGroupsFor } from "./catalog.js";

// Guardamos el link con el que se abrió la app ANTES de que Supabase lo lea y lo borre
const START_HASH = location.hash;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
});

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const r2 = (n) => Math.round(n * 100 + 1e-6) / 100;
const money = (n) => "$" + Number(n).toFixed(2);
const fee = (p) => r2(Number(p) * 0.05 + 0.7);
const withFee = (p) => r2(Number(p) + fee(p));
const SHIPPING_ON = false; // envío por correo apagado hasta conectar etiquetas reales (Shippo/EasyPost)
const shipFor = (code) => (PARCELS.find((x) => x[0] === code) || PARCELS[1])[3];
const EDIT = `<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>`;
const PLUS = `<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
const catLabel = (l) => (l.cat_path?.length ? l.cat_path.slice(-2).join(" › ") : [sectionName(l.section), l.subcategory].filter(Boolean).join(" › "));
const BUNDLE_OFF = 0.1;
const photoUrl = (p) => `${SUPABASE_URL}/storage/v1/object/public/fotos/${p}`;
const uid = () => session?.user?.id;
const LIST_COLS = "id,title,price,size,brand,section,subcategory,cat_path,parcel,cond,condition,town,photos,status,fav_count,seller_id";
const FEED_COLS = LIST_COLS + ",seller:profiles!listings_seller_id_fkey!inner(vacation,sales_count,rating_count,rating_avg,strikes)";
// Vendedor confiable: 5+ ventas en la app, 3+ reseñas, 4.5+ estrellas y ninguna falta
const TRUST = { sales: 5, reviews: 3, stars: 4.5 };
const isTrusted = (p) => !!p && p.sales_count >= TRUST.sales && p.rating_count >= TRUST.reviews && Number(p.rating_avg) >= TRUST.stars && !p.strikes;
const TRUST_SVG = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 3l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`;
const trustBadge = (p, big) => (isTrusted(p) ? `<span class="trust ${big ? "big" : ""}" title="Vendedor confiable">${TRUST_SVG}${big ? "Vendedor confiable" : "Confiable"}</span>` : "");
const TOWNS = ["Adjuntas","Aguada","Aguadilla","Aguas Buenas","Aibonito","Añasco","Arecibo","Arroyo","Barceloneta","Barranquitas","Bayamón","Cabo Rojo","Caguas","Camuy","Canóvanas","Carolina","Cataño","Cayey","Ceiba","Ciales","Cidra","Coamo","Comerío","Corozal","Culebra","Dorado","Fajardo","Florida","Guánica","Guayama","Guayanilla","Guaynabo","Gurabo","Hatillo","Hormigueros","Humacao","Isabela","Jayuya","Juana Díaz","Juncos","Lajas","Lares","Las Marías","Las Piedras","Loíza","Luquillo","Manatí","Maricao","Maunabo","Mayagüez","Moca","Morovis","Naguabo","Naranjito","Orocovis","Patillas","Peñuelas","Ponce","Quebradillas","Rincón","Río Grande","Sabana Grande","Salinas","San Germán","San Juan","San Lorenzo","San Sebastián","Santa Isabel","Toa Alta","Toa Baja","Trujillo Alto","Utuado","Vega Alta","Vega Baja","Vieques","Villalba","Yabucoa","Yauco"];
const PAYNAME = { apple: "Apple Pay", google: "Google Pay", card: "tarjeta" };
const LOGO = `<svg viewBox="0 0 60 102" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"><path d="M27 35 L22 21"/><path d="M40 35 L45 21"/></g><circle cx="21.5" cy="19" r="5" fill="currentColor"/><circle cx="45.5" cy="19" r="5" fill="currentColor"/><path d="M10 32 V100" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="33" cy="55" r="21" fill="#FF5A4E" stroke="currentColor" stroke-width="8"/><rect x="0" y="97.2" width="22" height="4.8" fill="currentColor"/><rect x="0" y="32" width="10" height="4.8" fill="currentColor"/></svg>`;
const PLACEHOLDER = `<svg width="40%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/></svg>`;
const HEART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.4 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.6 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>`;
const SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>`;
const CHEV = `<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
const SEARCH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => (t.hidden = true), 3200);
}
const fail = (e) => toast(cleanErr(e));
/* ---------- protección contra ventas por fuera ---------- */
// Igual que _offapp_hit en la base de datos. "pago" = siempre bloqueado; "contacto" = solo después de pagar.
function offAppHit(text) {
  if (!text || !text.trim()) return null;
  const n = " " + text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9@]+/g, " ") + " ";
  const w = (list) => new RegExp("(^|\\s)(" + list + ")(?=\\s)").test(n);
  if (w("a ?t ?h|athmovil|venmo|zelle|paypal|cashapp|cash|efectivo|cashito|transferencia") ||
      w("cash app|ath movil|ath mobile|chavos en mano|por fuera|fuera de la app|fuera del app|fuera de pulguea|sin la app|sin el app|sin pulguea|por el lado|cancelamos y|cancela y te")) return "pago";
  if (w("whatsapp|whats|wasap|watsap|guasap|telegram|instagram|insta|snapchat|signal|wa me|por privado|al privado|mi numero|mi cel|mi celular|textea|textear|textiame|llamame|escribeme al") ||
      /(\d[\s().\-_/]*){7,}/.test(text) || /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text) || /[a-z0-9._%+-]+ ?@ ?[a-z0-9-]+ (com|net|org|pr|us)(?=\s)/.test(n)) return "contacto";
  return null;
}
const OFFAPP_MSG = {
  pago: "En Pulguea no se puede hablar de pagar por fuera (ATH, efectivo, Venmo…). Paga dentro de la app: tu dinero queda protegido y nada de capturas de pantalla falsas.",
  contacto: "Los teléfonos, correos y redes se pueden compartir después de la compra. Por ahora sigan hablando por aquí.",
};
function cleanErr(e) {
  const m0 = e?.message || String(e || "Algo salió mal.");
  const m = m0.replace(/^OFFAPP_[A-Z]+:\s*/, "");
  if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
  if (/Email not confirmed/i.test(m)) return "Confirma tu correo primero. Revisa tu buzón.";
  if (/User already registered/i.test(m)) return "Ya existe una cuenta con ese correo. Entra con tu contraseña.";
  if (/Password should be/i.test(m)) return "La contraseña tiene que tener al menos 6 caracteres.";
  if (/rate limit/i.test(m)) return "Demasiados intentos. Espera unos minutos.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "No hay conexión. Revisa tu internet.";
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
const fmtWhen = (ts) => new Intl.DateTimeFormat("es-PR", { timeZone: "America/Puerto_Rico", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(ts));
const fmtAgo = (ts) => {
  const s = (Date.now() - new Date(ts)) / 1000;
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 7) return `hace ${Math.floor(s / 86400)} d`;
  return new Intl.DateTimeFormat("es-PR", { day: "numeric", month: "short" }).format(new Date(ts));
};
const initial = (n) => esc((n || "?").trim().charAt(0));
const condOf = (l) => l.cond || l.condition || "";
const header = (extra = "") => `<div class="top"><div class="brand"><a class="logo" href="#/" aria-label="pulguea">${LOGO}<span aria-hidden="true">ulguea</span></a><span class="tag">El pulguero de bolsillo</span></div>${TEST_MODE ? `<div class="testbar">Versión de prueba: los pagos son de mentira</div>` : ""}${extra}</div>`;
const back = (href, label = "Volver") => `<a class="back" href="${href}">‹ ${label}</a>`;
const img = (p, alt = "") => `<img class="fade" src="${esc(photoUrl(p))}" alt="${esc(alt)}" loading="lazy" onload="this.classList.add('in')">`;
const thumb = (l) => `<div class="thumb">${l?.photos?.[0] ? img(l.photos[0]) : ""}</div>`;
const skelGrid = (n = 6) => Array.from({ length: n }, () => `<div class="skel skelcard"></div>`).join("");

/* ---------- favoritos ---------- */
let favs = new Set();
/* ---------- preferencias (Personalización) ---------- */
let prefs = { genders: [], sizes: [], brands: [] };
async function loadPrefs() {
  prefs = { genders: [], sizes: [], brands: [] };
  if (!session) return;
  const { data } = await sb.from("user_prefs").select("genders,sizes,brands").eq("user_id", uid()).maybeSingle();
  if (data) prefs = data;
}
let following = new Set();
async function loadFollowing() {
  following = new Set();
  if (!session) return;
  const { data } = await sb.from("follows").select("followee_id").eq("follower_id", uid()).limit(1000);
  (data || []).forEach((f) => following.add(f.followee_id));
}
async function toggleFollow(pid) {
  if (needLogin()) return false;
  const on = following.has(pid);
  following[on ? "delete" : "add"](pid);
  const { error } = on
    ? await sb.from("follows").delete().eq("follower_id", uid()).eq("followee_id", pid)
    : await sb.from("follows").insert({ follower_id: uid(), followee_id: pid });
  if (error) { following[on ? "add" : "delete"](pid); fail(error); return on; }
  return !on;
}
const followBtn = (pid) => `<button class="btn ${following.has(pid) ? "ghost" : "primary"} small" data-follow="${pid}">${following.has(pid) ? "Siguiendo" : "Seguir"}</button>`;
async function savePrefs() {
  const { error } = await sb.from("user_prefs").upsert({ user_id: uid(), ...prefs, updated_at: new Date().toISOString() });
  if (error) fail(error);
}
const rawSizes = () => [...new Set(prefs.sizes.map((x) => x.slice(x.indexOf(":") + 1)))];
const hasPrefs = () => !!(prefs.genders.length || prefs.sizes.length || prefs.brands.length);
const pgList = (arr) => arr.map((x) => `"${String(x).replace(/["\\]/g, "")}"`).join(",");
function applyMine(q, { sizes = true, genders = false, brands = false } = {}) {
  if (genders && prefs.genders.length) q = q.in("section", prefs.genders);
  if (sizes && prefs.sizes.length) q = q.or(`size.in.(${pgList(rawSizes())}),size.is.null`);
  if (brands && prefs.brands.length) q = q.in("brand", prefs.brands);
  return q;
}

async function loadFavs() {
  favs = new Set();
  if (!session) return;
  const { data } = await sb.from("favorites").select("listing_id").eq("user_id", uid()).limit(1000);
  (data || []).forEach((f) => favs.add(f.listing_id));
}
async function toggleFav(btn) {
  if (needLogin()) return;
  const id = btn.dataset.fav;
  const on = favs.has(id);
  const cnt = btn.querySelector("span");
  favs[on ? "delete" : "add"](id);
  btn.setAttribute("aria-pressed", !on);
  if (cnt) cnt.textContent = Math.max(0, Number(cnt.textContent || 0) + (on ? -1 : 1)) || "";
  const { error } = on
    ? await sb.from("favorites").delete().eq("user_id", uid()).eq("listing_id", id)
    : await sb.from("favorites").insert({ user_id: uid(), listing_id: id });
  if (error) { favs[on ? "add" : "delete"](id); btn.setAttribute("aria-pressed", on); fail(error); }
}
const heartBtn = (l) => `<button class="heart" data-fav="${l.id}" aria-pressed="${favs.has(l.id)}" aria-label="Favorito">${HEART}<span>${l.fav_count || ""}</span></button>`;

const cardHTML = (l) => `
  <div class="card">
    <a href="#/item/${l.id}" style="text-decoration:none;color:inherit">
      <div class="pic">${l.photos?.[0] ? img(l.photos[0], l.title) : PLACEHOLDER}
        ${l.status !== "active" ? `<span class="badge state">${l.status === "sold" ? "Vendido" : l.status === "reserved" ? "Reservado" : "Quitado"}</span>` : ""}</div>
      <div class="meta"><span class="price">${money(l.price)}</span><span class="incl">${money(withFee(l.price))} incl. ${SHIELD}</span>
        <span class="small ellip">${[l.size, l.brand || l.subcategory].filter(Boolean).map(esc).join(" · ") || esc(l.town)}</span>${trustBadge(l.seller)}</div>
    </a>
    ${l.status === "active" ? heartBtn(l).replace('class="heart"', 'class="heart" style="bottom:auto;top:calc((100% - 76px) - 40px)"') : ""}
  </div>`;
function bindFavs(e) {
  const f = e.target.closest("[data-fav]");
  if (f) { e.preventDefault(); toggleFav(f); return true; }
  return false;
}

/* ---------- hoja inferior ---------- */
function openSheet(title, body, onClick) {
  closeSheet();
  const bg = document.createElement("div");
  bg.className = "sheet-bg";
  const sh = document.createElement("div");
  sh.className = "sheet";
  sh.setAttribute("role", "dialog");
  sh.setAttribute("aria-label", title);
  sh.innerHTML = `<header><b>${esc(title)}</b><button aria-label="Cerrar">×</button></header><div class="sbody">${body}</div>`;
  document.body.append(bg, sh);
  bg.onclick = closeSheet;
  sh.querySelector("header button").onclick = closeSheet;
  sh.onclick = (e) => onClick && onClick(e, sh);
  return sh;
}
function closeSheet() { document.querySelectorAll(".sheet,.sheet-bg").forEach((x) => x.remove()); }
const setSheet = (sh, title, body) => { sh.querySelector("header b").textContent = title; sh.querySelector(".sbody").innerHTML = body; };

function confirmTap(btn, text) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = "1";
  const old = btn.textContent;
  btn.textContent = text || "Toca otra vez para confirmar";
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 4000);
  return false;
}
async function busy(btn, fn) {
  if (!btn || btn.disabled) return;
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
  [/^#\/buscar$/, search],
  [/^#\/item\/([\w-]+)$/, item, true],
  [/^#\/lote\/([\w-]+)(?:\?.*)?$/, lote],
  [/^#\/comprar$/, checkout, true],
  [/^#\/vender$/, () => sellForm(null), true],
  [/^#\/editar\/([\w-]+)$/, (id) => sellForm(id), true],
  [/^#\/mensajes$/, inbox],
  [/^#\/chat\/([\w-]+)$/, chat, true],
  [/^#\/pedidos$/, orders],
  [/^#\/pedido\/([\w-]+)$/, order],
  [/^#\/favoritos$/, favorites],
  [/^#\/perfil$/, profile],
  [/^#\/perfil\/editar$/, editProfile],
  [/^#\/billetera$/, wallet],
  [/^#\/personalizar$/, persMain, true],
  [/^#\/personalizar\/tallas$/, persSizes, true],
  [/^#\/personalizar\/tallas\/(\w+)$/, persSizeGroup, true],
  [/^#\/personalizar\/marcas$/, persBrands, true],
  [/^#\/personalizar\/miembros$/, persMembers, true],
  [/^#\/ajustes$/, settings],
  [/^#\/u\/([\w-]+)$/, publicProfile],
  [/^#\/entrar$/, auth],
  [/^#\/clave$/, newPassword],
];
const NAVKEY = { "#/": "home", "#/buscar": "search", "#/mensajes": "inbox", "#/vender": "sell", "#/perfil": "profile", "#/pedidos": "profile", "#/pedido": "profile", "#/favoritos": "profile", "#/personalizar": "profile", "#/billetera": "profile", "#/ajustes": "profile", "#/lote": "home", "#/u": "home" };
let renderId = 0;
let cleanups = [];
const stale = (id) => id !== renderId;

async function route() {
  cleanups.forEach((f) => { try { f(); } catch {} });
  cleanups = [];
  closeSheet();
  document.querySelectorAll(".composer,.stickybar").forEach((e) => e.remove());
  app.onclick = app.onsubmit = app.oninput = app.onchange = null;
  let hash = location.hash || "#/";
  if (/access_token|error_description|type=recovery/.test(hash)) { history.replaceState(null, "", location.pathname + "#/"); hash = "#/"; }
  const id = ++renderId;
  const base = "#/" + (hash.split(/[/?]/)[1] || "");
  const key = NAVKEY[base];
  document.querySelectorAll(".nav a").forEach((a) => (a.dataset.nav === key ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  for (const [re, fn, noNav] of routes) {
    const m = hash.match(re);
    if (m) {
      document.body.classList.toggle("nonav", !!noNav);
      window.scrollTo(0, 0);
      app.classList.remove("enter");
      void app.offsetWidth;
      app.classList.add("enter");
      try { await fn(...m.slice(1), id); }
      catch (e) { console.error(e); if (!stale(id)) app.innerHTML = `${header()}<div class="empty">Algo salió mal: ${esc(cleanErr(e))}<br><br><a class="btn ghost" href="#/">Ir al inicio</a></div>`; }
      return;
    }
  }
  location.hash = "#/";
}

/* ---------- inicio ---------- */
let homeSection = null;
async function home(id) {
  if (homeSection === null) homeSection = hasPrefs() ? "parati" : "";
  app.innerHTML = header(`
    <a class="searchbox" href="#/buscar">${SEARCH}<span>Buscar artículos o marcas</span></a>
    <div class="tabsline" id="secs">${following.size ? `<button data-s="siguiendo" aria-pressed="${homeSection === "siguiendo"}">Siguiendo</button>` : ""}${hasPrefs() ? `<button data-s="parati" aria-pressed="${homeSection === "parati"}">Para ti</button>` : ""}<button data-s="" aria-pressed="${!homeSection}">Todo</button>${SECTIONS.map((s) => `<button data-s="${s.k}" aria-pressed="${homeSection === s.k}">${s.n}</button>`).join("")}</div>`) + `
    <div class="banner"><div>Recógelo <b>hoy</b> en persona. Pagas en la app y el vendedor solo cobra cuando escanea tu código.</div></div>
    <div class="row" style="margin-bottom:10px"><h3 style="font-size:18px">${homeSection === "parati" ? "Para ti" : homeSection === "siguiendo" ? "De quienes sigues" : "Novedades"}</h3>${homeSection === "parati" ? `<a class="small" href="#/personalizar">Ajustar ›</a>` : homeSection === "siguiendo" ? `<a class="small" href="#/personalizar/miembros">Ver miembros ›</a>` : homeSection ? `<a class="small" href="#/buscar?s=${homeSection}">Filtrar ›</a>` : ""}</div>
    <div class="grid" id="feed">${skelGrid()}</div>
    <div style="padding-top:14px"><button class="btn ghost" id="more" hidden>Ver más</button></div>`;
  let page = 0;
  const PAGE = 24;
  async function load(reset) {
    if (reset) { page = 0; $("#feed").innerHTML = skelGrid(); }
    let q = sb.from("listings").select(FEED_COLS).eq("status", "active").eq("seller.vacation", false).order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (homeSection === "siguiendo") q = q.in("seller_id", [...following]);
    else if (homeSection === "parati") q = applyMine(q, { sizes: true, genders: true, brands: prefs.brands.length && !prefs.genders.length && !prefs.sizes.length });
    else if (homeSection) q = q.eq("section", homeSection);
    const { data, error } = await q;
    if (stale(id)) return;
    if (error) { $("#feed").innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(cleanErr(error))}</div>`; return; }
    const html = data.map(cardHTML).join("");
    if (page === 0) $("#feed").innerHTML = html || `<div class="empty" style="grid-column:1/-1">Todavía no hay artículos aquí.<br><br><a class="btn primary" href="#/vender">Publica el primero</a></div>`;
    else $("#feed").insertAdjacentHTML("beforeend", html);
    $("#more").hidden = data.length < PAGE;
  }
  app.onclick = (e) => {
    if (bindFavs(e)) return;
    const s = e.target.closest("[data-s]");
    if (s) { homeSection = s.dataset.s; home(++renderId); return; }
    if (e.target.id === "more") { page++; load(false); }
  };
  await load(true);
}

/* ---------- buscar ---------- */
const filt = { q: "", path: [], size: "", brand: "", cond: "", town: "", min: "", max: "", sort: "new", mine: null, trusted: false };
const SORTS = [["new", "Más recientes"], ["low", "Precio: menor a mayor"], ["high", "Precio: mayor a menor"]];
async function search(id) {
  const qs = new URLSearchParams(location.hash.split("?")[1] || "");
  if (qs.get("s") != null) { const n = sectionName(qs.get("s")); filt.path = n ? [n] : []; filt.size = ""; }
  if (filt.mine === null) filt.mine = prefs.sizes.length > 0;
  const chip = (k, label, on) => `<button class="chip ${on ? "on" : ""}" data-f="${k}">${esc(label)} ▾</button>`;
  function bar() {
    const groups = sizeGroupsFor(filt.path);
    return [
      chip("cat", filt.path.length ? filt.path.slice(-2).join(" › ") : "Categoría", filt.path.length),
      prefs.sizes.length ? `<button class="chip ${filt.mine ? "on" : ""}" data-f="mine" aria-pressed="${!!filt.mine}">${filt.mine ? "✓ " : ""}Mis tallas</button>` : "",
      groups.length ? chip("size", filt.size ? "Talla " + filt.size : "Talla", filt.size) : "",
      `<button class="chip ${filt.trusted ? "on" : ""}" data-f="trusted" aria-pressed="${filt.trusted}">${filt.trusted ? "✓ " : ""}Vendedores confiables</button>`,
      chip("brand", filt.brand || "Marca", filt.brand),
      chip("cond", filt.cond || "Estado", filt.cond),
      chip("price", filt.min || filt.max ? `$${filt.min || 0} – ${filt.max ? "$" + filt.max : "más"}` : "Precio", filt.min || filt.max),
      chip("town", filt.town || "Pueblo", filt.town),
      chip("sort", SORTS.find((s) => s[0] === filt.sort)[1], filt.sort !== "new"),
      filt.path.length || filt.size || filt.brand || filt.cond || filt.min || filt.max || filt.town || filt.sort !== "new" ? `<button class="chip" data-f="clear">Borrar filtros</button>` : "",
    ].join("");
  }
  app.innerHTML = `<div class="top">
      <label class="searchbox">${SEARCH}<input id="q" type="search" placeholder="Buscar artículos o marcas" aria-label="Buscar" value="${esc(filt.q)}" autocomplete="off"></label>
      <div class="filterbar" id="fbar">${bar()}</div></div>
    <div class="small" id="count" style="margin-bottom:8px">&nbsp;</div>
    <div class="grid" id="res">${skelGrid()}</div>
    <div style="padding-top:14px"><button class="btn ghost" id="more" hidden>Ver más</button></div>`;
  if (!filt.q && !filt.path.length) setTimeout(() => $("#q")?.focus(), 50);
  let page = 0;
  const PAGE = 24;
  async function load(reset) {
    if (reset) { page = 0; $("#res").innerHTML = skelGrid(); $("#fbar").innerHTML = bar(); }
    let q = sb.from("listings").select(FEED_COLS, { count: "exact" }).eq("status", "active").eq("seller.vacation", false);
    if (filt.path.length) q = q.eq("section", sectionKey(filt.path[0]));
    if (filt.path.length > 1) q = q.contains("cat_path", filt.path);
    if (filt.size) q = q.eq("size", filt.size);
    else if (filt.mine) q = applyMine(q, { sizes: true });
    if (filt.brand) q = q.eq("brand", filt.brand);
    if (filt.trusted) q = q.gte("seller.sales_count", TRUST.sales).gte("seller.rating_count", TRUST.reviews).gte("seller.rating_avg", TRUST.stars).eq("seller.strikes", 0);
    if (filt.cond) q = q.eq("cond", filt.cond);
    if (filt.town) q = q.eq("town", filt.town);
    if (filt.min) q = q.gte("price", Number(filt.min));
    if (filt.max) q = q.lte("price", Number(filt.max));
    const term = filt.q.replace(/[%,()_\\."]/g, " ").trim();
    if (term) q = q.or(`title.ilike.%${term}%,brand.ilike.%${term}%,subcategory.ilike.%${term}%`);
    q = filt.sort === "low" ? q.order("price", { ascending: true }) : filt.sort === "high" ? q.order("price", { ascending: false }) : q.order("created_at", { ascending: false });
    const { data, error, count } = await q.range(page * PAGE, page * PAGE + PAGE - 1);
    if (stale(id)) return;
    if (error) { $("#res").innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(cleanErr(error))}</div>`; return; }
    $("#count").textContent = `${count ?? data.length} resultado${count === 1 ? "" : "s"}${filt.mine && !filt.size ? " en tus tallas" : ""}`;
    const html = data.map(cardHTML).join("");
    if (page === 0) $("#res").innerHTML = html || `<div class="empty" style="grid-column:1/-1">No encontramos nada con esos filtros.${filt.mine ? `<br><br><button class="btn ghost small" data-f="mine">Ver todas las tallas</button>` : ""}</div>`;
    else $("#res").insertAdjacentHTML("beforeend", html);
    $("#more").hidden = data.length < PAGE;
  }
  let deb;
  app.oninput = (e) => { if (e.target.id === "q") { clearTimeout(deb); deb = setTimeout(() => { filt.q = e.target.value; load(true); }, 300); } };
  app.onclick = (e) => {
    if (bindFavs(e)) return;
    if (e.target.id === "more") { page++; load(false); return; }
    const f = e.target.closest("[data-f]")?.dataset.f;
    if (!f) return;
    if (f === "clear") { Object.assign(filt, { path: [], size: "", brand: "", cond: "", town: "", min: "", max: "", sort: "new" }); load(true); return; }
    if (f === "mine") { filt.mine = !filt.mine; load(true); return; }
    if (f === "trusted") { filt.trusted = !filt.trusted; load(true); return; }
    if (f === "cat") pickCategory(filt.path, true, (path) => { filt.path = path; filt.size = ""; load(true); });
    if (f === "size") pickSize(sizeGroupsFor(filt.path), filt.size, (v) => { filt.size = v; load(true); }, true);
    if (f === "brand") pickBrand(filt.brand, (v) => { filt.brand = v; load(true); }, true);
    if (f === "cond") pickCond(filt.cond, (v) => { filt.cond = v; load(true); }, true);
    if (f === "town") pickTown(filt.town, (v) => { filt.town = v; load(true); }, true);
    if (f === "sort") openSheet("Ordenar", SORTS.map(([k, n]) => `<button class="optrow" data-v="${k}" aria-pressed="${filt.sort === k}">${n}<span class="radio"></span></button>`).join(""), (ev) => { const b = ev.target.closest("[data-v]"); if (b) { filt.sort = b.dataset.v; closeSheet(); load(true); } });
    if (f === "price") {
      const sh = openSheet("Precio", `<div class="two"><div class="field"><label for="pmin">Desde ($)</label><input id="pmin" type="number" min="0" inputmode="decimal" value="${esc(filt.min)}"></div><div class="field"><label for="pmax">Hasta ($)</label><input id="pmax" type="number" min="0" inputmode="decimal" value="${esc(filt.max)}"></div></div><button class="btn sea" data-ok>Ver resultados</button>`,
        (ev) => { if (ev.target.closest("[data-ok]")) { filt.min = $("#pmin", sh).value; filt.max = $("#pmax", sh).value; closeSheet(); load(true); } });
    }
  };
  await load(true);
}

/* ---------- selectores ---------- */
function pickCategory(cur, allowAll, done) {
  let path = cur?.length ? (isLeaf(cur) ? cur.slice(0, -1) : [...cur]) : [];
  let term = "";
  const title = () => (path.length ? path[path.length - 1] : "Categoría");
  const list = () => {
    if (term) {
      const t = term.toLowerCase();
      const hits = ALL_LEAVES.filter((p) => p.join(" ").toLowerCase().includes(t)).slice(0, 40);
      return hits.map((p) => `<button class="optrow" data-full="${esc(JSON.stringify(p))}"><span>${esc(p[p.length - 1])}<small>${esc(p.slice(0, -1).join(" › "))}</small></span><span class="radio"></span></button>`).join("") || `<div class="empty">No encontramos esa categoría.</div>`;
    }
    return (allowAll ? `<button class="optrow" data-here aria-pressed="${JSON.stringify(cur || []) === JSON.stringify(path)}">${path.length ? "Todo en " + esc(title()) : "Todas las categorías"}<span class="radio"></span></button>` : "") +
      childrenAt(path).map((n) => {
        const p = [...path, n[0]];
        const leaf = !n[2]?.length;
        return leaf
          ? `<button class="optrow" data-full="${esc(JSON.stringify(p))}" aria-pressed="${JSON.stringify(cur || []) === JSON.stringify(p)}">${esc(n[0])}<span class="radio"></span></button>`
          : `<button class="optrow" data-go="${esc(n[0])}">${esc(n[0])}${CHEV}</button>`;
      }).join("");
  };
  const body = () => `<div class="sheetnav">${path.length ? `<button class="iconbtn" data-up aria-label="Atrás">‹</button>` : ""}</div>
    <label class="searchbox inset">${SEARCH}<input id="catq" type="search" placeholder="Busca una categoría" autocomplete="off" value="${esc(term)}"></label>
    <div id="catlist">${list()}</div>`;
  const sh = openSheet("Categoría", body(), (e) => {
    const b = e.target.closest("[data-go],[data-up],[data-full],[data-here]");
    if (!b) return;
    if (b.dataset.go) { path.push(b.dataset.go); term = ""; redraw(); }
    else if (b.hasAttribute("data-up")) { path.pop(); redraw(); }
    else if (b.hasAttribute("data-here")) { closeSheet(); done([...path]); }
    else { closeSheet(); done(JSON.parse(b.dataset.full)); }
  });
  sh.classList.add("tall");
  function redraw() { setSheet(sh, title(), body()); bindQ(); }
  function bindQ() { const q = $("#catq", sh); q.oninput = () => { term = q.value.trim(); $("#catlist", sh).innerHTML = list(); }; }
  redraw();
}
function sizeGroupsHTML(groups, isOn, multi) {
  return groups.map((g) => {
    const [name, sizes] = SIZE_GROUPS[g];
    return `<div class="sgroup"><span class="label">${name}</span><div class="sizegrid two">${sizes.map((x) => `<button class="sizebtn" data-v="${esc(x)}" aria-pressed="${isOn(x)}">${esc(x)}</button>`).join("")}</div></div>`;
  }).join("");
}
function pickSize(groups, cur, done, allowAll) {
  const sh = openSheet("Talla", `<div class="infobox">ⓘ Escoge la talla que dice la etiqueta del artículo.</div>
    ${allowAll ? `<button class="optrow" data-v="">Cualquier talla<span class="radio"></span></button>` : ""}
    ${sizeGroupsHTML(groups, (x) => x === cur)}`,
    (e) => { const b = e.target.closest("[data-v]"); if (b) { closeSheet(); done(b.dataset.v); } });
  sh.classList.add("tall");
}
function pickBrand(cur, done, allowAll) {
  let term = "";
  const list = () => {
    const t = term.toLowerCase();
    const hits = BRANDS.filter((b) => b.toLowerCase().includes(t));
    const exact = BRANDS.some((b) => b.toLowerCase() === t);
    return (term && !exact ? `<button class="optrow" data-v="${esc(term)}"><span>Usar “${esc(term)}”<small>Marca que no está en la lista</small></span><span class="radio"></span></button>` : "") +
      (!term ? `<button class="optrow" data-v="" aria-pressed="${!cur}">${allowAll ? "Todas las marcas" : "Sin marca"}<span class="radio"></span></button><span class="label" style="display:block;padding:12px 0 4px">Marcas populares</span>` : "") +
      hits.map((b) => `<button class="optrow" data-v="${esc(b)}" aria-pressed="${cur === b}">${esc(b)}<span class="radio"></span></button>`).join("");
  };
  const sh = openSheet("Marca", `<label class="searchbox inset">${SEARCH}<input id="brq" type="search" placeholder="Busca marcas" autocomplete="off"></label><div id="brlist">${list()}</div>`,
    (e) => { const b = e.target.closest("[data-v]"); if (b) { closeSheet(); done(b.dataset.v); } });
  sh.classList.add("tall");
  const q = $("#brq", sh);
  q.oninput = () => { term = q.value.trim().slice(0, 40); $("#brlist", sh).innerHTML = list(); };
}
function pickParcel(cur, done) {
  let v = cur || "M";
  const body = () => PARCELS.map(([k, n, d, price]) => `<button class="optrow" data-v="${k}" aria-pressed="${v === k}"><span>${k === "M" ? `<em class="rec">Recomendado</em>` : ""}<b>${n}</b><small>${d} Envío: ${money(price)}</small></span><span class="radio"></span></button>`).join("") +
    `<button class="btn primary" data-ok style="margin-top:12px">Listo</button>`;
  openSheet("Tamaño del paquete", body(), (e, sh) => {
    const b = e.target.closest("[data-v]");
    if (b) { v = b.dataset.v; setSheet(sh, "Tamaño del paquete", body()); return; }
    if (e.target.closest("[data-ok]")) { closeSheet(); done(v); }
  });
}
function pickPrice(cur, done) {
  const info = (p) => (Number(p) >= 1 ? `El comprador verá <b>${money(withFee(p))}</b> con la Protección al Comprador. Tú recibes <b>${money(p)}</b>.` : "Vender es gratis. Te quedas con el 100% del precio.");
  const sh = openSheet("Precio", `<div class="pricebox"><span>$</span><input id="pin" type="number" min="1" max="10000" step="0.01" inputmode="decimal" placeholder="0.00" value="${esc(cur)}"></div>
    <div class="small" id="pinfo">${info(cur)}</div><button class="btn primary" data-ok>Listo</button>`, (e) => {
    if (!e.target.closest("[data-ok]")) return;
    const v = parseFloat($("#pin", sh).value);
    if (!(v >= 1)) return toast("Escribe un precio de $1 o más.");
    closeSheet();
    done(String(r2(v)));
  });
  const i = $("#pin", sh);
  i.oninput = () => { $("#pinfo", sh).innerHTML = info(i.value); };
  setTimeout(() => i.focus(), 60);
}
function pickCond(cur, done, allowAll) {
  openSheet("Estado", (allowAll ? `<button class="optrow" data-v="">Cualquier estado<span class="radio"></span></button>` : "") +
    CONDS.map(([n, d]) => `<button class="optrow" data-v="${n}" aria-pressed="${cur === n}"><span>${n}<small>${d}</small></span><span class="radio"></span></button>`).join(""),
    (e) => { const b = e.target.closest("[data-v]"); if (b) { closeSheet(); done(b.dataset.v); } });
}
function pickTown(cur, done, allowAll) {
  openSheet("Pueblo", (allowAll ? `<button class="optrow" data-v="">Todo Puerto Rico<span class="radio"></span></button>` : "") +
    TOWNS.map((t) => `<button class="optrow" data-v="${t}" aria-pressed="${cur === t}">${t}<span class="radio"></span></button>`).join(""),
    (e) => { const b = e.target.closest("[data-v]"); if (b) { closeSheet(); done(b.dataset.v); } });
}
function pickColors(cur, done) {
  const sel = new Set(cur);
  const body = () => `<span class="small">Escoge hasta 2.</span><div class="swatches">${COLORS.map(([n, c]) => `<button class="swatch" data-c="${n}" aria-pressed="${sel.has(n)}"><i style="background:${c}"></i>${n}</button>`).join("")}</div><button class="btn sea" data-ok>Listo</button>`;
  openSheet("Color", body(), (e, sh) => {
    const c = e.target.closest("[data-c]");
    if (c) { const n = c.dataset.c; if (sel.has(n)) sel.delete(n); else if (sel.size < 2) sel.add(n); else return toast("Máximo 2 colores."); setSheet(sh, "Color", body()); }
    if (e.target.closest("[data-ok]")) { closeSheet(); done([...sel]); }
  });
}
function pickMaterial(cur, done) {
  openSheet("Material", `<button class="optrow" data-v="">Sin especificar<span class="radio"></span></button>` + MATERIALS.map((m) => `<button class="optrow" data-v="${m}" aria-pressed="${cur === m}">${m}<span class="radio"></span></button>`).join(""),
    (e) => { const b = e.target.closest("[data-v]"); if (b) { closeSheet(); done(b.dataset.v); } });
}

/* ---------- artículo ---------- */
async function item(lid, id) {
  app.innerHTML = `<div class="skel" style="aspect-ratio:4/5;margin-inline:-16px;border-radius:0"></div><div class="skel" style="height:120px;margin-top:12px"></div>`;
  const { data: l, error } = await sb.from("listings").select("*, seller:profiles!listings_seller_id_fkey(id,display_name,town,rating_avg,rating_count,sales_count,vacation,strikes)").eq("id", lid).maybeSingle();
  if (stale(id)) return;
  if (error) throw error;
  if (!l) { app.innerHTML = `${back("#/")}<div class="empty">Este artículo ya no existe.</div>`; return; }
  const mine = uid() === l.seller_id;
  const { data: more } = await sb.from("listings").select(LIST_COLS).eq("seller_id", l.seller_id).eq("status", "active").neq("id", lid).order("created_at", { ascending: false }).limit(6);
  if (stale(id)) return;
  const s = l.seller || {};
  const cat = catLabel(l);
  const rows = [["Marca", l.brand], ["Talla", l.size], ["Estado", condOf(l)], ["Color", (l.colors || []).join(", ")], ["Material", l.material], ["Categoría", cat], ["Ubicación", l.town], ["Subido", fmtAgo(l.created_at)]].filter((r) => r[1]);
  app.innerHTML = `
    <div class="galwrap">
      <a class="closebtn" href="javascript:history.length>1?history.back():location.assign('#/')" aria-label="Volver">‹</a>
      ${l.photos?.length ? `<div class="gallery" id="gal">${l.photos.map((p) => img(p, l.title)).join("")}</div>` : `<div class="pic" style="aspect-ratio:4/5">${PLACEHOLDER}</div>`}
      ${l.status === "active" && !mine ? heartBtn(l) : ""}
    </div>
    ${l.photos?.length > 1 ? `<div class="dots" id="dots" style="margin-top:8px">${l.photos.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}
    <div class="stack" style="margin-top:12px">
      <div class="panel">
        <h2 style="font-size:20px">${esc(l.title)}</h2>
        <div class="small">${[l.size, condOf(l), l.brand].filter(Boolean).map(esc).join(" · ")}</div>
        <div><span class="price" style="font-size:24px">${money(l.price)}</span></div>
        <div class="incl" style="font-size:14px">${money(withFee(l.price))} incluye Protección al Comprador ${SHIELD}</div>
      </div>
      <div class="panel"><dl class="details">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        ${l.description ? `<div style="white-space:pre-wrap;border-top:1px solid var(--line);padding-top:10px">${esc(l.description)}</div>` : ""}</div>
      <div class="panel">
        <a class="seller" href="#/u/${s.id}"><div class="avatar">${initial(s.display_name)}</div>
          <div style="flex:1;min-width:0"><b>${esc(s.display_name)}</b> ${trustBadge(s, true)}<div class="small">${s.rating_count ? "★ " + Number(s.rating_avg).toFixed(1) + " (" + s.rating_count + ")" : "Sin reseñas todavía"} · ${s.sales_count || 0} ventas${s.town ? " · " + esc(s.town) : ""}</div></div>${CHEV}</a>
        ${!mine && l.status === "active" ? `<button class="btn ghost small" data-act="msg">Preguntar al vendedor</button>` : ""}
      </div>
      <div class="hl"><b>Protección al Comprador</b><span class="small" style="color:var(--ink)">Pagas en la app. El vendedor solo cobra cuando confirmas la entrega con tu código. Si no es como se describe, te devolvemos tu dinero. Si pagas por fuera (ATH, efectivo), pierdes esta protección.</span></div>
      ${mine ? `<div class="btns"><a class="btn ghost small" href="#/editar/${l.id}">Editar</a>${l.status === "active" ? `<button class="btn ghost small" data-act="remove">Quitar de la venta</button>` : ""}</div>` : ""}
      ${more?.length ? `<div class="row"><h3 style="font-size:17px">Más de ${esc(s.display_name)}</h3>${!mine ? `<a class="small" href="#/lote/${s.id}?first=${l.status === "active" ? l.id : ""}">Armar lote ›</a>` : ""}</div><div class="grid">${more.map(cardHTML).join("")}</div>` : ""}
    </div>`;
  if (!mine) {
    const bar = document.createElement("div");
    bar.className = "stickybar";
    bar.innerHTML = l.status === "active" && s.vacation
      ? `<div><div class="btn ghost" style="text-align:center">El vendedor está de vacaciones</div></div>`
      : l.status === "active"
      ? `<div><div class="btns"><button class="btn ghost" data-act="offer">Hacer una oferta</button><button class="btn primary" data-act="buy">Comprar</button></div></div>`
      : `<div><div class="btn ghost" style="text-align:center">${l.status === "sold" ? "Vendido" : "Reservado en otro pedido"}</div></div>`;
    document.body.appendChild(bar);
    bar.onclick = (e) => handle(e);
  }
  const gal = $("#gal");
  if (gal && $("#dots")) gal.addEventListener("scroll", () => {
    const i = Math.round(gal.scrollLeft / gal.clientWidth);
    document.querySelectorAll("#dots i").forEach((d, k) => d.classList.toggle("on", k === i));
  }, { passive: true });
  async function handle(e) {
    if (bindFavs(e)) return;
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "buy") { if (needLogin()) return; sessionStorage.setItem("checkout", JSON.stringify({ ids: [l.id] })); location.hash = "#/comprar"; }
    if (act === "offer") { if (needLogin()) return; offerSheet(l); }
    if (act === "msg") busy(b, () => openThread(l));
    if (act === "remove") { if (!confirmTap(b, "Toca otra vez para quitarlo")) return; busy(b, async () => { const { error } = await sb.from("listings").update({ status: "removed" }).eq("id", l.id); if (error) throw error; toast("Lo quitaste de la venta."); location.hash = "#/perfil"; }); }
  }
  app.onclick = handle;
}
function offerSheet(l) {
  const sh = openSheet("Hacer una oferta", `
    <div class="small">Precio: ${money(l.price)}. El vendedor puede aceptar, rechazar o contraofertar.</div>
    <div class="chips wrap">${[10, 20, 30].map((p) => `<button class="chip" data-quick="${r2(l.price * (1 - p / 100))}">${money(r2(l.price * (1 - p / 100)))} (−${p}%)</button>`).join("")}</div>
    <input id="offerAmt" type="number" min="1" step="0.01" inputmode="decimal" placeholder="Tu precio ($)" aria-label="Precio de la oferta">
    <button class="btn sea" data-send>Enviar oferta</button>`, (e) => {
    const q = e.target.closest("[data-quick]");
    if (q) { $("#offerAmt", sh).value = q.dataset.quick; return; }
    const b = e.target.closest("[data-send]");
    if (!b) return;
    const v = parseFloat($("#offerAmt", sh).value);
    if (!(v >= 1)) return toast("Escribe cuánto quieres ofrecer.");
    if (v >= l.price) return toast("Tu oferta tiene que ser menor que el precio.");
    busy(b, async () => {
      const { data: tid, error } = await sb.rpc("make_offer", { p_listing: l.id, p_amount: v });
      if (error) throw error;
      closeSheet();
      toast("Oferta enviada.");
      location.hash = "#/chat/" + tid;
    });
  });
  setTimeout(() => $("#offerAmt", sh)?.focus(), 100);
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
  app.innerHTML = `<div class="skel" style="height:300px;margin-top:20px"></div>`;
  const [{ data: list }, { data: s }] = await Promise.all([
    sb.from("listings").select(LIST_COLS).eq("seller_id", sellerId).eq("status", "active").order("created_at", { ascending: false }),
    sb.from("profiles").select("id,display_name").eq("id", sellerId).maybeSingle(),
  ]);
  if (stale(id)) return;
  const sel = new Set(first && list.some((x) => x.id === first) ? [first] : []);
  function draw() {
    const chosen = list.filter((x) => sel.has(x.id));
    const sub = r2(chosen.reduce((a, x) => a + Number(x.price), 0));
    const off = chosen.length >= 2 ? r2(sub * BUNDLE_OFF) : 0;
    app.innerHTML = `${back(first ? "#/item/" + first : "#/u/" + sellerId)}
    <div class="stack"><h2>Lote de ${esc(s?.display_name)}</h2><span class="small">Marca lo que quieres. Con 2 o más, 10% menos y un solo cargo.</span>
      ${list.map((x) => `<label class="listbtn"><input type="checkbox" data-pick="${x.id}" ${sel.has(x.id) ? "checked" : ""} style="width:22px;height:22px;flex:none;accent-color:var(--flame)">${thumb(x)}
        <div style="flex:1;min-width:0"><div class="ellip"><b>${esc(x.title)}</b></div><div class="small">${[x.size, x.brand].filter(Boolean).map(esc).join(" · ")}</div></div><b class="price" style="font-size:16px">${money(x.price)}</b></label>`).join("") || `<div class="empty">Este vendedor no tiene artículos disponibles.</div>`}
      <div class="panel lines">
        <div class="row"><span>${chosen.length} artículo${chosen.length === 1 ? "" : "s"}</span><span>${money(sub)}</span></div>
        ${off ? `<div class="row disc"><span>Descuento de lote (10%)</span><span>−${money(off)}</span></div>` : ""}
        <div class="row"><span>Protección al Comprador</span><span>${chosen.length ? money(fee(sub - off)) : "$0.00"}</span></div>
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
  app.innerHTML = `<div class="skel" style="height:300px;margin-top:20px"></div>`;
  const { data: list, error } = await sb.from("listings").select(LIST_COLS).in("id", ck.ids);
  if (stale(id)) return;
  if (error) throw error;
  if (list.length !== ck.ids.length || list.some((x) => x.status !== "active")) { app.innerHTML = `${back("#/")}<div class="empty">Uno de los artículos ya no está disponible.</div>`; return; }
  let agreed = null;
  if (ck.offer) {
    const { data: m } = await sb.from("messages").select("offer_status,offer_amount,counter_amount").eq("id", ck.offer).maybeSingle();
    if (m?.offer_status === "accepted") agreed = Number(m.offer_amount);
    else if (m?.offer_status === "countered") agreed = Number(m.counter_amount);
  }
  if (stale(id)) return;
  const st = { mode: "meet", address: "", pay: "apple" };
  const sub = r2(list.reduce((a, x) => a + Number(x.price), 0));
  const disc = agreed != null ? r2(sub - agreed) : list.length >= 2 ? r2(sub * BUNDLE_OFF) : 0;
  const base = r2(sub - disc);
  const f = fee(base);
  const title = list.length > 1 ? `Lote de ${list.length} artículos` : list[0].title;
  const SHIP = shipFor(list.some((x) => x.parcel === "L") ? "L" : list.some((x) => (x.parcel || "M") === "M") ? "M" : "S");
  const bar = document.createElement("div");
  bar.className = "stickybar";
  document.body.appendChild(bar);
  function draw() {
    const del = st.mode === "ship" ? SHIP : 0;
    const total = r2(base + f + del);
    const ready = st.mode === "meet" || st.address.trim().length >= 10;
    app.innerHTML = `${back("#/item/" + list[0].id)}
    <div class="stack">
      <h2>Pagar</h2>
      <div class="listbtn">${thumb(list[0])}<div style="flex:1;min-width:0"><div class="ellip"><b>${esc(title)}</b></div><div class="small">${list.length > 1 ? list.map((x) => esc(x.title)).join(", ") : [list[0].size, list[0].brand].filter(Boolean).map(esc).join(" · ")}</div></div></div>
      <span class="label">Entrega</span>
      <button class="opt" data-mode="meet" aria-pressed="${st.mode === "meet"}"><div class="row"><b>Encuentro en persona</b><span class="small">Gratis</span></div><span class="small">Después de pagar, coordinan el lugar y la hora por mensaje. Recomendamos un lugar público.</span></button>
      ${SHIPPING_ON ? "" : `<span class="small">Envío por correo: muy pronto.</span>`}
      ${!SHIPPING_ON ? "" : `<button class="opt" data-mode="ship" aria-pressed="${st.mode === "ship"}"><div class="row"><b>Envío por correo</b><span class="small">${money(SHIP)}</span></div><span class="small">Llega en 2 o 3 días a tu dirección.</span></button>`}
      ${st.mode === "ship" ? `<div class="field"><label for="addr">Dirección de envío</label><textarea id="addr" placeholder="Calle, número, urbanización, pueblo y código postal">${esc(st.address)}</textarea></div>` : ""}
      <span class="label">Forma de pago</span>
      <div class="rows">${["apple", "google", "card"].map((p) => `<button class="optrow" style="padding-inline:14px" data-pay="${p}" aria-pressed="${st.pay === p}">${p === "card" ? "Tarjeta de crédito o débito" : PAYNAME[p]}<span class="radio"></span></button>`).join("")}</div>
      <div class="panel lines">
        <div class="row"><span>Pedido</span><span>${money(sub)}</span></div>
        ${disc ? `<div class="row disc"><span>${agreed != null ? "Tu oferta aceptada" : "Descuento de lote (10%)"}</span><span>−${money(disc)}</span></div>` : ""}
        <div class="row"><span>Protección al Comprador</span><span>${money(f)}</span></div>
        <div class="row"><span>Envío</span><span>${del ? money(del) : "Gratis"}</span></div>
        <div class="row total"><span>Total</span><span>${money(total)}</span></div>
      </div>
      <div class="hl"><b>Protección al Comprador</b><span class="small" style="color:var(--ink)">El vendedor no recibe el dinero hasta que revises el artículo y confirmes la entrega.</span></div>
    </div>`;
    bar.innerHTML = `<div><button class="btn ${ready && st.pay === "apple" ? "apple" : "primary"}" data-act="pay" ${ready ? "" : "disabled"}>${!ready ? "Escribe tu dirección" : (st.pay === "card" ? "Pagar " : "Pagar con " + PAYNAME[st.pay] + " · ") + money(total)}</button>${TEST_MODE ? `<span class="small" style="text-align:center">Pago de prueba: no se cobra nada de verdad.</span>` : ""}</div>`;
  }
  draw();
  app.oninput = (e) => { if (e.target.id === "addr") { st.address = e.target.value; const b = $("[data-act=pay]", bar); const ok = st.address.trim().length >= 10; b.disabled = !ok; } };
  app.onchange = (e) => { if (e.target.id === "addr") draw(); };
  app.onclick = (e) => {
    const t = e.target.closest("[data-mode],[data-pay]");
    if (!t) return;
    if (t.dataset.mode) st.mode = t.dataset.mode;
    if (t.dataset.pay) st.pay = t.dataset.pay;
    draw();
  };
  bar.onclick = (e) => {
    const t = e.target.closest("[data-act=pay]");
    if (!t) return;
    busy(t, async () => {
      const { data: oid, error } = await sb.rpc("create_order", {
        p_listing_ids: list.map((x) => x.id), p_offer: ck.offer || null, p_mode: st.mode,
        p_spot: null, p_meet_at: null, p_address: st.mode === "ship" ? st.address.trim() : null,
      });
      if (error) throw error;
      sessionStorage.removeItem("checkout");
      toast("Pago hecho. Tu dinero está protegido.");
      location.hash = "#/pedido/" + oid;
    });
  };
}

/* ---------- vender / editar ---------- */
function compress(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const max = 1280;
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * s);
      c.height = Math.round(im.height * s);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo leer la foto."))), "image/jpeg", 0.82);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Ese archivo no es una foto válida.")); };
    im.src = url;
  });
}
async function sellForm(editId, id) {
  if (needLogin()) return;
  let l = { title: "", description: "", section: "", subcategory: "", cat_path: [], brand: "", size: "", cond: "", colors: [], material: "", price: "", parcel: "M", town: me?.town || "", photos: [] };
  if (editId) {
    app.innerHTML = `<div class="skel" style="height:300px;margin-top:20px"></div>`;
    const { data } = await sb.from("listings").select("*").eq("id", editId).maybeSingle();
    if (stale(id)) return;
    if (!data || data.seller_id !== uid()) { app.innerHTML = `${back("#/perfil")}<div class="empty">No puedes editar este artículo.</div>`; return; }
    if (data.status === "reserved" || data.status === "sold") { app.innerHTML = `${back("#/item/" + editId)}<div class="empty">Este artículo está en un pedido y no se puede editar.</div>`; return; }
    l = { ...data, cond: data.cond || "", colors: data.colors || [], material: data.material || "", brand: data.brand || "", size: data.size || "", subcategory: data.subcategory || "", section: data.section || "", cat_path: data.cat_path || [], parcel: data.parcel || "M", price: String(data.price) };
  }
  const v = { ...l, photos: [...(l.photos || [])] };
  let uploading = 0;
  const vrow = (k, label, val) => `<button type="button" class="vrow" data-row="${k}"><span>${label}</span><span class="val">${esc(val || "")}</span>${val ? EDIT : PLUS}</button>`;
  const hasPath = () => v.cat_path.length && isLeaf(v.cat_path);
  const wearable = () => ["mujer", "hombre", "ninos", "deportes"].includes(sectionKey(v.cat_path[0] || "")) && !/Juguetes|bebé|Útiles|Belleza|Cuidado/.test(v.cat_path.join(" "));
  function draw() {
    const groups = hasPath() ? sizeGroupsFor(v.cat_path) : [];
    const parcel = PARCELS.find((x) => x[0] === v.parcel) || PARCELS[1];
    app.innerHTML = `<div class="sellhead"><a class="iconbtn" href="${editId ? "#/item/" + editId : "javascript:history.length>1?history.back():location.assign('#/')"}" aria-label="Cerrar">✕</a><b>${editId ? "Editar artículo" : "Vender un artículo"}</b><span></span></div>
    <form class="sellform" id="sell" novalidate>
      <h3 class="sh">Fotos</h3>
      <div class="dropzone ${v.photos.length || uploading ? "has" : ""}" id="photos"></div>
      <h3 class="sh">Sobre tu artículo</h3>
      <div class="field"><label for="f-title">Título</label><input id="f-title" maxlength="80" placeholder="Dile a los compradores qué vendes" value="${esc(v.title)}"></div>
      <div class="field"><label for="f-desc">Descripción</label><textarea id="f-desc" maxlength="1000" rows="5" placeholder="Cuéntales más: cómo te queda, si tiene algún detalle…">${esc(v.description || "")}</textarea><span class="small">No pongas teléfonos, redes ni formas de pago por fuera. Todo se cuadra por el chat de Pulguea y cobras seguro, sin capturas falsas.</span></div>
      <h3 class="sh">Detalles del artículo</h3>
      <div class="vrows">
        ${vrow("cat", "Categoría", hasPath() ? v.cat_path[v.cat_path.length - 1] : "")}
        ${vrow("brand", "Marca", v.brand)}
        ${groups.length ? vrow("size", "Talla", v.size) : ""}
        ${vrow("cond", "Estado", v.cond)}
        ${vrow("color", "Colores", (v.colors || []).join(", "))}
        ${hasPath() && wearable() ? vrow("mat", "Material (recomendado)", v.material) : ""}
      </div>
      <h3 class="sh">Precio</h3>
      <div class="vrows">${vrow("price", "Precio", Number(v.price) >= 1 ? money(v.price) : "")}</div>
      <h3 class="sh">Entrega</h3>
      <span class="small">${SHIPPING_ON ? "Puedes entregar en persona o enviarlo por correo. El comprador siempre paga el envío." : "Las ventas se entregan en persona. Después de la compra coordinan el lugar y la hora por mensaje."}</span>
      <div class="vrows">
        ${vrow("town", "Ubicación", v.town)}
        ${SHIPPING_ON ? vrow("parcel", "Tamaño del paquete", parcel[1]) : ""}
      </div>
      <p class="err" id="err" hidden></p>
      <button class="btn primary" id="save">${editId ? "Guardar cambios" : "Subir"}</button>
    </form>`;
    drawPhotos();
  }
  function drawPhotos() {
    const box = $("#photos");
    if (!box) return;
    if (!v.photos.length && !uploading) {
      box.className = "dropzone";
      box.innerHTML = `<label class="upbtn">+ Subir fotos<input type="file" accept="image/*" multiple id="pick"></label><span class="small">Sube hasta 8 fotos tuyas. Las fotos de internet no se permiten.</span>`;
      return;
    }
    box.className = "dropzone has";
    box.innerHTML = `<div class="photos">` +
      v.photos.map((p, i) => `<div class="ph">${img(p, "Foto " + (i + 1))}${i === 0 ? `<span class="cover">Portada</span>` : ""}<button type="button" data-rm="${i}" aria-label="Quitar foto">×</button></div>`).join("") +
      (uploading ? `<div class="addph skel" aria-live="polite" style="font-size:12px">Subiendo…</div>` : "") +
      (v.photos.length + uploading < 8 ? `<label class="addph" aria-label="Añadir fotos">+<input type="file" accept="image/*" multiple id="pick"></label>` : "") + `</div>`;
  }
  const keep = () => { v.title = $("#f-title").value; v.description = $("#f-desc").value; };
  draw();
  app.onchange = async (e) => {
    if (e.target.id !== "pick") return;
    const files = [...e.target.files].slice(0, 8 - v.photos.length - uploading);
    for (const f of files) {
      uploading++; drawPhotos();
      try {
        const blob = await compress(f);
        const path = `${uid()}/${crypto.randomUUID()}.jpg`;
        const { error } = await sb.storage.from("fotos").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
        if (error) throw error;
        v.photos.push(path);
      } catch (err) { fail(err); }
      uploading--; drawPhotos();
    }
  };
  app.onclick = (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) { e.preventDefault(); const [p] = v.photos.splice(Number(rm.dataset.rm), 1); drawPhotos(); if (!(l.photos || []).includes(p)) sb.storage.from("fotos").remove([p]); return; }
    const r = e.target.closest("[data-row]")?.dataset.row;
    if (!r) return;
    keep();
    if (r === "cat") pickCategory(v.cat_path, false, (path) => {
      const g1 = sizeGroupsFor(v.cat_path).join(), g2 = sizeGroupsFor(path).join();
      if (g1 !== g2) v.size = "";
      v.cat_path = path; v.section = sectionKey(path[0]); v.subcategory = path[path.length - 1]; draw();
    });
    if (r === "brand") pickBrand(v.brand, (x) => { v.brand = x; draw(); });
    if (r === "size") pickSize(sizeGroupsFor(v.cat_path), v.size, (x) => { v.size = x; draw(); });
    if (r === "cond") pickCond(v.cond, (x) => { v.cond = x; draw(); });
    if (r === "color") pickColors(v.colors || [], (x) => { v.colors = x; draw(); });
    if (r === "mat") pickMaterial(v.material, (x) => { v.material = x; draw(); });
    if (r === "price") pickPrice(v.price, (x) => { v.price = x; draw(); });
    if (r === "town") pickTown(v.town, (x) => { v.town = x; draw(); });
    if (r === "parcel") pickParcel(v.parcel, (x) => { v.parcel = x; draw(); });
  };
  app.onsubmit = (e) => {
    e.preventDefault();
    keep();
    const err = $("#err");
    const groups = hasPath() ? sizeGroupsFor(v.cat_path) : [];
    const price = parseFloat(v.price);
    const miss = uploading ? "Espera a que terminen de subir las fotos." : !v.photos.length ? "Añade al menos una foto." : v.title.trim().length < 3 ? "Escribe un título (3 letras o más)." : !hasPath() ? "Escoge la categoría." : groups.length && !v.size ? "Escoge la talla." : !v.cond ? "Escoge el estado." : offAppHit(v.title) || offAppHit(v.description) ? "Quita del título o la descripción los teléfonos, redes o formas de pago por fuera (ATH, efectivo…)." : !(price >= 1) ? "Ponle precio (de $1 en adelante)." : !v.town ? "Escoge tu ubicación." : "";
    if (miss) { err.textContent = miss; err.hidden = false; err.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    err.hidden = true;
    const row = {
      title: v.title.trim(), description: v.description.trim() || null, section: sectionKey(v.cat_path[0]), subcategory: v.cat_path[v.cat_path.length - 1], cat_path: v.cat_path,
      brand: v.brand.trim() || null, size: groups.length ? v.size : null, cond: v.cond, colors: v.colors || [], material: wearable() ? v.material || null : null,
      price, parcel: v.parcel, town: v.town, photos: v.photos,
    };
    busy($("#save"), async () => {
      if (editId) {
        const { error } = await sb.from("listings").update(row).eq("id", editId);
        if (error) throw error;
        toast("Cambios guardados.");
        location.hash = "#/item/" + editId;
      } else {
        const { data, error } = await sb.from("listings").insert({ ...row, seller_id: uid() }).select("id").single();
        if (error) throw error;
        if (!me?.town) sb.from("profiles").update({ town: v.town }).eq("id", uid()).then(loadMe);
        toast("¡Subido! Ya está a la venta.");
        location.hash = "#/item/" + data.id;
      }
    });
  };
}

/* ---------- buzón ---------- */
async function inbox(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top"><h2>Buzón</h2></div><div class="stack" id="list">${Array.from({ length: 4 }, () => `<div class="skel" style="height:76px"></div>`).join("")}</div>`;
  const { data, error } = await sb.from("threads")
    .select("id,last_message_at,buyer_id,seller_id, listing:listings(id,title,photos,price), buyer:profiles!threads_buyer_id_fkey(display_name), seller:profiles!threads_seller_id_fkey(display_name)")
    .or(`buyer_id.eq.${uid()},seller_id.eq.${uid()}`).order("last_message_at", { ascending: false }).limit(100);
  if (stale(id)) return;
  if (error) throw error;
  $("#list").innerHTML = data.length ? data.map((t) => {
    const other = t.buyer_id === uid() ? t.seller : t.buyer;
    return `<a class="listbtn" href="#/chat/${t.id}"><div class="avatar">${initial(other?.display_name)}</div>
      <div style="flex:1;min-width:0"><div class="row"><b class="ellip">${esc(other?.display_name)}</b><span class="small">${fmtAgo(t.last_message_at)}</span></div>
      <div class="small ellip">${t.buyer_id === uid() ? "Comprando" : "Vendiendo"} · ${esc(t.listing?.title || "Artículo")}</div></div>${thumb(t.listing)}</a>`;
  }).join("") : `<div class="empty">No tienes mensajes todavía.<br>Toca "Preguntar al vendedor" o "Hacer una oferta" en cualquier artículo.</div>`;
}

async function chat(tid, id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="skel" style="height:300px;margin-top:20px"></div>`;
  const { data: t, error } = await sb.from("threads")
    .select("*, listing:listings(id,title,price,photos,status,seller_id), buyer:profiles!threads_buyer_id_fkey(id,display_name), seller:profiles!threads_seller_id_fkey(id,display_name)")
    .eq("id", tid).maybeSingle();
  if (stale(id)) return;
  if (error) throw error;
  if (!t) { app.innerHTML = `${back("#/mensajes", "Buzón")}<div class="empty">Conversación no encontrada.</div>`; return; }
  const iAmSeller = t.seller_id === uid();
  const other = iAmSeller ? t.buyer : t.seller;
  const [{ data: msgs0 }, { data: ord }] = await Promise.all([
    sb.from("messages").select("*").eq("thread_id", tid).order("created_at").limit(500),
    sb.from("orders").select("id,status").contains("listing_ids", [t.listing_id]).eq("buyer_id", t.buyer_id).order("created_at", { ascending: false }).limit(1),
  ]);
  if (stale(id)) return;
  const msgs = msgs0 || [];
  const openOrder = ord?.[0];
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
    app.innerHTML = `<div class="top" style="padding-bottom:8px">${back("#/mensajes", "Buzón")}
      <div class="listbtn" style="padding:8px"><a href="#/item/${t.listing?.id}" style="display:contents;color:inherit;text-decoration:none">${thumb(t.listing)}<div style="flex:1;min-width:0"><div class="ellip"><b>${esc(other?.display_name)}</b></div><div class="small ellip">${esc(t.listing?.title || "Artículo")} · ${money(t.listing?.price || 0)}</div></div></a>
      ${openOrder ? `<a class="btn sea small" style="width:auto" href="#/pedido/${openOrder.id}">Ver pedido</a>` : ""}</div></div>
      <div class="chat" id="chat"><div class="bub sys">Paga siempre dentro de la app: el vendedor cobra solo cuando escanea tu código, así que no hay capturas de ATH falsas ni efectivo. Nunca envíes tu código por mensaje y escojan un lugar público con gente.</div>${msgs.map(msgHTML).join("")}</div>`;
    window.scrollTo(0, document.body.scrollHeight);
  }
  draw();
  const comp = document.createElement("div");
  comp.className = "composer";
  comp.style.bottom = "0";
  comp.style.paddingBottom = "calc(8px + env(safe-area-inset-bottom,0px))";
  comp.innerHTML = `<div class="offwarn" id="offwarn" hidden></div><form><input id="msgIn" placeholder="Escribe un mensaje…" aria-label="Mensaje" autocomplete="off" maxlength="1000"><button id="msgSend">Enviar</button></form>`;
  document.body.appendChild(comp);
  const paidHere = () => !!openOrder && ["paid", "shipped", "completed"].includes(openOrder.status);
  const blockedReason = (txt) => { const h = offAppHit(txt); return h === "pago" || (h === "contacto" && !paidHere()) ? h : null; };
  $("#msgIn").addEventListener("input", (e) => {
    const r = blockedReason(e.target.value);
    const w = $("#offwarn");
    w.hidden = !r;
    if (r) w.textContent = OFFAPP_MSG[r];
    $("#msgSend").disabled = !!r;
  });
  comp.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const inp = $("#msgIn");
    const body = inp.value.trim();
    if (!body) return;
    if (blockedReason(body)) return toast(OFFAPP_MSG[blockedReason(body)]);
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
    const val = parseFloat(f.querySelector("input").value);
    busy(f.querySelector("button"), async () => {
      const { error } = await sb.rpc("respond_offer", { p_message: f.dataset.cform, p_action: "counter", p_counter: val });
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
  app.innerHTML = `<div class="top">${back("#/perfil", "Perfil")}<h2>Mis pedidos</h2><div class="tabs"><button data-tab="buy" aria-pressed="${ordersTab === "buy"}">Compras</button><button data-tab="sell" aria-pressed="${ordersTab === "sell"}">Ventas</button></div></div><div class="stack" id="list">${Array.from({ length: 3 }, () => `<div class="skel" style="height:76px"></div>`).join("")}</div>`;
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
      <div class="small ellip">${money(o.total)} · ${o.delivery_mode === "meet" ? "Encuentro" : "Envío"} · ${fmtAgo(o.created_at)}</div></div>${pill(o)}</a>`;
  }).join("") : `<div class="empty">${ordersTab === "buy" ? "Todavía no has comprado nada." : "Todavía no has vendido nada."}</div>`;
}
function pill(o) {
  if (o.status === "refunded") return `<span class="pillstate off">Reembolsado</span>`;
  if (o.status === "completed") return `<span class="pillstate ok">Completado</span>`;
  if (o.status === "shipped") return `<span class="pillstate wait">En camino</span>`;
  return `<span class="pillstate wait">${o.delivery_mode === "meet" ? "Por entregar" : "Por enviar"}</span>`;
}

async function order(oid, id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="skel" style="height:300px;margin-top:20px"></div>`;
  const { data: o, error } = await sb.from("orders").select("*").eq("id", oid).maybeSingle();
  if (stale(id)) return;
  if (error) throw error;
  if (!o) { app.innerHTML = `${back("#/pedidos", "Pedidos")}<div class="empty">Pedido no encontrado.</div>`; return; }
  const iAmBuyer = o.buyer_id === uid();
  const otherId = iAmBuyer ? o.seller_id : o.buyer_id;
  const [{ data: ls }, { data: other }, codeRes, revRes, { data: th }] = await Promise.all([
    sb.from("listings").select("id,title,photos,price").in("id", o.listing_ids),
    sb.from("profiles").select("id,display_name").eq("id", otherId).maybeSingle(),
    iAmBuyer ? sb.from("order_codes").select("code").eq("order_id", oid).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("reviews").select("id").eq("order_id", oid).eq("reviewer_id", uid()).maybeSingle(),
    sb.from("threads").select("id").eq("listing_id", o.listing_ids[0]).eq("buyer_id", o.buyer_id).maybeSingle(),
  ]);
  if (stale(id)) return;
  const code = codeRes.data?.code;
  let reviewed = !!revRes.data;
  const steps = o.delivery_mode === "meet" ? ["Pagado", "Encuentro", "Entregado"] : ["Pagado", "En camino", "Recibido"];
  const title = o.listing_ids.length > 1 ? `Lote de ${o.listing_ids.length} artículos` : ls?.[0]?.title || "Artículo";
  const chatHref = th ? "#/chat/" + th.id : "#/mensajes";
  let stars = 0;
  let rejectOpen = false;

  function actions() {
    const open = o.status === "paid" || o.status === "shipped";
    if (o.status === "refunded") return `<div class="panel"><b>Reembolsado</b><span class="small">${esc(o.refund_reason || "")} Reembolso al comprador: ${money(o.refund_amount || 0)}.</span></div>`;
    if (o.status === "completed") return `
      <div class="panel" style="background:var(--ok-soft)"><b style="color:var(--ok)">Entrega confirmada</b><span class="small" style="color:var(--ink)">${iAmBuyer ? "Se le pagó al vendedor." : "Recibiste " + money(o.subtotal - o.discount) + "."}${TEST_MODE ? " (Prueba: no se movió dinero real.)" : ""}</span></div>
      ${reviewed ? `<div class="small" style="text-align:center">Ya calificaste a ${esc(other?.display_name)}. ¡Gracias!</div>` : `
      <form class="panel" id="review"><span class="label">Califica a ${esc(other?.display_name)}</span>
        <div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-pressed="${n <= stars}" aria-label="${n} estrellas">★</button>`).join("")}</div>
        <input id="rcomment" maxlength="300" placeholder="Comentario (opcional)"><button class="btn sea">Enviar calificación</button></form>`}`;
    if (!open) return "";
    const meetInfo = `<div class="panel"><b>Coordinen el encuentro por mensaje</b><span class="small">Pónganse de acuerdo en el lugar y la hora. Recomendamos un lugar público con gente.</span><a class="btn sea small" href="${chatHref}">Escribirle a ${esc(other?.display_name)}</a></div>`;
    if (iAmBuyer) {
      if (o.delivery_mode === "meet") return `${meetInfo}
        <div class="panel qrwrap"><span class="label">Tu código de entrega</span><div class="qrbox" id="qr">Cargando…</div>
          <span class="code">${code ? code.slice(0, 3) + " " + code.slice(3) : "—"}</span>
          <span class="small" style="text-align:center">En el encuentro, revisa el artículo. Si está bien, deja que el vendedor escanee este código. Nunca lo envíes por mensaje.</span></div>
        ${rejectOpen ? rejectForm() : `<button class="btn ghost" data-act="reject">No lo acepto (reembolso)</button>`}
        <div class="panel"><span class="label">Si algo pasa</span>
          <div class="btns"><button class="btn ghost small" data-act="seller_no_show">El vendedor no llegó</button><button class="btn ghost small" data-act="buyer_cant">No puedo llegar</button></div>
          <button class="btn ghost small" data-act="received">Ya lo recibí y está bien</button></div>`;
      if (o.status === "paid") return `<div class="panel"><b>Esperando que ${esc(other?.display_name)} lo envíe.</b><span class="small">Te avisamos cuando salga.</span></div>
        <button class="btn ghost" data-act="buyer_cant">Cancelar pedido</button>`;
      return `<div class="panel"><b>¡Va en camino!</b><span class="small">Cuando llegue, revísalo y confirma.</span></div>
        <button class="btn sea" data-act="received">Lo recibí y está bien</button>
        ${rejectOpen ? rejectForm() : `<button class="btn ghost" data-act="reject">Hay un problema</button>`}`;
    }
    if (o.delivery_mode === "meet") return `${meetInfo}
      <form class="panel" id="codeForm"><span class="label">Confirmar la entrega</span>
        <span class="small">En el encuentro, cuando el comprador revise el artículo, pídele su código. Escanéalo o escríbelo.</span>
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
    const stepN = o.status === "completed" ? 2 : o.status === "shipped" ? 1 : o.status === "paid" ? 0 : -1;
    app.innerHTML = `${back("#/pedidos", "Mis pedidos")}
    <div class="stack">
      <div class="status">${steps.map((s, i) => `<div class="${i <= stepN ? "done" : ""}">${s}</div>`).join("")}</div>
      <div class="panel"><div class="row" style="align-items:flex-start;justify-content:flex-start">${thumb(ls?.[0])}<div style="flex:1;min-width:0"><h3 style="font-size:18px">${esc(title)}</h3>
        <div class="small">${iAmBuyer ? "Vendedor" : "Comprador"}: <a href="#/u/${otherId}">${esc(other?.display_name)}</a> · ${o.delivery_mode === "meet" ? "Encuentro en persona" : "Envío por correo"}</div></div></div>
        <div class="lines small">
          <div class="row"><span>Pedido</span><span>${money(o.subtotal)}</span></div>
          ${Number(o.discount) ? `<div class="row disc"><span>Descuento</span><span>−${money(o.discount)}</span></div>` : ""}
          <div class="row"><span>Protección al Comprador</span><span>${money(o.service_fee)}</span></div>
          ${Number(o.delivery_fee) ? `<div class="row"><span>Envío</span><span>${money(o.delivery_fee)}</span></div>` : ""}
          <div class="row total"><span>Total pagado</span><span>${money(o.total)}</span></div>
        </div></div>
      ${actions()}
      ${o.status === "completed" || o.status === "refunded" ? `<a class="btn ghost small" href="${chatHref}">Escribirle a ${esc(other?.display_name)}</a>` : ""}
    </div>`;
    if (iAmBuyer && o.status === "paid" && o.delivery_mode === "meet" && code) drawQR(code);
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
      }).catch(() => { scanner = null; box.hidden = true; btn.textContent = "Escanear código"; throw new Error("No se pudo abrir la cámara. Escribe el código a mano."); });
    });
  }
}

/* ---------- favoritos ---------- */
async function favorites(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top">${back("#/perfil", "Perfil")}<h2>Favoritos</h2></div><div class="grid" id="g">${skelGrid(4)}</div>`;
  const { data, error } = await sb.from("favorites").select(`created_at, listing:listings(${LIST_COLS})`).eq("user_id", uid()).order("created_at", { ascending: false }).limit(200);
  if (stale(id)) return;
  if (error) throw error;
  const ls = (data || []).map((f) => f.listing).filter(Boolean);
  $("#g").innerHTML = ls.map(cardHTML).join("") || `<div class="empty" style="grid-column:1/-1">Toca el corazón en un artículo para guardarlo aquí.</div>`;
  app.onclick = (e) => bindFavs(e);
}

/* ---------- perfil ---------- */
const ic = (d) => `<svg class="mi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  heart: '<path d="M12 20s-7-4.3-8.9-8.6C1.7 8 3.9 4.6 7.2 4.6c1.9 0 3.3 1 4.8 2.8 1.5-1.8 2.9-2.8 4.8-2.8 3.3 0 5.5 3.4 4.1 6.8C19 15.7 12 20 12 20z"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M3 9l9 6 9-6M7.5 9V7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v2"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="1.5"/><path d="M3 9h15"/><circle cx="16.5" cy="14.5" r=".8" fill="currentColor"/>',
  orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  rocket: '<path d="M14 4c3-1 6-1 6-1s0 3-1 6l-6 6-5-5z"/><path d="M8 10l-4 1 3 3M14 16l-1 4-3-3M5 19c0-2 1-3 2-3"/><circle cx="15.5" cy="8.5" r="1.3"/>',
  sliders: '<path d="M3 7h6M13 7h8M3 17h12M19 17h2"/><rect x="9" y="4.5" width="4" height="5" rx="1"/><rect x="15" y="14.5" width="4" height="5" rx="1"/>',
  umbrella: '<path d="M3 12a9 9 0 0 1 17-4z"/><path d="M11.5 10l5 10"/><path d="M8 5c1 2 2 4 3.5 5M15 4c-1 2-2 4-3.5 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
  life: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5l1.6 2.3 2.7-.6.6 2.7 2.4 1.4-1.1 2.6 1.1 2.6-2.4 1.4-.6 2.7-2.7-.6L12 21.5l-1.6-2.3-2.7.6-.6-2.7-2.4-1.4 1.1-2.6-1.1-2.6 2.4-1.4.6-2.7 2.7.6z"/>',
  cookie: '<path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 4 3.5 3 3 0 0 0 5 5.5z"/><circle cx="8.5" cy="10" r=".8" fill="currentColor"/><circle cx="10" cy="15.5" r=".8" fill="currentColor"/><circle cx="15" cy="15" r=".8" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.8" r=".8" fill="currentColor"/>',
  legal: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  out: '<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10"/>',
};
const mrow = (icon, label, { href, act, right = "" } = {}) =>
  `${href ? `<a class="rowbtn" href="${href}">` : `<button class="rowbtn" data-act="${act}">`}<span class="ml">${ic(ICONS[icon])}<span>${label}</span></span><span class="mr">${right}${CHEV}</span>${href ? "</a>" : "</button>"}`;
const prose = (h) => `<div class="prose">${h}</div>`;

async function walletInfo() {
  const { data } = await sb.from("orders").select("status,subtotal,discount,total,refund_amount").eq("seller_id", uid());
  let avail = 0, pending = 0;
  (data || []).forEach((o) => {
    const net = Number(o.subtotal) - Number(o.discount);
    if (o.status === "completed") avail += net;
    else if (o.status === "paid" || o.status === "shipped") pending += net;
    else if (o.status === "refunded") avail += Math.max(0, Number(o.total) - Number(o.refund_amount || 0));
  });
  return { avail: r2(avail), pending: r2(pending), n: (data || []).filter((o) => o.status === "completed").length };
}

async function profile(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top"><h2 style="text-align:center">Perfil</h2></div><div class="skel" style="height:84px"></div><div class="skel" style="height:300px;margin-top:14px"></div>`;
  const [, { data: fv }, w] = await Promise.all([
    loadMe(),
    sb.from("favorites").select("listing:listings(photos)").eq("user_id", uid()).order("created_at", { ascending: false }).limit(4),
    walletInfo(),
  ]);
  if (stale(id)) return;
  const pics = (fv || []).map((f) => f.listing?.photos?.[0]).filter(Boolean);
  const stack = pics.length ? `<span class="favstack">${pics.map((p) => `<img src="${esc(photoUrl(p))}" alt="">`).join("")}</span>` : "";
  const vac = !!me?.vacation;
  app.innerHTML = `<div class="top"><h2 style="text-align:center">Perfil</h2></div>
  <div class="stack menu">
    <a class="panel seller" href="#/u/${uid()}"><div class="avatar" style="background:var(--flame);width:56px;height:56px;font-size:22px">${initial(me?.display_name)}</div>
      <div style="flex:1;min-width:0"><b style="font-size:18px">${esc(me?.display_name)}</b><div class="small">${me?.rating_count ? "★ " + Number(me.rating_avg).toFixed(1) + " (" + me.rating_count + " reseñas)" : "Sin reseñas todavía"} · ${me?.sales_count || 0} ventas</div><div class="small" style="color:var(--sea);font-weight:600">Ver mi perfil y mi armario</div></div>${CHEV}</a>
    <div class="rows">${mrow("heart", "Artículos favoritos", { href: "#/favoritos", right: stack })}</div>
    <div class="rows">
      ${mrow("gift", "Invita a tus amigos", { act: "invite" })}
      ${mrow("wallet", "Billetera", { href: "#/billetera", right: `<span class="val">${money(w.avail)}</span>` })}
      ${mrow("orders", "Mis pedidos", { href: "#/pedidos" })}
      ${mrow("rocket", "Herramientas de promoción", { act: "promo" })}
    </div>
    <div class="rows">
      ${mrow("sliders", "Personalización", { href: "#/personalizar" })}
      ${mrow("umbrella", "Modo vacaciones", { act: "vac", right: `<span class="val">${vac ? "Activado" : "Apagado"}</span>` })}
    </div>
    <div class="rows">
      ${mrow("help", "Tu guía de Pulguea", { act: "how" })}
      ${mrow("life", "Centro de ayuda", { act: "help" })}
    </div>
    <div class="rows">
      ${mrow("gear", "Configuración", { href: "#/ajustes" })}
      ${mrow("cookie", "Configuración de cookies", { act: "cookies" })}
      ${mrow("info", "Sobre Pulguea", { act: "about" })}
      ${mrow("legal", "Información legal", { act: "legal" })}
    </div>
    <div class="rows"><button class="rowbtn" data-act="out"><span class="ml" style="color:var(--flame)">${ic(ICONS.out)}<span>Cerrar sesión</span></span></button></div>
  </div>`;
  app.onclick = (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "out") busy(b, async () => { await sb.auth.signOut(); toast("Cerraste sesión."); location.hash = "#/"; });
    if (a === "invite") inviteSheet();
    if (a === "promo") promoSheet();
    if (a === "vac") vacationSheet(id);
    if (a === "how") guideSheet();
    if (a === "help") helpSheet();
    if (a === "cookies") openSheet("Configuración de cookies", prose(`<p>Pulguea solo guarda en tu teléfono lo necesario para funcionar:</p><ul><li><b>Tu sesión</b>, para que no tengas que entrar cada vez.</li><li><b>Pequeños ajustes</b> de la app en este teléfono.</li></ul><p>No usamos cookies de anuncios ni te rastreamos en otras páginas. Si algún día añadimos cookies opcionales, podrás apagarlas aquí.</p>`));
    if (a === "about") openSheet("Sobre Pulguea", prose(`<div style="text-align:center;margin:4px 0 10px"><span class="logo" style="font-size:34px;justify-content:center">${LOGO}<span aria-hidden="true">ulguea</span></span></div><p>Pulguea es el mercado de segunda mano hecho para Puerto Rico. Compras y vendes con gente de tu pueblo, se encuentran en persona y te lo llevas el mismo día, sin esperar semanas por un envío.</p><p>El dinero se queda guardado en la app hasta que recibes el artículo, así nadie tiene que andar con efectivo.</p><p class="small">Versión de prueba${TEST_MODE ? " · los pagos son de mentira" : ""}</p>`));
    if (a === "legal") legalSheet();
  };
}
function inviteSheet() {
  const link = location.origin + location.pathname;
  const text = "Mira Pulguea, el pulguero de bolsillo: compra y vende de segunda mano en Puerto Rico y recógelo hoy mismo.";
  openSheet("Invita a tus amigos", prose(`<p>Mientras más gente venda en tu pueblo, más cosas vas a encontrar cerca. Comparte Pulguea con tus amigos.</p>`) +
    `<div class="rowinput" style="border:1px solid var(--line);border-radius:12px"><input readonly value="${esc(link)}" aria-label="Enlace" style="border:0;padding:10px 0"></div>
     <button class="btn primary" data-share>Compartir enlace</button>`, async (e) => {
    if (!e.target.closest("[data-share]")) return;
    try {
      if (navigator.share) await navigator.share({ title: "Pulguea", text, url: link });
      else { await navigator.clipboard.writeText(`${text} ${link}`); toast("Enlace copiado."); }
    } catch {}
  });
}
function promoSheet() {
  const link = `${location.origin}${location.pathname}#/u/${uid()}`;
  openSheet("Herramientas de promoción", prose(`<p><b>Comparte tu armario.</b> Pon este enlace en tu Instagram, TikTok o WhatsApp para que vean todo lo que vendes.</p>`) +
    `<button class="btn primary" data-share>Compartir mi armario</button>` +
    prose(`<p style="margin-top:14px"><b>Consejos para vender más rápido</b></p><ul><li>Sube fotos con luz natural y fondo limpio. La primera foto es la que más se ve.</li><li>Pon la marca y la talla: es lo primero que la gente filtra.</li><li>Contesta los mensajes rápido y acepta ofertas razonables.</li><li>Arma lotes: tus compradores ahorran 10% al llevarse varias cosas.</li></ul><p class="small">Pronto: destacar artículos para que salgan primero.</p>`),
    async (e) => {
      if (!e.target.closest("[data-share]")) return;
      try { if (navigator.share) await navigator.share({ title: "Mi armario en Pulguea", url: link }); else { await navigator.clipboard.writeText(link); toast("Enlace copiado."); } } catch {}
    });
}
/* ---------- Personalización (como Vinted) ---------- */
async function persMembers(id) {
  if (needLogin()) return;
  let term = "";
  app.innerHTML = `${pagehead("#/personalizar", "Miembros")}
    <div class="pagehero"><h2>Miembros que sigues</h2><span class="small">Sigue a vendedores que te gustan y verás sus artículos en Inicio › Siguiendo.</span></div>
    <label class="searchbox">${SEARCH}<input id="mq" type="search" placeholder="Busca miembros por nombre" autocomplete="off"></label>
    <div class="flatrows" id="ml" style="margin-top:12px"><div class="skel" style="height:60px;margin:12px 16px"></div></div>`;
  const row = (p) => `<div class="rowbtn member"><a class="ml" href="#/u/${p.id}" style="color:inherit;text-decoration:none"><div class="avatar">${initial(p.display_name)}</div><span><b>${esc(p.display_name)}</b> ${trustBadge(p)}<small class="small" style="display:block">${p.rating_count ? "★ " + Number(p.rating_avg).toFixed(1) + " · " : ""}${p.sales_count || 0} ventas${p.town ? " · " + esc(p.town) : ""}</small></span></a>${p.id === uid() ? "" : followBtn(p.id)}</div>`;
  async function load() {
    const cols = "id,display_name,town,rating_avg,rating_count,sales_count,strikes";
    let data = [];
    if (term.length >= 2) {
      const t = term.replace(/[%,()_\\"]/g, " ").trim();
      ({ data } = await sb.from("profiles").select(cols).ilike("display_name", `%${t}%`).neq("id", uid()).limit(30));
    } else if (following.size) {
      ({ data } = await sb.from("profiles").select(cols).in("id", [...following]).limit(200));
    }
    if (stale(id)) return;
    $("#ml").innerHTML = (data || []).map(row).join("") || `<div class="empty">${term.length >= 2 ? "No encontramos a nadie con ese nombre." : "Todavía no sigues a nadie. Busca por nombre o toca Seguir en el perfil de un vendedor."}</div>`;
  }
  let deb;
  app.oninput = (e) => { if (e.target.id === "mq") { clearTimeout(deb); deb = setTimeout(() => { term = e.target.value.trim(); load(); }, 300); } };
  app.onclick = async (e) => {
    const f = e.target.closest("[data-follow]");
    if (!f) return;
    f.disabled = true;
    const on = await toggleFollow(f.dataset.follow);
    f.outerHTML = followBtn(f.dataset.follow);
    if (on) toast("Siguiendo.");
  };
  await load();
}
const GENDERS = [["mujer", "Mujer", '<path d="M9 3v3l-2 4v11h10V10l-2-4V3"/><path d="M9 6h6"/>'], ["hombre", "Hombre", '<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/>'], ["ninos", "Niños", '<circle cx="12" cy="13" r="8"/><path d="M9 13h.01M15 13h.01M9.5 16.5a3.5 3.5 0 0 0 5 0M12 5c0-1.5 1-2 2-2"/>']];
const pagehead = (backTo, title) => `<div class="sellhead"><a class="iconbtn" href="${backTo}" aria-label="Volver">‹</a><b>${esc(title)}</b><span></span></div>`;
const checkbox = (on) => `<span class="cbox ${on ? "on" : ""}" aria-hidden="true">${on ? "✓" : ""}</span>`;
const sizesOf = (g) => prefs.sizes.filter((x) => GENDER_GROUPS[g].includes(x.split(":")[0])).map((x) => x.slice(x.indexOf(":") + 1));
async function persMain(id) {
  if (needLogin()) return;
  app.innerHTML = `${pagehead("#/perfil", "Personalización")}
    <div class="pagehero"><h2>Ve solo lo que te queda</h2><span class="small">Escoge las categorías, tallas y marcas que quieres ver primero en tu Inicio y en Buscar.</span></div>
    <div class="flatrows">
      <a class="rowbtn" href="#/personalizar/tallas"><span>Categorías y tallas</span><span class="mr"><span class="val">${esc(prefs.genders.map(sectionName).join(", "))}</span>${CHEV}</span></a>
      <a class="rowbtn" href="#/personalizar/miembros"><span>Miembros</span><span class="mr"><span class="val">${following.size ? following.size + " siguiendo" : ""}</span>${CHEV}</span></a>
      <a class="rowbtn" href="#/personalizar/marcas"><span>Marcas</span><span class="mr"><span class="val">${esc(prefs.brands.slice(0, 3).join(", "))}${prefs.brands.length > 3 ? "…" : ""}</span>${CHEV}</span></a>
    </div>
    ${hasPrefs() ? `<div style="padding:16px 0"><a class="btn ghost" href="#/" data-pt>Ver “Para ti” en Inicio</a></div>` : ""}`;
  app.onclick = (e) => { if (e.target.closest("[data-pt]")) homeSection = "parati"; };
}
async function persSizes(id) {
  if (needLogin()) return;
  const draw = () => {
    app.innerHTML = `${pagehead("#/personalizar", "Categorías y tallas")}
      <div class="pagehero"><h2>Tus tallas</h2><span class="small">Escoge las tallas que más te interesan.</span></div>
      <div class="flatrows">${GENDERS.map(([k, n, icon]) => `
        <button class="rowbtn gender" data-g="${k}"><span class="ml"><svg class="mi accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><b>${n}</b></span>${checkbox(prefs.genders.includes(k))}</button>
        <a class="rowbtn sub" href="#/personalizar/tallas/${k}"><span>Tallas</span><span class="mr"><span class="val">${esc(sizesOf(k).join(", "))}</span>${CHEV}</span></a>`).join("")}
      </div>`;
  };
  draw();
  app.onclick = async (e) => {
    const g = e.target.closest("[data-g]")?.dataset.g;
    if (!g) return;
    prefs.genders = prefs.genders.includes(g) ? prefs.genders.filter((x) => x !== g) : [...prefs.genders, g];
    draw();
    await savePrefs();
  };
}
async function persSizeGroup(g, id) {
  if (needLogin()) return;
  const name = GENDERS.find((x) => x[0] === g)?.[1];
  if (!name) { location.hash = "#/personalizar/tallas"; return; }
  const draw = () => {
    app.innerHTML = `${pagehead("#/personalizar/tallas", name)}
      <div class="flatrows">${GENDER_GROUPS[g].map((grp) => {
        const [gn, sizes] = SIZE_GROUPS[grp];
        return `<div class="grouplabel">${gn}</div>` + sizes.map((x) => { const t = grp + ":" + x; const on = prefs.sizes.includes(t); return `<button class="rowbtn" data-t="${esc(t)}" aria-pressed="${on}"><span>${esc(x)}</span>${checkbox(on)}</button>`; }).join("");
      }).join("")}</div>`;
  };
  draw();
  let deb;
  app.onclick = (e) => {
    const b = e.target.closest("[data-t]");
    if (!b) return;
    const t = b.dataset.t;
    const on = prefs.sizes.includes(t);
    prefs.sizes = on ? prefs.sizes.filter((x) => x !== t) : [...prefs.sizes, t];
    if (!on && !prefs.genders.includes(g)) prefs.genders = [...prefs.genders, g];
    b.setAttribute("aria-pressed", !on);
    b.querySelector(".cbox").outerHTML = checkbox(!on);
    filt.mine = prefs.sizes.length > 0;
    clearTimeout(deb);
    deb = setTimeout(() => { deb = null; savePrefs(); }, 400);
  };
  cleanups.push(() => { if (deb) { clearTimeout(deb); savePrefs(); } });
}
async function persBrands(id) {
  if (needLogin()) return;
  let term = "";
  const list = () => {
    const t = term.toLowerCase();
    const all = [...new Set([...prefs.brands, ...BRANDS])];
    const hits = all.filter((b) => b.toLowerCase().includes(t));
    const extra = term && !all.some((b) => b.toLowerCase() === t) ? `<button class="rowbtn" data-b="${esc(term)}"><span>Añadir “${esc(term)}”</span>${checkbox(false)}</button>` : "";
    return extra + hits.map((b) => `<button class="rowbtn" data-b="${esc(b)}" aria-pressed="${prefs.brands.includes(b)}"><span>${esc(b)}</span>${checkbox(prefs.brands.includes(b))}</button>`).join("");
  };
  app.innerHTML = `${pagehead("#/personalizar", "Marcas")}
    <div class="pagehero"><h2>Tus marcas</h2><span class="small">Escoge las marcas que te gustan.</span></div>
    <label class="searchbox">${SEARCH}<input id="bq" type="search" placeholder="Busca marcas" autocomplete="off"></label>
    <div class="flatrows" id="bl">${list()}</div>`;
  app.oninput = (e) => { if (e.target.id === "bq") { term = e.target.value.trim().slice(0, 40); $("#bl").innerHTML = list(); } };
  let deb;
  app.onclick = (e) => {
    const b = e.target.closest("[data-b]");
    if (!b) return;
    const n = b.dataset.b;
    const on = prefs.brands.includes(n);
    if (!on && prefs.brands.length >= 100) return toast("Máximo 100 marcas.");
    prefs.brands = on ? prefs.brands.filter((x) => x !== n) : [...prefs.brands, n];
    $("#bl").innerHTML = list();
    clearTimeout(deb);
    deb = setTimeout(() => { deb = null; savePrefs(); }, 400);
  };
  cleanups.push(() => { if (deb) { clearTimeout(deb); savePrefs(); } });
}
function vacationSheet(rid) {
  const on = !!me?.vacation;
  openSheet("Modo vacaciones", prose(`<p>Si te vas de viaje o no puedes entregar por unos días, activa el modo vacaciones.</p><ul><li>Tus artículos se esconden de Inicio y de Buscar.</li><li>Nadie puede comprarte ni hacerte ofertas.</li><li>Tus pedidos abiertos siguen igual: termínalos antes de irte.</li></ul>`) +
    `<button class="btn ${on ? "ghost" : "primary"}" data-tog>${on ? "Apagar modo vacaciones" : "Activar modo vacaciones"}</button>`, (e) => {
    const b = e.target.closest("[data-tog]");
    if (!b) return;
    busy(b, async () => {
      const { error } = await sb.from("profiles").update({ vacation: !on }).eq("id", uid());
      if (error) throw error;
      closeSheet();
      toast(on ? "Volviste. Tus artículos ya se ven." : "Modo vacaciones activado.");
      profile(++renderId);
    });
  });
}
function guideSheet() {
  openSheet("Tu guía de Pulguea", prose(`<p><b>Comprar</b></p><ol><li>Paga en la app con Apple Pay, Google Pay o tarjeta. El dinero queda guardado.</li><li>Coordina por mensaje con el vendedor el lugar y la hora. Escojan un sitio público con gente.</li><li>Revisa el artículo. Si está bien, enséñale tu código al vendedor para que lo escanee.</li></ol>
  <p><b>Vender</b></p><ol><li>Toca Vender, sube fotos y llena los detalles.</li><li>Cuando te compren, coordina el encuentro por mensaje.</li><li>Escanea el código del comprador y cobras al instante.</li></ol>
  <p><b>Vendedor confiable</b></p><p>Sale con 5 ventas o más dentro de la app, 3 reseñas o más, 4.5 estrellas y ninguna falta. Las ventas por fuera no cuentan.</p>
  <p><b>Lo que cuesta</b></p><p>Vender es gratis. El comprador paga un cargo de Protección al Comprador de 5% + $0.70.</p>
  <p><b>Si alguien no aparece</b></p><p>Si es el vendedor, el comprador recibe todo su dinero y el vendedor recibe una falta. Si es el comprador, recibe el precio de vuelta pero el cargo de servicio va al vendedor por su viaje.</p>`));
}
function helpSheet() {
  const faq = [
    ["¿Cuándo recibe el dinero el vendedor?", "En el momento en que escanea el código del comprador durante la entrega en persona."],
    ["¿Qué pasa si el artículo no es como se describe?", "No le enseñes tu código al vendedor. Cancela el pedido desde la página del pedido y recibes tu dinero de vuelta."],
    ["¿Dónde nos encontramos?", "Lo coordinan por mensaje. Recomendamos un lugar público con gente, como un centro comercial o una farmacia, de día."],
    ["¿Cómo hago una oferta?", "En el artículo toca “Hacer una oferta”. El vendedor puede aceptar, rechazar o contraofertar."],
    ["¿Qué es un lote?", "Si compras 2 o más artículos del mismo vendedor, te llevas 10% de descuento y pagas un solo cargo."],
    ["¿Cómo cambio mi contraseña?", "Ve a Perfil › Configuración › Cambiar contraseña."],
    ["El otro usuario no contesta", "Si no aparece al encuentro, cancela el pedido con el motivo “no llegó” y la app hace el reembolso."],
  ];
  openSheet("Centro de ayuda", faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><div>${a}</div></details>`).join(""));
}
function legalSheet() {
  openSheet("Información legal", prose(`<p class="small">Resumen en palabras sencillas. Versión de prueba.</p>
  <p><b>Términos de uso</b></p><ul><li>Tienes que tener 18 años o más y vivir en Puerto Rico.</li><li>Solo puedes vender cosas que son tuyas y que sean legales.</li><li>No se permiten armas, drogas, medicinas, animales vivos, falsificaciones ni artículos robados.</li><li>Los pagos se hacen siempre dentro de la app. Pedir pago por fuera puede cerrar tu cuenta.</li><li>Tres faltas por no llegar a encuentros pueden suspender tu cuenta.</li></ul>
  <p><b>Privacidad</b></p><ul><li>Guardamos tu nombre, correo, pueblo, artículos, mensajes y pedidos para que la app funcione.</li><li>Tu correo no es público. Los demás solo ven tu nombre, tu pueblo y tus reseñas.</li><li>No vendemos tus datos.</li><li>Puedes pedir que borremos tu cuenta y tus datos cuando quieras.</li></ul>`));
}

async function wallet(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top">${back("#/perfil", "Perfil")}<h2>Billetera</h2></div><div class="skel" style="height:140px"></div>`;
  const [w, { data: rows }] = await Promise.all([walletInfo(), sb.from("orders").select("id,status,subtotal,discount,total,refund_amount,completed_at,refunded_at,created_at").eq("seller_id", uid()).order("created_at", { ascending: false }).limit(50)]);
  if (stale(id)) return;
  const line = (o) => {
    const net = Number(o.subtotal) - Number(o.discount);
    const [label, amt, cls] = o.status === "completed" ? ["Venta cobrada", net, "plus"] : o.status === "refunded" ? ["Cargo por no presentarse", Math.max(0, Number(o.total) - Number(o.refund_amount || 0)), "plus"] : ["Pendiente de entrega", net, "pend"];
    if (o.status === "refunded" && !amt) return "";
    return `<a class="rowbtn" href="#/pedido/${o.id}"><span>${label}<small class="small" style="display:block">${fmtAgo(o.completed_at || o.refunded_at || o.created_at)}</small></span><span class="mr"><b class="${cls}">${cls === "plus" ? "+" : ""}${money(amt)}</b>${CHEV}</span></a>`;
  };
  const list = (rows || []).map(line).join("");
  app.innerHTML = `<div class="top">${back("#/perfil", "Perfil")}<h2>Billetera</h2></div>
    <div class="stack">
      <div class="panel" style="text-align:center"><span class="small">Disponible</span><div class="price" style="font-size:34px">${money(w.avail)}</div><span class="small">Pendiente: ${money(w.pending)}</span></div>
      ${TEST_MODE ? `<div class="hl"><span class="small" style="color:var(--ink)">Versión de prueba: este dinero es de mentira. Cuando activemos los pagos reales podrás pasarlo a tu cuenta de banco.</span></div>` : ""}
      <h3 style="font-size:17px">Movimientos</h3>
      <div class="rows">${list || `<div class="empty">Aquí verás lo que cobras por tus ventas.</div>`}</div>
    </div>`;
}

async function settings(id) {
  if (needLogin()) return;
  app.innerHTML = `<div class="top">${back("#/perfil", "Perfil")}<h2>Configuración</h2></div>
    <div class="stack menu">
      <div class="rows">
        <a class="rowbtn" href="#/perfil/editar"><span>Editar perfil</span>${CHEV}</a>
        <a class="rowbtn" href="#/clave"><span>Cambiar contraseña</span>${CHEV}</a>
      </div>
      <div class="rows"><div class="rowbtn" style="cursor:default"><span>Correo</span><span class="val">${esc(session.user.email)}</span></div></div>
      <div class="rows"><button class="rowbtn" data-act="del"><span>Borrar mi cuenta</span>${CHEV}</button></div>
    </div>`;
  app.onclick = (e) => {
    if (e.target.closest("[data-act=del]")) openSheet("Borrar mi cuenta", prose(`<p>Para borrar tu cuenta, primero termina o cancela tus pedidos abiertos. Luego escríbenos desde el correo de tu cuenta y la borramos junto con tus datos.</p><p class="small">Pronto podrás hacerlo directo desde aquí.</p>`));
  };
}
async function editProfile(id) {
  if (needLogin()) return;
  await loadMe();
  if (stale(id)) return;
  let town = me?.town || "";
  app.innerHTML = `${back("#/perfil", "Perfil")}
    <form class="stack" id="pform"><h2>Editar perfil</h2>
      <div class="rows">
        <div class="field" style="padding:12px 14px;border-bottom:1px solid var(--line)"><label for="p-name">Nombre que ven los demás</label><input id="p-name" maxlength="40" value="${esc(me?.display_name)}"></div>
        <button type="button" class="rowbtn" data-act="town"><span>Mi pueblo</span><span class="val ${town ? "set" : ""}" id="townv">${esc(town || "Escoge")}</span>${CHEV}</button>
        <div class="field" style="padding:12px 14px"><label for="p-bio">Sobre mí</label><textarea id="p-bio" maxlength="280" placeholder="Ej: Vendo ropa de mujer talla S y M. Entrego en Bayamón.">${esc(me?.bio || "")}</textarea></div>
      </div>
      <div class="small">Correo: ${esc(session.user.email)} (no es público)</div>
      <button class="btn primary">Guardar</button></form>`;
  app.onclick = (e) => { if (e.target.closest("[data-act=town]")) pickTown(town, (t) => { town = t; const el = $("#townv"); el.textContent = t; el.classList.add("set"); }); };
  app.onsubmit = (e) => {
    e.preventDefault();
    const name = $("#p-name").value.trim();
    if (!name) return toast("Escribe tu nombre.");
    busy(e.target.querySelector("button:not([type])"), async () => {
      const { error } = await sb.from("profiles").update({ display_name: name, town: town || null, bio: $("#p-bio").value.trim() || null }).eq("id", uid());
      if (error) throw error;
      await loadMe();
      toast("Guardado.");
      location.hash = "#/perfil";
    });
  };
}

async function publicProfile(pid, id) {
  app.innerHTML = `<div class="skel" style="height:200px;margin-top:20px"></div>`;
  const [{ data: p }, { data: ls }, { data: rv }, { count: nFollowers }, { count: nFollowing }] = await Promise.all([
    sb.from("profiles").select("id,display_name,town,bio,rating_avg,rating_count,sales_count,created_at,vacation,strikes").eq("id", pid).maybeSingle(),
    (pid === uid() ? sb.from("listings").select(LIST_COLS).eq("seller_id", pid).neq("status", "removed") : sb.from("listings").select(LIST_COLS).eq("seller_id", pid).eq("status", "active")).order("created_at", { ascending: false }),
    sb.from("reviews").select("stars,comment,created_at, reviewer:profiles!reviews_reviewer_id_fkey(display_name)").eq("reviewee_id", pid).order("created_at", { ascending: false }).limit(20),
    sb.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", pid),
    sb.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", pid),
  ]);
  let followers = nFollowers || 0;
  if (stale(id)) return;
  if (!p) { app.innerHTML = `${back("#/")}<div class="empty">Perfil no encontrado.</div>`; return; }
  let tab = "items";
  function draw() {
    app.innerHTML = `${back("javascript:history.back()")}
    <div class="stack">
      <div class="panel"><div class="seller"><div class="avatar" style="width:56px;height:56px;font-size:22px">${initial(p.display_name)}</div><div><b style="font-size:18px">${esc(p.display_name)}</b> ${trustBadge(p, true)}
        <div class="small">${p.rating_count ? "★ " + Number(p.rating_avg).toFixed(1) + " (" + p.rating_count + " reseñas)" : "Sin reseñas todavía"} · ${p.sales_count} ventas${p.town ? " · " + esc(p.town) : ""}</div></div></div>
        ${p.bio ? `<div style="white-space:pre-wrap">${esc(p.bio)}</div>` : ""}
        <div class="small"><b style="color:var(--ink)">${followers}</b> seguidor${followers === 1 ? "" : "es"} · <b style="color:var(--ink)">${nFollowing || 0}</b> siguiendo</div>
        ${pid !== uid() ? followBtn(pid) : ""}
        <div class="small">En Pulguea desde ${new Intl.DateTimeFormat("es-PR", { month: "long", year: "numeric" }).format(new Date(p.created_at))}</div>
        ${pid === uid() && !isTrusted(p) ? `<div class="trustprog"><b>${TRUST_SVG} Hazte Vendedor confiable</b><span class="small">Te faltan: ${[p.sales_count < TRUST.sales ? `${TRUST.sales - p.sales_count} venta${TRUST.sales - p.sales_count === 1 ? "" : "s"} en la app` : "", p.rating_count < TRUST.reviews ? `${TRUST.reviews - p.rating_count} reseña${TRUST.reviews - p.rating_count === 1 ? "" : "s"}` : "", p.rating_count >= TRUST.reviews && Number(p.rating_avg) < TRUST.stars ? "subir tus estrellas a 4.5" : "", p.strikes ? "no tener faltas" : ""].filter(Boolean).join(", ")}. Solo cuentan las ventas pagadas dentro de Pulguea.</span></div>` : ""}
        ${p.vacation ? `<div class="hl"><span class="small" style="color:var(--ink)">De vacaciones: no está vendiendo por ahora.</span></div>` : ""}
        ${pid === uid() ? `<div class="btns"><a class="btn ghost small" href="#/perfil/editar">Editar perfil</a><a class="btn primary small" href="#/vender">Subir artículo</a></div>` : ""}
        ${ls.length > 1 && pid !== uid() && !p.vacation ? `<a class="btn ghost small" href="#/lote/${pid}">Armar un lote (10% menos)</a>` : ""}</div>
      <div class="tabsline"><button data-t="items" aria-pressed="${tab === "items"}">Armario (${ls.length})</button><button data-t="rev" aria-pressed="${tab === "rev"}">Reseñas (${rv?.length || 0})</button></div>
      ${tab === "items" ? `<div class="grid">${ls.map(cardHTML).join("") || `<div class="empty" style="grid-column:1/-1">No tiene artículos a la venta.</div>`}</div>`
        : rv?.length ? rv.map((r) => `<div class="panel"><div class="row"><b style="color:var(--gold)">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</b><span class="small">${esc(r.reviewer?.display_name)} · ${fmtAgo(r.created_at)}</span></div>${r.comment ? `<div>${esc(r.comment)}</div>` : ""}</div>`).join("") : `<div class="empty">Todavía no tiene reseñas.</div>`}
    </div>`;
  }
  draw();
  app.onclick = async (e) => {
    if (bindFavs(e)) return;
    const f = e.target.closest("[data-follow]");
    if (f) { f.disabled = true; const before = following.has(pid); const now = await toggleFollow(pid); if (now !== before) followers += now ? 1 : -1; draw(); if (now && !before) toast(`Ahora sigues a ${p.display_name}.`); return; }
    const t = e.target.closest("[data-t]"); if (t) { tab = t.dataset.t; draw(); }
  };
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
          $("#senttext").innerHTML = `Te enviamos un correo a <b>${esc(mail)}</b>. Toca el botón <b>Confirmar mi cuenta</b> y listo. Si no lo ves, busca en Spam o Promociones.<br><br><button type="button" class="btn ghost small" id="resend">Enviar el correo otra vez</button>`;
          $("#resend").onclick = (ev) => busy(ev.target, async () => { const { error } = await sb.auth.resend({ type: "signup", email: mail, options: { emailRedirectTo: location.origin + location.pathname } }); if (error) throw error; toast("Te lo enviamos otra vez."); });
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
  app.innerHTML = `${header()}<form class="panel" id="np" novalidate>
    <h2 style="font-size:20px">Crea tu contraseña nueva</h2>
    <span class="small">Para la cuenta ${esc(session.user.email)}</span>
    <div class="field"><label for="np1">Contraseña nueva</label><input id="np1" type="password" autocomplete="new-password" placeholder="Al menos 6 caracteres"></div>
    <div class="field"><label for="np2">Escríbela otra vez</label><input id="np2" type="password" autocomplete="new-password"></div>
    <label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="npshow" style="width:auto"> Ver contraseña</label>
    <button class="btn primary">Guardar contraseña</button></form>`;
  setTimeout(() => $("#np1")?.focus(), 80);
  app.onchange = (e) => { if (e.target.id === "npshow") ["#np1", "#np2"].forEach((k) => ($(k).type = e.target.checked ? "text" : "password")); };
  app.onsubmit = (e) => {
    e.preventDefault();
    const p = $("#np1").value;
    if (p.length < 6) return toast("La contraseña tiene que tener al menos 6 caracteres.");
    if (p !== $("#np2").value) return toast("Las dos contraseñas no son iguales.");
    busy(e.target.querySelector("button.btn"), async () => {
      const { error } = await sb.auth.updateUser({ password: p });
      if (error) throw /different from the old/i.test(error.message) ? new Error("Escoge una contraseña diferente a la anterior.") : error;
      toast("¡Listo! Tu contraseña se cambió.");
      location.hash = "#/";
    });
  };
}

/* ---------- arranque ---------- */
(async () => {
  const { data } = await sb.auth.getSession();
  session = data.session;
  const fromRecovery = /type=recovery/.test(START_HASH);
  const linkErr = /error_description=([^&]+)/.exec(START_HASH);
  if (fromRecovery && session) history.replaceState(null, "", location.pathname + "#/clave");
  else if (/type=signup/.test(START_HASH) && session) { history.replaceState(null, "", location.pathname + "#/"); setTimeout(() => toast("¡Cuenta confirmada! Bienvenido al pulguero de bolsillo."), 400); }
  else if (linkErr) {
    history.replaceState(null, "", location.pathname + "#/entrar");
    setTimeout(() => toast(/expired|invalid/i.test(decodeURIComponent(linkErr[1])) ? "Ese enlace ya expiró o ya se usó. Pide otro desde Entrar." : "No se pudo abrir el enlace. Pide otro desde Entrar."), 300);
  }
  await Promise.all([loadMe(), loadFavs(), loadPrefs(), loadFollowing()]);
  let recovering = false;
  sb.auth.onAuthStateChange((ev, s) => {
    const had = !!session;
    session = s;
    if (ev === "PASSWORD_RECOVERY") { recovering = true; loadMe().then(() => (location.hash = "#/clave")); return; }
    if (had !== !!s) Promise.all([loadMe(), loadFavs(), loadPrefs(), loadFollowing()]).then(() => { if (!recovering) route(); });
  });
  window.addEventListener("hashchange", route);
  route();
})();
