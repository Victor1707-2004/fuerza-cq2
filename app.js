// ===== FUERZA (CQ)² - app.js =====

// --- LINKS 
const LINKS = {
  instagram: "https://www.instagram.com/fuerzaccqq/",
  whatsapp: "https://whatsapp.com/channel/0029VaVzdrW89ind1cM7Dy44",
  correo: "https://www.tiktok.com/@fuerzacq2",
};

// --- DOM refs ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const promedioInput = $("#promedioInput");
const btnCalcular = $("#btnCalcular");
const btnCopiar = $("#btnCopiar");
const btnCSV = $("#btnCSV");
const btnReset = $("#btnReset");
const resultadoValor = $("#resultadoValor");
const resultadoNota = $("#resultadoNota");

const rangoSelect = $("#rango");
const btnGenerarTabla = $("#btnGenerarTabla");
const tablaDinamica = $("#tablaDinamica tbody");

// --- Helpers ---
function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function round2(n){
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Fórmula del afiche:
// X = (7 - 0.4Y) / 0.6
function calcX(y){
  const x = (7 - 0.4 * y) / 0.6;
  return x;
}

function format(n){
  // siempre 2 decimales
  return round2(n).toFixed(2);
}

function setLinks(){
  $("#btnInstagram").href = LINKS.instagram;
  $("#btnWhatsApp").href = LINKS.whatsapp;
  $("#btnCorreo").href = LINKS.correo;
}

function setYear(){
  $("#year").textContent = new Date().getFullYear();
}

// --- Navbar mobile ---
function initNav(){
  const toggle = $("#navToggle");
  const links = $("#navLinks");

  function close(){
    links.classList.remove("show");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("show");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // cerrar al tocar un link
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") close();
  });

  // cerrar con Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

// --- Active link on scroll ---
function initActiveLinks(){
  const sections = $$("section[id]");
  const navLinks = $$("#navLinks a");

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
    });
  }, { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 });

  sections.forEach(s => io.observe(s));
}

// --- Reveal animations ---
function initReveal(){
  const items = $$(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(el => io.observe(el));
}

// --- Count-up stats ---
function initCounters(){
  const nums = $$("[data-count]");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = Number(el.getAttribute("data-count"));
      const duration = 800;
      const start = performance.now();

      function tick(t){
        const p = Math.min(1, (t - start) / duration);
        const val = Math.round(target * (0.15 + 0.85 * p));
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });

  nums.forEach(n => io.observe(n));
}

// --- Calculator logic ---
function showResult(y){
  const xRaw = calcX(y);
  const x = round2(xRaw);

  resultadoValor.textContent = `${format(x)}`;

  // Mensaje: advertir si sale fuera de 0-10
  if (x > 10){
    resultadoNota.textContent = "Resultado mayor a 10. Revisa el promedio ingresado o la política de tu materia.";
    resultadoNota.style.color = "rgba(255,91,107,.95)";
  } else if (x < 0){
    resultadoNota.textContent = "Resultado menor a 0. Revisa el promedio ingresado.";
    resultadoNota.style.color = "rgba(255,207,92,.95)";
  } else {
    resultadoNota.textContent = `Con Y = ${format(y)}, necesitas al menos X = ${format(x)} en el examen de recuperación.`;
    resultadoNota.style.color = "";
  }

  // Guardar último para tabla y CSV
  window.__lastY = y;
}

function parseY(){
  const y = Number(String(promedioInput.value).replace(",", "."));
  if (Number.isNaN(y)) return null;
  return y;
}

function validateY(y){
  if (y === null) return { ok:false, msg:"Ingresa un número." };
  if (y < 0 || y > 10) return { ok:false, msg:"El promedio debe estar entre 0 y 10." };
  return { ok:true, msg:"" };
}

function onCalcular(){
  const y = parseY();
  const v = validateY(y);
  if (!v.ok){
    resultadoValor.textContent = "—";
    resultadoNota.textContent = v.msg;
    resultadoNota.style.color = "rgba(255,207,92,.95)";
    return;
  }
  showResult(y);
}

function copyResult(){
  const text = resultadoValor.textContent.trim();
  if (!text || text === "—") return;

  const y = window.__lastY;
  const payload = y != null
    ? `Promedio (Y): ${format(y)} | Recuperación mínima (X): ${text}`
    : text;

  navigator.clipboard.writeText(payload).then(() => {
    btnCopiar.textContent = "Copiado ✓";
    setTimeout(() => (btnCopiar.textContent = "Copiar"), 900);
  }).catch(() => {
    // fallback
    alert("No se pudo copiar. Selecciona el resultado y copia manualmente.");
  });
}

function resetAll(){
  promedioInput.value = "";
  resultadoValor.textContent = "—";
  resultadoNota.textContent = "Ingresa un promedio para ver el resultado.";
  resultadoNota.style.color = "";
  tablaDinamica.innerHTML = `<tr><td class="muted" colspan="2">Aún no hay datos. Calcula tu promedio y genera la tabla.</td></tr>`;
  window.__lastY = null;
}

// --- Dynamic table generation ---
function buildRows(baseY, rango){
  // baseY: número, rango: ± en pasos 0.1
  const rows = [];
  const start = clamp(baseY - rango, 0, 10);
  const end = clamp(baseY + rango, 0, 10);

  // redondear a 1 decimal para iterar bonito
  const start1 = Math.round(start * 10) / 10;
  const end1 = Math.round(end * 10) / 10;

  for (let y = start1; y <= end1 + 1e-9; y = Math.round((y + 0.1) * 10) / 10){
    const x = round2(calcX(y));
    rows.push({ y: round2(y), x });
  }
  return rows;
}

function renderTable(rows, highlightY){
  if (!rows.length){
    tablaDinamica.innerHTML = `<tr><td class="muted" colspan="2">Sin datos.</td></tr>`;
    return;
  }
  tablaDinamica.innerHTML = rows.map(({y, x}) => {
    const is = Math.abs(y - highlightY) < 1e-9;
    const tag = is ? `<span class="tag">Tu Y</span>` : "";
    const xTxt = format(x);
    const warn = (x > 10 || x < 0);
    const style = warn ? ` style="color: rgba(255,91,107,.95); font-weight: 900;"` : "";
    return `
      <tr>
        <td><strong>${format(y)}</strong> ${tag}</td>
        <td${style}>${xTxt}</td>
      </tr>
    `;
  }).join("");
}

function generateTable(){
  const y = parseY();
  const v = validateY(y);
  if (!v.ok){
    resultadoNota.textContent = v.msg;
    resultadoNota.style.color = "rgba(255,207,92,.95)";
    return;
  }
  const rango = Number(rangoSelect.value);
  const rows = buildRows(y, rango);
  renderTable(rows, round2(y));
  window.__lastRows = rows;
}

// --- CSV download ---
function downloadCSV(){
  const rows = window.__lastRows;
  const y = window.__lastY;

  if (!rows || !rows.length){
    alert("Primero genera la tabla dinámica.");
    return;
  }

  const lines = [
    "Promedio (Y),Recuperación mínima (X)",
    ...rows.map(r => `${format(r.y)},${format(r.x)}`)
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  const name = y != null ? `tabla_recuperacion_Y_${format(y)}.csv` : "tabla_recuperacion.csv";
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

// --- Init ---
function init(){
  setLinks();
  setYear();
  initNav();
  initActiveLinks();
  initReveal();
  initCounters();

  btnCalcular.addEventListener("click", onCalcular);
  promedioInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCalcular();
  });

  btnCopiar.addEventListener("click", copyResult);
  btnReset.addEventListener("click", resetAll);

  // helper chips
  $$(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      promedioInput.value = btn.getAttribute("data-y");
      onCalcular();
    });
  });

  btnGenerarTabla.addEventListener("click", generateTable);
  btnCSV.addEventListener("click", downloadCSV);

  // primera demo (opcional): no auto-calcular para que el usuario vea vacío
  resetAll();
}

document.addEventListener("DOMContentLoaded", init);
