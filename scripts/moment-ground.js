
// between tiles at 500 and tokens at 700
window.PR_GROUND_SORT = 550;
window.PR_OVER_SORT = 850;
// above all real elevations, below weather
const _PR_OVER_ELEVATION = Number.MAX_VALUE;

const _prGroundLayers = new Map();
const _prGroundParts = new Map();
const _prGroundSigs = new Map();
let _prGroundTick = null;
let _prGroundStride = 1;
const _prGroundTextures = new Map();

function _prGroundHsl(hue, sat, light, alpha) {
  return "hsla(" + (((hue % 360) + 360) % 360) + "," + sat + "%," + light + "%," + alpha + ")";
}

function _prGroundPad(size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

function _prGroundTexture(key, size, draw) {
  const found = _prGroundTextures.get(key);
  if (found) return found;
  const pad = _prGroundPad(size);
  draw(pad.getContext("2d"), size);
  const tex = PIXI.Texture.from(pad);
  _prGroundTextures.set(key, tex);
  return tex;
}

function _prGroundGlint(hue) {
  return _prGroundTexture("glint" + hue, 128, (x, s) => {
    const h = s / 2;
    const core = x.createRadialGradient(h, h, 0, h, h, h * 0.42);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.4, _prGroundHsl(hue, 96, 78, 0.85));
    core.addColorStop(1, _prGroundHsl(hue, 96, 70, 0));
    x.fillStyle = core;
    x.beginPath();
    x.arc(h, h, h * 0.42, 0, Math.PI * 2);
    x.fill();
    x.filter = "blur(1.5px)";
    for (const rot of [0, Math.PI / 2]) {
      x.save();
      x.translate(h, h);
      x.rotate(rot);
      const arm = x.createLinearGradient(-h, 0, h, 0);
      arm.addColorStop(0, _prGroundHsl(hue, 96, 78, 0));
      arm.addColorStop(0.5, _prGroundHsl(hue, 96, 84, 0.95));
      arm.addColorStop(1, _prGroundHsl(hue, 96, 78, 0));
      x.fillStyle = arm;
      x.fillRect(-h, -s * 0.022, s, s * 0.044);
      x.restore();
    }
    x.filter = "none";
  });
}

function _prGroundPetal(hue, spread) {
  hue = (Math.round(hue / 15) * 15) % 360;
  spread = Math.round(spread * 4) / 4;
  return _prGroundTexture("petal" + hue + "|" + spread, 128, (x, s) => {
    const g = x.createLinearGradient(0, s, 0, 0);
    g.addColorStop(0, _prGroundHsl(hue, 96, 48, 0.06));
    g.addColorStop(0.38, _prGroundHsl(hue + 30 * spread, 98, 50, 0.95));
    g.addColorStop(0.72, _prGroundHsl(hue + 90 * spread, 97, 58, 1));
    g.addColorStop(1, _prGroundHsl(hue + 140 * spread, 95, 52, 0));
    x.filter = "blur(3px)";
    x.fillStyle = g;
    x.beginPath();
    x.ellipse(s / 2, s * 0.62, s * 0.3, s * 0.42, 0, 0, Math.PI * 2);
    x.fill();
    x.filter = "none";
  });
}

function _prGroundSoft(key, hue, inner, outer) {
  return _prGroundTexture(key, 128, (x, s) => {
    const h = s / 2;
    const g = x.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, inner);
    g.addColorStop(0.46, outer);
    g.addColorStop(1, _prGroundHsl(hue, 92, 72, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
  });
}

function _prGroundDroplet(rgb) {
  return _prGroundTexture("drop" + rgb, 128, (x, s) => {
    const g = x.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(" + rgb + ",0)");
    g.addColorStop(0.3, "rgba(" + rgb + ",.65)");
    g.addColorStop(0.62, "rgba(" + prLift(rgb, 0.6) + ",.92)");
    g.addColorStop(0.88, "rgba(" + rgb + ",.5)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.filter = "blur(2px)";
    x.fillStyle = g;
    x.fillRect(0, s * 0.42, s, s * 0.16);
    x.filter = "none";
  });
}

function _prGroundRing(rgb) {
  return _prGroundTexture("ring" + rgb, 256, (x, s) => {
    const h = s / 2;
    x.filter = "blur(3px)";
    x.strokeStyle = "rgba(" + rgb + ",.95)";
    x.lineWidth = s * 0.045;
    x.beginPath();
    x.arc(h, h, h * 0.85, 0, Math.PI * 2);
    x.stroke();
    x.filter = "none";
  });
}

function _prGroundArc(rgb, span, thick, blur) {
  const step = (v, by, least) => Math.max(least, Math.round(v / by) * by);
  span = step(span, 45, 45);
  thick = step(thick, 0.06, 0.06);
  blur = step(blur, 6, 6);
  const key = "arc" + rgb + "|" + span.toFixed(0) + "|" + thick.toFixed(2) + "|" + blur.toFixed(1);
  const tex = _prGroundTexture(key, 512, (x, s) => {
    const h = s / 2;
    const turn = span / 360;
    const g = x.createConicGradient(0, h, h);
    g.addColorStop(0, "rgba(" + rgb + ",0)");
    g.addColorStop(turn * 0.14, "rgba(" + rgb + ",.34)");
    g.addColorStop(turn * 0.4, "rgba(" + rgb + ",.85)");
    g.addColorStop(turn * 0.56, "rgba(" + prLift(rgb, 0.55) + ",.9)");
    g.addColorStop(turn * 0.74, "rgba(" + rgb + ",.72)");
    g.addColorStop(Math.min(0.999, turn), "rgba(" + rgb + ",0)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.filter = "blur(" + blur.toFixed(1) + "px)";
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    x.filter = "none";

    const half = Math.max(0.012, thick / 2);
    const m = x.createRadialGradient(h, h, h * (0.94 - half * 2.4), h, h, h);
    m.addColorStop(0, "rgba(0,0,0,0)");
    m.addColorStop(0.42, "rgba(0,0,0,1)");
    m.addColorStop(0.72, "rgba(0,0,0,1)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = m;
    x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "source-over";
  });
  const inner = 256 * (0.94 - Math.max(0.012, thick / 2) * 2.4);
  tex.prRing ??= { inner, outer: 256, turn: span / 360, spill: Math.min(Math.PI, (blur * 3) / Math.max(1, inner)) };
  return tex;
}

function _prGroundArcMesh(layer, texture, opts) {
  const ring = texture.prRing;
  const size = texture.width;
  const c = size / 2;
  const whole = ring.turn * Math.PI * 2 + ring.spill * 2 >= Math.PI * 2;
  const from = whole ? 0 : -ring.spill;
  const to = whole ? Math.PI * 2 : ring.turn * Math.PI * 2 + ring.spill;
  const steps = Math.max(4, Math.ceil((to - from) / (Math.PI / 32)));
  const reach = ring.outer / Math.cos((to - from) / steps / 2);
  const verts = [], uvs = [], index = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + (to - from) * i / steps;
    for (const r of [ring.inner, reach]) {
      const x = c + r * Math.cos(a), y = c + r * Math.sin(a);
      verts.push(x, y);
      uvs.push(x / size, y / size);
    }
    if (i) index.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
  }
  const mesh = new PIXI.SimpleMesh(texture, new Float32Array(verts), new Float32Array(uvs), new Uint16Array(index));
  mesh.autoUpdate = false;
  mesh.pivot.set(c, c);
  mesh.x = opts.x;
  mesh.y = opts.y;
  mesh.scale.set(opts.w / size);
  mesh.alpha = opts.alpha;
  mesh.blendMode = PIXI.BLEND_MODES.ADD;
  layer.addChild(mesh);
  return mesh;
}

function _prGroundScale(rect) {
  const grid = canvas?.dimensions?.size || canvas?.grid?.size || 100;
  const spread = Math.min(14, Math.max(1, (rect.width * rect.height) / (1600 * 900)));
  return { grid, spread };
}

function _prGroundBowl(rgb, hole) {
  hole = Math.max(0.05, Math.min(0.82, Math.round(hole / 0.05) * 0.05));
  return _prGroundTexture("bowl" + rgb + "|" + hole.toFixed(2), 256, (x, s) => {
    const h = s / 2;
    const g = x.createRadialGradient(h, h, h * hole, h, h, h);
    g.addColorStop(0, "rgba(" + rgb + ",0)");
    g.addColorStop(0.16, "rgba(" + rgb + ",.5)");
    g.addColorStop(0.56, "rgba(" + rgb + ",.38)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
  });
}

function _prGroundPrism(hue, spread) {
  hue = (Math.round(hue / 15) * 15) % 360;
  spread = Math.round(spread * 4) / 4;
  return _prGroundTexture("prism" + hue + "|" + spread, 256, (x, s) => {
    const h = s / 2;
    const g = x.createConicGradient(0, h, h);
    for (let i = 0; i <= 6; i++) {
      g.addColorStop(i / 6, _prGroundHsl(hue + i * 60 * spread, 92, 50, 0.5));
    }
    x.filter = "blur(" + (s * 0.051).toFixed(1) + "px)";
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    x.filter = "none";
    const m = x.createRadialGradient(h, h, 0, h, h, h);
    m.addColorStop(0, "rgba(0,0,0,1)");
    m.addColorStop(0.62, "rgba(0,0,0,1)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = m;
    x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "source-over";
  });
}

function _prGroundStreak(rgb) {
  return _prGroundTexture("streak" + rgb, 128, (x, s) => {
    const g = x.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, "rgba(" + rgb + ",0)");
    g.addColorStop(0.34, "rgba(" + rgb + ",.7)");
    g.addColorStop(0.6, "rgba(" + prLift(rgb, 0.5) + ",.85)");
    g.addColorStop(0.82, "rgba(" + rgb + ",.5)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.filter = "blur(2px)";
    x.fillStyle = g;
    x.fillRect(0, s * 0.34, s, s * 0.32);
    x.filter = "none";
  });
}

function _prGroundSpeck(rgb) {
  return _prGroundTexture("speck" + rgb, 128, (x, s) => {
    const h = s / 2;
    const g = x.createRadialGradient(h, h, 0, h, h, h);
    g.addColorStop(0, "rgba(" + prLift(rgb, 0.45) + ",.95)");
    g.addColorStop(0.34, "rgba(" + rgb + ",.7)");
    g.addColorStop(0.68, "rgba(" + rgb + ",.24)");
    g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
  });
}

function _prGroundRay(rgb, spread) {
  spread = Math.round(spread * 20) / 20;
  return _prGroundTexture("ray" + rgb + "|" + spread, 256, (x, s) => {
    const hem = prTurnHue(rgb, spread * 180);
    const crown = prTurnHue(rgb, spread * 210);
    const g = x.createLinearGradient(0, s, 0, 0);
    g.addColorStop(0, "rgba(" + hem + ",0)");
    g.addColorStop(0.03, "rgba(" + hem + ",.6)");
    g.addColorStop(0.07, "rgba(" + prLift(rgb, 0.55) + ",1)");
    g.addColorStop(0.15, "rgba(" + rgb + ",.85)");
    g.addColorStop(0.36, "rgba(" + rgb + ",.45)");
    g.addColorStop(0.62, "rgba(" + crown + ",.3)");
    g.addColorStop(1, "rgba(" + crown + ",0)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);

    const m = x.createLinearGradient(0, 0, s, 0);
    m.addColorStop(0, "rgba(0,0,0,0)");
    m.addColorStop(0.5, "rgba(0,0,0,1)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = m;
    x.fillRect(0, 0, s, s);
    x.globalCompositeOperation = "source-over";
  });
}

let _prGroundSeenRect = null;

function _prGroundViewRect() {
  const wt = canvas?.stage?.worldTransform;
  const screen = canvas?.app?.screen;
  if (!wt || !screen || !wt.a) return null;
  return {
    x: -wt.tx / wt.a,
    y: -wt.ty / wt.d,
    right: (-wt.tx + screen.width) / wt.a,
    bottom: (-wt.ty + screen.height) / wt.d
  };
}

function _prGroundInView(x, y, reach) {
  const view = _prGroundSeenRect;
  if (!view) return true;
  const r = reach * 1.2;
  return x + r >= view.x && x - r <= view.right
    && y + r >= view.y && y - r <= view.bottom;
}

function _prGroundShow(sp, seen) {
  if (sp.visible !== seen) sp.visible = seen;
  return seen;
}

function _prGroundSprite(layer, texture, opts) {
  const s = new PIXI.Sprite(texture);
  s.anchor.set(opts.anchorX ?? 0.5, opts.anchorY ?? 0.5);
  s.blendMode = opts.wash ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.ADD;
  s.x = opts.x;
  s.y = opts.y;
  s.width = opts.w;
  s.height = opts.h ?? opts.w;
  s.alpha = opts.alpha ?? 1;
  s.rotation = opts.rotation ?? 0;
  layer.addChild(s);
  return s;
}

function _prGroundGlimmer(layer, fx, rect, parts) {
  const tex = _prGroundGlint(prHexHue(fx.color));
  const { grid, spread } = _prGroundScale(rect);
  const plan = prGlimmerPlan(fx, { grid, spread }, "ground");

  for (const g of plan.glints) {
    const sp = _prGroundSprite(layer, tex, {
      x: rect.x + g.x * rect.width,
      y: rect.y + g.y * rect.height,
      w: g.size, alpha: 0
    });
    let t = g.phase;
    const gx = sp.x;
    const gy = sp.y;
    parts.push(dt => {
      t = (t + dt) % g.seconds;
      if (!_prGroundShow(sp, _prGroundInView(gx, gy, g.size * 2))) return;
      const f = t / g.seconds;
      const lit = f < 0.74 ? 0 : Math.sin((f - 0.74) / 0.26 * Math.PI);
      sp.alpha = lit;
      sp.width = g.size * (0.35 + lit * 0.75);
      sp.height = sp.width;
      sp.rotation += dt * plan.turnRate;
    });
  }
}

function _prGroundBloom(layer, fx, rect, parts) {
  const hue = prHexHue(fx.color);
  const { grid, spread } = _prGroundScale(rect);
  const plan = prBloomPlan(fx, { grid, spread }, "ground");
  if (fx.style !== "blooms") {
    const diag = Math.hypot(rect.width, rect.height) / 2;
    const floorSp = _prGroundSprite(layer, _prGroundPrism(hue, fx.spread), {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      w: diag * 2.4, h: diag * 2.4,
      alpha: 0.85, wash: true
    });
    let floorRot = 0;
    parts.push(dt => {
      floorRot += dt * plan.floorRate;
      floorSp.rotation = floorRot;
    });
  }

  if (fx.style === "prism") return;

  const petalAt = i => _prGroundPetal(hue + i, fx.spread);
  const core = _prGroundSoft("bcore" + hue + "|" + Math.round(fx.spread * 4) / 4, hue,
    _prGroundHsl(hue + 40 * fx.spread, 98, 58, 1),
    _prGroundHsl(hue + 180 * fx.spread, 96, 48, 0.6));
  let wait = 0;
  const live = [];

  const open = () => {
    const b = plan.open();
    const x = rect.x + b.x * rect.width;
    const y = rect.y + b.y * rect.height;
    const group = { age: 0, life: b.life, sprites: [] };

    group.sprites.push({
      sp: _prGroundSprite(layer, core, { x, y, w: b.size * 0.9, alpha: 0, wash: true }),
      grow: 1.6, base: b.size * 0.9, rot: 0, spin: 0
    });
    for (const petal of b.petals) {
      group.sprites.push({
        sp: _prGroundSprite(layer, petalAt(petal.hue), {
          x, y, w: petal.w, h: petal.w * 1.4, alpha: 0, rotation: petal.rot, anchorY: 1, wash: true
        }),
        grow: 1, base: petal.w, rot: petal.rot, spin: 0
      });
    }
    live.push(group);
  };

  for (let i = 0; i < plan.seed; i++) open();

  parts.push(dt => {
    wait -= dt;
    if (wait <= 0) { open(); wait = plan.every; }
    for (let i = live.length - 1; i >= 0; i--) {
      const g = live[i];
      g.age += dt;
      const f = g.age / g.life;
      if (f >= 1) {
        for (const s of g.sprites) s.sp.destroy();
        live.splice(i, 1);
        continue;
      }
      const eased = 1 - Math.pow(1 - f, 3);
      const alpha = f < 0.14 ? f / 0.14 : f < 0.58 ? 1 : 1 - (f - 0.58) / 0.42;
      for (const s of g.sprites) {
        const scale = 0.05 + eased * (s.grow - 0.05);
        s.sp.width = s.base * scale;
        s.sp.height = s.base * scale * (s.grow === 1 ? 1.4 : 1);
        s.sp.alpha = Math.max(0, alpha);
      }
    }
  });
}

function _prGroundSurge(layer, fx, rect, parts) {
  const ringTex = _prGroundRing(fx.rgb);
  const dropTex = _prGroundDroplet(fx.rgb);
  const coreTex = _prGroundSoft("bcore" + fx.rgb, 200,
    "rgba(" + prLift(fx.rgb, 0.5) + ",.9)", "rgba(" + fx.rgb + ",.55)");
  const poolTex = _prGroundSoft("pool" + fx.rgb, 200,
    "rgba(" + fx.rgb + ",.55)", "rgba(" + fx.rgb + ",.26)");
  const { grid, spread } = _prGroundScale(rect);
  const plan = prSurgePlan(fx, { grid, spread }, "ground");
  let wait = 0;
  const live = [];

  const burst = () => {
    const b = plan.burst();
    const reach = b.reach;
    const x = rect.x + b.x * rect.width;
    const y = rect.y + b.y * rect.height;
    const g = { age: 0, life: b.life, reach, ring: null, core: null, pool: null, drops: [] };

    g.ring = _prGroundSprite(layer, ringTex, { x, y, w: reach * 2, alpha: 0 });
    g.core = _prGroundSprite(layer, coreTex, { x, y, w: reach * 1.1, alpha: 0 });
    g.pool = _prGroundSprite(layer, poolTex, { x, y, w: reach * 2.4, alpha: 0, wash: true });
    for (const drop of b.drops) {
      g.drops.push({
        sp: _prGroundSprite(layer, dropTex, {
          x, y, w: drop.len, h: drop.len * 0.35, alpha: 0, rotation: drop.a
        }),
        a: drop.a, reach: drop.reach, x, y, len: drop.len
      });
    }
    live.push(g);
  };

  burst();

  parts.push(dt => {
    wait -= dt;
    if (wait <= 0) { burst(); wait = plan.every; }
    for (let i = live.length - 1; i >= 0; i--) {
      const g = live[i];
      g.age += dt;
      const f = g.age / g.life;
      if (f >= 1) {
        g.ring.destroy();
        g.core.destroy();
        g.pool.destroy();
        for (const d of g.drops) d.sp.destroy();
        live.splice(i, 1);
        continue;
      }
      const eased = 1 - Math.pow(1 - f, 3);
      g.ring.scale.set(eased);
      g.ring.alpha = f < 0.1 ? f / 0.1 : f < 0.5 ? 1 : (1 - f) / 0.5;
      const flash = f < 0.08 ? f / 0.08 : Math.max(0, 1 - (f - 0.08) / 0.34);
      g.core.width = g.reach * 1.1 * (0.3 + eased * 1.2);
      g.core.height = g.core.width;
      g.core.alpha = flash;
      g.pool.scale.set(0.2 + eased * 1.15);
      g.pool.alpha = f < 0.2 ? f / 0.2 : f < 0.55 ? 0.9 : (1 - f) / 0.45 * 0.9;
      for (const d of g.drops) {
        const travel = eased * d.reach;
        d.sp.x = d.x + Math.cos(d.a) * travel;
        d.sp.y = d.y + Math.sin(d.a) * travel * 0.78;
        d.sp.width = d.len * (0.3 + eased * 1.3);
        d.sp.alpha = f < 0.12 ? f / 0.12 : f < 0.55 ? 1 : (1 - f) / 0.45;
      }
    }
  });
}

function _prGroundVortex(layer, fx, rect, parts) {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const { spread } = _prGroundScale(rect);
  const plan = prVortexPlan(fx, { w: rect.width, h: rect.height, spread }, "ground");

  const body = _prGroundBowl(fx.rgb, plan.eyeFraction);
  const bodySp = _prGroundSprite(layer, body, {
    x: cx, y: cy, w: plan.bodyW, h: plan.bodyW * 0.94, alpha: 0.9, wash: true
  });
  let bodyRot = 0;
  parts.push(dt => { bodyRot += dt * plan.bodyRate; bodySp.rotation = bodyRot; });

  for (const arm of plan.arms) {
    const sp = _prGroundArcMesh(layer, _prGroundArc(fx.rgb, arm.span, arm.thick, arm.blur), {
      x: cx + arm.dx,
      y: cy + arm.dy,
      w: arm.size,
      alpha: arm.alpha
    });
    let rot = arm.rot0;
    parts.push(dt => { rot += arm.rate * dt; sp.rotation = rot; });
  }
}

function _prGroundAurora(layer, fx, rect, parts) {
  const tex = _prGroundRay(fx.rgb, fx.spread);
  const { spread } = _prGroundScale(rect);
  const plan = prAuroraPlan(fx, { w: rect.width, h: rect.height, spread }, "ground");
  const half = plan.side / 2;
  const turn = fx.angle * Math.PI / 180;
  const cos = Math.cos(turn), sin = Math.sin(turn);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  let t = 0;

  const rays = [];
  for (const band of plan.bands) {
    for (const ray of band.rays) {
      const at = prAuroraEdge(band, ray, plan.side);
      // PIXI skews without stretching so widen to match the CSS
      const sp = _prGroundSprite(layer, tex, {
        x: cx, y: cy, w: ray.w / Math.cos(at.skew), h: ray.len, alpha: 0, rotation: turn, anchorY: 0.93, wash: true
      });
      sp.skew.y = at.skew;
      rays.push({ sp, ray, band, at });
    }
  }

  parts.push(dt => {
    t += dt;
    for (const { sp, ray, band, at } of rays) {
      const sway = -band.sway * Math.cos(6.283 * (t / plan.swaySeconds + ray.swayPhase));
      const dx = at.x - half;
      const dy = at.y + sway - half;
      const x = cx + dx * cos - dy * sin;
      const y = cy + dx * sin + dy * cos;
      if (!_prGroundShow(sp, _prGroundInView(x, y, ray.len + ray.w))) continue;
      const pulse = (1 - Math.cos(6.283 * (t + ray.flickerPhase) / ray.flickerSeconds)) / 2;
      sp.x = x;
      sp.y = y;
      sp.alpha = ray.peak * (1 - ray.flicker * pulse);
    }
  });
}

function _prGroundSleet(layer, fx, rect, parts) {
  const tex = _prGroundStreak(fx.rgb);
  const { grid, spread } = _prGroundScale(rect);
  const plan = prSleetPlan(fx, { grid, spread }, "ground");
  const v = plan.bearing;
  const span = Math.hypot(rect.width, rect.height);

  for (const s of plan.shards) {
    const sp = _prGroundSprite(layer, tex, {
      x: rect.x + s.x * rect.width,
      y: rect.y + Math.random() * rect.height,
      w: s.len * 6, h: s.thick * 6,
      alpha: 0.85, rotation: Math.atan2(v.y, v.x)
    });
    const rate = span / (s.seconds * 6);
    let t = Math.random();
    parts.push(dt => {
      t = (t + dt * rate / span) % 1;
      const x = rect.x + ((s.x + v.x * t) % 1 + 1) % 1 * rect.width;
      const y = rect.y + ((0.5 + v.y * t * 1.4) % 1 + 1) % 1 * rect.height;
      if (!_prGroundShow(sp, _prGroundInView(x, y, s.len * 6))) return;
      sp.x = x;
      sp.y = y;
      sp.alpha = 0.85 * Math.sin(t * Math.PI);
    });
  }
}

function _prGroundVerdant(layer, fx, rect, parts) {
  const tex = _prGroundSpeck(fx.rgb);
  const { grid, spread } = _prGroundScale(rect);
  const plan = prVerdantPlan(fx, { grid, spread }, "ground");
  const v = plan.bearing;

  for (const s of plan.spores) {
    const x0 = rect.x + s.x * rect.width;
    const y0 = rect.y + s.y * rect.height;
    const sp = _prGroundSprite(layer, tex, { x: x0, y: y0, w: s.size, alpha: 0 });
    let t = s.phase;
    parts.push(dt => {
      t += dt;
      const f = (t / s.seconds) % 1;
      const swing = Math.sin(f * Math.PI * 2);
      const x = x0 + v.x * s.reach * swing;
      const y = y0 + v.y * s.reach * swing;
      if (!_prGroundShow(sp, _prGroundInView(x, y, s.size))) return;
      sp.x = x;
      sp.y = y;
      sp.alpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(f * Math.PI * 2));
    });
  }
}

function _prGroundMotes(layer, fx, rect, parts) {
  const tex = _prGroundSpeck(fx.rgb);
  const { grid, spread } = _prGroundScale(rect);
  const plan = prMotesPlan(fx, { grid, spread }, "ground");
  const v = plan.bearing;

  for (const m of plan.motes) {
    const sp = _prGroundSprite(layer, tex, {
      x: rect.x + m.x * rect.width,
      y: rect.y + m.y * rect.height,
      w: plan.size, alpha: 0
    });
    let t = m.phase;
    parts.push(dt => {
      t += dt;
      const f = (t / m.seconds) % 1;
      const x = rect.x + m.x * rect.width + v.x * plan.reach * f;
      const y = rect.y + m.y * rect.height + v.y * plan.reach * f;
      if (!_prGroundShow(sp, _prGroundInView(x, y, plan.size))) return;
      sp.x = x;
      sp.y = y;
      sp.alpha = 0.85 * Math.sin(f * Math.PI);
    });
  }
}

// draw after the darkness multiply like fxmaster embers
function _prGroundGlowParent(layer) {
  const group = canvas.effects;
  let at = group.getChildIndex(group.illumination) + 1;
  for (let i = at; i < group.children.length; i++) {
    const other = group.children[i];
    if (other._prGlow && other.sort <= layer.sort) at = i + 1;
  }
  layer._prGlow = true;
  group.addChildAt(layer, at);
}

function _prGroundClear(slot) {
  _prGroundParts.delete(slot);
  _prGroundSigs.delete(slot);
  const layer = _prGroundLayers.get(slot);
  if (layer) {
    layer.destroy({ children: true });
    _prGroundLayers.delete(slot);
    if (canvas?.primary) canvas.primary.sortDirty = true;
  }
  if (_prGroundTick && !_prGroundLayers.size) {
    PIXI.Ticker.shared.remove(_prGroundTick);
    _prGroundTick = null;
  }
}

window.prGroundApply = function(fx, slot) {
  slot = slot || "main";
  const wanted = (fx && (fx.sits === "ground" || fx.sits === "over") && fx.style !== "none" && fx.opacity > 0)
    ? [fx.sits, fx.glow, fx.style, fx.color, fx.opacity, fx.density, fx.speed, fx.size, fx.angle, fx.eye, fx.spin, fx.spread, fx.bands, prShelterEpoch(), prEffort().density].join("|")
    : "";
  if (wanted && wanted === _prGroundSigs.get(slot) && _prGroundLayers.has(slot)) {
    if (fx.sits === "over") prShelterCutRoofs(_prGroundLayers.get(slot));
    return;
  }
  _prGroundClear(slot);
  if (!wanted) return;
  if (!canvas?.ready || !canvas.primary || !globalThis.PIXI) return;

  const dims = canvas.dimensions;
  const rect = dims?.sceneRect ?? { x: 0, y: 0, width: dims?.width ?? 4000, height: dims?.height ?? 3000 };

  const layer = new PIXI.Container();
  // v14 sorts by level elevation so 0 burries it
  layer.elevation = fx.sits === "over" ? _PR_OVER_ELEVATION : (canvas.level?.elevation?.base ?? 0);
  layer.sortLayer = fx.sits === "over" ? PR_OVER_SORT : PR_GROUND_SORT;
  layer.sort = Math.max(0, PR_ATMO_SECTIONS.indexOf(slot));
  layer.alpha = fx.opacity;
  layer.eventMode = "none";

  fx = { ...fx, density: fx.density * prEffort().density };

  const parts = [];
  if (fx.style === "glimmer") _prGroundGlimmer(layer, fx, rect, parts);
  else if (fx.style === "sleet") _prGroundSleet(layer, fx, rect, parts);
  else if (fx.style === "verdant") _prGroundVerdant(layer, fx, rect, parts);
  else if (fx.style === "motes") _prGroundMotes(layer, fx, rect, parts);
  else if (fx.style === "bloom" || fx.style === "prism" || fx.style === "blooms") _prGroundBloom(layer, fx, rect, parts);
  else if (fx.style === "surge") _prGroundSurge(layer, fx, rect, parts);
  else if (fx.style === "vortex") _prGroundVortex(layer, fx, rect, parts);
  else if (fx.style === "aurora") _prGroundAurora(layer, fx, rect, parts);
  else { layer.destroy({ children: true }); return; }

  prShelterGround(layer, layer.elevation);
  if (fx.sits === "over") prShelterCutRoofs(layer);

  _prGroundLayers.set(slot, layer);
  _prGroundParts.set(slot, parts);
  _prGroundSigs.set(slot, wanted);

  if (fx.sits === "over" && fx.glow && canvas.effects?.illumination?.parent === canvas.effects) _prGroundGlowParent(layer);
  else {
    canvas.primary.addChild(layer);
    canvas.primary.sortDirty = true;
  }

  if (!_prGroundTick) {
    let owed = 0;
    _prGroundTick = () => {
      owed += PIXI.Ticker.shared.deltaMS / 1000;
      if (document.visibilityState === "hidden") return;
      if (--_prGroundStride > 0) return;
      _prGroundStride = prEffort().stride;
      const dt = owed;
      owed = 0;
      _prGroundSeenRect = _prGroundViewRect();
      for (const list of _prGroundParts.values()) {
        for (const step of list) step(dt);
      }
    };
    PIXI.Ticker.shared.add(_prGroundTick);
  }
};

Hooks.on("canvasTearDown", function() {
  for (const slot of [..._prGroundLayers.keys()]) _prGroundClear(slot);
  for (const tex of _prGroundTextures.values()) tex.destroy(true);
  _prGroundTextures.clear();
});
