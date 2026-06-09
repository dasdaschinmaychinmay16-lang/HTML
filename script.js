const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pointer = { x: 0, y: 0, nx: 0, ny: 0, targetX: 0, targetY: 0 };

if (!document.querySelector(".cursor-light")) {
  const cursorLight = document.createElement("div");
  cursorLight.className = "cursor-light";
  cursorLight.setAttribute("aria-hidden", "true");
  document.body.prepend(cursorLight);
}

document.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
  document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
});

// Navigation
document.querySelectorAll(".menu-toggle").forEach((toggle) => {
  const nav = document.getElementById(toggle.getAttribute("aria-controls"));
  if (!nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});

// Scroll reveals
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 5, 4) * 55}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("visible"));
}

// Add depth behavior to both the new components and existing inner-page cards.
const depthSelectors = [
  ".product-card",
  ".solution-detail",
  ".industry-detail",
  ".delivery-grid article",
  ".method-grid article",
  ".solution-card",
  ".industry-card",
  ".process-step",
  ".contact-card",
  ".contact-side article",
  ".freelancer-panel",
  ".registration-form",
  ".legal-panel",
  ".page-hero",
  ".freelancer-hero",
  ".legal-hero",
  ".live-graphic-section",
  ".page-cta"
].join(",");

document.querySelectorAll(depthSelectors).forEach((card) => {
  card.classList.add("tilt-card");
  if (!card.dataset.tilt) card.dataset.tilt = "3";
});

if (!prefersReducedMotion && matchMedia("(hover: hover)").matches) {
  document.querySelectorAll(".tilt-card").forEach((card) => {
    const amount = Number(card.dataset.tilt || 5);

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const localX = (event.clientX - rect.left) / rect.width;
      const localY = (event.clientY - rect.top) / rect.height;
      const rotateY = (localX - 0.5) * amount * 2;
      const rotateX = (0.5 - localY) * amount * 2;

      card.style.setProperty("--rx", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--ry", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--mx", `${(localX * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(localY * 100).toFixed(1)}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    });
  });

  document.querySelectorAll(".magnetic").forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
      item.style.setProperty("--magnetic-x", `${x}px`);
      item.style.setProperty("--magnetic-y", `${y}px`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--magnetic-x", "0px");
      item.style.setProperty("--magnetic-y", "0px");
    });
  });
}

// Animated metrics
document.querySelectorAll("[data-counter]").forEach((counter) => {
  const target = Number(counter.dataset.counter || 0);
  const duration = 1100;
  let started = false;

  const run = () => {
    if (started) return;
    started = true;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.round(target * eased));
      if (progress < 1 && !prefersReducedMotion) requestAnimationFrame(tick);
      else counter.textContent = String(target);
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        run();
        counterObserver.disconnect();
      }
    }, { threshold: 0.4 });
    counterObserver.observe(counter);
  } else {
    run();
  }
});

// Forms
function setupForm(formSelector, noteSelector, message) {
  const form = document.querySelector(formSelector);
  const note = document.querySelector(noteSelector);
  if (!form || !note) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    note.textContent = message;
    note.style.color = "#5be4ff";
    form.reset();
  });
}

setupForm(
  "#freelancer-form",
  "#form-note",
  "Profile received. We will match it against active delivery needs."
);
setupForm(
  "#contact-form",
  "#contact-note",
  "Enquiry received. We will review the operation and respond shortly."
);

// Interactive command selector
let commandMode = "sense";
const commandDescriptions = {
  sense: { label: "SENSE", accent: "#5be4ff" },
  think: { label: "THINK", accent: "#9d76ff" },
  simulate: { label: "SIMULATE", accent: "#2dd4bf" },
  act: { label: "ACT", accent: "#ffbf69" }
};

document.querySelectorAll(".command-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    commandMode = tab.dataset.command || "sense";
    document.querySelectorAll(".command-tab").forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-selected", String(selected));
    });

    const label = document.querySelector("[data-command-label]");
    if (label) {
      label.textContent = commandDescriptions[commandMode].label;
      label.style.color = commandDescriptions[commandMode].accent;
    }
  });
});

// Canvas 3D engine
const palette = {
  cyan: "#5be4ff",
  teal: "#2dd4bf",
  blue: "#578cff",
  violet: "#9d76ff",
  amber: "#ffbf69",
  coral: "#ff6b7d",
  white: "#f5fbff"
};

const focalLength = 520;

function rotatePoint(point, pitch, yaw, roll = 0) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  const cz = Math.cos(roll);
  const sz = Math.sin(roll);

  const x1 = point.x * cy - point.z * sy;
  const z1 = point.z * cy + point.x * sy;
  const y2 = point.y * cx - z1 * sx;
  const z2 = z1 * cx + point.y * sx;

  return {
    x: x1 * cz - y2 * sz,
    y: y2 * cz + x1 * sz,
    z: z2
  };
}

function projectPoint(point, width, height, camera = 470) {
  const scale = focalLength / (focalLength + point.z + camera);
  return {
    x: point.x * scale + width / 2,
    y: point.y * scale + height / 2,
    z: point.z,
    scale: Math.max(0.15, scale)
  };
}

function line(ctx, a, b, color, width = 1, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function glowDot(ctx, point, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = radius * 4;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(1, radius * point.scale), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCanvasGrid(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(91,228,255,0.035)";
  ctx.lineWidth = 1;
  const size = 44;
  for (let x = 0; x <= width; x += size) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += size) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWireSphere(ctx, width, height, time, options = {}) {
  const radius = options.radius || Math.min(width, height) * 0.29;
  const pitch = 0.24 + pointer.ny * 0.18;
  const yaw = time * 0.00024 + pointer.nx * 0.3;
  const color = options.color || palette.cyan;
  const centerY = options.centerY || 0;
  const rings = 8;
  const segments = 64;

  for (let ringIndex = 1; ringIndex < rings; ringIndex += 1) {
    const latitude = -Math.PI / 2 + (Math.PI / rings) * ringIndex;
    let previous = null;
    for (let segment = 0; segment <= segments; segment += 1) {
      const longitude = (segment / segments) * Math.PI * 2;
      const point = {
        x: Math.cos(latitude) * Math.cos(longitude) * radius,
        y: Math.sin(latitude) * radius + centerY,
        z: Math.cos(latitude) * Math.sin(longitude) * radius
      };
      const projected = projectPoint(rotatePoint(point, pitch, yaw), width, height);
      if (previous) line(ctx, previous, projected, color, 1, 0.14);
      previous = projected;
    }
  }

  for (let longitudeIndex = 0; longitudeIndex < 12; longitudeIndex += 1) {
    const longitude = (longitudeIndex / 12) * Math.PI * 2;
    let previous = null;
    for (let segment = 0; segment <= 36; segment += 1) {
      const latitude = -Math.PI / 2 + (segment / 36) * Math.PI;
      const point = {
        x: Math.cos(latitude) * Math.cos(longitude) * radius,
        y: Math.sin(latitude) * radius + centerY,
        z: Math.cos(latitude) * Math.sin(longitude) * radius
      };
      const projected = projectPoint(rotatePoint(point, pitch, yaw), width, height);
      if (previous) line(ctx, previous, projected, color, 1, 0.12);
      previous = projected;
    }
  }

  return { radius, pitch, yaw, centerY };
}

function drawOrbitingSignals(ctx, width, height, time, sphere, mode) {
  const accents = {
    sense: [palette.cyan, palette.blue, palette.teal],
    think: [palette.violet, palette.cyan, palette.coral],
    simulate: [palette.teal, palette.blue, palette.white],
    act: [palette.amber, palette.coral, palette.cyan]
  };
  const colors = accents[mode] || accents.sense;
  const elements = [];
  const count = mode === "think" ? 38 : 26;

  for (let i = 0; i < count; i += 1) {
    const longitude = (i / count) * Math.PI * 2 + time * (0.00018 + (i % 3) * 0.00002);
    const latitude = Math.sin(i * 2.17 + time * 0.0005) * 0.78;
    const orbitRadius = sphere.radius * (1.08 + (i % 4) * 0.09);
    const raw = {
      x: Math.cos(latitude) * Math.cos(longitude) * orbitRadius,
      y: Math.sin(latitude) * orbitRadius + sphere.centerY,
      z: Math.cos(latitude) * Math.sin(longitude) * orbitRadius
    };
    const rotated = rotatePoint(raw, sphere.pitch, sphere.yaw);
    elements.push({
      point: projectPoint(rotated, width, height),
      color: colors[i % colors.length],
      index: i
    });
  }

  elements.sort((a, b) => b.point.z - a.point.z);
  elements.forEach((element) => {
    glowDot(ctx, element.point, element.index % 7 === 0 ? 5 : 2.3, element.color, 0.9);
  });

  for (let i = 0; i < elements.length; i += 4) {
    const next = elements[(i + 5) % elements.length];
    line(ctx, elements[i].point, next.point, colors[i % colors.length], 0.8, 0.12);
  }
}

function drawCore(ctx, width, height, time, color, centerY = 0) {
  const center = projectPoint({ x: 0, y: centerY, z: 0 }, width, height);
  const pulse = 1 + Math.sin(time * 0.002) * 0.08;
  const radius = 24 * pulse;

  ctx.save();
  const gradient = ctx.createRadialGradient(center.x, center.y, 1, center.x, center.y, radius * 2.8);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.22, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 3; i += 1) {
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(time * 0.0004 * (i % 2 ? -1 : 1) + i);
    ctx.scale(1, 0.35 + i * 0.08);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.34 - i * 0.07;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 64 + i * 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawDataColumns(ctx, width, height, time, color) {
  const columns = 7;
  for (let x = -3; x <= 3; x += 1) {
    for (let z = -3; z <= 3; z += 1) {
      const wave = Math.sin(time * 0.0015 + x * 0.8 + z * 0.6);
      const columnHeight = 36 + (wave + 1) * 30;
      const base = rotatePoint({ x: x * 58, y: 82, z: z * 58 }, 0.72, time * 0.0002 + pointer.nx * 0.25);
      const top = rotatePoint({ x: x * 58, y: 82 - columnHeight, z: z * 58 }, 0.72, time * 0.0002 + pointer.nx * 0.25);
      const pBase = projectPoint(base, width, height);
      const pTop = projectPoint(top, width, height);
      line(ctx, pBase, pTop, color, 3.5 * pTop.scale, 0.35);
      if ((x + z + columns) % 3 === 0) glowDot(ctx, pTop, 3, palette.white, 0.9);
    }
  }
}

function drawFlowNetwork(ctx, width, height, time, color) {
  const nodes = [];
  const count = 34;
  const yaw = time * 0.00022 + pointer.nx * 0.35;
  const pitch = pointer.ny * 0.25;

  for (let i = 0; i < count; i += 1) {
    const raw = {
      x: Math.sin(i * 2.31) * 190,
      y: Math.cos(i * 1.73) * 165,
      z: Math.sin(i * 3.27) * 145
    };
    nodes.push({
      raw,
      point: projectPoint(rotatePoint(raw, pitch, yaw), width, height),
      index: i
    });
  }

  nodes.forEach((node, i) => {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const other = nodes[j];
      const dx = node.raw.x - other.raw.x;
      const dy = node.raw.y - other.raw.y;
      const dz = node.raw.z - other.raw.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < 105) line(ctx, node.point, other.point, color, 0.8, (1 - distance / 105) * 0.35);
    }
  });

  nodes.sort((a, b) => b.point.z - a.point.z).forEach((node) => {
    glowDot(ctx, node.point, node.index % 6 === 0 ? 4.4 : 2, node.index % 5 === 0 ? palette.violet : color, 0.9);
  });
}

function drawTwinCube(ctx, width, height, time, color) {
  const size = Math.min(width, height) * 0.25;
  const vertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
  ].map(([x, y, z]) => {
    const rotated = rotatePoint(
      { x: x * size, y: y * size, z: z * size },
      -0.4 + pointer.ny * 0.2,
      time * 0.00035 + pointer.nx * 0.3
    );
    return projectPoint(rotated, width, height);
  });

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7]
  ];
  edges.forEach(([a, b]) => line(ctx, vertices[a], vertices[b], color, 1.5, 0.5));
  vertices.forEach((vertex, index) => glowDot(ctx, vertex, index % 3 === 0 ? 4 : 2, color, 0.95));
  drawCore(ctx, width, height, time, color);
}

function updateReadout(container, time) {
  const confidence = container.querySelector('[data-live-value="confidence"]');
  const risk = container.querySelector('[data-live-value="risk"]');
  const flow = container.querySelector('[data-live-value="flow"]');
  const pulse = container.querySelector('[data-live-value="pulse"]');

  if (confidence) confidence.textContent = `${Math.round(94 + Math.sin(time * 0.0012) * 3)}%`;
  if (risk) risk.textContent = `${Math.round(17 + Math.cos(time * 0.0011) * 5)}%`;
  if (flow) flow.textContent = Math.sin(time * 0.002) > 0 ? "Live" : "Sync";
  if (pulse) pulse.textContent = Math.sin(time * 0.003) > 0 ? "On" : "Run";
}

function initLiveGraphic(container) {
  const canvas = container.querySelector("canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const mode = container.dataset.liveGraphic || "operations";
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(280, rect.width);
    height = Math.max(280, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(time = 0) {
    pointer.nx += (pointer.targetX - pointer.nx) * 0.045;
    pointer.ny += (pointer.targetY - pointer.ny) * 0.045;
    ctx.clearRect(0, 0, width, height);
    drawCanvasGrid(ctx, width, height);

    if (mode === "products") {
      drawDataColumns(ctx, width, height, time, palette.cyan);
    } else if (mode === "solutions" || mode === "industries") {
      drawFlowNetwork(ctx, width, height, time, mode === "solutions" ? palette.violet : palette.teal);
    } else if (mode === "contact") {
      drawFlowNetwork(ctx, width, height, time, palette.amber);
      drawCore(ctx, width, height, time, palette.amber);
    } else if (mode === "command") {
      const active = commandDescriptions[commandMode];
      if (commandMode === "think") {
        drawFlowNetwork(ctx, width, height, time, active.accent);
        drawCore(ctx, width, height, time, active.accent);
      } else if (commandMode === "simulate") {
        drawTwinCube(ctx, width, height, time, active.accent);
      } else if (commandMode === "act") {
        drawDataColumns(ctx, width, height, time, active.accent);
        drawCore(ctx, width, height, time, active.accent);
      } else {
        const sphere = drawWireSphere(ctx, width, height, time, { color: active.accent });
        drawOrbitingSignals(ctx, width, height, time, sphere, commandMode);
        drawCore(ctx, width, height, time, active.accent);
      }
    } else {
      const sphere = drawWireSphere(ctx, width, height, time, { color: palette.cyan });
      drawOrbitingSignals(ctx, width, height, time, sphere, "sense");
      drawCore(ctx, width, height, time, palette.cyan);
    }

    updateReadout(container, time);
    if (!prefersReducedMotion && visible) frame = requestAnimationFrame(render);
  }

  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver((entries) => {
      const nextVisible = entries[0].isIntersecting;
      if (nextVisible && !visible && !prefersReducedMotion) {
        visible = true;
        frame = requestAnimationFrame(render);
      } else if (!nextVisible) {
        visible = false;
        cancelAnimationFrame(frame);
      }
    }, { rootMargin: "160px" });
    visibilityObserver.observe(container);
  }

  render(0);
}

document.querySelectorAll(".live-graphic").forEach(initLiveGraphic);
