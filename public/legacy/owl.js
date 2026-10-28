(function () {
  "use strict";
  // The Golden Owl: the Steward's companion. Builds the 3D model and animates it.
  // LLOwl.create(THREE, { reduceMotion }) returns:
  //   root      the model, standing on its feet at the origin, facing +z, about 1.9 tall
  //   react(m, t)  play a short reaction: "greet", "gain" or "dip"
  //   hold(m)   keep a mood between reactions ("dip" while a kingdom is down), or null
  //   update(t, fly)  pose for time t (seconds); fly is 0 when perched, 1 in full flight
  function create(THREE, opts) {
    opts = opts || {};
    var reduce = !!opts.reduceMotion;
    function M(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0 }, o || {})); }
    function add(parent, geo, mat, x, y, z) {
      var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
    }
    function pivot(parent, x, y, z) { var g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g; }
    function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

    var gold = M(0xf2c230, { metalness: 0.5, roughness: 0.38, emissive: 0x2a1c00 });
    var goldDeep = M(0xc99a1c, { metalness: 0.4, roughness: 0.45 });
    var goldDark = M(0x94700f, { metalness: 0.3, roughness: 0.55 });
    var cream = M(0xf6e9c4, { roughness: 0.85 });
    var peach = M(0xffb37a, { roughness: 0.5 });
    var talon = M(0x3a2a14, { roughness: 0.4 });
    var mint = M(0x2ee6a6, { emissive: 0x0b6a4a, emissiveIntensity: 0.7, roughness: 0.2 });
    var ringMat = M(0xf5c542, { metalness: 0.75, roughness: 0.25 });
    var black = M(0x0a0d0c, { roughness: 0.15 });
    var glint = new THREE.MeshBasicMaterial({ color: 0xffffff });

    var root = new THREE.Group();
    var body = pivot(root);

    // Feet: three toes each, with dark talons.
    var feet = pivot(body, 0, 0.06, 0.12);
    [-1, 1].forEach(function (s) {
      [-0.35, 0, 0.35].forEach(function (a) {
        var toe = pivot(feet, s * 0.17, 0, 0); toe.rotation.y = a;
        add(toe, new THREE.CylinderGeometry(0.035, 0.045, 0.2, 6), peach, 0, 0, 0.1).rotation.x = Math.PI / 2;
        add(toe, new THREE.ConeGeometry(0.03, 0.08, 6), talon, 0, -0.01, 0.22).rotation.x = Math.PI / 2;
      });
    });

    var trunk = add(body, new THREE.SphereGeometry(0.6, 24, 18), gold, 0, 0.7, 0); trunk.scale.set(1, 1.1, 0.95);
    var belly = add(body, new THREE.SphereGeometry(0.48, 22, 16), cream, 0, 0.64, 0.27); belly.scale.set(0.84, 0.95, 0.55);
    // Feather chevrons across the chest.
    [[0.48, [-0.2, 0, 0.2]], [0.66, [-0.26, -0.09, 0.09, 0.26]], [0.84, [-0.17, 0.0, 0.17]]].forEach(function (row) {
      row[1].forEach(function (x) {
        var v = add(body, new THREE.SphereGeometry(0.05, 8, 6), goldDeep, x, row[0], 0.52 - Math.abs(x) * 0.35);
        v.scale.set(1.3, 0.45, 0.35); v.castShadow = false;
      });
    });
    // Tail: three fanned feathers.
    [-1, 0, 1].forEach(function (k) {
      var f = add(body, new THREE.SphereGeometry(0.1, 10, 8), goldDark, k * 0.12, 0.2, -0.5);
      f.scale.set(0.9, 0.35, 2.6); f.rotation.set(0.65, k * 0.25, 0);
    });

    // Wings, with three long primary feathers at the tips.
    var wingL = pivot(body, -0.56, 1.0, -0.02), wingR = pivot(body, 0.56, 1.0, -0.02);
    [[wingL, -1], [wingR, 1]].forEach(function (p) {
      var w = add(p[0], new THREE.SphereGeometry(0.3, 18, 14), goldDeep, p[1] * 0.04, -0.32, 0); w.scale.set(0.4, 1.22, 1.05);
      for (var i = 0; i < 3; i++) {
        var f = add(p[0], new THREE.SphereGeometry(0.1, 10, 8), goldDark, p[1] * 0.05, -0.66 - i * 0.03, -0.14 + i * 0.13);
        f.scale.set(0.45, 2.2, 0.75); f.rotation.x = -0.25 + i * 0.12;
      }
    });

    // Head: face discs, mint eyes in gold rings, feather brows, ear tufts and the Steward's crown.
    var head = pivot(body, 0, 1.3, 0.02);
    add(head, new THREE.SphereGeometry(0.47, 24, 18), gold, 0, 0, 0);
    var lids = [], brows = [];
    [-1, 1].forEach(function (s) {
      var disc = add(head, new THREE.CylinderGeometry(0.21, 0.21, 0.05, 28), cream, s * 0.18, 0.02, 0.38); disc.rotation.x = Math.PI / 2;
      add(head, new THREE.SphereGeometry(0.118, 18, 14), mint, s * 0.18, 0.03, 0.42);
      var ring = add(head, new THREE.TorusGeometry(0.12, 0.018, 8, 28), ringMat, s * 0.18, 0.03, 0.445); ring.castShadow = false;
      add(head, new THREE.SphereGeometry(0.062, 14, 10), black, s * 0.18, 0.03, 0.515);
      add(head, new THREE.SphereGeometry(0.022, 8, 6), glint, s * 0.18 + 0.028, 0.065, 0.57).castShadow = false;
      var lid = add(head, new THREE.SphereGeometry(0.128, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, s * 0.18, 0.03, 0.43);
      lid.rotation.x = 0.2; lid.scale.y = 0.05; lids.push(lid);
      var brow = add(head, new THREE.BoxGeometry(0.2, 0.045, 0.06), goldDark, s * 0.18, 0.19, 0.44); brow.userData.side = s; brows.push(brow);
      var tuft = add(head, new THREE.ConeGeometry(0.09, 0.34, 6), goldDeep, s * 0.28, 0.43, -0.05); tuft.rotation.z = -s * 0.45;
    });
    add(head, new THREE.ConeGeometry(0.065, 0.2, 8), peach, 0, -0.09, 0.5).rotation.x = Math.PI * 0.92;
    var crown = pivot(head, 0, 0.43, -0.02); crown.rotation.z = 0.12;
    add(crown, new THREE.CylinderGeometry(0.17, 0.17, 0.09, 20, 1, true), Object.assign(gold.clone(), { side: THREE.DoubleSide }), 0, 0, 0);
    for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2 + Math.PI / 2; add(crown, new THREE.ConeGeometry(0.04, 0.13, 6), gold, Math.cos(a) * 0.165, 0.1, Math.sin(a) * 0.165); }
    add(crown, new THREE.OctahedronGeometry(0.045), mint, 0, 0.02, 0.18);

    // ----- animation -----
    var mood = "idle", moodAt = 0, held = null, heldW = 0, nextBlink = 2;
    var LENGTH = { greet: 2.4, gain: 2.6, dip: 3.2 };
    function react(m, t) { mood = m; moodAt = t; }
    function hold(m) { held = m; }

    function update(t, fly) {
      fly = fly || 0;
      var p = 0, w = 0;
      if (mood !== "idle") {
        var el = t - moodAt, len = LENGTH[mood];
        p = el / len; w = smooth(el / 0.3) * (1 - smooth((el - (len - 0.45)) / 0.45));
        if (el > len) mood = "idle";
      }
      var m = mood;
      heldW += ((held && mood === "idle" ? 1 : 0) - heldW) * 0.06;
      if (m === "idle" && held && heldW > 0.01) { m = held; w = heldW; p = 0.5; }
      w *= 1 - fly;

      var calm = reduce ? 0 : 1;
      body.position.y = Math.sin(t * 1.8) * 0.012 * calm * (1 - fly);
      body.scale.set(1, 1, 1); body.rotation.set(0.5 * fly, 0, 0);
      head.rotation.set(-0.4 * fly, Math.sin(t * 0.5) * 0.45 * calm * (1 - fly), Math.sin(t * 0.37) * 0.08 * calm);
      feet.rotation.x = -1.1 * fly;
      var open = 1.25 * fly, flap = Math.sin(t * 11) * 0.75 * fly;
      wingL.rotation.set(0, 0, -(open + flap)); wingR.rotation.set(0, 0, open + flap);
      var lid = 0.05, browLift = 0, browTilt = 0;
      if (!reduce) { if (t > nextBlink) nextBlink = t + 2.5 + Math.random() * 2; if (nextBlink - t > 2.3) lid = 1; }

      if (m === "greet") {
        wingR.rotation.z += (1.6 + Math.sin(p * 20) * 0.35) * w;
        head.rotation.z += -0.25 * w; head.rotation.y *= 1 - w; browLift = 0.03 * w;
      } else if (m === "gain") {
        body.position.y += Math.abs(Math.sin(p * Math.PI * 3)) * 0.28 * w;
        var beat = (1.1 + Math.sin(p * 40) * 0.5) * w; wingL.rotation.z -= beat; wingR.rotation.z += beat;
        browLift = 0.04 * w;
      } else if (m === "dip") {
        body.scale.set(1 + 0.05 * w, 1 - 0.08 * w, 1); head.rotation.x += 0.3 * w; head.rotation.y *= 1 - w;
        wingL.rotation.z += 0.08 * w; wingR.rotation.z -= 0.08 * w;
        lid = Math.max(lid, 0.5 * w); browTilt = 0.4 * w;
      }
      lids.forEach(function (l) { l.scale.y = Math.max(0.05, lid); });
      brows.forEach(function (b) { var s = b.userData.side; b.position.y = 0.19 + browLift; b.rotation.z = s * (0.12 - browTilt); }); // outer ends up when calm, inner ends up when worried
    }

    return { root: root, top: 1.95, react: react, hold: hold, update: update };
  }

  window.LLOwl = { create: create };
})();
