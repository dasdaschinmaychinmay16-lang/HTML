// ── Navigation ──────────────────────────────────────────────────────────────
const menuToggles = document.querySelectorAll(".menu-toggle");
menuToggles.forEach((menuToggle) => {
  const navId = menuToggle.getAttribute("aria-controls");
  const nav = navId ? document.getElementById(navId) : null;
  if (!nav) return;
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
});

// ── Scroll reveal ────────────────────────────────────────────────────────────
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// ── Forms ────────────────────────────────────────────────────────────────────
const freelancerForm = document.querySelector("#freelancer-form");
const formNote = document.querySelector("#form-note");
if (freelancerForm && formNote) {
  freelancerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formNote.textContent = "Thank you. Your registration has been received and our team will review it shortly.";
    freelancerForm.reset();
  });
}
const contactForm = document.querySelector("#contact-form");
const contactNote = document.querySelector("#contact-note");
if (contactForm && contactNote) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    contactNote.textContent = "Thank you. Your enquiry has been received and our team will review it shortly.";
    contactForm.reset();
  });
}

// ── Canvas live graphics ─────────────────────────────────────────────────────
const liveGraphics = document.querySelectorAll(".live-graphic");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const P = {
  ink:   "#17202a",
  soft:  "#53616f",
  muted: "#71808f",
  line:  "#d9e2ea",
  page:  "#f7f9fb",
  teal:  "#0f766e",
  blue:  "#2563eb",
  coral: "#e85d4f",
  gold:  "#c0840f",
  white: "#ffffff"
};

// ── Drawing primitives ───────────────────────────────────────────────────────

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x,     y + h, rad);
  ctx.arcTo(x,     y + h, x,     y,     rad);
  ctx.arcTo(x,     y,     x + w, y,     rad);
  ctx.closePath();
}

// Keep alias used by updateReadout path
function roundedRect(ctx, x, y, w, h, r) { rr(ctx, x, y, w, h, r); }

function backdrop(ctx, w, h) {
  ctx.fillStyle = "#f7f9fb";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(217,226,234,0.5)";
  ctx.lineWidth = 1;
  const gs = 32;
  for (let x = 0; x < w + gs; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h + gs; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

function card(ctx, x, y, w, h, { bg = P.white, stroke = "rgba(217,226,234,0.9)", sw = 1.5, radius = 8 } = {}) {
  rr(ctx, x, y, w, h, radius);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = sw;
  ctx.stroke();
}

function accentBar(ctx, x, y, w, color) {
  rr(ctx, x, y, w, 4, 3);
  ctx.fillStyle = color;
  ctx.fill();
}

function txt(ctx, x, y, text, { size = 11, weight = "700", font = "Manrope", color = P.soft, align = "left", max } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (max) ctx.fillText(text, x, y, max);
  else ctx.fillText(text, x, y);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function dot(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function connectorLine(ctx, x1, y1, x2, y2, color, dashed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (dashed) ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);

  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4));
  ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
}

// ── Reusable components ───────────────────────────────────────────────────────

function kpiCard(ctx, x, y, w, h, title, value, detail, color) {
  card(ctx, x, y, w, h);
  accentBar(ctx, x, y, w, color);
  txt(ctx, x + 12, y + 18, title.toUpperCase(), { size: 9, color: P.muted });
  txt(ctx, x + 12, y + 38, value, { size: 19, weight: "800", font: "Sora", color: P.ink });
  txt(ctx, x + 12, y + 57, detail, { size: 9.5, color, max: w - 20 });
}

function lineChart(ctx, x, y, w, h, color, t, phase = 0, title = "") {
  card(ctx, x, y, w, h);
  const th = title ? 22 : 0;
  if (title) txt(ctx, x + 12, y + 12, title, { size: 10.5, color: P.soft });

  const cx = x + 12, cy = y + th + 6, cw = w - 24, ch = h - th - 18;

  ctx.strokeStyle = "rgba(217,226,234,0.7)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const gy = cy + (ch / 3) * i;
    ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx + cw, gy); ctx.stroke();
  }

  ctx.beginPath();
  const pts = 40;
  for (let i = 0; i <= pts; i++) {
    const px = cx + (cw / pts) * i;
    const py = cy + ch * 0.52
      - Math.sin(i * 0.44 + t * 0.003 + phase) * ch * 0.27
      - Math.sin(i * 1.15 + t * 0.002 + phase * 0.7) * ch * 0.09;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.lineTo(cx + cw, cy + ch);
  ctx.lineTo(cx, cy + ch);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.08;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function statusRow(ctx, x, y, w, name, value, color, online) {
  card(ctx, x, y, w, 30, { radius: 6 });
  dot(ctx, x + 15, y + 15, 5, online ? color : P.line);
  txt(ctx, x + 28, y + 15, name, { size: 11, weight: "600", color: P.ink });
  txt(ctx, x + w - 10, y + 15, value, { size: 10.5, weight: "700", color: online ? color : P.muted, align: "right" });
}

function progressBar(ctx, x, y, w, name, pct, color, t, phase = 0) {
  card(ctx, x, y, w, 42, { radius: 6 });
  txt(ctx, x + 12, y + 13, name, { size: 11, color: P.ink, max: w * 0.68 });
  txt(ctx, x + w - 10, y + 13, Math.round(pct) + "%", { size: 11, color, align: "right" });

  rr(ctx, x + 12, y + 24, w - 24, 8, 4);
  ctx.fillStyle = "rgba(217,226,234,0.55)"; ctx.fill();

  const animated = Math.min(1, pct / 100 + Math.sin(t * 0.002 + phase) * 0.025);
  rr(ctx, x + 12, y + 24, Math.max(6, (w - 24) * animated), 8, 4);
  ctx.fillStyle = color; ctx.fill();
}

function pipeStep(ctx, x, y, w, h, num, title, color, active) {
  card(ctx, x, y, w, h, {
    bg: active ? color : P.white,
    stroke: active ? color : "rgba(217,226,234,0.9)",
    sw: active ? 0 : 1.5
  });
  rr(ctx, x + 10, y + (h - 26) / 2, 26, 26, 6);
  ctx.fillStyle = active ? "rgba(255,255,255,0.22)" : color; ctx.fill();
  txt(ctx, x + 23, y + h / 2, num, { size: 11, weight: "800", font: "Sora", color: P.white, align: "center" });
  txt(ctx, x + 44, y + h / 2, title, { size: 12, weight: "700", color: active ? P.white : P.ink });
}

function sectorTile(ctx, x, y, w, h, name, detail, color) {
  card(ctx, x, y, w, h);
  rr(ctx, x, y + 10, 4, h - 20, 2);
  ctx.fillStyle = color; ctx.fill();
  txt(ctx, x + 14, y + 22, name, { size: 11.5, weight: "700", color: P.ink });
  txt(ctx, x + 14, y + 38, detail, { size: 9.5, color: P.soft, max: w - 20 });
}

function skillRow(ctx, x, y, w, skill, count, pct, color, t, ph = 0) {
  card(ctx, x, y, w, 42, { radius: 6 });
  txt(ctx, x + 12, y + 13, skill, { size: 11, weight: "700", color: P.ink });
  txt(ctx, x + w - 10, y + 13, count, { size: 10, color, align: "right" });

  rr(ctx, x + 12, y + 25, w - 24, 8, 4);
  ctx.fillStyle = "rgba(217,226,234,0.5)"; ctx.fill();

  const fill = (w - 24) * Math.min(1, pct + Math.sin(t * 0.002 + ph) * 0.025);
  rr(ctx, x + 12, y + 25, Math.max(6, fill), 8, 4);
  ctx.fillStyle = color; ctx.fill();
}

function inputPill(ctx, x, y, w, h, text, color) {
  card(ctx, x, y, w, h, { stroke: color, sw: 2 });
  txt(ctx, x + w / 2, y + h / 2, text, { size: 11, weight: "700", color, align: "center" });
}

function outputCard(ctx, x, y, w, h, title, detail, color) {
  card(ctx, x, y, w, h);
  accentBar(ctx, x, y, w, color);
  txt(ctx, x + w / 2, y + 20, title, { size: 11, weight: "800", font: "Sora", color: P.ink, align: "center" });
  txt(ctx, x + w / 2, y + 36, detail, { size: 9, color: P.soft, align: "center", max: w - 12 });
}

// ── Page draw functions ───────────────────────────────────────────────────────

function drawOperations(ctx, w, h, t) {
  const mg = 12;
  const col3 = (w - mg * 4) / 3;

  // KPI row
  kpiCard(ctx, mg, mg, col3, 66,
    "OEE Score", `${(93 + Math.sin(t * 0.001) * 1.4).toFixed(1)}%`, "↑ 1.8% vs last week", P.teal);
  kpiCard(ctx, mg * 2 + col3, mg, col3, 66,
    "Uptime", "99.1 h", "Rolling 7-day window", P.blue);
  kpiCard(ctx, mg * 3 + col3 * 2, mg, col3, 66,
    "Active Alerts", `${Math.sin(t * 0.0008) > 0.2 ? 2 : 3}`, "1 requires action", P.coral);

  // Line chart
  const chartY = mg + 66 + mg;
  lineChart(ctx, mg, chartY, w - mg * 2, 84, P.teal, t, 0, "Machine performance signal");

  // Status rows
  const sy = chartY + 84 + mg;
  statusRow(ctx, mg, sy,      w - mg * 2, "CNC Line A",   "Online — 98.4%",  P.teal,  true);
  statusRow(ctx, mg, sy + 36, w - mg * 2, "Press Unit B", "Standby — 87.2%", P.gold,  true);
  statusRow(ctx, mg, sy + 72, w - mg * 2, "Conveyor C",   "Offline",          P.coral, false);

  // Secondary signal if space allows
  const sigY = sy + 108 + mg;
  if (sigY + 32 < h - mg) {
    lineChart(ctx, mg, sigY, w - mg * 2, Math.max(32, h - sigY - mg), P.blue, t, 1.8);
  }
}

function drawProducts(ctx, w, h, t) {
  const mg = 12;
  const col2 = (w - mg * 3) / 2;
  const items = [
    { label: "Predictive Maintenance AI", pct: 82, color: P.teal,  ph: 0   },
    { label: "Digital Twin Studio",       pct: 76, color: P.coral, ph: 0.5 },
    { label: "Process Intelligence",      pct: 64, color: P.blue,  ph: 1.0 },
    { label: "Quality Vision & AI",       pct: 71, color: P.gold,  ph: 1.5 },
    { label: "Workflow Automation Bots",  pct: 88, color: P.teal,  ph: 2.0 },
    { label: "Operations Command Center", pct: 59, color: P.blue,  ph: 2.5 }
  ];

  const barH = 42;
  items.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = mg + col * (col2 + mg);
    const y = mg + row * (barH + mg);
    progressBar(ctx, x, y, col2, item.label, item.pct, item.color, t, item.ph);
  });

  const chartY = mg + 3 * (barH + mg);
  if (chartY + 36 < h - mg) {
    lineChart(ctx, mg, chartY, w - mg * 2, Math.max(36, h - chartY - mg), P.teal, t, 0.4, "Live module activity");
  }
}

function drawSolutions(ctx, w, h, t) {
  const mg = 12;
  const steps = [
    { num: "01", label: "Assess  — workflow audit & data readiness", color: P.ink },
    { num: "02", label: "Design  — AI/ML, twin & automation plan",   color: P.teal },
    { num: "03", label: "Build   — systems, dashboards & models",    color: P.blue },
    { num: "04", label: "Improve — tune, train users & scale",       color: P.coral }
  ];
  const active = Math.floor((t * 0.00035) % steps.length);
  const stepH = 44;

  steps.forEach((s, i) => {
    const y = mg + i * (stepH + mg);
    pipeStep(ctx, mg, y, w - mg * 2, stepH, s.num, s.label, s.color, i === active);

    if (i < steps.length - 1) {
      const lineX = mg + 23;
      const lineY1 = y + stepH;
      const lineY2 = y + stepH + mg;
      ctx.strokeStyle = i < active ? s.color : P.line;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lineX, lineY1); ctx.lineTo(lineX, lineY2); ctx.stroke();
    }
  });

  const chartY = mg + steps.length * (stepH + mg);
  if (chartY + 36 < h - mg) {
    lineChart(ctx, mg, chartY, w - mg * 2, Math.max(36, h - chartY - mg), P.teal, t, 0.7, "Delivery progress signal");
  }
}

function drawIndustries(ctx, w, h, t) {
  const mg = 12;
  const col2 = (w - mg * 3) / 2;
  const sectors = [
    { name: "Manufacturing", detail: "Predictive maintenance · OEE",   color: P.teal  },
    { name: "Logistics",     detail: "Route planning · Dispatch AI",    color: P.blue  },
    { name: "Healthcare",    detail: "Scheduling · Documentation",      color: P.coral },
    { name: "Retail",        detail: "Demand forecast · Inventory",     color: P.gold  },
    { name: "Finance",       detail: "Reconciliation · Risk detection", color: P.teal  },
    { name: "Education",     detail: "Admissions · Engagement AI",      color: P.blue  }
  ];
  const tileH = 52;

  sectors.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    sectorTile(ctx, mg + col * (col2 + mg), mg + row * (tileH + mg), col2, tileH, s.name, s.detail, s.color);
  });

  const chartY = mg + 3 * (tileH + mg);
  if (chartY + 36 < h - mg) {
    lineChart(ctx, mg, chartY, w - mg * 2, Math.max(36, h - chartY - mg), P.coral, t, 1.1, "Cross-sector signal");
  }
}

function drawFreelancers(ctx, w, h, t) {
  const mg = 12;
  const skills = [
    { skill: "AI & ML Engineering",    count: "8 specialists", pct: 0.82, color: P.teal,  ph: 0.0 },
    { skill: "Digital Twin Design",    count: "5 specialists", pct: 0.68, color: P.coral, ph: 0.6 },
    { skill: "Data Science",           count: "6 specialists", pct: 0.74, color: P.blue,  ph: 1.2 },
    { skill: "Process Consulting",     count: "7 specialists", pct: 0.78, color: P.gold,  ph: 1.8 },
    { skill: "API & Integration Eng.", count: "5 specialists", pct: 0.64, color: P.blue,  ph: 2.4 }
  ];
  const rowH = 42;

  skills.forEach((s, i) => {
    skillRow(ctx, mg, mg + i * (rowH + mg), w - mg * 2, s.skill, s.count, s.pct, s.color, t, s.ph);
  });

  const chartY = mg + skills.length * (rowH + mg);
  if (chartY + 36 < h - mg) {
    lineChart(ctx, mg, chartY, w - mg * 2, Math.max(36, h - chartY - mg), P.gold, t, 2.2);
  }
}

function drawContact(ctx, w, h, t) {
  const mg = 12;
  const cw  = w - mg * 2;

  // Source header
  card(ctx, mg, mg, cw, 32, { stroke: P.teal, sw: 2 });
  accentBar(ctx, mg, mg, cw, P.teal);
  txt(ctx, w / 2, mg + 18, "Your challenge: downtime · quality · manual work · reporting", {
    size: 9.5, weight: "600", color: P.soft, align: "center", max: cw - 20
  });

  // Three input pills
  const pillW = (cw - mg * 2) / 3;
  const pillY = mg + 32 + mg;
  const inputs = [
    { label: "Downtime",    color: P.teal  },
    { label: "Quality",     color: P.blue  },
    { label: "Reporting",   color: P.coral }
  ];
  inputs.forEach((inp, i) => {
    const px = mg + i * (pillW + mg);
    inputPill(ctx, px, pillY, pillW, 28, inp.label, inp.color);
  });

  // Convergence lines from pills to discovery
  const discY = pillY + 28 + mg + 24;
  const discX = mg + cw * 0.2;
  const discW = cw * 0.6;
  inputs.forEach((inp, i) => {
    const fromX = mg + i * (pillW + mg) + pillW / 2;
    const fromY = pillY + 28;
    connectorLine(ctx, fromX, fromY, discX + discW / 2, discY, inp.color, true);
  });

  // Discovery box
  card(ctx, discX, discY, discW, 36, { bg: P.ink, stroke: P.ink });
  txt(ctx, w / 2, discY + 18, "Discovery call", { size: 13, weight: "800", font: "Sora", color: P.white, align: "center" });

  // Output track cards
  const trkY = discY + 36 + mg + 20;
  const trkW = (cw - mg * 3) / 4;
  const routes = [
    { title: "AI / ML",      detail: "Prediction",   color: P.teal  },
    { title: "Digital Twin", detail: "Simulation",   color: P.coral },
    { title: "Consulting",   detail: "Strategy",     color: P.blue  },
    { title: "Build",        detail: "Delivery",     color: P.gold  }
  ];
  routes.forEach((r, i) => {
    const cx = mg + i * (trkW + mg) + trkW / 2;
    connectorLine(ctx, w / 2, discY + 36, cx, trkY, r.color, true);
    outputCard(ctx, mg + i * (trkW + mg), trkY, trkW, 46, r.title, r.detail, r.color);
  });

  // Signal
  const sigY = trkY + 46 + mg;
  if (sigY + 32 < h - mg) {
    lineChart(ctx, mg, sigY, cw, Math.max(32, h - sigY - mg), P.teal, t, 0.3);
  }
}

// ── Readout updater ──────────────────────────────────────────────────────────

function updateReadout(container, mode, time) {
  const confidence = container.querySelector('[data-live-value="confidence"]');
  const risk       = container.querySelector('[data-live-value="risk"]');
  if (confidence) confidence.textContent = `${Math.round(91 + Math.sin(time * 0.001) * 4)}%`;
  if (risk)       risk.textContent       = `${Math.round(18 + Math.cos(time * 0.0014) * 6)}%`;

  const flow  = container.querySelector('[data-live-value="flow"]');
  const pulse = container.querySelector('[data-live-value="pulse"]');
  if (flow)  flow.textContent  = Math.sin(time * 0.004) > 0 ? "Live" : "Sync";
  if (pulse) pulse.textContent = Math.sin(time * 0.004) > 0 ? "On"   : "Run";
}

// ── Canvas init ──────────────────────────────────────────────────────────────

function initLiveGraphic(container) {
  const canvas = container.querySelector("canvas");
  if (!canvas) return;

  const ctx  = canvas.getContext("2d");
  const mode = container.dataset.liveGraphic || "operations";
  let width = 0, height = 0, frameId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    width  = Math.max(280, rect.width);
    height = Math.max(280, rect.height);
    canvas.width  = Math.round(width  * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.logicalWidth  = width;
    ctx.logicalHeight = height;
  }

  const drawByMode = {
    operations:  drawOperations,
    products:    drawProducts,
    solutions:   drawSolutions,
    industries:  drawIndustries,
    freelancers: drawFreelancers,
    contact:     drawContact
  };

  function render(time) {
    ctx.clearRect(0, 0, width, height);
    backdrop(ctx, width, height);
    (drawByMode[mode] || drawOperations)(ctx, width, height, time);
    updateReadout(container, mode, time);
    if (!prefersReducedMotion) frameId = requestAnimationFrame(render);
  }

  resize();
  window.addEventListener("resize", resize);
  render(0);

  return () => {
    if (frameId) cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
  };
}

liveGraphics.forEach(initLiveGraphic);
