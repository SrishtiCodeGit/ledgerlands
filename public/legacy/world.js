(function () {
  "use strict";
  // Draws a kingdom into a host element and returns { destroy }, or null when 3D isn't available.
  // The landing page mounts the example kingdom with a camera tied to scroll. A plan page passes
  // opts.holdings ([{ id, style, cost, value }]) and gets its own kingdom with a camera you drag around;
  // opts.onHover(id | null, clientX, clientY) reports the building under the pointer.
  function mount(host, opts) {
  opts = opts || {};
  var planMode = Array.isArray(opts.holdings);
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  if (typeof THREE === "undefined") return null;
  var cleanups = [];
  function on(target, type, fn, o) { target.addEventListener(type, fn, o); cleanups.push(function () { target.removeEventListener(type, fn, o); }); }
  try {
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x03080f);
    host.appendChild(renderer.domElement);
    if (planMode) { var cs = renderer.domElement.style; cs.display = "block"; cs.width = "100%"; cs.height = "100%"; cs.touchAction = "pan-y"; cs.cursor = "grab"; }

    var scene = new THREE.Scene();
    // Deep water: navy near the island, sinking to near-black toward the horizon.
    // The fog band follows the camera distance (see the frame loop) so the island itself stays clear.
    scene.fog = new THREE.Fog(0x0c3328, 70, 190);
    var camera = new THREE.PerspectiveCamera(36, 1, 0.5, 500);
    camera.position.set(36, 7.5, 34);

    var hemi = new THREE.HemisphereLight(0xfff4dc, 0x3a4a2a, 0.75);
    scene.add(hemi);
    // Daylight 1 = market open (warm sun), 0 = closed (cool moonlight, lit windows). Eased slowly between the two.
    var dayGoal = 1, dayNow = 1;
    var SUN_C = new THREE.Color(0xffe6b8), MOON_C = new THREE.Color(0x9fb8ff), SKY_DAY = new THREE.Color(0xfff4dc), SKY_NIGHT = new THREE.Color(0x7d93c4);
    function applyDaylight(k) {
      sun.intensity = 0.32 + 1.03 * k;
      sun.color.copy(MOON_C).lerp(SUN_C, k);
      hemi.intensity = 0.32 + 0.43 * k;
      hemi.color.copy(SKY_NIGHT).lerp(SKY_DAY, k);
      MAT.glow.emissiveIntensity = 2.6 - 1.4 * k;
      renderer.toneMappingExposure = 0.9 + 0.15 * k;
    }
    var sun = new THREE.DirectionalLight(0xffe6b8, 1.35);
    sun.position.set(-18, 30, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    var sc = sun.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 80;
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    // ----- textures painted on canvases -----
    var rnd = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    function shadeHex(hex, amt) {
      var r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255, k = (rnd() * 2 - 1) * amt;
      var c = function (v) { return Math.max(0, Math.min(255, Math.round(v + k))); };
      return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
    }
    function tex(size, draw, rep) {
      var c = document.createElement("canvas"); c.width = c.height = size;
      var g = c.getContext("2d"); draw(g, size);
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      if (rep) t.repeat.set(rep[0], rep[1]);
      return t;
    }
    function bricks(base, mortar, rows, cols) {
      return function (g, S) {
        g.fillStyle = mortar; g.fillRect(0, 0, S, S);
        var bh = S / rows, bw = S / cols;
        for (var r = 0; r < rows; r++) {
          var off = r % 2 ? bw / 2 : 0;
          for (var c = -1; c <= cols; c++) {
            g.fillStyle = shadeHex(base, 16);
            g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, bh - 4);
            g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(c * bw + off + 2, r * bh + 2, bw - 4, 2);
          }
        }
        for (var i = 0; i < 260; i++) { g.fillStyle = "rgba(0,0,0," + (rnd() * 0.12) + ")"; g.fillRect(rnd() * S, rnd() * S, 2, 2); }
      };
    }
    function shingles(base, edge) {
      return function (g, S) {
        g.fillStyle = edge; g.fillRect(0, 0, S, S);
        var rows = 10, w = S / 8, h = S / rows;
        for (var r = rows; r >= -1; r--) {
          var off = r % 2 ? w / 2 : 0;
          for (var c = -1; c <= 8; c++) {
            var x = c * w + off, y = r * h;
            g.fillStyle = shadeHex(base, 14);
            g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h * 0.9);
            g.quadraticCurveTo(x + w / 2, y + h * 1.5, x, y + h * 0.9); g.closePath(); g.fill();
            g.strokeStyle = edge; g.lineWidth = 2; g.stroke();
          }
        }
      };
    }
    var T = {
      stone: tex(256, bricks(0x9c917c, "#5f574a", 8, 4)),
      tstone: tex(256, bricks(0x8d9397, "#565b5f", 10, 5)),
      rock: tex(256, bricks(0x776d60, "#3f3932", 5, 3)),
      arcane: tex(256, bricks(0x4fa79b, "#2c6a62", 9, 4)),
      red: tex(256, shingles(0x8e2f25, "#4e1812")),
      slate: tex(256, shingles(0x46668f, "#22374f")),
      terra: tex(256, shingles(0xb5562e, "#6a2d12")),
      violet: tex(256, shingles(0x5f4396, "#2f1f52")),
      timber: tex(256, function (g, S) {
        g.fillStyle = "#e2cf9f"; g.fillRect(0, 0, S, S);
        for (var i = 0; i < 400; i++) { g.fillStyle = "rgba(120,90,40," + (rnd() * 0.08) + ")"; g.fillRect(rnd() * S, rnd() * S, 3, 3); }
        g.fillStyle = "#5b3a1e";
        g.fillRect(0, 0, 18, S); g.fillRect(S / 2 - 9, 0, 18, S); g.fillRect(0, 0, S, 16); g.fillRect(0, S / 2 - 8, S, 16);
        g.strokeStyle = "#5b3a1e"; g.lineWidth = 14;
        g.beginPath(); g.moveTo(18, S / 2); g.lineTo(S / 2 - 9, 16); g.moveTo(S / 2 + 9, 16); g.lineTo(S, S / 2); g.stroke();
      }),
      iron: tex(256, function (g, S) {
        g.fillStyle = "#6b7178"; g.fillRect(0, 0, S, S);
        for (var y = 0; y < 4; y++) { g.fillStyle = shadeHex(0x6b7178, 10); g.fillRect(0, y * 64 + 2, S, 60); }
        g.fillStyle = "#3e4348"; for (var yy = 0; yy < 4; yy++) g.fillRect(0, yy * 64, S, 3);
        g.fillStyle = "#b9bec4"; for (var r = 0; r < 4; r++) for (var c = 0; c < 8; c++) { g.beginPath(); g.arc(c * 32 + 16, r * 64 + 10, 3.5, 0, 6.3); g.fill(); }
      }),
      grass: tex(512, function (g, S) {
        g.fillStyle = "#6f8f3a"; g.fillRect(0, 0, S, S);
        for (var i = 0; i < 2600; i++) { g.strokeStyle = ["#5c7a2e", "#7fa046", "#668535", "#88aa4c"][i % 4]; g.lineWidth = 1.5; var x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd() * 3 - 1.5, y - 4 - rnd() * 4); g.stroke(); }
        for (var j = 0; j < 40; j++) { g.fillStyle = ["#f1e27a", "#ffffff", "#e9a2c0"][j % 3]; g.beginPath(); g.arc(rnd() * S, rnd() * S, 2.2, 0, 6.3); g.fill(); }
      }, [6, 6]),
      cobble: tex(256, function (g, S) {
        g.fillStyle = "#6f685b"; g.fillRect(0, 0, S, S);
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { g.fillStyle = shadeHex(0xa39b8a, 18); var o = r % 2 ? 16 : 0; g.beginPath(); g.ellipse(c * 32 + o + 16, r * 32 + 16, 13, 12, 0, 0, 6.3); g.fill(); }
      }),
      pave: tex(256, function (g, S) {
        g.fillStyle = "#615d55"; g.fillRect(0, 0, S, S);
        for (var r = 0; r < 4; r++) for (var c = -1; c < 4; c++) { g.fillStyle = shadeHex(0x8f8a7d, 14); var o = r % 2 ? 32 : 0; g.fillRect(c * 64 + o + 3, r * 64 + 3, 58, 58); }
      }),
      market: tex(256, function (g, S) {
        g.fillStyle = "#b8a27a"; g.fillRect(0, 0, S, S);
        for (var i = 0; i < 500; i++) { g.fillStyle = ["#9c8660", "#c9b48b", "#a8926a"][i % 3]; g.beginPath(); g.arc(rnd() * S, rnd() * S, 1 + rnd() * 2, 0, 6.3); g.fill(); }
      }),
      gravel: tex(256, function (g, S) {
        g.fillStyle = "#7d6a4f"; g.fillRect(0, 0, S, S);
        for (var i = 0; i < 700; i++) { g.fillStyle = i % 25 === 0 ? "#e0b63a" : ["#6a5940", "#8f7a5c", "#5e4f39"][i % 3]; g.beginPath(); g.arc(rnd() * S, rnd() * S, 1 + rnd() * 2.4, 0, 6.3); g.fill(); }
      }),
      dirt: tex(256, function (g, S) {
        for (var y = 0; y < S; y += 16) { g.fillStyle = shadeHex(0x6b4a2b, 14); g.fillRect(0, y, S, 16); }
        for (var i = 0; i < 300; i++) { g.fillStyle = ["#80603d", "#4e351e"][i % 2]; g.fillRect(rnd() * S, rnd() * S, 3, 3); }
      }),
      water: tex(256, function (g, S) {
        g.fillStyle = "#0b3a33"; g.fillRect(0, 0, S, S);
        for (var k = 0; k < 60; k++) { g.fillStyle = "rgba(2,16,12," + (rnd() * 0.25) + ")"; g.beginPath(); g.arc(rnd() * S, rnd() * S, 10 + rnd() * 30, 0, 6.3); g.fill(); }
        g.strokeStyle = "rgba(150,190,230,0.07)"; g.lineWidth = 3;
        for (var i = 0; i < 18; i++) { var x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 12, y - 6, x + 24, y); g.stroke(); }
      }, [30, 30])
    };

    function M(opts) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, opts)); }
    var MAT = {
      stone: M({ map: T.stone }), tstone: M({ map: T.tstone }), rock: M({ map: T.rock }), arcane: M({ map: T.arcane }),
      timber: M({ map: T.timber }), iron: M({ map: T.iron, metalness: 0.45, roughness: 0.55 }),
      stoneTop: M({ color: 0xb3a994 }), dark: M({ color: 0x1e1610 }), wood: M({ color: 0x7b4f26 }), woodLight: M({ color: 0x9a6a3a }),
      leaf: M({ color: 0x4a7a2a }), leaf2: M({ color: 0x5f9136 }), trunk: M({ color: 0x6a4527 }), hill: M({ color: 0x6f8f3a }),
      gold: M({ color: 0xf2c230, metalness: 0.6, roughness: 0.35, emissive: 0x3a2800 }),
      glow: M({ color: 0xffd27a, emissive: 0xffb84a, emissiveIntensity: 1.2 }),
      crystal: M({ color: 0xb8a6ff, emissive: 0x6a4cff, emissiveIntensity: 0.9, roughness: 0.2 }),
      redCloth: M({ color: 0x8e2f25, side: THREE.DoubleSide }), cream: M({ color: 0xf3e6c4, side: THREE.DoubleSide }),
      dirt: M({ map: T.dirt }), water: M({ map: T.water, roughness: 0.35, metalness: 0.1 }),
      grass: M({ map: T.grass }), rail: M({ color: 0x9aa0a6, metalness: 0.6, roughness: 0.4 })
    };
    function roofMat(t, rx, ry) { var c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return M({ map: c, side: THREE.DoubleSide }); }
    var ROOF = {
      redCone: roofMat(T.red, 3, 2), slateCone: roofMat(T.slate, 3, 2), violetCone: roofMat(T.violet, 3, 3),
      terra: M({ map: T.terra, side: THREE.DoubleSide })
    };
    var GROUND = {
      pave: M({ map: T.pave }), market: M({ map: T.market }), gravel: M({ map: T.gravel }), cobble: M({ map: T.cobble })
    };

    function shadowed(m) { m.castShadow = true; m.receiveShadow = true; return m; }
    function box(w, h, d, mat, unit) {
      var g = new THREE.BoxGeometry(w, h, d);
      if (unit) {
        var uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
        for (var f = 0; f < 6; f++) for (var i = 0; i < 4; i++) { var k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / unit, uv.getY(k) * dims[f][1] / unit); }
        uv.needsUpdate = true;
      }
      return shadowed(new THREE.Mesh(g, Array.isArray(mat) ? mat : mat));
    }
    function texturedBox(w, h, d, side, top, unit) {
      return box(w, h, d, [side, side, top, top, side, side], unit);
    }
    function pyramid(w, h, mat) {
      var m = shadowed(new THREE.Mesh(new THREE.ConeGeometry(w / Math.SQRT2, h, 4, 1), mat));
      m.rotation.y = Math.PI / 4; return m;
    }
    function gableGeo(L, W, H) {
      var hw = W / 2, hl = L / 2, s = Math.hypot(hw, H), pos = [], uv = [];
      function quad(a, b, c, d, ua, ub, uc, ud) { pos.push.apply(pos, a.concat(b, c, a, c, d)); uv.push.apply(uv, ua.concat(ub, uc, ua, uc, ud)); }
      function tri(a, b, c, ua, ub, uc) { pos.push.apply(pos, a.concat(b, c)); uv.push.apply(uv, ua.concat(ub, uc)); }
      quad([-hl, 0, hw], [hl, 0, hw], [hl, H, 0], [-hl, H, 0], [0, 0], [L, 0], [L, s], [0, s]);
      quad([hl, 0, -hw], [-hl, 0, -hw], [-hl, H, 0], [hl, H, 0], [0, 0], [L, 0], [L, s], [0, s]);
      tri([hl, 0, hw], [hl, 0, -hw], [hl, H, 0], [0, 0], [W, 0], [hw, H]);
      tri([-hl, 0, -hw], [-hl, 0, hw], [-hl, H, 0], [0, 0], [W, 0], [hw, H]);
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.computeVertexNormals(); return g;
    }
    function at(m, x, y, z) { m.position.set(x, y, z); return m; }

    // ----- static landscape -----
    var HALF = 11;
    // Rolling sea: the GPU lifts each vertex by a sum of sine swells and bends the normals to match.
    var waveUniforms = { uTime: { value: 0 } };
    MAT.water.color = new THREE.Color(0x8fa8c8);
    MAT.water.roughness = 0.28; MAT.water.metalness = 0.3;
    MAT.water.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = waveUniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", [
          "#include <common>",
          "uniform float uTime;",
          "float swell(vec2 p) {",
          "  return sin(p.x * 0.26 + uTime * 1.1) * 0.13",
          "       + sin(p.y * 0.38 - uTime * 0.85) * 0.09",
          "       + sin((p.x + p.y) * 0.8 + uTime * 1.6) * 0.035",
          "       + sin((p.x - p.y) * 1.4 - uTime * 2.0) * 0.015;",
          "}"
        ].join("\n"))
        .replace("#include <beginnormal_vertex>", [
          "float e = 0.15; float h0 = swell(position.xy);",
          "float hx = swell(position.xy + vec2(e, 0.0)); float hy = swell(position.xy + vec2(0.0, e));",
          "vec3 objectNormal = normalize(vec3(-(hx - h0) / e, -(hy - h0) / e, 1.0));",
          "#ifdef USE_TANGENT",
          "vec3 objectTangent = vec3(tangent.xyz);",
          "#endif"
        ].join("\n"))
        .replace("#include <begin_vertex>", "vec3 transformed = vec3(position); transformed.z += swell(position.xy);");
    };
    var water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 180, 180), MAT.water);
    water.rotation.x = -Math.PI / 2; water.position.y = -1.3; water.receiveShadow = true; scene.add(water);
    var deep = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x062a22, roughness: 0.5 }));
    deep.rotation.x = -Math.PI / 2; deep.position.y = -1.55; scene.add(deep);

    // Foam lapping at the shore: two soft rings that swell and fade out of step.
    var foamTex = tex(256, function (g, S) {
      var gr = g.createLinearGradient(0, 0, 0, S);
      gr.addColorStop(0, "rgba(255,255,255,0.95)"); gr.addColorStop(0.35, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.globalCompositeOperation = "destination-out";
      for (var i = 0; i < 180; i++) { g.beginPath(); g.arc(rnd() * S, rnd() * S * 0.6, 2 + rnd() * 6, 0, 6.3); g.fill(); }
    });
    foamTex.encoding = THREE.LinearEncoding;
    var foams = [0, 0.5].map(function (phase) {
      var grp = new THREE.Group();
      for (var s = 0; s < 4; s++) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2 + 1.4, 1.4), new THREE.MeshBasicMaterial({ map: foamTex, color: 0xe2f6ec, transparent: true, depthWrite: false, opacity: 0.5, fog: true }));
        var dir = [[0, 1], [1, 0], [0, -1], [-1, 0]][s];
        m.position.set(dir[0] * (HALF + 0.6), -1.16, dir[1] * (HALF + 0.6));
        // Lay the strip flat with its bright edge facing the island on each side.
        m.rotation.order = "YXZ"; m.rotation.y = s * Math.PI / 2; m.rotation.x = -Math.PI / 2;
        grp.add(m);
      }
      scene.add(grp);
      return { grp: grp, phase: phase };
    });
    var islandSide = texturedBox(HALF * 2, 1.6, HALF * 2, MAT.dirt, MAT.grass, 0);
    islandSide.position.y = -0.8; scene.add(islandSide);
    var grassTop = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), MAT.grass);
    grassTop.rotation.x = -Math.PI / 2; grassTop.position.y = 0.005; grassTop.receiveShadow = true; scene.add(grassTop);

    function patch(cx, cz, w, d, mat) {
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat.clone());
      p.material.map = mat.map.clone(); p.material.map.needsUpdate = true; p.material.map.repeat.set(w / 2, d / 2);
      p.rotation.x = -Math.PI / 2; p.position.set(cx, 0.02, cz); p.receiveShadow = true; return p;
    }
    scene.add(patch(0, 0, 6, 6, GROUND.cobble));
    scene.add(patch(0, 5.6, 2, 5.2, GROUND.cobble));

    // walls, battlements and towers
    var wallH = 1.1;
    function wallRun(x0, z0, x1, z1) {
      var len = Math.hypot(x1 - x0, z1 - z0), alongX = Math.abs(x1 - x0) > 0.01;
      var g = new THREE.Group();
      var w = texturedBox(alongX ? len : 0.45, wallH, alongX ? 0.45 : len, MAT.stone, MAT.stoneTop, 2);
      w.position.y = wallH / 2; g.add(w);
      var n = Math.floor(len / 0.9);
      for (var i = 0; i < n; i++) {
        var t = (i + 0.5) / n - 0.5;
        var m = texturedBox(alongX ? 0.45 : 0.5, 0.35, alongX ? 0.5 : 0.45, MAT.stone, MAT.stoneTop, 2);
        m.position.set(alongX ? t * len : 0, wallH + 0.17, alongX ? 0 : t * len); g.add(m);
      }
      g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); scene.add(g);
    }
    var E = HALF - 0.5;
    wallRun(-E, -E, E, -E); wallRun(-E, -E, -E, E); wallRun(E, -E, E, E);
    wallRun(-E, E, -1.4, E); wallRun(1.4, E, E, E);
    function guardTower(x, z, s, h) {
      var g = new THREE.Group();
      var b = texturedBox(s, h, s, MAT.stone, MAT.stoneTop, 2); b.position.y = h / 2; g.add(b);
      var ledge = texturedBox(s + 0.25, 0.25, s + 0.25, MAT.stone, MAT.stoneTop, 2); ledge.position.y = h; g.add(ledge);
      var r = pyramid(s + 0.35, s * 1.1, ROOF.redCone); r.position.y = h + 0.12 + s * 0.55; g.add(r);
      [[0, s / 2 + 0.01], [s / 2 + 0.01, 0], [0, -s / 2 - 0.01], [-s / 2 - 0.01, 0]].forEach(function (o, i) {
        var sl = box(i % 2 ? 0.04 : 0.14, 0.5, i % 2 ? 0.14 : 0.04, MAT.dark); sl.position.set(o[0], h * 0.62, o[1]); g.add(sl);
      });
      g.position.set(x, 0, z); scene.add(g); return g;
    }
    guardTower(-E, -E, 1.5, 2.4); guardTower(E, -E, 1.5, 2.4); guardTower(-E, E, 1.5, 2.4); guardTower(E, E, 1.5, 2.4);
    guardTower(-1.9, E, 1.2, 2.0); guardTower(1.9, E, 1.2, 2.0);
    var gateArch = texturedBox(2.6, 0.5, 0.5, MAT.stone, MAT.stoneTop, 2); gateArch.position.set(0, 1.6, E); scene.add(gateArch);
    var gateDoor = box(1.8, 1.35, 0.12, MAT.wood); gateDoor.position.set(0, 0.68, E - 0.1); scene.add(gateDoor);
    for (var gb = -3; gb <= 3; gb++) { var bar = box(0.06, 1.35, 0.06, MAT.rail); bar.position.set(gb * 0.25, 0.68, E + 0.02); scene.add(bar); }

    // torches (glowing) at the gate
    [-1.3, 1.3].forEach(function (x) {
      var post = box(0.1, 0.5, 0.1, MAT.wood); post.position.set(x, 1.1, E + 0.35); scene.add(post);
      var fl = box(0.16, 0.2, 0.16, MAT.glow); fl.position.set(x, 1.45, E + 0.35); fl.castShadow = false; scene.add(fl);
    });

    // trees (fixed scatter that avoids districts and the castle)
    function tree(x, z, s) {
      var g = new THREE.Group();
      var tr = box(0.18 * s, 0.6 * s, 0.18 * s, MAT.trunk); tr.position.y = 0.3 * s; g.add(tr);
      var c1 = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.62 * s, 1.2 * s, 7), MAT.leaf)); c1.position.y = 1.0 * s; g.add(c1);
      var c2 = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.45 * s, 0.95 * s, 7), MAT.leaf2)); c2.position.y = 1.55 * s; g.add(c2);
      g.position.set(x, 0, z); g.rotation.y = rnd() * 6; scene.add(g);
    }
    var SPOTS = [
      { x: -6, z: -6, w: 6.5, d: 6.5 }, { x: 6, z: -6, w: 6.5, d: 6.5 }, { x: -6, z: 6, w: 6.5, d: 6.5 },
      { x: 6, z: 6, w: 6.5, d: 6.5 }, { x: 0, z: -7.4, w: 4.4, d: 4.4 }, { x: -7.4, z: 0, w: 4.4, d: 4.4 }
    ];
    var placedTrees = 0, guard = 0;
    while (placedTrees < 26 && guard < 900) {
      guard++;
      var tx = (rnd() * 2 - 1) * (HALF - 1.4), tz = (rnd() * 2 - 1) * (HALF - 1.4);
      if (Math.abs(tx) < 3.6 && Math.abs(tz) < 3.6) continue;
      if (Math.abs(tx) < 1.6 && tz > 2) continue;
      var bad = SPOTS.some(function (s) { return Math.abs(tx - s.x) < s.w / 2 + 0.5 && Math.abs(tz - s.z) < s.d / 2 + 0.5; });
      if (bad) continue;
      tree(tx, tz, 0.8 + rnd() * 0.5); placedTrees++;
    }
    for (var rk = 0; rk < 10; rk++) {
      var ang = rnd() * 6.28, rad = 13.5 + rnd() * 3;
      var rock = box(0.6 + rnd(), 0.5 + rnd() * 0.6, 0.6 + rnd(), M({ color: 0x6e6658 }));
      rock.position.set(Math.cos(ang) * rad, -1.1, Math.sin(ang) * rad); rock.rotation.y = rnd() * 3; scene.add(rock);
    }

    // castle (whole clan)
    var castle = new THREE.Group();
    (function () {
      var keep = texturedBox(2.6, 3.4, 2.6, MAT.stone, MAT.stoneTop, 2); keep.position.y = 1.7; castle.add(keep);
      var kr = pyramid(3.0, 2.0, ROOF.redCone); kr.position.y = 3.4 + 1.0; castle.add(kr);
      var gate = box(1.0, 1.3, 0.06, MAT.dark); gate.position.set(0, 0.65, 1.31); castle.add(gate);
      var lintel = box(1.2, 0.18, 0.12, MAT.stoneTop); lintel.position.set(0, 1.36, 1.32); castle.add(lintel);
      [-0.75, 0.75].forEach(function (x) {
        var ban = box(0.42, 1.3, 0.04, MAT.redCloth); ban.position.set(x, 2.2, 1.33); ban.castShadow = false; castle.add(ban);
        var tip = box(0.42, 0.12, 0.05, MAT.gold); tip.position.set(x, 1.5, 1.33); castle.add(tip);
      });
      [-0.4, 0.4].forEach(function (x) { var win = box(0.22, 0.42, 0.04, MAT.glow); win.position.set(x, 2.75, 1.32); win.castShadow = false; castle.add(win); });
      [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(function (p) {
        var t = texturedBox(1.25, 4.3, 1.25, MAT.stone, MAT.stoneTop, 2); t.position.set(p[0], 2.15, p[1]); castle.add(t);
        var l = texturedBox(1.5, 0.25, 1.5, MAT.stone, MAT.stoneTop, 2); l.position.set(p[0], 4.3, p[1]); castle.add(l);
        var r = pyramid(1.7, 1.6, ROOF.redCone); r.position.set(p[0], 4.42 + 0.8, p[1]); castle.add(r);
        var s1 = box(0.12, 0.6, 0.04, MAT.dark); s1.position.set(p[0], 3.0, p[1] + 0.64); castle.add(s1);
        var s2 = box(0.04, 0.6, 0.12, MAT.dark); s2.position.set(p[0] + 0.64, 3.0, p[1]); castle.add(s2);
      });
      for (var i = 0; i < 4; i++) {
        var w = texturedBox(i % 2 ? 0.35 : 1.75, 1.6, i % 2 ? 1.75 : 0.35, MAT.stone, MAT.stoneTop, 2);
        var o = [[0, -1.5], [1.5, 0], [0, 1.5], [-1.5, 0]][i];
        w.position.set(o[0], 0.8, o[1]); castle.add(w);
      }
    })();
    castle.userData = { hid: "clan", top: 6.2 };
    scene.add(castle);

    // ----- building builders (each returns a group + its apex height) -----
    function flagFor(group, y, color) {
      var pole = box(0.05, 1.0, 0.05, MAT.wood); pole.position.set(0, y + 0.5, 0); group.add(pole);
      var fg = new THREE.BufferGeometry();
      fg.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0.75, -0.14, 0, 0, -0.32, 0], 3));
      fg.computeVertexNormals();
      var fm = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ color: color, side: THREE.DoubleSide, roughness: 0.8 }));
      fm.position.set(0.03, y + 1.0, 0); fm.castShadow = true; group.add(fm);
      return fm;
    }
    var BUILD = {
      tower: function (g, k) {
        var h = 1.9 + 3.2 * k;
        var b = texturedBox(1.25, h, 1.25, MAT.tstone, MAT.stoneTop, 1.6); b.position.y = h / 2; g.add(b);
        var door = box(0.42, 0.7, 0.05, MAT.wood); door.position.set(0, 0.35, 0.64); g.add(door);
        var dl = box(0.55, 0.1, 0.07, MAT.stoneTop); dl.position.set(0, 0.74, 0.64); g.add(dl);
        [0.42, 0.68].forEach(function (f) { var w = box(0.2, 0.36, 0.04, MAT.glow); w.position.set(0, h * f, 0.64); w.castShadow = false; g.add(w); });
        var wr = box(0.04, 0.36, 0.2, MAT.dark); wr.position.set(0.64, h * 0.55, 0); g.add(wr);
        var ledge = texturedBox(1.5, 0.22, 1.5, MAT.stone, MAT.stoneTop, 2); ledge.position.y = h; g.add(ledge);
        for (var i = 0; i < 4; i++) { var m = texturedBox(0.32, 0.28, 0.32, MAT.stone, MAT.stoneTop, 2); var o = [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]][i]; m.position.set(o[0], h + 0.25, o[1]); g.add(m); }
        var r = pyramid(1.35, 1.7, ROOF.slateCone); r.position.y = h + 0.11 + 0.85; g.add(r);
        return h + 1.95;
      },
      hall: function (g, k) {
        var h = 1.0 + 0.9 * k, L = 2.6, W = 1.8;
        var b = texturedBox(L, h, W, MAT.timber, MAT.stoneTop, 1.3); b.position.y = h / 2; g.add(b);
        var roof = shadowed(new THREE.Mesh(gableGeo(L + 0.3, W + 0.35, 1.0), ROOF.terra)); roof.position.y = h; g.add(roof);
        var ch = texturedBox(0.3, 1.0, 0.3, MAT.stone, MAT.stoneTop, 2); ch.position.set(0.8, h + 0.6, -0.35); g.add(ch);
        var door = box(0.5, 0.8, 0.05, MAT.wood); door.position.set(0, 0.4, W / 2 + 0.02); g.add(door);
        [-0.85, 0.85].forEach(function (x) {
          var w = box(0.32, 0.3, 0.04, MAT.glow); w.position.set(x, h * 0.62, W / 2 + 0.02); w.castShadow = false; g.add(w);
          [-0.24, 0.24].forEach(function (dx) { var s = box(0.14, 0.32, 0.04, M({ color: 0x3f5a2e })); s.position.set(x + dx, h * 0.62, W / 2 + 0.03); g.add(s); });
        });
        for (var i = 0; i < 6; i++) {
          var st = box(0.38, 0.04, 0.6, i % 2 ? MAT.cream : MAT.redCloth);
          st.position.set(-0.95 + i * 0.38, Math.min(h * 0.55, 0.95), W / 2 + 0.3); st.rotation.x = 0.35; g.add(st);
        }
        [-1.15, 1.15].forEach(function (x) {
          var bar = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 10), MAT.woodLight)); bar.position.set(x, 0.21, W / 2 + 0.55); g.add(bar);
        });
        var sign = box(0.04, 0.3, 0.4, MAT.gold); sign.position.set(L / 2 + 0.25, h * 0.75, 0.3); g.add(sign);
        return h + 1.0;
      },
      mine: function (g, k) {
        var hh = 0.9 + 1.3 * k;
        var base = texturedBox(2.0, 0.7, 2.0, MAT.rock, MAT.hill, 1.2); base.position.y = 0.35; g.add(base);
        var hill = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.45, hh, 8), MAT.hill)); hill.position.y = 0.7 + hh / 2; g.add(hill);
        var ent = box(0.7, 0.6, 0.05, MAT.dark); ent.position.set(0, 0.32, 1.01); g.add(ent);
        [-0.4, 0.4].forEach(function (x) { var p = box(0.1, 0.7, 0.1, MAT.wood); p.position.set(x, 0.35, 1.04); g.add(p); });
        var lin = box(0.95, 0.12, 0.12, MAT.wood); lin.position.set(0, 0.72, 1.04); g.add(lin);
        var lamp = box(0.12, 0.16, 0.12, MAT.glow); lamp.position.set(0.6, 0.6, 1.08); lamp.castShadow = false; g.add(lamp);
        for (var i = 0; i < 5; i++) { var tie = box(0.6, 0.04, 0.1, MAT.wood); tie.position.set(0, 0.03, 1.2 + i * 0.25); g.add(tie); }
        [-0.18, 0.18].forEach(function (x) { var r = box(0.04, 0.05, 1.3, MAT.rail); r.position.set(x, 0.06, 1.75); g.add(r); });
        var cart = box(0.5, 0.3, 0.42, MAT.iron); cart.position.set(0, 0.26, 1.85); g.add(cart);
        var load = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 6), MAT.gold)); load.position.set(0, 0.5, 1.85); g.add(load);
        [[-0.85, 1.25], [0.85, 1.35], [0.95, 0.4]].forEach(function (p) { var n = shadowed(new THREE.Mesh(new THREE.OctahedronGeometry(0.13), MAT.gold)); n.position.set(p[0], 0.13, p[1]); g.add(n); });
        return 0.7 + hh;
      },
      wizard: function (g, k) {
        var h = 2.6 + 3.0 * k;
        var b = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, h, 10), MAT.arcane)); b.position.y = h / 2; g.add(b);
        var w = box(0.2, 0.36, 0.04, MAT.crystal); w.position.set(0, h * 0.6, 0.66); g.add(w);
        var door = box(0.4, 0.66, 0.05, MAT.wood); door.position.set(0, 0.33, 0.72); g.add(door);
        var r = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.0, 10), ROOF.violetCone)); r.position.y = h + 1.0; g.add(r);
        var c = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), MAT.crystal); c.position.y = h + 2.4; g.add(c);
        g.userData.spin = c;
        return h + 2.0;
      },
      vault: function (g, k) {
        var h = 1.0 + 0.9 * k;
        var b = texturedBox(2.0, h, 1.6, MAT.iron, M({ color: 0x555b61, metalness: 0.4, roughness: 0.6 }), 1.2); b.position.y = h / 2; g.add(b);
        var slab = box(2.25, 0.2, 1.85, M({ color: 0x43474c, metalness: 0.4, roughness: 0.6 })); slab.position.y = h + 0.1; g.add(slab);
        var door = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 20), MAT.gold)); door.rotation.x = Math.PI / 2; door.position.set(0, h * 0.5, 0.82); g.add(door);
        var hub = box(0.12, 0.12, 0.1, MAT.dark); hub.position.set(0, h * 0.5, 0.87); g.add(hub);
        return h + 0.2;
      }
    };

    // ----- black birds: two V formations circling the kingdom -----
    var birdMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8, side: THREE.DoubleSide });
    var wingGeoL = new THREE.BufferGeometry();
    wingGeoL.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.14, 0, 0, 0.16, -0.75, 0.02, -0.04, 0, 0, 0.16, -0.75, 0.02, -0.04, -0.4, 0.01, 0.12], 3));
    wingGeoL.computeVertexNormals();
    var wingGeoR = wingGeoL.clone(); wingGeoR.scale(-1, 1, 1);
    function makeBird() {
      var b = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.5), birdMat); body.castShadow = true; b.add(body);
      var head = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.12), birdMat); head.position.set(0, 0.03, 0.29); b.add(head);
      var tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.16), birdMat); tail.position.set(0, 0, -0.3); b.add(tail);
      var wl = new THREE.Mesh(wingGeoL, birdMat); wl.castShadow = true; wl.position.x = -0.05; b.add(wl);
      var wr = new THREE.Mesh(wingGeoR, birdMat); wr.castShadow = true; wr.position.x = 0.05; b.add(wr);
      b.userData = { wl: wl, wr: wr };
      return b;
    }
    var FORMATION = [[0, 0], [-0.95, -0.9], [0.95, -0.9], [-1.9, -1.8], [1.9, -1.8], [-2.85, -2.7]];
    var flocks = [
      { R: 15, H: 10, w: 0.16, a0: 0, size: 6 },
      { R: 10, H: 13.5, w: -0.12, a0: 2.4, size: 5 }
    ].map(function (f) {
      f.birds = [];
      for (var i = 0; i < f.size; i++) { var b = makeBird(); b.userData.ph = rnd() * 6.28; scene.add(b); f.birds.push({ mesh: b, off: FORMATION[i] }); }
      return f;
    });
    var fwd = new THREE.Vector3(), side = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), bp = new THREE.Vector3();
    function flyBirds(t) {
      flocks.forEach(function (f) {
        var a = f.a0 + t * f.w;
        var cx = Math.cos(a) * f.R, cz = Math.sin(a) * f.R * 0.8, cy = f.H + Math.sin(a * 3) * 0.7;
        var s = Math.sign(f.w) || 1;
        fwd.set(-Math.sin(a) * s, 0, Math.cos(a) * 0.8 * s).normalize();
        side.crossVectors(UP, fwd).normalize();
        f.birds.forEach(function (b) {
          var ph = b.mesh.userData.ph;
          bp.set(cx, cy, cz).addScaledVector(side, b.off[0]).addScaledVector(fwd, b.off[1]);
          bp.y += Math.sin(t * 1.3 + ph) * 0.18;
          b.mesh.position.copy(bp);
          b.mesh.lookAt(bp.x + fwd.x, bp.y + fwd.y, bp.z + fwd.z);
          b.mesh.rotateZ(-s * 0.25);
          var gliding = Math.sin(t * 0.6 + ph) < 0.1;
          var flap = gliding ? 0.12 : Math.sin(t * 8 + ph) * 0.55;
          b.mesh.userData.wl.rotation.z = flap;
          b.mesh.userData.wr.rotation.z = -flap;
        });
      });
    }

    // ----- the holdings: the plan's own, or the example kingdom (six holdings in five districts) -----
    var HOLD = planMode ? opts.holdings.slice(0, 48).map(function (h) { return { id: h.id, fam: h.style, style: h.style, inv: h.cost, cur: h.value }; }) : [
      { fam: "Stocks", style: "tower", inv: 2400, cur: 2830 },
      { fam: "Stocks", style: "tower", inv: 1800, cur: 2600 },
      { fam: "Funds", style: "hall", inv: 4000, cur: 4420 },
      { fam: "Gold", style: "mine", inv: 1500, cur: 1680 },
      { fam: "Bonds", style: "vault", inv: 1500, cur: 1430 },
      { fam: "Crypto", style: "wizard", inv: 900, cur: 1180 }
    ];
    var GROUND_FOR = { tower: "pave", hall: "market", mine: "gravel", wizard: "cobble", vault: "pave" };
    var FLAG_UP = 0x2fa860, FLAG_DOWN = 0xd9443a;
    var maxV = Math.max.apply(null, [1e-9].concat(HOLD.map(function (h) { return h.cur; })));
    var pickables = [];
    var fams = [];
    HOLD.forEach(function (h) {
      var f = fams.filter(function (x) { return x.name === h.fam; })[0];
      if (!f) { f = { name: h.fam, style: h.style, members: [] }; fams.push(f); }
      f.members.push(h);
    });

    var risers = [{ obj: castle, delay: 0.3 }];
    var anims = [];
    var coinGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 14);
    var smokeGeo = new THREE.SphereGeometry(0.22, 10, 8);
    var smokeMat = new THREE.MeshStandardMaterial({ color: 0x777777, transparent: true, opacity: 0.5, roughness: 1, depthWrite: false });
    function addFx(obj, up, y) {
      var g = new THREE.Group(); g.position.copy(obj.position); scene.add(g);
      for (var i = 0; i < 6; i++) {
        var m = up ? new THREE.Mesh(coinGeo, MAT.gold) : new THREE.Mesh(smokeGeo, smokeMat);
        m.visible = false; g.add(m);
        anims.push({ type: up ? "coin" : "smoke", mesh: m, base: y, phase: i / 6, r: up ? 0.45 : 0.25, a: i * 1.05, owner: obj });
      }
    }
    var castleFlag = flagFor(castle, 6.2, FLAG_UP);
    anims.push({ type: "flag", mesh: castleFlag, phase: 0 });

    fams.forEach(function (f, i) {
      var spot = SPOTS[i];
      scene.add(patch(spot.x, spot.z, spot.w - 0.5, spot.d - 0.5, GROUND[GROUND_FOR[f.style]]));
      var n = f.members.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
      var cw = (spot.w - 0.8) / cols, cd = (spot.d - 0.8) / rows;
      var scale = Math.min(1, Math.min(cw, cd) / 3.0);
      f.members.forEach(function (h, j) {
        var c = j % cols, r = Math.floor(j / cols);
        var g = new THREE.Group();
        var top = BUILD[f.style](g, Math.sqrt(h.cur / maxV));
        var up = h.cur >= h.inv;
        if (!up) g.traverse(function (o) {
          if (o.isMesh && o.material && !Array.isArray(o.material) && o.material.color && o.material !== MAT.glow) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.6); }
          else if (o.isMesh && Array.isArray(o.material)) o.material = o.material.map(function (m) { var c2 = m.clone(); c2.color.multiplyScalar(0.6); return c2; });
        });
        var fl = flagFor(g, top, up ? FLAG_UP : FLAG_DOWN);
        anims.push({ type: "flag", mesh: fl, phase: i * 2 + j });
        if (g.userData.spin) anims.push({ type: "spin", mesh: g.userData.spin });
        g.userData.finalScale = scale;
        g.userData.holdingId = h.id;
        pickables.push(g);
        g.scale.setScalar(scale);
        g.position.set(spot.x - (spot.w - 0.8) / 2 + cw * (c + 0.5), 0, spot.z - (spot.d - 0.8) / 2 + cd * (r + 0.5));
        scene.add(g);
        risers.push({ obj: g, delay: 1.1 + risers.length * 0.55 });
        addFx(g, up, (top + 0.4) * scale);
      });
    });

    // Buildings start flat and rise into place one after another, like a portfolio filling in.
    risers.forEach(function (r) { r.base = r.obj.userData.finalScale || 1; r.obj.scale.y = 0.001; r.obj.visible = false; });
    var ease = function (x) { return 1 - Math.pow(1 - x, 3); };


    // ----- sky: a gradient dome, stars at night, soft clouds -----
    var skyUniforms = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, glow: { value: new THREE.Color() } };
    var sky = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 20), new THREE.ShaderMaterial({
      uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 glow; varying vec3 vP;",
        "void main(){",
        "  float h = clamp(vP.y, -0.2, 1.0);",
        "  vec3 c = mix(horizon, mid, smoothstep(0.0, 0.22, h));",
        "  c = mix(c, top, smoothstep(0.22, 0.75, h));",
        "  float g = exp(-pow(h * 9.0, 2.0)) * (0.55 + 0.45 * max(0.0, vP.x));",
        "  c += glow * g * 0.55;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}"
      ].join("\n")
    }));
    scene.add(sky);

    var starGeo = new THREE.BufferGeometry(), starPos = [];
    for (var si = 0; si < 900; si++) {
      var th = rnd() * Math.PI * 2, ph = Math.acos(0.15 + rnd() * 0.85), R = 200;
      starPos.push(Math.sin(ph) * Math.cos(th) * R, Math.cos(ph) * R, Math.sin(ph) * Math.sin(th) * R);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    var starMat = new THREE.PointsMaterial({ color: 0xfff6dc, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false, depthWrite: false });
    var stars = new THREE.Points(starGeo, starMat); scene.add(stars);

    var cloudTex = tex(128, function (g, S) {
      var gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(0.5, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr; g.fillRect(0, 0, S, S);
    });
    cloudTex.encoding = THREE.LinearEncoding;
    var clouds = [];
    for (var ci = 0; ci < 10; ci++) {
      var cg = new THREE.Group(), puffs = 3 + Math.floor(rnd() * 3);
      for (var pi = 0; pi < puffs; pi++) {
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.6, fog: false }));
        sp.position.set((pi - puffs / 2) * 4 + rnd() * 2, rnd() * 1.6, rnd() * 2);
        sp.scale.setScalar(7 + rnd() * 5);
        cg.add(sp);
      }
      var ca = rnd() * Math.PI * 2, cr = 50 + rnd() * 50;
      cg.position.set(Math.cos(ca) * cr, 22 + rnd() * 18, Math.sin(ca) * cr);
      cg.userData = { a: ca, r: cr, speed: 0.004 + rnd() * 0.006 };
      scene.add(cg); clouds.push(cg);
    }

    // ----- day and night follow the site theme -----
    var THEMES = {
      light: { top: 0x7fc3d6, mid: 0xbfe6dc, horizon: 0xfbe9c8, glow: 0xffd28a, fog: 0xdcefe4, sun: 1.45, hemi: 0.85, stars: 0, cloud: 0.75, exposure: 1.08, glowWin: 1.0, water: 0x6fb9a8 },
      dark:  { top: 0x020907, mid: 0x062219, horizon: 0x1d5442, glow: 0xb58a3a, fog: 0x0c3328, sun: 0.55, hemi: 0.42, stars: 0.85, cloud: 0.18, exposure: 0.95, glowWin: 2.4, water: 0x7fb8a6 }
    };
    var themeK = document.documentElement.getAttribute("data-theme") === "dark" ? 1 : 0, themeGoal = themeK;
    var cA = new THREE.Color(), cB = new THREE.Color();
    function mixHex(a, b, k, out) { cA.setHex(a); cB.setHex(b); return out.copy(cA).lerp(cB, k); }
    function applyTheme(k) {
      var L = THEMES.light, D = THEMES.dark;
      mixHex(L.top, D.top, k, skyUniforms.top.value); mixHex(L.mid, D.mid, k, skyUniforms.mid.value);
      mixHex(L.horizon, D.horizon, k, skyUniforms.horizon.value); mixHex(L.glow, D.glow, k, skyUniforms.glow.value);
      mixHex(L.fog, D.fog, k, scene.fog.color); renderer.setClearColor(scene.fog.color);
      mixHex(L.water, D.water, k, MAT.water.color);
      sun.intensity = L.sun + (D.sun - L.sun) * k; sun.color.copy(new THREE.Color(0xffe6b8)).lerp(new THREE.Color(0xb7c8ff), k);
      hemi.intensity = L.hemi + (D.hemi - L.hemi) * k;
      starMat.opacity = D.stars * k; stars.visible = k > 0.02;
      clouds.forEach(function (c) { c.children.forEach(function (s) { s.material.opacity = L.cloud + (D.cloud - L.cloud) * k; }); });
      MAT.glow.emissiveIntensity = L.glowWin + (D.glowWin - L.glowWin) * k;
      renderer.toneMappingExposure = L.exposure + (D.exposure - L.exposure) * k;
    }
    applyTheme(themeK);
    var themeWatch = new MutationObserver(function () { themeGoal = document.documentElement.getAttribute("data-theme") === "dark" ? 1 : 0; kick(); });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    cleanups.push(function () { themeWatch.disconnect(); });

    // ----- the camera flies a path tied to scroll: wide, side, close, behind, overview -----
    var KEYS = [
      { p: [36, 7.5, 34], t: [0, 9.5, 0] },
      { p: [-34, 10, 26], t: [0, 8.5, 0] },
      { p: [-21, 6.5, -20], t: [0, 6.5, 0] },
      { p: [26, 12, -28], t: [0, 8, 0] },
      { p: [6, 30, 40], t: [0, 7, 0] }
    ];
    var vA = new THREE.Vector3(), vB = new THREE.Vector3(), camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
    var wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3();
    function pathAt(p) {
      var f = Math.max(0, Math.min(1, p)) * (KEYS.length - 1), i = Math.min(KEYS.length - 2, Math.floor(f)), k = f - i;
      k = k * k * (3 - 2 * k);
      wantPos.copy(vA.fromArray(KEYS[i].p)).lerp(vB.fromArray(KEYS[i + 1].p), k);
      wantTgt.copy(vA.fromArray(KEYS[i].t)).lerp(vB.fromArray(KEYS[i + 1].t), k);
    }
    function scrollProgress() {
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return window.scrollY / max;
    }
    // On a plan page the camera circles the island instead: drag sideways to turn it, up and down to tilt.
    // It drifts slowly on its own until someone drags.
    var orbit = { theta: 0.75, phi: 0.5, dist: 40, auto: true };
    function orbitAt() {
      var r = orbit.dist * (camera.aspect < 1 ? 1.35 : 1);
      wantPos.set(Math.sin(orbit.theta) * Math.cos(orbit.phi) * r, 1 + Math.sin(orbit.phi) * r, Math.cos(orbit.theta) * Math.cos(orbit.phi) * r);
      wantTgt.set(0, 1.6, 0);
    }
    function aim() { if (planMode) orbitAt(); else pathAt(scrollProgress()); }
    var mouseX = 0, mouseY = 0;
    if (planMode) {
      var cvs = renderer.domElement, drag = null, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hoverId = null;
      var pick = function (e) {
        var r = cvs.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        var hit = ray.intersectObjects(pickables, true)[0], o = hit && hit.object;
        while (o && !o.userData.holdingId) o = o.parent;
        var id = o ? o.userData.holdingId : null;
        if (id !== hoverId || id) { hoverId = id; if (opts.onHover) opts.onHover(id, e.clientX, e.clientY); }
        cvs.style.cursor = drag ? "grabbing" : id ? "pointer" : "grab";
      };
      on(cvs, "pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, moved: false }; orbit.auto = false; try { cvs.setPointerCapture(e.pointerId); } catch (err) {} });
      on(cvs, "pointermove", function (e) {
        if (drag) {
          var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
          orbit.theta -= dx * 0.008;
          if (e.pointerType === "mouse") orbit.phi = Math.max(0.22, Math.min(1.25, orbit.phi + dy * 0.005));
          drag.x = e.clientX; drag.y = e.clientY;
          kick();
        }
        pick(e);
      });
      var endDrag = function (e) { if (drag && !drag.moved) pick(e); drag = null; };
      on(cvs, "pointerup", endDrag);
      on(cvs, "pointercancel", function () { drag = null; });
      on(cvs, "pointerleave", function () { if (!drag && hoverId) { hoverId = null; if (opts.onHover) opts.onHover(null, 0, 0); } });
    } else {
      on(window, "pointermove", function (e) { mouseX = e.clientX / window.innerWidth - 0.5; mouseY = e.clientY / window.innerHeight - 0.5; }, { passive: true });
      on(window, "scroll", function () { kick(); }, { passive: true });
    }

    // ----- size, visibility and frame loop -----
    function resize() {
      var w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 52 : 36;
      camera.updateProjectionMatrix();
    }
    resize();
    aim(); camPos.copy(wantPos); camTgt.copy(wantTgt);
    on(window, "resize", resize);
    if (planMode && typeof ResizeObserver !== "undefined") {
      var sizeWatch = new ResizeObserver(function () { resize(); kick(); });
      sizeWatch.observe(host);
      cleanups.push(function () { sizeWatch.disconnect(); });
    }

    var running = true;
    on(document, "visibilitychange", function () { running = !document.hidden; if (running) kick(); });
    var clock = new THREE.Clock(), looping = false, startAt = performance.now(), rafId = 0, destroyed = false;
    function kick() { if (!looping && !destroyed) { looping = true; rafId = requestAnimationFrame(frame); } }
    function frame() {
      if (!running || destroyed) { looping = false; return; }
      rafId = requestAnimationFrame(frame);
      var t = reduceMotion ? 0 : clock.getElapsedTime() * 0.5;
      var since = (performance.now() - startAt) / 1000;

      if (planMode && orbit.auto && !reduceMotion) orbit.theta += 0.0011;
      aim();
      if (!planMode) {
        var drift = reduceMotion ? 0 : Math.sin(t * 0.15) * 1.2;
        wantPos.x += mouseX * 3 + drift; wantPos.y += -mouseY * 1.6;
      }
      var ease2 = reduceMotion ? 1 : planMode ? 0.14 : 0.05;
      camPos.lerp(wantPos, ease2); camTgt.lerp(wantTgt, ease2);
      camera.position.copy(camPos); camera.lookAt(camTgt);

      if (Math.abs(themeGoal - themeK) > 0.002) { themeK += (themeGoal - themeK) * (reduceMotion ? 1 : 0.06); applyTheme(themeK); }

      risers.forEach(function (r) {
        var k = reduceMotion ? 1 : Math.max(0, Math.min(1, (since - r.delay) / 1.1));
        r.obj.visible = k > 0;
        r.obj.scale.y = Math.max(0.001, r.base * ease(k));
      });
      T.water.offset.set(t * 0.003, t * 0.0015);
      waveUniforms.uTime.value = t * 0.7;
      foams.forEach(function (f) {
        var p = reduceMotion ? 0.3 : (t * 0.16 + f.phase) % 1;
        f.grp.scale.set(1 + p * 0.05, 1, 1 + p * 0.05);
        f.grp.children.forEach(function (m) { m.material.opacity = 0.5 * Math.sin(p * Math.PI); });
      });
      clouds.forEach(function (c) { var a = c.userData.a + t * c.userData.speed; c.position.x = Math.cos(a) * c.userData.r; c.position.z = Math.sin(a) * c.userData.r; });
      flyBirds(t);
      anims.forEach(function (a) {
        if (a.type === "flag") a.mesh.rotation.y = Math.sin(t * 2.0 + a.phase) * 0.22;
        else if (a.type === "spin") a.mesh.rotation.y = t * 1.2;
        else {
          var shown = a.owner.visible && a.owner.scale.y > (a.owner.userData.finalScale || 1) * 0.95;
          a.mesh.visible = shown;
          if (!shown) return;
          var p = reduceMotion ? a.phase : (t * (a.type === "coin" ? 0.45 : 0.3) + a.phase) % 1, ang = a.a + t * 0.8;
          a.mesh.position.set(Math.cos(ang) * a.r, a.base + p * (a.type === "coin" ? 1.4 : 1.8), Math.sin(ang) * a.r);
          if (a.type === "coin") { a.mesh.rotation.set(Math.PI / 2, 0, t * 4 + a.a); a.mesh.scale.setScalar(1 - p * 0.6); }
          else a.mesh.scale.setScalar(0.6 + p * 1.6);
        }
      });
      renderer.render(scene, camera);
    }
    kick();

    return {
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(rafId);
        cleanups.forEach(function (f) { f(); });
        scene.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
          ms.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); });
        });
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  } catch (err) {
    cleanups.forEach(function (f) { f(); });
    return null;
  }
  }

  window.LLWorld = { mount: mount };
})();
