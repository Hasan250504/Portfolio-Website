(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ------------------------------------------------------------
     Sections (= buildings), in skyline order
     ------------------------------------------------------------ */
  const BUILDINGS = [
    { id: "about",          num: "01", name: "About",        x: 70,   w: 170, h: 220, kind: "house" },
    { id: "education",      num: "02", name: "Education",    x: 285,  w: 230, h: 175, kind: "university" },
    { id: "experience",     num: "03", name: "Experience",   x: 565,  w: 140, h: 380, kind: "tower" },
    { id: "projects",       num: "04", name: "Projects",     x: 750,  w: 250, h: 300, kind: "workshop" },
    { id: "skills",         num: "05", name: "Skills",       x: 1045, w: 160, h: 330, kind: "watertower" },
    { id: "certifications", num: "06", name: "Certificates", x: 1250, w: 150, h: 270, kind: "archive" },
    { id: "contact",        num: "07", name: "Contact",      x: 1440, w: 115, h: 175, kind: "mast" },
  ];

  /* ------------------------------------------------------------
     Day / night theme
     ------------------------------------------------------------ */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const pktHour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Karachi" }).format(new Date()));
  let night = store.get("theme") ? store.get("theme") === "night" : (pktHour < 6 || pktHour >= 18);
  const themeBtn = document.getElementById("theme-toggle");
  let city = null;

  const applyTheme = () => {
    root.dataset.theme = night ? "night" : "day";
    themeBtn.setAttribute("aria-pressed", String(night));
    if (city) city.setNight(night);
  };
  applyTheme();
  themeBtn.addEventListener("click", () => {
    night = !night;
    store.set("theme", night ? "night" : "day");
    applyTheme();
  });

  /* ------------------------------------------------------------
     Renderer: 3D city, or 2D skyline fallback
     ------------------------------------------------------------ */
  const cityEl = document.getElementById("city");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (window.City3D && window.City3D.supported()) {
    try {
      city = window.City3D.init({
        container: document.getElementById("stage"),
        labelLayer: document.getElementById("labels"),
        landmarks: BUILDINGS,
        night,
        reduceMotion,
        onSelect: (id) => go(id),
        onHover: (id, on) => setDirHot(id, on),
      });
      cityEl.classList.add("is-3d");
      document.getElementById("hint-desk").textContent = "Drag to orbit · Scroll to zoom · Click a building";
      document.getElementById("hint-mobile").textContent = "Drag to orbit · Pinch to zoom · Tap a building";
    } catch (err) {
      console.error("3D city failed, using 2D skyline", err);
      city = null;
      document.getElementById("stage").innerHTML = "";
      document.getElementById("labels").innerHTML = "";
    }
  }
  if (!city) init2D();

  /* ---------- 2D skyline (fallback) ---------- */
  function init2D() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const GROUND = 640;
    let seed = 20031;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const wrap = document.getElementById("skyline-wrap");
    wrap.hidden = false;

    const el = (tag, attrs = {}, parent) => {
      const node = document.createElementNS(SVG_NS, tag);
      for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
      if (parent) parent.appendChild(node);
      return node;
    };

    const stars = document.getElementById("stars");
    for (let i = 0; i < 70; i++) {
      const s = el("circle", {
        cx: (620 + rand() * 980).toFixed(1), cy: (10 + rand() * 300).toFixed(1), r: (0.6 + rand() * 1.1).toFixed(2),
        class: rand() > 0.6 ? "star star--twinkle" : "star",
        opacity: (0.25 + rand() * 0.6).toFixed(2),
      }, stars);
      s.style.animationDelay = `${(rand() * 4).toFixed(2)}s`;
    }
    const moon = el("g", { transform: "translate(1340 92)" }, stars);
    el("mask", { id: "moon-cut" }, moon).innerHTML =
      '<rect x="-40" y="-40" width="80" height="80" fill="#fff"/><circle cx="11" cy="-7" r="24" fill="#000"/>';
    el("circle", { r: 26, class: "star", mask: "url(#moon-cut)" }, moon);

    const backdrop = document.getElementById("backdrop");
    let bx = -10;
    while (bx < 1600) {
      const w = 40 + rand() * 80;
      const maxH = bx < 560 ? 160 : 300;
      const h = 60 + rand() * (maxH - 60);
      el("rect", { x: bx.toFixed(1), y: (GROUND - h).toFixed(1), width: w.toFixed(1), height: h.toFixed(1), class: "bg-building" }, backdrop);
      for (let wy = GROUND - h + 12; wy < GROUND - 10; wy += 16) {
        for (let wx = bx + 8; wx < bx + w - 10; wx += 12) {
          if (rand() > 0.82) el("rect", { x: wx.toFixed(1), y: wy.toFixed(1), width: 4, height: 6, class: "bg-win" }, backdrop);
        }
      }
      bx += w + rand() * 18 - 6;
    }

    const draw = {
      house(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        const peak = top - 62;
        el("polygon", { points: `${x - 10},${top} ${x + w / 2},${peak} ${x + w + 10},${top}`, class: "bldg__shape" }, g);
        el("circle", { cx: x + w / 2, cy: top - 24, r: 10, class: "bldg__line" }, g);
        el("circle", { cx: x + w / 2, cy: top - 24, r: 5, class: "win" }, g);
        el("rect", { x: x + w * 0.72, y: top - 52, width: 16, height: 30, class: "bldg__shape" }, g);
        el("rect", { x: x + w / 2 - 12, y: GROUND - 34, width: 24, height: 34, class: "bldg__line" }, g);
        return { labelY: peak, win: { x, y: top + 14, w, h: h - 56 } };
      },
      university(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        el("polygon", { points: `${x - 12},${top} ${x + w / 2},${top - 34} ${x + w + 12},${top}`, class: "bldg__shape" }, g);
        const cx = x + w / 2, drumTop = top - 54;
        el("rect", { x: cx - 36, y: drumTop, width: 72, height: 22, class: "bldg__shape" }, g);
        el("path", { d: `M${cx - 40},${drumTop} A40,40 0 0 1 ${cx + 40},${drumTop} Z`, class: "bldg__shape" }, g);
        el("line", { x1: cx, y1: drumTop - 40, x2: cx, y2: drumTop - 66, class: "bldg__line" }, g);
        el("polygon", { points: `${cx},${drumTop - 66} ${cx + 18},${drumTop - 60} ${cx},${drumTop - 54}`, class: "bldg__fill" }, g);
        const colTop = GROUND - 78;
        el("line", { x1: x, y1: colTop, x2: x + w, y2: colTop, class: "bldg__line" }, g);
        for (let i = 0; i <= 8; i++) {
          const lx = x + 14 + ((w - 28) / 8) * i;
          el("line", { x1: lx, y1: colTop + 6, x2: lx, y2: GROUND - 12, class: "bldg__line" }, g);
        }
        el("line", { x1: x - 8, y1: GROUND - 6, x2: x + w + 8, y2: GROUND - 6, class: "bldg__line" }, g);
        return { labelY: drumTop - 66, win: { x, y: top + 12, w, h: h - 100 } };
      },
      tower(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        el("rect", { x: x + 16, y: top - 40, width: w - 32, height: 40, class: "bldg__shape" }, g);
        el("rect", { x: x + 38, y: top - 70, width: w - 76, height: 30, class: "bldg__shape" }, g);
        const cx = x + w / 2;
        el("line", { x1: cx, y1: top - 70, x2: cx, y2: top - 150, class: "bldg__line" }, g);
        el("line", { x1: cx - 6, y1: top - 100, x2: cx + 6, y2: top - 100, class: "bldg__line" }, g);
        el("circle", { cx, cy: top - 152, r: 3, class: "beacon" }, g);
        el("line", { x1: x, y1: top + 14, x2: x + w, y2: top + 14, class: "bldg__line" }, g);
        return { labelY: top - 158, win: { x, y: top + 26, w, h: h - 30 } };
      },
      workshop(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        for (let i = 1; i < 4; i++) {
          const lx = x + (w / 4) * i;
          el("line", { x1: lx, y1: top, x2: lx, y2: GROUND, class: "bldg__line" }, g);
        }
        const mx = x + w * 0.74, mTop = top - 120;
        el("line", { x1: mx - 6, y1: top, x2: mx - 6, y2: mTop, class: "bldg__line" }, g);
        el("line", { x1: mx + 6, y1: top, x2: mx + 6, y2: mTop, class: "bldg__line" }, g);
        for (let yy = top; yy > mTop + 10; yy -= 14) {
          el("line", { x1: mx - 6, y1: yy, x2: mx + 6, y2: yy - 14, class: "bldg__line" }, g);
        }
        el("line", { x1: mx - 150, y1: mTop, x2: mx + 46, y2: mTop, class: "bldg__line" }, g);
        el("line", { x1: mx - 150, y1: mTop + 8, x2: mx + 46, y2: mTop + 8, class: "bldg__line" }, g);
        el("line", { x1: mx, y1: mTop - 22, x2: mx - 150, y2: mTop, class: "bldg__line" }, g);
        el("line", { x1: mx, y1: mTop - 22, x2: mx + 46, y2: mTop, class: "bldg__line" }, g);
        el("rect", { x: mx + 28, y: mTop + 8, width: 18, height: 14, class: "bldg__fill" }, g);
        const hookX = mx - 118;
        el("line", { x1: hookX, y1: mTop + 8, x2: hookX, y2: mTop + 58, class: "bldg__line" }, g);
        el("rect", { x: hookX - 14, y: mTop + 58, width: 28, height: 16, class: "bldg__shape" }, g);
        el("circle", { cx: mx, cy: mTop - 24, r: 3, class: "beacon" }, g);
        return { labelY: mTop - 30, win: { x, y: top + 14, w, h: h - 18 } };
      },
      watertower(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        const cx = x + w * 0.4;
        el("line", { x1: cx - 22, y1: top, x2: cx - 16, y2: top - 36, class: "bldg__line" }, g);
        el("line", { x1: cx + 22, y1: top, x2: cx + 16, y2: top - 36, class: "bldg__line" }, g);
        el("line", { x1: cx - 20, y1: top - 10, x2: cx + 18, y2: top - 26, class: "bldg__line" }, g);
        el("line", { x1: cx + 20, y1: top - 10, x2: cx - 18, y2: top - 26, class: "bldg__line" }, g);
        el("rect", { x: cx - 26, y: top - 80, width: 52, height: 44, class: "bldg__shape" }, g);
        for (let i = 1; i < 4; i++) {
          el("line", { x1: cx - 26 + 13 * i, y1: top - 80, x2: cx - 26 + 13 * i, y2: top - 36, class: "bldg__line" }, g);
        }
        el("polygon", { points: `${cx - 30},${top - 80} ${cx},${top - 104} ${cx + 30},${top - 80}`, class: "bldg__shape" }, g);
        el("rect", { x: x + w - 46, y: top - 26, width: 36, height: 26, class: "bldg__line" }, g);
        return { labelY: top - 104, win: { x, y: top + 14, w, h: h - 18 } };
      },
      archive(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        el("rect", { x: x - 6, y: top - 10, width: w + 12, height: 10, class: "bldg__shape" }, g);
        const cx = x + w / 2, cy = top - 54;
        el("line", { x1: cx, y1: top - 10, x2: cx, y2: cy + 24, class: "bldg__line" }, g);
        el("polygon", { points: `${cx - 14},${cy + 10} ${cx - 22},${cy + 44} ${cx - 10},${cy + 36} ${cx - 4},${cy + 46} ${cx - 2},${cy + 14}`, class: "bldg__shape" }, g);
        el("polygon", { points: `${cx + 14},${cy + 10} ${cx + 22},${cy + 44} ${cx + 10},${cy + 36} ${cx + 4},${cy + 46} ${cx + 2},${cy + 14}`, class: "bldg__shape" }, g);
        el("circle", { cx, cy, r: 24, class: "bldg__shape" }, g);
        el("circle", { cx, cy, r: 17, class: "bldg__line" }, g);
        el("path", { d: `M${cx - 8},${cy} l6,6 l11,-12`, class: "bldg__line" }, g);
        return { labelY: cy - 26, win: { x, y: top + 12, w, h: h - 16 } };
      },
      mast(g, { x, w, h }) {
        const top = GROUND - h;
        el("rect", { x, y: top, width: w, height: h, class: "bldg__shape" }, g);
        const cx = x + w / 2, mTop = top - 250;
        el("line", { x1: cx - 22, y1: top, x2: cx - 3, y2: mTop, class: "bldg__line" }, g);
        el("line", { x1: cx + 22, y1: top, x2: cx + 3, y2: mTop, class: "bldg__line" }, g);
        let left = true;
        for (let yy = top; yy > mTop + 16; yy -= 18) {
          const t1 = (top - yy) / (top - mTop), t2 = (top - (yy - 18)) / (top - mTop);
          const s1 = 22 - 19 * t1, s2 = 22 - 19 * t2;
          el("line", { x1: left ? cx - s1 : cx + s1, y1: yy, x2: left ? cx + s2 : cx - s2, y2: yy - 18, class: "bldg__line" }, g);
          left = !left;
        }
        el("line", { x1: cx, y1: mTop, x2: cx, y2: mTop - 30, class: "bldg__line" }, g);
        el("path", { d: `M${cx + 12},${top - 120} a16,16 0 0 0 22,-26 Z`, class: "bldg__shape" }, g);
        el("circle", { cx, cy: mTop - 32, r: 3.5, class: "beacon" }, g);
        const waves = el("g", { class: "waves" }, g);
        for (let i = 0; i < 3; i++) {
          const c = el("circle", { cx, cy: mTop - 32, r: 6, class: "wave" }, waves);
          c.style.animationDelay = `${i}s`;
        }
        return { labelY: mTop - 40, win: { x, y: top + 14, w, h: h - 18 } };
      },
    };

    const layer = document.getElementById("buildings");
    const allWins = [];
    BUILDINGS.forEach((b, i) => {
      const g = el("g", { class: "bldg", tabindex: "0", role: "button", "data-room": b.id, "aria-label": `${b.num} ${b.name} — open section` }, layer);
      g.style.animationDelay = `${120 + i * 90}ms`;
      const { labelY, win } = draw[b.kind](g, b);
      const cellW = 15, cellH = 20, ww = 6, wh = 10;
      const cols = Math.max(1, Math.floor((win.w - 18) / cellW));
      const rows = Math.max(0, Math.floor((win.h - 6) / cellH));
      const offX = win.x + (win.w - cols * cellW) / 2 + (cellW - ww) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rect = el("rect", { x: (offX + c * cellW).toFixed(1), y: (win.y + r * cellH).toFixed(1), width: ww, height: wh, class: "win" }, g);
          if (rand() < 0.34) {
            rect.classList.add("is-lit");
            rect.style.setProperty("--lit", (0.45 + rand() * 0.5).toFixed(2));
          }
          allWins.push(rect);
        }
      }
      const label = el("g", { class: "bldg__label", "aria-hidden": "true" }, g);
      const cx = b.x + b.w / 2;
      const pillW = `${b.num}  ${b.name}`.length * 9 + 30, pillH = 30;
      const pillY = labelY - 26 - pillH;
      el("line", { x1: cx, y1: labelY - 4, x2: cx, y2: pillY + pillH }, label);
      el("rect", { x: cx - pillW / 2, y: pillY, width: pillW, height: pillH, rx: 15, class: "label-pill" }, label);
      const t = el("text", { x: cx, y: pillY + 20 }, label);
      el("tspan", { class: "label-num" }, t).textContent = `${b.num}  `;
      el("tspan", {}, t).textContent = b.name.toUpperCase();
      el("rect", { x: b.x - 10, y: pillY, width: b.w + 20, height: GROUND - pillY, class: "bldg__hit" }, g);
      g.insertBefore(g.lastChild, g.firstChild);

      g.addEventListener("pointerenter", () => setHot(b.id, true));
      g.addEventListener("pointerleave", () => setHot(b.id, false));
      g.addEventListener("focus", () => setHot(b.id, true));
      g.addEventListener("blur", () => setHot(b.id, false));
    });

    if (!reduceMotion) {
      setInterval(() => {
        for (let i = 0; i < 3; i++) {
          const w = allWins[Math.floor(Math.random() * allWins.length)];
          w.classList.toggle("is-lit");
          if (!w.style.getPropertyValue("--lit")) w.style.setProperty("--lit", (0.45 + Math.random() * 0.5).toFixed(2));
        }
      }, 450);
    }

    layer.addEventListener("click", (e) => {
      const g = e.target.closest(".bldg");
      if (g) go(g.dataset.room);
    });
    layer.addEventListener("keydown", (e) => {
      const g = e.target.closest(".bldg");
      if (g && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        go(g.dataset.room);
      }
    });

    if (wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) * 0.35;
  }

  /* ------------------------------------------------------------
     Directory + hover sync
     ------------------------------------------------------------ */
  const dirList = document.getElementById("directory-list");
  BUILDINGS.forEach((b) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "btn";
    a.href = `#/${b.id}`;
    a.dataset.room = b.id;
    a.innerHTML = `<span>${b.num}</span>${b.name}`;
    a.addEventListener("pointerenter", () => setHot(b.id, true));
    a.addEventListener("pointerleave", () => setHot(b.id, false));
    a.addEventListener("focus", () => setHot(b.id, true));
    a.addEventListener("blur", () => setHot(b.id, false));
    li.appendChild(a);
    dirList.appendChild(li);
  });

  function setDirHot(id, on) {
    const a = dirList.querySelector(`[data-room="${id}"]`);
    if (a) a.classList.toggle("is-hot", on);
  }
  function setHot(id, on) {
    setDirHot(id, on);
    const g = document.querySelector(`.bldg[data-room="${id}"]`);
    if (g) g.classList.toggle("is-hot", on);
    if (city) city.setHot(id, on);
  }

  /* ------------------------------------------------------------
     Panel — entering a building
     ------------------------------------------------------------ */
  const panel = document.getElementById("panel");
  const panelScroll = document.getElementById("panel-scroll");
  const floorLabel = document.getElementById("panel-floor");
  const btnClose = document.getElementById("panel-close");
  const btnPrev = document.getElementById("panel-prev");
  const btnNext = document.getElementById("panel-next");
  const rooms = new Map([...panel.querySelectorAll(".room")].map((r) => [r.dataset.room, r]));
  let current = null;
  let returnFocus = null;
  let flying = false;

  const insetFrom = (rect) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    return `inset(${Math.max(0, rect.top)}px ${Math.max(0, vw - rect.right)}px ${Math.max(0, vh - rect.bottom)}px ${Math.max(0, rect.left)}px)`;
  };
  const originRect = (id) => {
    if (city) {
      const r = city.labelRect(id);
      if (r) return r;
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      return { top: cy - 20, bottom: cy + 20, left: cx - 60, right: cx + 60 };
    }
    const g = document.querySelector(`.bldg[data-room="${id}"]`);
    return g ? g.getBoundingClientRect() : null;
  };

  const showRoom = (id) => {
    rooms.forEach((room, key) => {
      const active = key === id;
      room.hidden = !active;
      const title = room.querySelector(".room__title");
      if (active) { title.id = "panel-title"; title.tabIndex = -1; }
      else if (title.id === "panel-title") title.removeAttribute("id");
    });
    const idx = BUILDINGS.findIndex((b) => b.id === id);
    const b = BUILDINGS[idx];
    floorLabel.textContent = `Building ${b.num} / 0${BUILDINGS.length} — ${b.name}`;
    btnPrev.setAttribute("aria-label", `Previous: ${BUILDINGS[(idx - 1 + BUILDINGS.length) % BUILDINGS.length].name}`);
    btnNext.setAttribute("aria-label", `Next: ${BUILDINGS[(idx + 1) % BUILDINGS.length].name}`);
    panelScroll.scrollTop = 0;
    const room = rooms.get(id);
    room.style.animation = "none";
    void room.offsetWidth;
    room.style.animation = "";
    current = id;
    document.title = `${b.name} — Hasan Asif`;
  };

  const reveal = (id, animate) => {
    const rect = animate ? originRect(id) : null;
    showRoom(id);
    panel.hidden = false;
    document.body.classList.add("is-locked");
    if (rect && !reduceMotion) {
      panel.style.transition = "none";
      panel.style.clipPath = insetFrom(rect);
      void panel.offsetWidth;
      panel.style.transition = "";
    }
    requestAnimationFrame(() => { panel.style.clipPath = "inset(0 0 0 0)"; });
    rooms.get(id).querySelector(".room__title").focus({ preventScroll: true });
    // stop rendering the city while it's fully covered
    if (city) setTimeout(() => { if (!panel.hidden) city.pause(true); }, reduceMotion ? 0 : 750);
  };

  const openRoom = (id, { animate = true } = {}) => {
    if (!rooms.has(id)) return;
    if (!panel.hidden) {
      showRoom(id);
      rooms.get(id).querySelector(".room__title").focus({ preventScroll: true });
      return;
    }
    if (flying) return;
    const active = document.activeElement;
    returnFocus = active && !active.closest(".labels") && active !== document.body ? active : null;
    if (city && animate) {
      flying = true;
      city.flyTo(id, () => { flying = false; reveal(id, true); });
    } else {
      reveal(id, animate);
    }
  };

  const closeRoom = () => {
    if (panel.hidden) return;
    const id = current;
    if (city) city.pause(false);
    const rect = originRect(id);
    const finish = () => {
      if (panel.hidden) return;
      panel.hidden = true;
      panel.style.clipPath = "";
      document.body.classList.remove("is-locked");
      current = null;
      document.title = "Hasan Asif — AI & Automation Engineer";
      const target = returnFocus && document.contains(returnFocus)
        ? returnFocus
        : (document.querySelector(`.bldg[data-room="${id}"]`) || dirList.querySelector(`[data-room="${id}"]`));
      if (target) target.focus({ preventScroll: true });
      if (city) city.restoreView();
    };
    if (rect && !reduceMotion) {
      panel.style.clipPath = insetFrom(rect);
      panel.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 900);
    } else {
      finish();
    }
  };

  const step = (dir) => {
    const idx = BUILDINGS.findIndex((b) => b.id === current);
    location.hash = `#/${BUILDINGS[(idx + dir + BUILDINGS.length) % BUILDINGS.length].id}`;
  };

  /* ---------- Routing (#/about etc.) ---------- */
  const route = (animate) => {
    const id = location.hash.replace(/^#\/?/, "");
    if (rooms.has(id)) openRoom(id, { animate });
    else closeRoom();
  };
  window.addEventListener("hashchange", () => route(true));

  function go(id) {
    if (location.hash === `#/${id}`) openRoom(id);
    else location.hash = `#/${id}`;
  }

  btnClose.addEventListener("click", () => {
    history.pushState("", document.title, location.pathname + location.search);
    closeRoom();
  });
  btnPrev.addEventListener("click", () => step(-1));
  btnNext.addEventListener("click", () => step(1));

  document.addEventListener("keydown", (e) => {
    if (panel.hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      btnClose.click();
    } else if (e.key === "Tab") {
      const focusables = [...panel.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((n) => !n.closest("[hidden]") && n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      const a = document.activeElement;
      if (e.shiftKey && (a === first || !panel.contains(a) || a.classList.contains("room__title"))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && a === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* ---------- Clock (Pakistan time) ---------- */
  const clock = document.getElementById("clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);

  if (!finePointer) document.body.classList.add("is-touch");
  route(false);
})();
