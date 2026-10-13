/* ============================================================
   CelularHub · lógica de la página
   - Lee los celulares desde api.php (MySQL) y se actualiza cada 30 s
   - Si no hay servidor (abres index.html directo), usa datos de respaldo
   ============================================================ */
"use strict";

const API = "api.php";
const REFRESH_MS = 30000;

/* Datos de respaldo: solo se usan si api.php no responde */
const FALLBACK = [
  {
    id: 1, slug: "iphone-15", name: "iPhone 15", brand: "Apple",
    tagline: "Fluido, con muy buena cámara y muchos años de soporte",
    description: "El iPhone de entrada de la generación 15, con USB-C, chip A16 Bionic y cámara principal de 48 MP.",
    material: "Aluminio y vidrio Ceramic Shield", os: "iOS", screen: '6.1" OLED, 60 Hz', processor: "Apple A16 Bionic",
    storage_gb: 128, ram_gb: 6, camera_mp: 48, cameras: 2, battery_mah: 3349, weight_g: 171,
    performance_score: 9, camera_score: 9, durability: 9, rating: 4.6, updates_years: 6, warranty_months: 12,
    price: 3600000, stock: 15, color: "#4f7cff", updated_at: "",
    pros: ["El chip A16 Bionic sigue siendo muy rápido.", "Cámara de 48 MP con muy buen video.", "Conserva bien su valor de reventa."],
    cons: ["Pantalla de 60 Hz.", "Carga lenta y sin cargador en la caja.", "Es el más caro de los tres."],
    links: [{ store: "Apple Colombia", url: "https://www.apple.com/co/iphone/" }, { store: "Mercado Libre", url: "https://listado.mercadolibre.com.co/iphone-15" }],
  },
  {
    id: 2, slug: "galaxy-s24", name: "Galaxy S24", brand: "Samsung",
    tagline: "Pantalla de 120 Hz y 7 años de actualizaciones",
    description: "El gama alta compacto de Samsung, con pantalla AMOLED de 120 Hz e inteligencia artificial integrada.",
    material: "Aluminio y vidrio Gorilla Glass Victus 2", os: "Android (One UI)", screen: '6.2" AMOLED, 120 Hz', processor: "Exynos 2400 (según región)",
    storage_gb: 256, ram_gb: 8, camera_mp: 50, cameras: 3, battery_mah: 4000, weight_g: 167,
    performance_score: 9, camera_score: 8.5, durability: 9, rating: 4.5, updates_years: 7, warranty_months: 12,
    price: 3400000, stock: 20, color: "#8a6df0", updated_at: "",
    pros: ["Pantalla AMOLED de 120 Hz muy brillante.", "7 años de actualizaciones.", "Compacto y liviano (167 g)."],
    cons: ["Carga rápida de solo 25 W.", "Batería de 4000 mAh, no destaca.", "Precio alto frente a la gama media."],
    links: [{ store: "Samsung Colombia", url: "https://www.samsung.com/co/smartphones/" }, { store: "Mercado Libre", url: "https://listado.mercadolibre.com.co/samsung-galaxy-s24" }],
  },
  {
    id: 3, slug: "redmi-note-13-pro", name: "Redmi Note 13 Pro", brand: "Xiaomi",
    tagline: "La opción económica con batería enorme y cámara de 200 MP",
    description: "El gama media más vendido de Xiaomi, con pantalla AMOLED de 120 Hz y carga de 67 W.",
    material: "Marco de plástico y vidrio frontal Gorilla Glass Victus", os: "Android (HyperOS)", screen: '6.67" AMOLED, 120 Hz', processor: "Snapdragon 7s Gen 2",
    storage_gb: 256, ram_gb: 8, camera_mp: 200, cameras: 3, battery_mah: 5100, weight_g: 187,
    performance_score: 6.5, camera_score: 7.5, durability: 6.5, rating: 4.3, updates_years: 4, warranty_months: 12,
    price: 1250000, stock: 35, color: "#14a898", updated_at: "",
    pros: ["Cuesta casi una tercera parte que los otros dos.", "Batería de 5100 mAh y carga de 67 W.", "Pantalla AMOLED de 120 Hz grande."],
    cons: ["Marco de plástico.", "Protección IP54, solo salpicaduras.", "Solo 4 años de actualizaciones de seguridad."],
    links: [{ store: "Xiaomi Colombia", url: "https://www.mi.com/co/" }, { store: "Mercado Libre", url: "https://listado.mercadolibre.com.co/redmi-note-13-pro" }],
  },
];

/* Filas del comparador.
   best: "max" o "min" decide qué celda se marca en verde; null = solo se muestra.
   bar: true dibuja una barra proporcional bajo el valor. */
const ROWS = [
  { key: "price", label: "Precio", fmt: (v) => money(v), best: "min", bar: true },
  { key: "material", label: "Materiales", fmt: (v) => esc(v) },
  { key: "screen", label: "Pantalla", fmt: (v) => esc(v) },
  { key: "processor", label: "Procesador", fmt: (v) => esc(v) },
  { key: "os", label: "Sistema", fmt: (v) => esc(v) },
  { key: "storage_gb", label: "Almacenamiento", fmt: (v) => `${v} GB`, best: "max", bar: true },
  { key: "ram_gb", label: "Memoria RAM", fmt: (v) => `${v} GB`, best: "max", bar: true },
  { key: "camera_mp", label: "Cámara principal", fmt: (v) => `${v} MP`, best: null, bar: true },
  { key: "camera_score", label: "Calidad de cámara (0 a 10)", fmt: (v) => `${v}`, best: "max", bar: true },
  { key: "battery_mah", label: "Batería", fmt: (v) => `${Number(v).toLocaleString("es-CO")} mAh`, best: "max", bar: true },
  { key: "weight_g", label: "Peso", fmt: (v) => `${v} g`, best: "min", bar: true },
  { key: "performance_score", label: "Rendimiento (0 a 10)", fmt: (v) => `${v}`, best: "max", bar: true },
  { key: "durability", label: "Resistencia (0 a 10)", fmt: (v) => `${v}`, best: "max", bar: true },
  { key: "rating", label: "Valoración de usuarios", fmt: (v) => `★ ${Number(v).toFixed(1)}`, best: "max", bar: true },
  { key: "updates_years", label: "Años de actualizaciones", fmt: (v) => `${v} años`, best: "max", bar: true },
  { key: "warranty_months", label: "Garantía", fmt: (v) => `${v} meses`, best: "max" },
];

/* Pesos del puntaje según lo que más le importe a la persona (cada fila suma 1) */
const WEIGHTS = {
  equilibrado: { price: .20, performance_score: .15, camera_score: .15, battery_mah: .15, durability: .10, rating: .10, updates_years: .10, storage_gb: .05 },
  precio:      { price: .50, performance_score: .10, camera_score: .10, battery_mah: .10, durability: .05, rating: .05, updates_years: .05, storage_gb: .05 },
  camara:      { price: .10, performance_score: .10, camera_score: .50, battery_mah: .05, durability: .05, rating: .10, updates_years: .05, storage_gb: .05 },
  bateria:     { price: .15, performance_score: .10, camera_score: .05, battery_mah: .50, durability: .05, rating: .05, updates_years: .05, storage_gb: .05 },
  rendimiento: { price: .10, performance_score: .45, camera_score: .10, battery_mah: .10, durability: .05, rating: .05, updates_years: .10, storage_gb: .05 },
  durabilidad: { price: .10, performance_score: .10, camera_score: .05, battery_mah: .05, durability: .35, rating: .10, updates_years: .25, storage_gb: 0 },
};
const LOWER_IS_BETTER = new Set(["price"]);
const PRIORITY_TEXT = {
  equilibrado: "buscas un poco de todo",
  precio: "quieres gastar poco",
  camara: "te importa la cámara",
  bateria: "te importa la batería",
  rendimiento: "quieres el mejor rendimiento",
  durabilidad: "quieres que dure muchos años",
};

let products = [];
let cart = loadCart();
let online = true;
let lastJson = "";
let heroDrawn = false;

/* ---------------- Utilidades ---------------- */
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
/* Solo deja pasar links http(s): evita que un dato de la base de datos ejecute código */
function safeUrl(u) {
  return /^https?:\/\//i.test(String(u)) ? String(u) : "#";
}
function safeColor(c) {
  return /^#[0-9a-f]{6}$/i.test(String(c)) ? c : "#4f7cff";
}
function safeSlug(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "");
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2600);
}
function loadCart() {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch (e) { return []; }
}
function saveCart() {
  try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) { /* sin almacenamiento */ }
}

/* ---------------- Tema: color de la página y modo oscuro ---------------- */
const root = document.documentElement;

function setAccent(name) {
  root.setAttribute("data-accent", name);
  try { localStorage.setItem("accent", name); } catch (e) { /* ignorar */ }
  document.querySelectorAll(".swatch").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.accent === name)));
}
function setTheme(name) {
  root.setAttribute("data-theme", name);
  try { localStorage.setItem("theme", name); } catch (e) { /* ignorar */ }
  const btn = $("btn-theme");
  btn.textContent = name === "dark" ? "☀️" : "🌙";
  btn.setAttribute("aria-label", name === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
}

/* ---------------- Datos ---------------- */
async function loadProducts() {
  try {
    const res = await fetch(API + "?action=products", { cache: "no-store" });
    const text = await res.text();
    const data = JSON.parse(text);
    if (!res.ok || !Array.isArray(data)) throw new Error((data && data.error) || "Respuesta inesperada");
    online = true;
    if (text === lastJson) { renderStatus(); return; }   // nada cambió: no redibujar
    lastJson = text;
    products = data;
  } catch (e) {
    online = false;
    if (!products.length) products = FALLBACK;
  }
  renderAll();
}

/* ---------------- Puntaje ---------------- */
function computeScores(list, priority) {
  const w = WEIGHTS[priority] || WEIGHTS.equilibrado;
  const total = new Map(list.map((p) => [p.id, 0]));
  for (const key of Object.keys(w)) {
    if (!w[key]) continue;
    const vals = list.map((p) => Number(p[key]) || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    for (const p of list) {
      let norm = max === min ? 1 : ((Number(p[key]) || 0) - min) / (max - min);
      if (LOWER_IS_BETTER.has(key) && max !== min) norm = 1 - norm;
      total.set(p.id, total.get(p.id) + norm * w[key]);
    }
  }
  const out = new Map();
  for (const [id, s] of total) out.set(id, Math.round(s * 100));
  return out;
}

/* ---------------- Dibujo del celular (solo CSS) ---------------- */
function phoneHTML(p) {
  const n = Math.min(Math.max(Number(p.cameras) || 2, 1), 4);
  return `<div class="phone" style="--pc:${safeColor(p.color)}" aria-hidden="true">
    <div class="cams n${n}">${"<i></i>".repeat(n)}</div></div>`;
}

function buyLinks(p) {
  if (!p.links || !p.links.length) return `<span class="muted small">Sin links de compra</span>`;
  return p.links.map((l) =>
    `<a class="buy-link" href="${esc(safeUrl(l.url))}" target="_blank" rel="noopener noreferrer">Comprar en ${esc(l.store)} ↗</a>`
  ).join("");
}

/* ---------------- Dibujo de la página ---------------- */
function renderAll() {
  const priority = $("priority").value;
  const scores = computeScores(products, priority);
  const winnerId = [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  renderStatus();
  renderHero();
  renderGrid(winnerId, priority);
  renderDetails();
  renderCompare(scores, winnerId, priority);
  renderCart();
}

function renderStatus() {
  const s = $("status");
  s.textContent = online
    ? "Conectado a MySQL: datos en vivo"
    : "Sin conexión con la base de datos: mostrando datos de respaldo";
  s.className = "status " + (online ? "ok" : "off");
  const latest = products.map((p) => p.updated_at).filter(Boolean).sort().pop();
  $("last-update").textContent = latest ? "Datos actualizados el " + String(latest).replace("T", " a las ") + "." : "";
}

function renderHero() {
  const el = $("hero-phones");
  el.innerHTML = products.slice(0, 3).map((p, i) => `
    <figure class="hp hp${i}">
      ${phoneHTML(p)}
      <figcaption><strong>${esc(p.name)}</strong><span>${money(p.price)}</span></figcaption>
    </figure>`).join("");
  if (!heroDrawn) {
    heroDrawn = true;
    el.classList.add("intro");
    setTimeout(() => el.classList.remove("intro"), 1600);
  }
}

function stockLabel(stock) {
  if (stock <= 0) return `<span class="stock out">Agotado</span>`;
  if (stock <= 10) return `<span class="stock low">Quedan ${stock} unidades</span>`;
  return `<span class="stock muted">${stock} unidades disponibles</span>`;
}

function renderGrid(winnerId, priority) {
  $("grid").innerHTML = products.map((p) => `
    <article class="card ${p.id === winnerId ? "top" : ""}" style="--pc:${safeColor(p.color)}">
      ${p.id === winnerId ? `<span class="ribbon">Mejor para ti</span>` : ""}
      <div class="card-visual">${phoneHTML(p)}</div>
      <div class="card-body">
        <span class="brand">${esc(p.brand)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="tagline">${esc(p.tagline)}</p>
        <div class="chips">
          <span class="chip">${p.storage_gb} GB</span>
          <span class="chip">${p.ram_gb} GB RAM</span>
          <span class="chip">${Number(p.battery_mah).toLocaleString("es-CO")} mAh</span>
        </div>
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          <span class="stars">★ ${Number(p.rating).toFixed(1)}</span>
        </div>
        ${stockLabel(p.stock)}
        <div class="card-actions">
          <a class="btn btn-ghost btn-sm" href="#detalle-${safeSlug(p.slug)}">Pros y contras</a>
          <button class="btn btn-primary btn-sm" data-add="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>Agregar al carrito</button>
        </div>
        <div class="buy-links">${buyLinks(p)}</div>
      </div>
    </article>`).join("");
}

function renderDetails() {
  const spec = (label, value) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
  $("details").innerHTML = products.map((p) => `
    <article class="detail" id="detalle-${safeSlug(p.slug)}" style="--pc:${safeColor(p.color)}">
      <div class="detail-visual">${phoneHTML(p)}</div>
      <div class="detail-main">
        <span class="brand">${esc(p.brand)}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description)}</p>
        <dl class="spec-list">
          ${spec("Pantalla", p.screen)}
          ${spec("Procesador", p.processor)}
          ${spec("Memoria", `${p.ram_gb} GB RAM y ${p.storage_gb} GB`)}
          ${spec("Cámara principal", `${p.camera_mp} MP (${p.cameras} lentes)`)}
          ${spec("Batería", `${Number(p.battery_mah).toLocaleString("es-CO")} mAh`)}
          ${spec("Peso", `${p.weight_g} g`)}
          ${spec("Materiales", p.material)}
          ${spec("Software", `${p.os}, ${p.updates_years} años de actualizaciones`)}
        </dl>
        <div class="proscons">
          <div class="pros">
            <h4>Lo bueno</h4>
            <ul>${(p.pros || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
          <div class="cons">
            <h4>Lo malo</h4>
            <ul>${(p.cons || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
        </div>
        <div class="detail-buy">
          <span>${money(p.price)}</span>
          <button class="btn btn-primary btn-sm" data-add="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>Agregar al carrito</button>
          <div class="buy-links">${buyLinks(p)}</div>
        </div>
      </div>
    </article>`).join("");
}

function barWidth(row, p) {
  const nums = products.map((x) => Number(x[row.key]) || 0);
  const v = Number(p[row.key]) || 0;
  if (!v) return 0;
  const pct = row.best === "min" ? (Math.min(...nums.filter(Boolean)) / v) * 100 : (v / Math.max(...nums)) * 100;
  return Math.max(4, Math.min(100, pct));
}

function renderCompare(scores, winnerId, priority) {
  const head = `<thead><tr><th scope="col"></th>${products.map((p) =>
    `<th scope="col">${esc(p.name)}<small>${esc(p.brand)}</small></th>`).join("")}</tr></thead>`;

  const body = ROWS.map((row) => {
    let bestVal = null;
    if (row.best) {
      const nums = products.map((p) => Number(p[row.key]));
      bestVal = row.best === "min" ? Math.min(...nums) : Math.max(...nums);
    }
    const allEqual = new Set(products.map((p) => p[row.key])).size === 1;
    const cells = products.map((p) => {
      const isBest = row.best && !allEqual && Number(p[row.key]) === bestVal;
      const bar = row.bar ? `<span class="mini-bar"><span style="width:${barWidth(row, p)}%"></span></span>` : "";
      return `<td class="${isBest ? "best" : ""}">${row.fmt(p[row.key])}${bar}</td>`;
    }).join("");
    return `<tr><th scope="row">${row.label}</th>${cells}</tr>`;
  }).join("");

  const maxScore = Math.max(...scores.values());
  const scoreRow = `<tr class="score"><th scope="row">Puntaje final</th>${products.map((p) => {
    const s = scores.get(p.id);
    return `<td class="${s === maxScore ? "best" : ""}"><span class="score-num">${s}<small> de 100</small></span>
      <span class="mini-bar"><span style="width:${s}%"></span></span></td>`;
  }).join("")}</tr>`;

  $("compare-table").innerHTML = head + `<tbody>${body}${scoreRow}</tbody>`;

  const w = products.find((p) => p.id === winnerId);
  $("verdict").innerHTML = w
    ? `Si ${PRIORITY_TEXT[priority]}, el mejor es el <strong>${esc(w.name)}</strong> con ${scores.get(w.id)} de 100 puntos.`
    : "";
}

/* ---------------- Carrito ---------------- */
function addToCart(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const line = cart.find((l) => l.id === id);
  if ((line ? line.qty : 0) >= p.stock) return toast("No quedan más unidades de este celular");
  if (line) line.qty++; else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  toast(`${p.name} agregado al carrito`);
}

function renderCart() {
  cart = cart.filter((l) => products.some((p) => p.id === l.id));
  $("cart-count").textContent = cart.reduce((a, l) => a + l.qty, 0);

  if (!cart.length) {
    $("cart-items").innerHTML = `<p class="muted" style="padding:16px 0">Tu carrito está vacío. Agrega un celular desde el catálogo.</p>`;
    $("cart-total").textContent = money(0);
    return;
  }
  let total = 0;
  $("cart-items").innerHTML = cart.map((l) => {
    const p = products.find((x) => x.id === l.id);
    total += p.price * l.qty;
    return `<div class="cart-line" style="--pc:${safeColor(p.color)}">
      <div class="cart-thumb" aria-hidden="true"></div>
      <div>
        <strong>${esc(p.name)}</strong>
        <div class="muted small">${money(p.price)} c/u</div>
        <div class="qty">
          <button data-dec="${p.id}" aria-label="Quitar una unidad">−</button>
          <span>${l.qty}</span>
          <button data-inc="${p.id}" aria-label="Agregar una unidad">+</button>
        </div>
      </div>
      <strong>${money(p.price * l.qty)}</strong>
    </div>`;
  }).join("");
  $("cart-total").textContent = money(total);
}

function changeQty(id, delta) {
  const line = cart.find((l) => l.id === id);
  const p = products.find((x) => x.id === id);
  if (!line || !p) return;
  line.qty += delta;
  if (line.qty > p.stock) { line.qty = p.stock; toast("Llegaste al máximo disponible"); }
  if (line.qty <= 0) cart = cart.filter((l) => l.id !== id);
  saveCart();
  renderCart();
}

/* ---------------- Paneles (carrito y admin) ---------------- */
function openPanel(el) {
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
  $("overlay").classList.add("open");
}
function closePanels() {
  for (const el of [$("cart-drawer"), $("admin-modal")]) {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }
  $("overlay").classList.remove("open");
}

/* ---------------- Admin ---------------- */
const ADMIN_FIELDS = [
  { key: "price", label: "Precio (COP)", step: "1000", max: "" },
  { key: "stock", label: "Stock", step: "1", max: "" },
  { key: "rating", label: "Valoración (0 a 5)", step: "0.1", max: "5" },
  { key: "durability", label: "Resistencia (0 a 10)", step: "0.5", max: "10" },
  { key: "battery_mah", label: "Batería (mAh)", step: "50", max: "" },
];

function renderAdmin() {
  $("admin-table").innerHTML = `
    <thead><tr><th>Celular</th>${ADMIN_FIELDS.map((f) => `<th>${f.label}</th>`).join("")}<th></th></tr></thead>
    <tbody>${products.map((p) => `
      <tr data-id="${p.id}">
        <td><strong>${esc(p.name)}</strong></td>
        ${ADMIN_FIELDS.map((f) => `<td><input type="number" min="0" ${f.max ? `max="${f.max}"` : ""} step="${f.step}" data-f="${f.key}" value="${esc(p[f.key])}" aria-label="${f.label} de ${esc(p.name)}"></td>`).join("")}
        <td><button class="btn btn-primary btn-sm" data-save="${p.id}">Guardar</button></td>
      </tr>`).join("")}</tbody>`;
}

async function saveProduct(id) {
  const row = document.querySelector(`#admin-table tr[data-id="${id}"]`);
  const msg = $("admin-msg");
  const payload = { admin_key: $("admin-key").value };
  row.querySelectorAll("input[data-f]").forEach((i) => { payload[i.dataset.f] = i.value; });

  if (!payload.admin_key) {
    msg.style.color = "var(--bad)";
    msg.textContent = "Escribe la clave de administrador para guardar.";
    return;
  }
  try {
    const res = await fetch(`${API}?action=update&id=${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({ error: "El servidor no respondió con datos válidos" }));
    if (!res.ok) throw new Error(data.error || "No se pudo guardar");
    msg.style.color = "var(--good)";
    msg.textContent = `Guardado: ${data.name} ya está actualizado en la base de datos.`;
    lastJson = "";
    await loadProducts();
    renderAdmin();
  } catch (e) {
    msg.style.color = "var(--bad)";
    msg.textContent = e instanceof TypeError
      ? "No hay conexión con el servidor. Abre la página desde http://localhost/ con Apache y MySQL encendidos en XAMPP."
      : e.message;
  }
}

/* ---------------- Eventos ---------------- */
document.addEventListener("click", (e) => {
  const sw = e.target.closest(".swatch");
  if (sw) return setAccent(sw.dataset.accent);
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.add) addToCart(Number(t.dataset.add));
  else if (t.dataset.inc) changeQty(Number(t.dataset.inc), 1);
  else if (t.dataset.dec) changeQty(Number(t.dataset.dec), -1);
  else if (t.dataset.save) saveProduct(Number(t.dataset.save));
});
$("btn-theme").addEventListener("click", () => setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"));
$("btn-cart").addEventListener("click", () => openPanel($("cart-drawer")));
$("cart-close").addEventListener("click", closePanels);
$("admin-close").addEventListener("click", closePanels);
$("overlay").addEventListener("click", closePanels);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanels(); });
$("btn-admin").addEventListener("click", () => { $("admin-msg").textContent = ""; renderAdmin(); openPanel($("admin-modal")); });
$("priority").addEventListener("change", renderAll);
$("cart-clear").addEventListener("click", () => { cart = []; saveCart(); renderCart(); });
$("cart-checkout").addEventListener("click", () => {
  if (!cart.length) return toast("Tu carrito está vacío");
  cart = []; saveCart(); renderCart(); closePanels();
  toast("Gracias. Es una demo: no se hizo ningún cobro.");
});

/* ---------------- Inicio ---------------- */
setTheme(root.getAttribute("data-theme") || "light");
setAccent(root.getAttribute("data-accent") || "blue");
loadProducts();
setInterval(() => {
  // No refrescar mientras el panel admin está abierto, para no pisar lo que se escribe
  if (!$("admin-modal").classList.contains("open")) loadProducts();
}, REFRESH_MS);
