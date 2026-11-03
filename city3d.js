/* ==========================================================
   City3D — animated low-poly city (Three.js r147, classic build)
   Exposes window.City3D = { supported(), init(opts) }
   ========================================================== */
(function () {
  "use strict";

  function supported() {
    try {
      const c = document.createElement("canvas");
      return !!(window.THREE && window.THREE.OrbitControls && window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) {
      return false;
    }
  }

  function init(opts) {
    const T = window.THREE;
    const container = opts.container;
    const labelLayer = opts.labelLayer;
    const reduce = !!opts.reduceMotion;
    const small = window.innerWidth < 900;

    let seed = 4242;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const pick = (a) => a[Math.floor(rand() * a.length)];
    const lerp = (a, b, t) => a + (b - a) * t;
    const PI = Math.PI;

    /* ---------------- Renderer / scene / camera ---------------- */
    const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new T.Scene();
    scene.background = new T.Color();
    scene.fog = new T.Fog(0x000000, 200, 500);

    const camera = new T.PerspectiveCamera(38, 1, 1, 1400);
    const HOME = small
      ? { pos: new T.Vector3(150, 95, 185), target: new T.Vector3(0, 12, 0) }
      : { pos: new T.Vector3(118, 58, 138), target: new T.Vector3(0, 14, 0) };
    camera.position.copy(HOME.pos);

    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.target.copy(HOME.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 40;
    controls.maxDistance = 280;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = 1.4;
    controls.screenSpacePanning = false;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.35;
    let lastInteract = 0;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      lastInteract = performance.now();
    });

    /* ---------------- Lights ---------------- */
    const hemi = new T.HemisphereLight(0xffffff, 0x8d8577, 0.85);
    scene.add(hemi);
    const sun = new T.DirectionalLight(0xfff1dc, 0.9);
    sun.position.set(90, 150, 70);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 10, far: 420 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.3;
    scene.add(sun, sun.target);
    const moon = new T.DirectionalLight(0x8ea4ff, 0);
    moon.position.set(-90, 130, -60);
    scene.add(moon);

    /* ---------------- Materials & textures ---------------- */
    const lam = (c, extra) => new T.MeshLambertMaterial(Object.assign({ color: c }, extra || {}));
    const M = {
      ground: lam("#cbc4b6"),
      road: lam("#3a3a3c"),
      paint: lam("#ece6da"),
      curb: lam("#d8d1c4"),
      grass: lam("#9ba487"),
      roof: lam("#b3ab9d"),
      stone: lam("#e7e1d5"),
      dark: lam("#2b2a29"),
      metal: lam("#8e8b86"),
      crane: lam("#d1a03a"),
      gold: lam("#c9a24a", { emissive: "#2a1e00" }),
      wood: lam("#8a6e52"),
      water: lam("#7f97a3"),
      ribbon: lam("#9b3b2f"),
      trunk: lam("#6b5a48"),
      leaf: lam("#ffffff"),
      body: lam("#ffffff"),
      glass: lam("#2f3338"),
      skin: lam("#ffffff"),
      pants: lam("#2e2d33"),
      cloud: lam("#ffffff", { transparent: true, opacity: 0.85, depthWrite: false }),
      beacon: new T.MeshBasicMaterial({ color: "#ff3b30" }),
      flag: lam("#ebe6e0", { side: T.DoubleSide }),
    };
    const edgeMat = new T.LineBasicMaterial({ transparent: true, opacity: 0.55 });
    const edgeFaint = new T.LineBasicMaterial({ transparent: true, opacity: 0.16 });
    const edgeHot = new T.LineBasicMaterial({ transparent: true, opacity: 1 });

    const canvas = (w, h) => {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      return c;
    };
    const ctex = (c) => {
      const t = new T.CanvasTexture(c);
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return t;
    };

    // Facade window textures: base map + lit-at-night emissive + all-lit (hover)
    function windowSet(style) {
      const W = 256, H = 512, cols = 8, rows = 16, cw = W / cols, ch = H / rows;
      const base = canvas(W, H), lit = canvas(W, H), all = canvas(W, H);
      const b = base.getContext("2d"), l = lit.getContext("2d"), a = all.getContext("2d");
      b.fillStyle = "#ffffff"; b.fillRect(0, 0, W, H);
      l.fillStyle = "#000"; l.fillRect(0, 0, W, H);
      a.fillStyle = "#000"; a.fillRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) {
        if (style === "glass") { b.fillStyle = "rgba(0,0,0,0.10)"; b.fillRect(0, r * ch, W, 3); }
        for (let c = 0; c < cols; c++) {
          let x, y, w, h;
          if (style === "glass") { x = c * cw + 2; y = r * ch + 5; w = cw - 4; h = ch - 8; }
          else { x = c * cw + 9; y = r * ch + 7; w = cw - 18; h = ch - 13; }
          b.fillStyle = "#4a4f58"; b.fillRect(x, y, w, h);
          b.fillStyle = "rgba(255,255,255,0.13)"; b.fillRect(x, y, w, h * 0.35);
          const warm = rand() < 0.12
            ? `hsl(205, 60%, ${72 + rand() * 15}%)`
            : `hsl(${30 + rand() * 14}, ${75 + rand() * 20}%, ${55 + rand() * 22}%)`;
          a.fillStyle = warm; a.fillRect(x, y, w, h);
          if (rand() < 0.36) { l.fillStyle = warm; l.fillRect(x, y, w, h); }
        }
      }
      return { map: ctex(base), lit: ctex(lit), all: ctex(all) };
    }
    const WIN = { glass: windowSet("glass"), punched: windowSet("punched") };

    const facadeMats = [];
    function facadeMat(faceW, h, tint, style) {
      const set = WIN[style];
      const ox = Math.floor(rand() * 8) / 8, oy = Math.floor(rand() * 16) / 16;
      const prep = (src) => {
        const t = src.clone();
        t.wrapS = t.wrapT = T.RepeatWrapping;
        t.repeat.set(faceW / 12.8, h / 48);
        t.offset.set(ox, oy);
        return t;
      };
      const lit = prep(set.lit), all = prep(set.all);
      const m = lam(tint, { map: prep(set.map), emissive: "#ffffff", emissiveMap: lit, emissiveIntensity: 0 });
      m.userData = { lit, all, hot: false };
      facadeMats.push(m);
      return m;
    }

    const glowTex = (() => {
      const c = canvas(128, 128), g = c.getContext("2d");
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, "rgba(255,255,255,1)");
      grd.addColorStop(0.35, "rgba(255,255,255,0.45)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      return ctex(c);
    })();

    const beamTex = (() => {
      const c = canvas(256, 128), g = c.getContext("2d");
      const grd = g.createLinearGradient(0, 0, 256, 0);
      grd.addColorStop(0, "rgba(255,255,255,0.95)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.filter = "blur(6px)";
      g.beginPath();
      g.moveTo(0, 50); g.lineTo(256, 8); g.lineTo(256, 120); g.lineTo(0, 78);
      g.closePath(); g.fill();
      return ctex(c);
    })();

    function signTex(text, w, h, bg, fg) {
      const c = canvas(w, h), g = c.getContext("2d");
      const tex = ctex(c);
      const draw = () => {
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = fg;
        let size = Math.floor(h * 0.5);
        g.font = `500 ${size}px "Roboto Mono", ui-monospace, monospace`;
        const fit = (w * 0.88) / g.measureText(text).width;
        if (fit < 1) { size = Math.floor(size * fit); g.font = `500 ${size}px "Roboto Mono", ui-monospace, monospace`; }
        g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(text, w / 2, h / 2 + 2);
        tex.needsUpdate = true;
      };
      draw();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
      return tex;
    }

    /* ---------------- Geometry helpers ---------------- */
    const addEdges = (mesh, mat, list) => {
      const e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry, 30), mat);
      mesh.add(e);
      if (list) list.push(e);
      return e;
    };
    const mesh = (geo, mat, parent, x, y, z, shadow = true) => {
      const m = new T.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = shadow; m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    const box = (w, h, d, mat, parent, x, y, z) => mesh(new T.BoxGeometry(w, h, d), mat, parent, x, y, z);
    const cyl = (rt, rb, h, seg, mat, parent, x, y, z) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat, parent, x, y, z);
    const prism = (w, h, len, mat, parent, x, y, z) => {
      const s = new T.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
      const g = new T.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
      g.translate(0, 0, -len / 2);
      return mesh(g, mat, parent, x, y, z);
    };
    const cylBetween = (a, b, r, mat, parent) => {
      const len = a.distanceTo(b);
      const m = mesh(new T.CylinderGeometry(r, r, len, 6), mat, parent, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      return m;
    };
    // facade building: w (x), h, d (z), base y0
    const fbox = (w, h, d, x, y0, z, tint, style, parent, lm, edges = edgeMat) => {
      const sx = facadeMat(d, h, tint, style), sz = facadeMat(w, h, tint, style);
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), [sx, sx, M.roof, M.roof, sz, sz]);
      m.position.set(x, y0 + h / 2, z);
      m.castShadow = m.receiveShadow = true;
      parent.add(m);
      if (lm) { lm.mats.push(sx, sz); addEdges(m, edges, lm.edges); }
      else if (edges) addEdges(m, edges);
      return m;
    };

    /* ---------------- City layout ---------------- */
    const R = 8;                          // road width
    const B = 24;                         // block size
    const ROADS = small ? [-80, -48, -16, 16, 48, 80] : [-112, -80, -48, -16, 16, 48, 80, 112];
    const BLOCKS = small ? [-64, -32, 0, 32, 64] : [-96, -64, -32, 0, 32, 64, 96];
    const CITY = BLOCKS[BLOCKS.length - 1] + B / 2;   // outer edge of blocks
    const WRAP = 260;                     // traffic loop length (half)
    const SLAB = 0.3;
    const STOP = R / 2 + 3.8;             // stop line distance from crossing centre

    const SLOTS = {
      about: [32, 32], education: [0, 32], experience: [0, 0], projects: [-32, 0],
      skills: [0, -32], certifications: [32, 0], contact: [32, -32],
    };
    const PARKS = [[-32, -32], [-32, 32]];
    const isPark = (x, z) => PARKS.some((p) => p[0] === x && p[1] === z);
    const slotAt = (x, z) => Object.keys(SLOTS).find((k) => SLOTS[k][0] === x && SLOTS[k][1] === z);

    // ground
    const ground = mesh(new T.PlaneGeometry(1600, 1600), M.ground, scene, 0, 0, 0, false);
    ground.rotation.x = -PI / 2;

    // roads
    ROADS.forEach((r) => {
      const a = mesh(new T.PlaneGeometry(R, WRAP * 2 + 20), M.road, scene, r, 0.03, 0, false);
      a.rotation.x = -PI / 2;
      const b = mesh(new T.PlaneGeometry(WRAP * 2 + 20, R), M.road, scene, 0, 0.031, r, false);
      b.rotation.x = -PI / 2;
    });

    const dummy = new T.Object3D();
    const nearCrossing = (s, pad) => ROADS.some((c) => Math.abs(s - c) < pad);

    // lane dashes + crosswalks (instanced)
    (() => {
      const dashes = [];
      ROADS.forEach((r) => {
        for (let s = -WRAP; s <= WRAP; s += 6) {
          if (nearCrossing(s, R / 2 + 4)) continue;
          dashes.push([r, s, PI / 2], [s, r, 0]);
        }
      });
      const dm = new T.InstancedMesh(new T.BoxGeometry(2.4, 0.02, 0.22), M.paint, dashes.length);
      dashes.forEach(([x, z, ry], i) => {
        dummy.position.set(x, 0.05, z); dummy.rotation.set(0, ry, 0); dummy.updateMatrix();
        dm.setMatrixAt(i, dummy.matrix);
      });
      dm.receiveShadow = true;
      scene.add(dm);

      const stripes = [];
      ROADS.forEach((rx) => ROADS.forEach((cz) => {
        [-1, 1].forEach((side) => {
          const off = side * (R / 2 + 2.6);
          for (let k = -3; k <= 3; k++) {
            stripes.push([rx + k, cz + off, 0]);        // on road along z
            stripes.push([cz + off, rx + k, PI / 2]);   // on road along x
          }
        });
      }));
      const sm = new T.InstancedMesh(new T.BoxGeometry(0.5, 0.02, 2), M.paint, stripes.length);
      stripes.forEach(([x, z, ry], i) => {
        dummy.position.set(x, 0.05, z); dummy.rotation.set(0, ry, 0); dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      });
      sm.receiveShadow = true;
      scene.add(sm);
    })();

    // blocks: slabs, filler buildings, parks
    const treeSpots = [];
    const FILL_TINTS = ["#e9e3d8", "#dcd5c8", "#cfc7b8", "#c4bcae", "#e2d9c9", "#bdb5a7", "#d6cdbd"];
    const blockGeo = new T.BoxGeometry(B, SLAB, B);
    BLOCKS.forEach((bx) => BLOCKS.forEach((bz) => {
      mesh(blockGeo, M.curb, scene, bx, SLAB / 2, bz, false);
      // street trees along block edges (skip mid-block where lamps stand)
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([ex, ez]) => {
        for (let s = -9; s <= 9; s += 4.5) {
          if (Math.abs(s) < 3 || rand() > 0.5) continue;
          const ox = ex !== 0 ? ex * (B / 2 - 1.1) : s;
          const oz = ez !== 0 ? ez * (B / 2 - 1.1) : s;
          treeSpots.push([bx + ox, bz + oz, 0.8 + rand() * 0.35]);
        }
      });

      if (isPark(bx, bz)) return buildPark(bx, bz);
      if (slotAt(bx, bz)) return;

      // filler buildings
      const d = Math.max(Math.abs(bx), Math.abs(bz));
      let [hMin, hMax] = d <= 32 ? [9, 30] : d <= 64 ? [6, 24] : [3, 15];
      if (bx + bz > 32) { hMin = Math.max(3, hMin * 0.5); hMax *= 0.55; }
      const lots = pick([
        [[0, 0, 15, 15]],
        [[-4.3, 0, 7.4, 15], [4.3, 0, 7.4, 15]],
        [[0, -4.3, 15, 7.4], [0, 4.3, 15, 7.4]],
        [[-4.3, -4.3, 7.4, 7.4], [4.3, -4.3, 7.4, 7.4], [-4.3, 4.3, 7.4, 7.4], [4.3, 4.3, 7.4, 7.4]],
        [[-4.3, 0, 7.4, 15], [4.3, -4.3, 7.4, 7.4], [4.3, 4.3, 7.4, 7.4]],
      ]);
      lots.forEach(([lx, lz, lw, ld]) => {
        if (lots.length > 2 && rand() < 0.15) { treeSpots.push([bx + lx, bz + lz, 1.1]); return; }
        const w = lw * (0.8 + rand() * 0.2), dd = ld * (0.8 + rand() * 0.2);
        const h = Math.max(3, Math.round((hMin + rand() * (hMax - hMin)) / 3) * 3);
        const style = rand() < 0.5 ? "glass" : "punched";
        fbox(w, h, dd, bx + lx, SLAB, bz + lz, pick(FILL_TINTS), style, scene, null, small ? null : edgeFaint);
        if (rand() < 0.35) box(w * 0.35, 1.6, dd * 0.3, M.roof, scene, bx + lx + w * 0.15, SLAB + h + 0.8, bz + lz - dd * 0.15);
        if (h > 18 && rand() < 0.4) fbox(w * 0.65, 3 + Math.round(rand() * 2) * 3, dd * 0.65, bx + lx, SLAB + h, bz + lz, pick(FILL_TINTS), style, scene, null, small ? null : edgeFaint);
      });
    }));

    function buildPark(bx, bz) {
      const g = mesh(new T.BoxGeometry(B - 3, 0.05, B - 3), M.grass, scene, bx, SLAB + 0.02, bz, false);
      g.receiveShadow = true;
      const pond = mesh(new T.CircleGeometry(4.2, 32), M.water, scene, bx + 2.5, SLAB + 0.06, bz - 2, false);
      pond.rotation.x = -PI / 2;
      box(B - 3, 0.04, 1.4, M.stone, scene, bx, SLAB + 0.06, bz + 5);
      box(1.4, 0.04, B - 3, M.stone, scene, bx - 5, SLAB + 0.06, bz);
      [[-2, 6.6], [3, 6.6], [-6.6, -3]].forEach(([x, z], i) => {
        const bench = box(2.2, 0.5, 0.7, M.wood, scene, bx + x, SLAB + 0.45, bz + z);
        if (i === 2) bench.rotation.y = PI / 2;
      });
      for (let i = 0; i < 18; i++) {
        const x = (rand() - 0.5) * 17, z = (rand() - 0.5) * 17;
        if (Math.hypot(x - 2.5, z + 2) < 5.5 || Math.abs(z - 5) < 1.6 || Math.abs(x + 5) < 1.6) continue;
        treeSpots.push([bx + x, bz + z, 0.9 + rand() * 0.6]);
      }
    }

    /* ---------------- Landmarks ---------------- */
    const landmarks = {};
    const lmGroups = [];
    const animated = { jib: null, badge: null, flag: null, beacons: [], rings: [] };
    const ringMats = [];

    const BUILDERS = {
      about(g, lm) {
        fbox(12, 6, 10, 0, 0, -1, "#efe8dc", "punched", g, lm);
        addEdges(prism(13.4, 5, 11.4, M.roof, g, 0, 6, -1), edgeMat, lm.edges);
        addEdges(box(1.2, 3.2, 1.2, M.stone, g, 3.2, 9.6, -3), edgeMat, lm.edges);
        box(1.8, 2.8, 0.2, M.dark, g, 0, 1.4, 4.1);
        box(1.4, 0.05, 6.5, M.stone, g, 0, 0.03, 7.4);
        // little fence
        for (let x = -7; x <= 7; x += 1) if (Math.abs(x) > 1) box(0.12, 0.9, 0.12, M.stone, g, x, 0.45, 10.4);
        box(14.2, 0.1, 0.1, M.stone, g, 0, 0.8, 10.4);
        treeSpots.push([lm.x - 6.5, lm.z + 6.5, 1.1], [lm.x + 6.8, lm.z + 6, 0.9]);
        return 12.5;
      },
      education(g, lm) {
        fbox(20, 9, 11, 0, 0, -2.5, "#ece5d8", "punched", g, lm);
        box(21.5, 0.3, 4.2, M.stone, g, 0, 0.15, 5.0);
        box(20.5, 0.3, 3.6, M.stone, g, 0, 0.45, 4.8);
        for (let i = 0; i < 8; i++) cyl(0.42, 0.48, 7.6, 12, M.stone, g, -8.75 + i * 2.5, 0.6 + 3.8, 5.0);
        addEdges(box(20.8, 1, 3.8, M.stone, g, 0, 8.7, 4.9), edgeMat, lm.edges);
        addEdges(prism(21.4, 3.2, 15.4, M.roof, g, 0, 9.2, -0.6), edgeMat, lm.edges);
        cyl(3.3, 3.3, 2.6, 28, M.stone, g, 0, 12.4, -2.5);
        const dome = mesh(new T.SphereGeometry(3.6, 28, 14, 0, PI * 2, 0, PI / 2), M.stone, g, 0, 13.7, -2.5);
        dome.castShadow = true;
        cyl(0.06, 0.06, 4.4, 6, M.metal, g, 0, 19.4, -2.5);
        const flag = mesh(new T.PlaneGeometry(2.2, 1.3), M.flag, g, 1.1, 20.8, -2.5);
        animated.flag = flag;
        return 21.8;
      },
      experience(g, lm) {
        fbox(12, 42, 12, 0, 0, 0, "#dcd6cb", "glass", g, lm);
        fbox(9, 6, 9, 0, 42, 0, "#d2ccc0", "glass", g, lm);
        fbox(6, 6, 6, 0, 48, 0, "#c9c3b7", "glass", g, lm);
        cyl(0.12, 0.35, 12, 8, M.metal, g, 0, 60, 0);
        const b = mesh(new T.SphereGeometry(0.45, 10, 8), M.beacon, g, 0, 66.3, 0, false);
        animated.beacons.push({ m: b, off: 0 });
        const sign = new T.Mesh(new T.PlaneGeometry(9, 1.6), new T.MeshBasicMaterial({ map: signTex("SELFTECH", 512, 92, "#141312", "#ebe6e0") }));
        sign.position.set(0, 39.6, 6.06);
        g.add(sign);
        const sign2 = sign.clone();
        sign2.position.set(6.06, 39.6, 0);
        sign2.rotation.y = PI / 2;
        g.add(sign2);
        return 67;
      },
      projects(g, lm) {
        fbox(20, 21, 16, 0, 0, 0, "#e2dbcf", "glass", g, lm);
        const mx = 5, mz = -3, top = 21;
        addEdges(box(1.3, 20, 1.3, M.crane, g, mx, top + 10, mz), edgeMat, lm.edges);
        const jib = new T.Group();
        jib.position.set(mx, top + 20.5, mz);
        g.add(jib);
        box(27, 0.9, 0.9, M.crane, jib, -7, 0, 0);
        box(3.2, 1.8, 1.8, M.dark, jib, 4.6, -0.9, 0);
        box(1.8, 1.6, 1.6, M.crane, jib, 0, -1.4, 0.9);
        box(0.5, 3.4, 0.5, M.crane, jib, 0, 2.1, 0);
        const ties = new T.BufferGeometry().setFromPoints([
          new T.Vector3(0, 3.8, 0), new T.Vector3(-20, 0.4, 0),
          new T.Vector3(0, 3.8, 0), new T.Vector3(6, 0.4, 0),
          new T.Vector3(-14, -0.4, 0), new T.Vector3(-14, -10, 0),
        ]);
        jib.add(new T.LineSegments(ties, edgeMat));
        box(1.6, 1.2, 1.6, M.dark, jib, -14, -10.6, 0);
        box(4, 0.6, 1.2, M.metal, jib, -14, -11.5, 0);
        animated.jib = jib;
        const b = mesh(new T.SphereGeometry(0.35, 8, 6), M.beacon, jib, 0, 4, 0, false);
        animated.beacons.push({ m: b, off: 0.4 });
        return 46;
      },
      skills(g, lm) {
        fbox(14, 30, 14, 0, 0, 0, "#d6cfc3", "punched", g, lm);
        const wx = -2.6, wz = -2.2, top = 30;
        [[-1.7, -1.7], [1.7, -1.7], [-1.7, 1.7], [1.7, 1.7]].forEach(([x, z]) => cyl(0.13, 0.13, 4.2, 6, M.wood, g, wx + x, top + 2.1, wz + z));
        cyl(2.7, 2.7, 4.2, 20, M.wood, g, wx, top + 6.3, wz);
        mesh(new T.ConeGeometry(3, 2.2, 20), M.roof, g, wx, top + 9.5, wz);
        const bb = new T.Mesh(new T.PlaneGeometry(6.4, 2.6), new T.MeshBasicMaterial({ map: signTex("AGENTS·RAG·VOICE", 512, 208, "#141312", "#ebe6e0"), side: T.DoubleSide }));
        bb.position.set(3.2, top + 3.6, 4.2);
        bb.rotation.y = PI / 4;
        g.add(bb);
        cyl(0.1, 0.1, 2.4, 6, M.metal, g, 1.6, top + 1.2, 2.6);
        cyl(0.1, 0.1, 2.4, 6, M.metal, g, 4.8, top + 1.2, 5.8);
        return 41.5;
      },
      certifications(g, lm) {
        fbox(12, 27, 12, 0, 0, 0, "#e6dfd2", "glass", g, lm);
        addEdges(box(12.8, 1, 12.8, M.stone, g, 0, 27.5, 0), edgeMat, lm.edges);
        cyl(0.22, 0.22, 4.5, 8, M.metal, g, 0, 30.2, 0);
        const badge = new T.Group();
        badge.position.set(0, 34.6, 0);
        g.add(badge);
        const disc = mesh(new T.CylinderGeometry(2.4, 2.4, 0.5, 32), M.gold, badge, 0, 0, 0);
        disc.rotation.x = PI / 2;
        mesh(new T.TorusGeometry(2.65, 0.32, 10, 36), M.gold, badge, 0, 0, 0);
        const r1 = box(1, 2.8, 0.2, M.ribbon, badge, -1, -2.9, 0); r1.rotation.z = -0.3;
        const r2 = box(1, 2.8, 0.2, M.ribbon, badge, 1, -2.9, 0); r2.rotation.z = 0.3;
        animated.badge = badge;
        return 38;
      },
      contact(g, lm) {
        fbox(10, 12, 10, 0, 0, 0, "#ddd6ca", "punched", g, lm);
        const base = 12, top = 52;
        const legs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        const P = (sx, sz, y) => {
          const s = lerp(2.6, 0.35, (y - base) / (top - base));
          return new T.Vector3(sx * s, y, sz * s);
        };
        legs.forEach(([sx, sz]) => cylBetween(P(sx, sz, base), P(sx, sz, top), 0.12, M.metal, g));
        const pts = [];
        for (let y = base, k = 0; y < top - 2; y += 4, k++) {
          for (let i = 0; i < 4; i++) {
            const a = legs[i], b = legs[(i + 1) % 4];
            const lo = k % 2 ? a : b, hi = k % 2 ? b : a;
            pts.push(P(lo[0], lo[1], y), P(hi[0], hi[1], y + 4));
          }
        }
        g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), edgeMat));
        cyl(0.08, 0.08, 6, 6, M.metal, g, 0, top + 3, 0);
        const dishGeo = new T.SphereGeometry(1.7, 16, 8, 0, PI * 2, 0, PI / 3);
        const d1 = mesh(dishGeo, lam("#e7e1d5", { side: T.DoubleSide }), g, 1.6, 38, 0); d1.rotation.z = -PI / 2;
        const d2 = mesh(dishGeo, lam("#e7e1d5", { side: T.DoubleSide }), g, 0, 30, 2); d2.rotation.x = PI / 2;
        const b = mesh(new T.SphereGeometry(0.5, 10, 8), M.beacon, g, 0, top + 6.3, 0, false);
        animated.beacons.push({ m: b, off: 0.8 });
        for (let i = 0; i < 3; i++) {
          const mat = new T.LineBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
          ringMats.push(mat);
          const circle = [];
          for (let a = 0; a < 48; a++) circle.push(new T.Vector3(Math.cos((a / 48) * PI * 2), 0, Math.sin((a / 48) * PI * 2)));
          const ring = new T.LineLoop(new T.BufferGeometry().setFromPoints(circle), mat);
          ring.position.set(0, top + 6.3, 0);
          g.add(ring);
          animated.rings.push({ m: ring, off: i / 3 });
        }
        return 60;
      },
    };

    opts.landmarks.forEach((info) => {
      const [x, z] = SLOTS[info.id];
      const g = new T.Group();
      g.position.set(x, SLAB, z);
      g.userData.room = info.id;
      scene.add(g);
      const lm = { id: info.id, x, z, group: g, mats: [], edges: [], top: 0, label: null };
      lm.top = BUILDERS[info.id](g, lm);
      lm.anchor = new T.Vector3(x, SLAB + lm.top + 1.5, z);
      landmarks[info.id] = lm;
      lmGroups.push(g);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "clabel";
      btn.tabIndex = -1;
      btn.dataset.room = info.id;
      btn.innerHTML = `<span>${info.num}</span>${info.name}`;
      btn.addEventListener("click", () => opts.onSelect(info.id));
      btn.addEventListener("pointerenter", () => setHot(info.id, true, true));
      btn.addEventListener("pointerleave", () => setHot(info.id, false, true));
      labelLayer.appendChild(btn);
      lm.label = btn;
    });

    /* ---------------- Trees (instanced) ---------------- */
    (() => {
      const n = treeSpots.length;
      const trunks = new T.InstancedMesh(new T.CylinderGeometry(0.18, 0.26, 2.2, 6), M.trunk, n);
      const round = new T.InstancedMesh(new T.IcosahedronGeometry(1.35, 0), M.leaf, n);
      const cone = new T.InstancedMesh(new T.ConeGeometry(1.25, 3.4, 7), M.leaf, n);
      const greens = ["#7f8f6a", "#6f805c", "#8d9a73", "#5f7050", "#9aa67e", "#748463"].map((c) => new T.Color(c));
      const autumn = new T.Color("#b58a4a");
      let ri = 0, ci = 0;
      const col = new T.Color();
      treeSpots.forEach(([x, z, s], i) => {
        dummy.rotation.set(0, rand() * PI, 0);
        dummy.scale.set(s, s, s);
        dummy.position.set(x, SLAB + 1.1 * s, z);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);
        col.copy(rand() < 0.06 ? autumn : pick(greens)).offsetHSL(0, 0, (rand() - 0.5) * 0.06);
        if (rand() < 0.3) {
          dummy.position.set(x, SLAB + (2.2 + 1.5) * s, z);
          dummy.updateMatrix();
          cone.setMatrixAt(ci, dummy.matrix); cone.setColorAt(ci++, col);
        } else {
          dummy.scale.set(s, s * (1.05 + rand() * 0.3), s);
          dummy.position.set(x, SLAB + (2.2 + 1.0) * s, z);
          dummy.updateMatrix();
          round.setMatrixAt(ri, dummy.matrix); round.setColorAt(ri++, col);
        }
      });
      round.count = ri; cone.count = ci;
      [trunks, round, cone].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
    })();

    /* ---------------- Street lamps (instanced) ---------------- */
    const lampMat = new T.MeshBasicMaterial({ color: "#9a968e" });
    const glowMat = new T.MeshBasicMaterial({ map: glowTex, color: "#ffd59a", transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    const haloMat = new T.PointsMaterial({ map: glowTex, color: "#ffe2b0", size: 7, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    (() => {
      const list = [];
      ROADS.forEach((r) => BLOCKS.forEach((b) => [-1, 1].forEach((side) => {
        const off = r + side * (R / 2 + 0.5);
        if (Math.abs(off) > CITY) return;
        list.push({ x: off, z: b, rot: side > 0 ? PI : 0, dx: -side, dz: 0 });
        list.push({ x: b, z: off, rot: side * PI / 2, dx: 0, dz: -side });
      })));
      const n = list.length;
      const poles = new T.InstancedMesh(new T.CylinderGeometry(0.09, 0.13, 6.2, 6), M.metal, n);
      const arms = new T.InstancedMesh(new T.BoxGeometry(1.7, 0.1, 0.1), M.metal, n);
      const heads = new T.InstancedMesh(new T.BoxGeometry(0.8, 0.16, 0.42), lampMat, n);
      const glows = new T.InstancedMesh(new T.PlaneGeometry(9, 9), glowMat, n);
      const haloPos = new Float32Array(n * 3);
      list.forEach((l, i) => {
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, l.rot, 0);
        dummy.position.set(l.x, SLAB + 3.1, l.z); dummy.updateMatrix(); poles.setMatrixAt(i, dummy.matrix);
        dummy.position.set(l.x + l.dx * 0.85, SLAB + 6.15, l.z + l.dz * 0.85); dummy.updateMatrix(); arms.setMatrixAt(i, dummy.matrix);
        dummy.position.set(l.x + l.dx * 1.6, SLAB + 6.05, l.z + l.dz * 1.6); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
        dummy.rotation.set(-PI / 2, 0, 0);
        dummy.position.set(l.x + l.dx * 1.8, SLAB + 0.08, l.z + l.dz * 1.8); dummy.updateMatrix(); glows.setMatrixAt(i, dummy.matrix);
        haloPos.set([l.x + l.dx * 1.6, SLAB + 5.85, l.z + l.dz * 1.6], i * 3);
      });
      poles.castShadow = arms.castShadow = true;
      glows.renderOrder = 2;
      const halo = new T.Points(new T.BufferGeometry().setAttribute("position", new T.BufferAttribute(haloPos, 3)), haloMat);
      scene.add(poles, arms, heads, glows, halo);
    })();

    /* ---------------- Traffic signals ---------------- */
    const SIG = { red: new T.Color("#ff3b30"), amber: new T.Color("#ffb020"), green: new T.Color("#3bd16f") };
    const signals = (() => {
      const corners = [];
      ROADS.forEach((x) => ROADS.forEach((z) => {
        if (Math.abs(x) > 80 || Math.abs(z) > 80) return;
        const o = R / 2 + 0.7;
        corners.push({ x: x + o, z: z + o, axis: "z" }, { x: x - o, z: z - o, axis: "z" },
          { x: x - o, z: z + o, axis: "x" }, { x: x + o, z: z - o, axis: "x" });
      }));
      const n = corners.length;
      const posts = new T.InstancedMesh(new T.CylinderGeometry(0.08, 0.08, 3.6, 6), M.dark, n);
      const heads = new T.InstancedMesh(new T.BoxGeometry(0.42, 0.42, 0.42), new T.MeshBasicMaterial({ color: "#ffffff" }), n);
      corners.forEach((c, i) => {
        dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
        dummy.position.set(c.x, SLAB + 1.8, c.z); dummy.updateMatrix(); posts.setMatrixAt(i, dummy.matrix);
        dummy.position.set(c.x, SLAB + 3.75, c.z); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
        heads.setColorAt(i, SIG.red);
      });
      posts.castShadow = true;
      scene.add(posts, heads);
      return { corners, heads, state: "" };
    })();

    const CYCLE = 16;
    const lightState = (axis, t) => {
      const s = t % CYCLE;
      if (axis === "z") return s < 6.5 ? "green" : s < 8 ? "amber" : "red";
      return s >= 8 && s < 14.5 ? "green" : s >= 14.5 ? "amber" : "red";
    };

    /* ---------------- Cars ---------------- */
    const CAR_COLORS = ["#ebe6e0", "#2b2b2e", "#9b3b2f", "#3d5a73", "#c9a24a", "#6e7b6a", "#8c8c8c", "#f4f2ec", "#5a4a6b", "#b4543a"].map((c) => new T.Color(c));
    const lanes = [];
    ROADS.forEach((r) => [1, -1].forEach((dir) => {
      lanes.push({ axis: "z", dir, fixed: r + dir * 1.9, speed: 8 + rand() * 5, cars: [] });  // drive on the left
      lanes.push({ axis: "x", dir, fixed: r - dir * 1.9, speed: 8 + rand() * 5, cars: [] });
    }));
    const perLane = small ? 2 : 3;
    lanes.forEach((lane) => {
      for (let i = 0; i < perLane; i++) {
        lane.cars.push({
          u: -WRAP + (i + rand() * 0.6) * ((2 * WRAP) / perLane),
          v: lane.speed,
          len: rand() < 0.15 ? 1.35 : 1,
          color: pick(CAR_COLORS),
        });
      }
    });
    const carCount = lanes.length * perLane;
    const local = (x, y, z, rx = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, 0, 0)), new T.Vector3(1, 1, 1));
    const headMat = new T.MeshBasicMaterial({ color: "#dedad2" });
    const tailMat = new T.MeshBasicMaterial({ color: "#6d2420" });
    const beamMat = new T.MeshBasicMaterial({ map: beamTex, color: "#fff1cf", transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    const carParts = [
      { mesh: new T.InstancedMesh(new T.BoxGeometry(3.8, 0.8, 1.8), M.body, carCount), locals: [local(0, 0.78, 0)], color: true },
      { mesh: new T.InstancedMesh(new T.BoxGeometry(2.0, 0.7, 1.6), M.glass, carCount), locals: [local(-0.25, 1.52, 0)] },
      { mesh: new T.InstancedMesh(new T.BoxGeometry(3.1, 0.55, 1.9), M.dark, carCount), locals: [local(0, 0.36, 0)] },
      { mesh: new T.InstancedMesh(new T.BoxGeometry(0.08, 0.22, 0.4), headMat, carCount * 2), locals: [local(1.91, 0.85, 0.55), local(1.91, 0.85, -0.55)] },
      { mesh: new T.InstancedMesh(new T.BoxGeometry(0.08, 0.2, 0.42), tailMat, carCount * 2), locals: [local(-1.91, 0.88, 0.6), local(-1.91, 0.88, -0.6)] },
      { mesh: new T.InstancedMesh(new T.PlaneGeometry(9, 4.2), beamMat, carCount), locals: [local(6.4, 0.09, 0, -PI / 2)] },
    ];
    carParts.forEach((p, k) => {
      p.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      p.mesh.frustumCulled = false;
      if (k < 3 && !small) p.mesh.castShadow = true;
      if (k === 5) p.mesh.renderOrder = 3;
      scene.add(p.mesh);
    });
    {
      let idx = 0;
      lanes.forEach((lane) => lane.cars.forEach((car) => carParts[0].mesh.setColorAt(idx++, car.color)));
    }

    const UP = new T.Vector3(0, 1, 0);
    const _q = new T.Quaternion(), _p = new T.Vector3(), _s = new T.Vector3(), _m = new T.Matrix4(), _m2 = new T.Matrix4();
    const heading = (axis, dir) => (axis === "x" ? (dir > 0 ? 0 : PI) : (dir > 0 ? -PI / 2 : PI / 2));

    function updateCars(dt, simT) {
      const zGo = lightState("z", simT) === "green";
      const xGo = lightState("x", simT) === "green";
      let idx = 0;
      lanes.forEach((lane) => {
        const cars = lane.cars, n = cars.length;
        const go = lane.axis === "z" ? zGo : xGo;
        for (let i = 0; i < n; i++) {
          const car = cars[i];
          let target = lane.speed;
          if (!go) {
            const front = car.u + 1.9 * car.len;
            let best = Infinity;
            for (let c = 0; c < ROADS.length; c++) {
              if (Math.abs(ROADS[c]) > 80) continue;
              const d = ROADS[c] * lane.dir - STOP - front;
              if (d > -0.4 && d < best) best = d;
            }
            if (best < 18) target = Math.min(target, Math.max(0, best - 0.3) * 0.9);
          }
          if (n > 1) {
            const ahead = cars[(i + 1) % n];
            let gap = ahead.u - car.u;
            if (gap <= 0) gap += 2 * WRAP;
            gap -= 1.9 * (car.len + ahead.len);
            target = Math.min(target, Math.max(0, (gap - 1.8) * 1.3));
          }
          car.v += (target - car.v) * Math.min(1, dt * 2.5);
          if (car.v < 0.01) car.v = 0;
        }
        for (let i = 0; i < n; i++) {
          const car = cars[i];
          car.u += car.v * dt;
          if (car.u > WRAP) car.u -= 2 * WRAP;
          const p = lane.dir * car.u;
          if (lane.axis === "z") _p.set(lane.fixed, 0, p); else _p.set(p, 0, lane.fixed);
          _q.setFromAxisAngle(UP, heading(lane.axis, lane.dir));
          _s.set(car.len, 1, 1);
          _m.compose(_p, _q, _s);
          carParts.forEach((part) => {
            part.locals.forEach((loc, k) => {
              _m2.multiplyMatrices(_m, loc);
              part.mesh.setMatrixAt(idx * part.locals.length + k, _m2);
            });
          });
          idx++;
        }
      });
      carParts.forEach((p) => { p.mesh.instanceMatrix.needsUpdate = true; });

      // signal heads
      const st = lightState("z", simT) + lightState("x", simT);
      if (st !== signals.state) {
        signals.state = st;
        const zs = lightState("z", simT), xs = lightState("x", simT);
        signals.corners.forEach((c, i) => signals.heads.setColorAt(i, SIG[c.axis === "z" ? zs : xs]));
        signals.heads.instanceColor.needsUpdate = true;
      }
    }

    /* ---------------- People ---------------- */
    const walkPaths = [];
    ROADS.forEach((r) => [-1, 1].forEach((side) => {
      const off = r + side * (R / 2 + 2.6);
      if (Math.abs(off) > CITY) return;
      walkPaths.push({ axis: "z", fixed: off }, { axis: "x", fixed: off });
    }));
    const PEOPLE = small ? 50 : 120;
    const SHIRTS = ["#9b3b2f", "#3d5a73", "#ebe6e0", "#c9a24a", "#6e7b6a", "#2b2b2e", "#b4543a", "#7a6a8f", "#d9cbb3", "#4f7c82"].map((c) => new T.Color(c));
    const SKINS = ["#e2b896", "#c99872", "#a8754f", "#7d5236", "#f0cfb0"].map((c) => new T.Color(c));
    const people = [];
    for (let i = 0; i < PEOPLE; i++) {
      people.push({
        path: pick(walkPaths),
        u: (rand() * 2 - 1) * CITY,
        dir: rand() < 0.5 ? 1 : -1,
        speed: 0.9 + rand() * 0.7,
        phase: rand() * PI * 2,
      });
    }
    const legGeo = new T.BoxGeometry(0.16, 0.8, 0.16);
    legGeo.translate(0, -0.4, 0);
    const pBody = new T.InstancedMesh(new T.CylinderGeometry(0.24, 0.3, 0.95, 8), M.body, PEOPLE);
    const pHead = new T.InstancedMesh(new T.SphereGeometry(0.22, 10, 8), M.skin, PEOPLE);
    const pLegs = new T.InstancedMesh(legGeo, M.pants, PEOPLE * 2);
    [pBody, pHead, pLegs].forEach((m) => {
      m.instanceMatrix.setUsage(T.DynamicDrawUsage);
      m.frustumCulled = false;
      if (!small) m.castShadow = true;
      scene.add(m);
    });
    people.forEach((p, i) => { pBody.setColorAt(i, pick(SHIRTS)); pHead.setColorAt(i, pick(SKINS)); });
    const _e = new T.Euler(), _lq = new T.Quaternion(), _lp = new T.Vector3(), ONE = new T.Vector3(1, 1, 1), PS = new T.Vector3(0.85, 0.85, 0.85);

    function updatePeople(dt) {
      people.forEach((p, i) => {
        p.u += p.dir * p.speed * dt;
        if (p.u > CITY) p.u = -CITY; else if (p.u < -CITY) p.u = CITY;
        p.phase += dt * p.speed * 5.5;
        const onRoad = nearCrossing(p.u, R / 2);
        const y = onRoad ? 0.03 : SLAB;
        if (p.path.axis === "z") _p.set(p.path.fixed, y, p.u); else _p.set(p.u, y, p.path.fixed);
        _q.setFromAxisAngle(UP, heading(p.path.axis, p.dir));
        _m.compose(_p, _q, PS);
        const bob = Math.abs(Math.sin(p.phase)) * 0.06;
        _m2.makeTranslation(0, 1.25 + bob, 0); pBody.setMatrixAt(i, _m2.premultiply(_m));
        _m2.makeTranslation(0, 1.98 + bob, 0); pHead.setMatrixAt(i, _m2.premultiply(_m));
        const swing = Math.sin(p.phase) * 0.55;
        for (let k = 0; k < 2; k++) {
          _lp.set(0, 0.8 + bob, k ? 0.12 : -0.12);
          _lq.setFromEuler(_e.set(0, 0, k ? swing : -swing));
          _m2.compose(_lp, _lq, ONE);
          pLegs.setMatrixAt(i * 2 + k, _m2.premultiply(_m));
        }
      });
      pBody.instanceMatrix.needsUpdate = pHead.instanceMatrix.needsUpdate = pLegs.instanceMatrix.needsUpdate = true;
    }

    /* ---------------- Sky: stars, moon, clouds ---------------- */
    const starsMat = new T.PointsMaterial({ color: "#ffffff", size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    (() => {
      const n = 900, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const th = rand() * PI * 2, ph = rand() * 1.25;
        pos.set([Math.cos(th) * Math.sin(ph) * 700, Math.cos(ph) * 700 + 30, Math.sin(th) * Math.sin(ph) * 700], i * 3);
      }
      scene.add(new T.Points(new T.BufferGeometry().setAttribute("position", new T.BufferAttribute(pos, 3)), starsMat));
    })();
    const moonMat = new T.MeshBasicMaterial({ color: "#f3efe6", transparent: true, opacity: 0, fog: false });
    const moonMesh = new T.Mesh(new T.SphereGeometry(14, 24, 16), moonMat);
    moonMesh.position.set(-320, 260, -420);
    scene.add(moonMesh);

    const clouds = [];
    for (let i = 0; i < 9; i++) {
      const c = new T.Group();
      const parts = 3 + Math.floor(rand() * 3);
      for (let k = 0; k < parts; k++) {
        const s = new T.Mesh(new T.SphereGeometry(1, 10, 8), M.cloud);
        const r = 5 + rand() * 5;
        s.scale.set(r * 1.4, r * 0.7, r);
        s.position.set(k * 7 - parts * 3.5, rand() * 2, (rand() - 0.5) * 6);
        c.add(s);
      }
      c.position.set((rand() - 0.5) * 520, 85 + rand() * 30, (rand() - 0.5) * 520);
      c.userData.speed = 1.5 + rand() * 2;
      scene.add(c);
      clouds.push(c);
    }

    /* ---------------- Day / night ---------------- */
    const C = (c) => new T.Color(c);
    const PAL = {
      sky: [C("#ebe6e0"), C("#020204")],
      hemiSky: [C("#ffffff"), C("#53638f")],
      hemiGround: [C("#8d8577"), C("#0a0a10")],
      edge: [C("#1a1816"), C("#ebe6e0")],
      edgeHot: [C("#000000"), C("#ffffff")],
      lamp: [C("#9a968e"), C("#fff1c4")],
      head: [C("#dedad2"), C("#fffbe8")],
      tail: [C("#6d2420"), C("#ff3326")],
      ring: [C("#1a1816"), C("#ebe6e0")],
    };
    const mix = (pair, t, out) => out.copy(pair[0]).lerp(pair[1], t);
    let tNight = opts.night ? 1 : 0;
    let tTarget = tNight;
    let hotId = null;

    function applyTheme(t) {
      mix(PAL.sky, t, scene.background);
      scene.fog.color.copy(scene.background);
      scene.fog.near = lerp(220, 140, t);
      scene.fog.far = lerp(560, 430, t);
      hemi.intensity = lerp(0.85, 0.2, t);
      mix(PAL.hemiSky, t, hemi.color);
      mix(PAL.hemiGround, t, hemi.groundColor);
      sun.intensity = lerp(0.9, 0, t);
      moon.intensity = lerp(0, 0.3, t);
      renderer.shadowMap.autoUpdate = t < 0.97;
      if (!renderer.shadowMap.autoUpdate) renderer.shadowMap.needsUpdate = true;
      facadeMats.forEach((m) => { m.emissiveIntensity = m.userData.hot ? Math.max(0.9, t) : t; });
      mix(PAL.edge, t, edgeMat.color);
      mix(PAL.edge, t, edgeFaint.color);
      mix(PAL.edgeHot, t, edgeHot.color);
      mix(PAL.lamp, t, lampMat.color);
      mix(PAL.head, t, headMat.color);
      mix(PAL.tail, t, tailMat.color);
      ringMats.forEach((m) => mix(PAL.ring, t, m.color));
      glowMat.opacity = t * 0.9;
      haloMat.opacity = t;
      beamMat.opacity = t * 0.55;
      starsMat.opacity = t;
      moonMat.opacity = t;
      M.cloud.opacity = (1 - t) * 0.85;
      clouds.forEach((c) => { c.visible = t < 0.98; });
      M.gold.emissive.setRGB(0.16 * t + 0.04, 0.12 * t + 0.03, 0.02 * t);
    }
    applyTheme(tNight);

    /* ---------------- Hover / highlight ---------------- */
    function setHot(id, on, fromCity) {
      const lm = landmarks[id];
      if (!lm) return;
      lm.mats.forEach((m) => {
        m.userData.hot = on;
        m.emissiveMap = on ? m.userData.all : m.userData.lit;
        m.emissiveIntensity = on ? Math.max(0.9, tNight) : tNight;
      });
      lm.edges.forEach((e) => { e.material = on ? edgeHot : edgeMat; });
      lm.label.classList.toggle("is-hot", on);
      hotId = on ? id : hotId === id ? null : hotId;
      if (fromCity && opts.onHover) opts.onHover(id, on);
    }

    const raycaster = new T.Raycaster();
    raycaster.params.Line.threshold = 0.2;
    const ndc = new T.Vector2();
    const el = renderer.domElement;
    function pickAt(cx, cy) {
      const r = el.getBoundingClientRect();
      ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(lmGroups, true);
      for (const h of hits) {
        let o = h.object;
        while (o && !o.userData.room) o = o.parent;
        if (o) return o.userData.room;
      }
      return null;
    }
    let hoverId = null, pendingMove = null, downAt = null;
    const setHover = (id) => {
      if (id === hoverId) return;
      if (hoverId) setHot(hoverId, false, true);
      hoverId = id;
      if (id) setHot(id, true, true);
      el.style.cursor = id ? "pointer" : "grab";
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", (e) => { downAt = { x: e.clientX, y: e.clientY }; lastInteract = performance.now(); });
    el.addEventListener("pointerup", (e) => {
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6) {
        const id = pickAt(e.clientX, e.clientY);
        if (id) opts.onSelect(id);
      }
      downAt = null;
    });
    el.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") pendingMove = e; });
    el.addEventListener("pointerleave", () => { pendingMove = null; setHover(null); });
    el.addEventListener("wheel", () => { controls.autoRotate = false; lastInteract = performance.now(); }, { passive: true });

    /* ---------------- Camera moves ---------------- */
    let camAnim = null, saved = null;
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    function animateCam(toP, toT, dur, done) {
      controls.autoRotate = false;
      if (dur <= 0) {
        camera.position.copy(toP); controls.target.copy(toT); controls.update();
        if (done) done();
        return;
      }
      camAnim = { fromP: camera.position.clone(), fromT: controls.target.clone(), toP, toT, t0: performance.now(), dur, done };
      controls.enabled = false;
    }
    function flyTo(id, done) {
      const lm = landmarks[id];
      if (!lm) { if (done) done(); return; }
      if (!saved) saved = { pos: camera.position.clone(), target: controls.target.clone() };
      const toT = new T.Vector3(lm.x, Math.min(lm.top * 0.5, 26), lm.z);
      const dir = camera.position.clone().sub(controls.target).setY(0).normalize();
      const dist = Math.max(42, lm.top * 1.3);
      const toP = toT.clone().addScaledVector(dir, dist);
      toP.y = toT.y + dist * 0.42;
      animateCam(toP, toT, reduce ? 0 : 1000, done);
    }
    function restoreView() {
      if (!saved) return;
      animateCam(saved.pos, saved.target, reduce ? 0 : 1100, () => { lastInteract = performance.now(); });
      saved = null;
    }

    /* ---------------- Resize ---------------- */
    function layout() {
      const w = container.clientWidth || window.innerWidth, h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 55 : 38;
      if (w > 900) camera.setViewOffset(w, h, -w * 0.09, -h * 0.05, w, h);
      else camera.setViewOffset(w, h, 0, -h * 0.07, w, h);
      camera.updateProjectionMatrix();
    }
    layout();
    window.addEventListener("resize", layout);

    /* ---------------- Labels ---------------- */
    const _v = new T.Vector3();
    function updateLabels() {
      const w = el.clientWidth, h = el.clientHeight;
      Object.values(landmarks).forEach((lm) => {
        _v.copy(lm.anchor).project(camera);
        const visible = _v.z < 1 && _v.x > -1.1 && _v.x < 1.1 && _v.y > -1.1 && _v.y < 1.2;
        lm.label.style.visibility = visible ? "visible" : "hidden";
        if (visible) {
          const x = (_v.x * 0.5 + 0.5) * w, y = Math.max(120, (-_v.y * 0.5 + 0.5) * h);
          lm.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 22px))`;
        }
      });
    }

    /* ---------------- Loop ---------------- */
    const clock = new T.Clock();
    let paused = false, simT = 0, elapsed = 0;
    function frame() {
      requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (paused) return;
      const now = performance.now();
      elapsed += dt;
      const sdt = reduce ? 0 : dt;
      simT += sdt;

      if (tNight !== tTarget) {
        tNight += (tTarget - tNight) * Math.min(1, dt * 2.4);
        if (Math.abs(tNight - tTarget) < 0.003) tNight = tTarget;
        applyTheme(tNight);
      }

      updateCars(sdt, simT);
      updatePeople(sdt);

      if (animated.jib) animated.jib.rotation.y += sdt * 0.12;
      if (animated.badge) animated.badge.rotation.y += sdt * 0.7;
      if (animated.flag) animated.flag.rotation.y = Math.sin(elapsed * 2.2) * 0.25 * (reduce ? 0 : 1);
      animated.beacons.forEach((b) => { b.m.visible = reduce || ((elapsed + b.off) % 1.6) < 0.8; });
      animated.rings.forEach((r) => {
        const k = reduce ? 0.5 : ((elapsed / 3 + r.off) % 1);
        r.m.scale.setScalar(1 + k * 10);
        r.m.material.opacity = (1 - k) * 0.7;
      });
      clouds.forEach((c) => {
        c.position.x += c.userData.speed * sdt;
        if (c.position.x > 300) c.position.x = -300;
      });

      if (camAnim) {
        const k = Math.min(1, (now - camAnim.t0) / camAnim.dur);
        const e = ease(k);
        camera.position.lerpVectors(camAnim.fromP, camAnim.toP, e);
        controls.target.lerpVectors(camAnim.fromT, camAnim.toT, e);
        if (k >= 1) {
          const done = camAnim.done;
          camAnim = null;
          controls.enabled = true;
          if (done) done();
        }
      } else if (!reduce && !saved && !controls.autoRotate && now - lastInteract > 12000) {
        controls.autoRotate = true;
      }
      const t = controls.target;
      t.x = Math.max(-90, Math.min(90, t.x));
      t.z = Math.max(-90, Math.min(90, t.z));
      t.y = Math.max(2, Math.min(40, t.y));
      controls.update();

      if (pendingMove && !camAnim) {
        setHover(pickAt(pendingMove.clientX, pendingMove.clientY));
        pendingMove = null;
      }

      renderer.render(scene, camera);
      updateLabels();
    }
    frame();

    return {
      setNight(night) { tTarget = night ? 1 : 0; },
      setHot(id, on) { setHot(id, on, false); },
      flyTo,
      restoreView,
      pause(p) { paused = p; if (!p) clock.getDelta(); },
      labelRect(id) {
        const lm = landmarks[id];
        if (!lm || lm.label.style.visibility === "hidden") return null;
        return lm.label.getBoundingClientRect();
      },
    };
  }

  window.City3D = { supported, init };
})();
