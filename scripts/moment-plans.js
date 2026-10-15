window.prBearing = function(deg) {
  const r = deg * Math.PI / 180;
  return { x: Math.sin(r), y: -Math.cos(r) };
};

window.prSleetPlan = function(fx, box, mode) {
  const v = prBearing(fx.angle);
  const grid = box.grid || 100;
  const spread = box.spread || 1;
  const bands = [
    { cls: "pr-ov-shard-far", n: 30, w: 1.4, len: [8, 16], dur: [3.0, 4.4] },
    { cls: "pr-ov-shard-mid", n: 20, w: 2.1, len: [15, 27], dur: [2.0, 2.9] },
    { cls: "", n: 12, w: 2.9, len: [24, 40], dur: [1.3, 1.9] }
  ];

  const shards = [];
  for (const b of bands) {
    const count = Math.round(b.n * fx.density * (mode === "ground" ? spread : 1));
    for (let i = 0; i < count; i++) {
      const len = mode === "ground"
        ? grid * 0.01 * _prRnd(b.len[0], b.len[1]) * fx.size
        : _prRnd(b.len[0], b.len[1]) * fx.size;
      const x = _prRnd(-0.2, 1.18);
      const glow = _prRnd(4, 9);
      const seconds = _prRnd(b.dur[0], b.dur[1]) / fx.speed;
      const phase = -_prRnd(0, 5);
      shards.push({
        band: b.cls, len, x, glow, seconds, phase,
        thick: (mode === "ground" ? grid * 0.01 * b.w : b.w) * Math.sqrt(fx.size)
      });
    }
  }
  return { shards, bearing: v, tilt: fx.angle - 180, travel: (box.h || 0) };
};

window.prVerdantPlan = function(fx, box, mode) {
  const grid = box.grid || 100;
  const spread = box.spread || 1;
  const v = prBearing(fx.angle);
  const count = Math.round(52 * fx.density * (mode === "ground" ? spread : 1));

  const spores = [];
  for (let i = 0; i < count; i++) {
    const size = mode === "ground"
      ? grid * 0.01 * _prRnd(5, 15) * fx.size
      : _prRnd(5, 15) * fx.size;
    const reach = mode === "ground" ? grid * 0.01 * _prRnd(14, 34) : _prRnd(14, 34);
    const x = _prRnd(0.01, 0.99);
    const y = _prRnd(0.02, 0.98);
    const seconds = _prRnd(2.4, 5.2) / fx.speed;
    const phase = -_prRnd(0, 5);
    spores.push({ size, reach, x, y, seconds, phase });
  }
  return { spores, bearing: v };
};

window.prMotesPlan = function(fx, box, mode) {
  const grid = box.grid || 100;
  const spread = box.spread || 1;
  const a = fx.angle;
  const dir = (a < 45 || a >= 315) ? "up" : (a >= 135 && a < 225) ? "down" : "angle";
  const count = Math.round(14 * fx.density * (mode === "ground" ? spread : 1));
  const size = (mode === "ground" ? grid * 0.05 : 5) * fx.size;

  const motes = [];
  for (let i = 0; i < count; i++) {
    const x = 0.05 + Math.random() * 0.88;
    const y = 0.18 + Math.random() * 0.72;
    const seconds = (5 + Math.random() * 6) / fx.speed;
    const phase = Math.random() * 6;
    motes.push({ x, y, seconds, phase });
  }
  return { motes, dir, size, bearing: prBearing(a), reach: mode === "ground" ? grid * 1.3 : 130 };
};

window.prGlimmerPlan = function(fx, box, mode) {
  const count = Math.round(60 * fx.density * (mode === "ground" ? (box.spread || 1) : 1));
  const basis = mode === "ground" ? (box.grid || 100) * 0.16 : 1;

  const glints = [];
  for (let i = 0; i < count; i++) {
    const size = mode === "ground"
      ? basis * _prRnd(0.7, 2.1) * fx.size
      : _prRnd(7, 21) * fx.size;
    const x = _prRnd(0.01, 0.99);
    const y = _prRnd(0.03, 0.97);
    const seconds = _prRnd(4.5, 9) / fx.speed;
    const phase = mode === "ground" ? Math.random() * seconds : -_prRnd(0, 9);
    glints.push({ size, x, y, seconds, phase });
  }
  return { glints, turnRate: 0.35 * fx.speed };
};

window.prSurgePlan = function(fx, box, mode) {
  const grid = box.grid || 100;
  const spread = box.spread || 1;
  const every = mode === "ground"
    ? Math.max(0.14, 1.05 / fx.speed / fx.density / spread)
    : Math.max(300, 1050 / fx.speed / fx.density);

  const burst = () => {
    let reach, x, y, life;
    if (mode === "ground") {
      reach = grid * _prRnd(1.1, 2.2) * fx.size;
      x = _prRnd(0.08, 0.92);
      y = _prRnd(0.1, 0.9);
      life = _prRnd(1.5, 2.3) / fx.speed;
    } else {
      x = _prRnd(0.08, 0.92);
      y = _prRnd(0.1, 0.9);
      reach = Math.min(box.w, box.h) * _prRnd(0.11, 0.22) * fx.size;
      life = _prRnd(1500, 2300) / fx.speed;
    }
    const n = Math.round(_prRnd(7, 12) * fx.density);
    const drops = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + _prRnd(-0.3, 0.3);
      const drop = { a };
      if (mode === "ground") {
        drop.len = grid * 0.34 * _prRnd(0.7, 1.7) * fx.size;
        drop.reach = reach * _prRnd(0.7, 1.5);
      } else {
        drop.reach = reach * _prRnd(0.7, 1.5);
        drop.len = _prRnd(18, 46) * fx.size;
        drop.thick = _prRnd(3, 7) * Math.sqrt(fx.size);
        drop.lifeScale = _prRnd(0.75, 1.15);
        drop.delay = _prRnd(0, 90);
      }
      drops.push(drop);
    }
    return { reach, x, y, life, drops };
  };

  return { every, burst };
};

window.prBloomPlan = function(fx, box, mode) {
  const grid = box.grid || 100;
  const spread = box.spread || 1;
  const every = mode === "ground"
    ? Math.max(0.08, 0.62 / fx.speed / fx.density / spread)
    : Math.max(150, 620 / fx.speed / fx.density);
  const seed = mode === "ground"
    ? Math.min(28, Math.max(2, Math.round(4 * fx.density * spread)))
    : Math.max(2, Math.round(4 * fx.density));

  const open = () => {
    let size, x, y, life;
    if (mode === "ground") {
      size = grid * _prRnd(0.7, 1.6) * fx.size;
      x = _prRnd(0.08, 0.92);
      y = _prRnd(0.1, 0.9);
      life = _prRnd(2.6, 4.2) / fx.speed;
    } else {
      x = _prRnd(0.08, 0.92);
      y = _prRnd(0.1, 0.9);
      size = Math.min(box.w, box.h) * _prRnd(0.07, 0.16) * fx.size;
      life = _prRnd(2600, 4200) / fx.speed;
    }
    const n = Math.round(_prRnd(5, 8));
    const petals = [];
    for (let i = 0; i < n; i++) {
      if (mode === "ground") {
        const rot = (i / n) * Math.PI * 2 + _prRnd(-0.2, 0.2);
        petals.push({ rot, w: size * _prRnd(0.5, 0.85), hue: (i / n) * 360 * fx.spread });
      } else {
        const w = size * _prRnd(0.4, 0.72);
        const h = size * _prRnd(0.7, 1.15);
        petals.push({
          w, h,
          hue: i * 44,
          rot: (i / n) * 360 + _prRnd(-12, 12),
          lifeScale: _prRnd(0.85, 1.1),
          delay: _prRnd(0, 260)
        });
      }
    }
    return { size, x, y, life, petals };
  };

  return { every, seed, open, floorRate: 0.05 * fx.speed };
};

window.prVortexPlan = function(fx, box, mode) {
  const diag = Math.hypot(box.w, box.h) / 2;
  const half = Math.min(box.w, box.h) / 2;
  const eyeR = half * (fx.eye / 100);
  const outer = Math.max(eyeR * 1.25, diag * 1.22 * fx.size);
  const spin = fx.spin === "ccw" ? -1 : 1;

  const bodyW = outer * 2.3;
  const armFloor = half * 0.05;
  const count = Math.round(30 * fx.density * (mode === "ground" ? Math.min(4, Math.sqrt(box.spread || 1)) : 1));

  const arms = [];
  for (let i = 0; i < count; i++) {
    const t = Math.pow(Math.random(), 1.25);
    const span = 70 + Math.pow(Math.random(), 0.8) * 175;
    const thick = mode === "ground"
      ? (0.03 + Math.pow(Math.random(), 1.7) * 0.16) * (0.55 + t * 0.8)
      : (9 + Math.pow(Math.random(), 1.7) * 78) * (0.55 + t * 0.8);
    const base = Math.max(eyeR, armFloor);
    const r = base + t * (outer - base);
    const off = t * 3.1;
    const mag = r * 0.09;
    const arm = {
      t, r, span, thick,
      size: r * 2,
      dx: Math.cos(off) * mag,
      dy: Math.sin(off) * mag * 0.8,
      turnSeconds: (6 + t * 14) / fx.speed
    };
    if (mode === "ground") {
      arm.blur = 4 + t * 10;
      arm.alpha = 0.8 - t * 0.28;
      arm.rot0 = Math.random() * Math.PI * 2;
      arm.rate = spin * (Math.PI * 2) / arm.turnSeconds;
    } else {
      arm.blur = 5 + t * 15;
      arm.peak = 0.2 + _prRnd(0, 0.42);
      arm.delay = -_prRnd(0, 12);
      arm.wobSeconds = _prRnd(5, 10) / fx.speed;
      arm.wobDelay = -_prRnd(0, 8);
      arm.wobScaleY = _prRnd(0.86, 1);
    }
    arms.push(arm);
  }

  return {
    diag, half, eyeR, outer, spin, bodyW,
    eyeFraction: eyeR / (bodyW / 2),
    bodySeconds: 26 / fx.speed,
    bodyRate: 0.06 * spin * fx.speed,
    arms
  };
};

window.prAuroraPlan = function(fx, box, mode) {
  const side = Math.hypot(box.w, box.h);
  const turn = fx.angle * Math.PI / 180;
  const reach = Math.abs(box.w * Math.sin(turn)) + Math.abs(box.h * Math.cos(turn));
  const thin = mode === "ground" ? Math.min(3, Math.sqrt(box.spread || 1)) : 1;
  const share = Math.min(1, 3 / fx.bands);

  const bands = [];
  for (let b = 0; b < fx.bands; b++) {
    const depth = fx.bands === 1 ? 0 : b / (fx.bands - 1);
    const edge = side / 2 + reach * (0.3 - depth * 0.44 + _prRnd(-0.03, 0.03));
    const len = reach * (0.5 - depth * 0.2) * fx.size;
    const amp = reach * (0.075 - depth * 0.03) * fx.size;
    const folds = _prRnd(1.1, 2.4);
    const bend = [_prRnd(0, 6.3), _prRnd(0, 6.3)];
    const knots = [_prRnd(1.5, 3.5), _prRnd(0, 6.3), _prRnd(4, 8), _prRnd(0, 6.3)];
    const glow = u => 0.5 + 0.5 * Math.sin(6.283 * u * knots[0] + knots[1]) *
      (0.65 + 0.35 * Math.sin(6.283 * u * knots[2] + knots[3]));
    const dim = 1 - depth * 0.45;

    const rays = [];
    const veils = Math.round(24 * thin * share);
    for (let i = 0; i < veils; i++) {
      const u = (i + 0.5 + _prRnd(-0.1, 0.1)) / veils;
      rays.push({
        u,
        w: side * 2 / veils,
        len: len * _prRnd(0.8, 1.1),
        peak: dim * (0.3 + glow(u) * 0.3),
        flicker: 0.2,
        flickerSeconds: _prRnd(5, 9) / fx.speed,
        flickerPhase: _prRnd(0, 9)
      });
    }
    const hems = Math.round(44 * thin * share);
    for (let i = 0; i < hems; i++) {
      const u = (i + 0.5 + _prRnd(-0.1, 0.1)) / hems;
      rays.push({
        u,
        w: side * 2 / hems,
        len: len * _prRnd(0.14, 0.22),
        peak: dim * (0.45 + glow(u) * 0.5),
        flicker: 0.3,
        flickerSeconds: _prRnd(2.5, 5) / fx.speed,
        flickerPhase: _prRnd(0, 5)
      });
    }
    const count = Math.round(80 * fx.density * (1 - depth * 0.3) * thin * share);
    for (let i = 0; i < count; i++) {
      const u = (i + Math.random()) / count;
      const lit = glow(u);
      rays.push({
        u,
        w: side * (0.003 + Math.pow(Math.random(), 2.6) * 0.016) / thin,
        len: len * (0.4 + lit * 0.45 + _prRnd(0, 0.35)),
        peak: Math.min(1, dim * (0.55 + lit * 0.65) * _prRnd(0.65, 1)),
        flicker: _prRnd(0.3, 0.75),
        flickerSeconds: _prRnd(1.4, 4) / fx.speed,
        flickerPhase: _prRnd(0, 4)
      });
    }
    for (const ray of rays) ray.swayPhase = (ray.u * folds * 0.5) % 1;
    bands.push({ depth, edge, amp, folds, bend, rays, sway: amp * 0.4 });
  }

  return { side, bands, swaySeconds: 14 / fx.speed };
};

window.prAuroraEdge = function(band, ray, side) {
  const u = ray.u;
  const a = 6.283 * u * band.folds + band.bend[0];
  const b = 6.283 * u * band.folds * 2.7 + band.bend[1];
  const bent = 0.7 * Math.sin(a) + 0.3 * Math.sin(b);
  const slope = band.amp * 6.283 * band.folds * (0.7 * Math.cos(a) + 0.81 * Math.cos(b)) / side;
  return { x: u * side, y: band.edge + band.amp * bent, skew: Math.atan(slope) };
};
