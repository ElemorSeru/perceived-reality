window.PR_MOMENT_FLAG = "moments";
window.PR_ATMO_FLAG = "atmospheres";

window.PR_TRANSITIONS = {
  mist: { labelKey: "perceived-reality.Moments.Transitions.mist", fx: "blobs", c1: "#ccd2e2", c2: "#6a7290", count: 5, blur: 7, intensity: 92, cover: 95, dur: 3.5 },
  blackout: { labelKey: "perceived-reality.Moments.Transitions.blackout", fx: "none", c1: "#000000", c2: "#000000", count: 0, blur: 4, intensity: 97, cover: 100, dur: 3 },
  pollen: { labelKey: "perceived-reality.Moments.Transitions.pollen", fx: "rise", c1: "#ffe682", c2: "#a08030", count: 34, blur: 6, intensity: 80, cover: 80, dur: 4 },
  ripple: { labelKey: "perceived-reality.Moments.Transitions.ripple", fx: "bands", c1: "#b4dcff", c2: "#3a5c80", count: 3, blur: 5, intensity: 55, cover: 60, dur: 3.5, warp: true },
  ember: { labelKey: "perceived-reality.Moments.Transitions.ember", fx: "fall", c1: "#ff8c3c", c2: "#601408", count: 26, blur: 6, intensity: 85, cover: 85, dur: 4 },
  snow: { labelKey: "perceived-reality.Moments.Transitions.snow", fx: "fallrot", c1: "#ffffff", c2: "#8ba0c0", count: 30, blur: 5, intensity: 75, cover: 75, dur: 4 },
  rain: { labelKey: "perceived-reality.Moments.Transitions.rain", fx: "rain", c1: "#9fb8d8", c2: "#2e3c50", count: 40, blur: 6, intensity: 80, cover: 80, dur: 3.5 },
  sand: { labelKey: "perceived-reality.Moments.Transitions.sand", fx: "side", c1: "#e0c080", c2: "#78582c", count: 38, blur: 7, intensity: 88, cover: 90, dur: 3.5 },
  fireflies: { labelKey: "perceived-reality.Moments.Transitions.fireflies", fx: "blink", c1: "#d8ff8c", c2: "#16280f", count: 22, blur: 4, intensity: 70, cover: 60, dur: 4.5 },
  static: { labelKey: "perceived-reality.Moments.Transitions.static", fx: "blink", c1: "#ffffff", c2: "#08080f", count: 55, blur: 8, intensity: 90, cover: 100, dur: 3 },
  bloodmist: { labelKey: "perceived-reality.Moments.Transitions.bloodmist", fx: "blobs", c1: "#c03040", c2: "#40060e", count: 5, blur: 7, intensity: 88, cover: 95, dur: 4 },
  spores: { labelKey: "perceived-reality.Moments.Transitions.spores", fx: "rise", c1: "#a0d060", c2: "#26380f", count: 24, blur: 8, intensity: 85, cover: 85, dur: 4.5 },
  starfall: { labelKey: "perceived-reality.Moments.Transitions.starfall", fx: "diag", c1: "#ffffff", c2: "#0c1228", count: 18, blur: 4, intensity: 78, cover: 70, dur: 4 },
  ghostlight: { labelKey: "perceived-reality.Moments.Transitions.ghostlight", fx: "blobs", c1: "#bfe8ff", c2: "#1c3240", count: 4, blur: 10, intensity: 75, cover: 75, dur: 4.5 },
  shadow: { labelKey: "perceived-reality.Moments.Transitions.shadow", fx: "pulse", c1: "#000000", c2: "#140c1e", count: 1, blur: 6, intensity: 92, cover: 95, dur: 4 },
  haze: { labelKey: "perceived-reality.Moments.Transitions.haze", fx: "rise", c1: "#ffd882", c2: "#8a6828", count: 12, blur: 5, intensity: 65, cover: 65, dur: 3.5 },
  petals: { labelKey: "perceived-reality.Moments.Transitions.petals", fx: "petal", c1: "#ffb0c8", c2: "#502636", count: 26, blur: 4, intensity: 70, cover: 70, dur: 4.5 },
  ash: { labelKey: "perceived-reality.Moments.Transitions.ash", fx: "fallrot", c1: "#b0a8a0", c2: "#241c16", count: 32, blur: 7, intensity: 88, cover: 90, dur: 4 },
  lightning: { labelKey: "perceived-reality.Moments.Transitions.lightning", fx: "flash", c1: "#e8f0ff", c2: "#10141e", count: 1, blur: 5, intensity: 90, cover: 95, dur: 3.5 },
  dream: { labelKey: "perceived-reality.Moments.Transitions.dream", fx: "blobs", c1: "#b088e0", c2: "#1e1030", count: 5, blur: 9, intensity: 85, cover: 90, dur: 5, warp: true },
  sheen: { labelKey: "perceived-reality.Moments.Transitions.sheen", fx: "sheen", c1: "#ff7ad9", c2: "#141020", count: 14, blur: 3, intensity: 88, cover: 60, dur: 4.5, from: "left", to: "right", tilt: 0, sweep: 100 }
};

window.PR_FX_RENDERERS = {
  none: { fits: ["transition", "atmosphere"] },

  blobs: { fits: ["transition"] },
  bands: { fits: ["transition"] },
  pulse: { fits: ["transition"] },
  flash: { fits: ["transition"] },
  fall: { fits: ["transition"] },
  fallrot: { fits: ["transition"] },
  side: { fits: ["transition"] },
  diag: { fits: ["transition"] },
  petal: { fits: ["transition"] },
  sheen: { fits: ["transition"] },

  rain: { fits: ["transition"] },
  rise: { fits: ["transition"] },
  blink: { fits: ["transition"] },

  sleet: { fits: ["atmosphere"], angled: true, sized: true, ground: true, fg: true, pt: true },
  glimmer: { fits: ["atmosphere"], sized: true, ground: true, glow: true, fg: true, pt: true },
  verdant: { fits: ["atmosphere"], angled: true, sized: true, ground: true, glow: true, fg: true, pt: true },

  // old drift style, kept for saved atmospheres
  motes: { fits: ["atmosphere"], angled: true, sized: true, ground: true, glow: true, fg: true, pt: true },

  vortex: { fits: ["atmosphere"], sized: true, eye: true, spin: true, ground: true, bg: true },
  surge: { fits: ["atmosphere"], sized: true, ground: true, fg: true, pt: true },
  // old style that drew prism and blooms together
  bloom: { fits: ["atmosphere"], sized: true, ground: true, spectrum: true, glow: true },
  prism: { fits: ["atmosphere"], ground: true, spectrum: true, glow: true, bg: true, fill: true },
  blooms: { fits: ["atmosphere"], sized: true, ground: true, spectrum: true, glow: true, fg: true, pt: true },
  aurora: { fits: ["atmosphere"], angled: true, sized: true, ground: true, spectrum: true, bands: true, glow: true, bg: true }
};

window.prFxRenderer = function(name) {
  return PR_FX_RENDERERS[name] ?? PR_FX_RENDERERS.none;
};

window.prFxCan = function(name, capability) {
  return prFxRenderer(name)[capability] === true;
};

window.prFxFits = function(name, clipType) {
  return (prFxRenderer(name).fits ?? []).includes(clipType);
};

window.PR_ATMO_PRESETS = {
  none: { labelKey: "perceived-reality.Moments.Presets.none", sat: 100, bright: 100, hue: 0, tintOn: false, tint: "#808080", tintA: 0, vig: "#000000", vigS: 0, style: "none", pColor: "#ffe8b0", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26 },
  fey: { labelKey: "perceived-reality.Moments.Presets.fey", sat: 145, bright: 108, hue: -10, tintOn: true, tint: "#8a50c8", tintA: 20, vig: "#503078", vigS: 40, style: "motes", pColor: "#ffe8b0", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26 },
  dread: { labelKey: "perceived-reality.Moments.Presets.dread", sat: 35, bright: 84, hue: 0, tintOn: true, tint: "#1e3c64", tintA: 34, vig: "#0a1428", vigS: 75, style: "none", pColor: "#a0c8e8", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26 },
  ashen: { labelKey: "perceived-reality.Moments.Presets.ashen", sat: 15, bright: 90, hue: 0, tintOn: true, tint: "#6a5a40", tintA: 28, vig: "#201a14", vigS: 70, style: "none", pColor: "#c0b8a8", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26 },
  sickly: { labelKey: "perceived-reality.Moments.Presets.sickly", sat: 70, bright: 94, hue: 38, tintOn: true, tint: "#4a6a20", tintA: 26, vig: "#141c08", vigS: 55, style: "motes", pColor: "#c8e870", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26 },
  storm: { labelKey: "perceived-reality.Moments.Presets.storm", sat: 62, bright: 92, hue: -6, tintOn: true, tint: "#28506e", tintA: 20, vig: "#0c1c2c", vigS: 45, style: "none", pColor: "#bfe9ff", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, own: { style: "sleet", pColor: "#bfe9ff", pOpacity: 90, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 192, pEye: 26 } },
  arcane: { labelKey: "perceived-reality.Moments.Presets.arcane", sat: 108, bright: 104, hue: 0, tintOn: false, tint: "#808080", tintA: 0, vig: "#1a1430", vigS: 30, style: "none", pColor: "#ffe9b8", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, own: { style: "glimmer", pColor: "#ffe9b8", pOpacity: 95, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "ground", pAngle: 0, pEye: 26 } },
  maelstrom: { labelKey: "perceived-reality.Moments.Presets.maelstrom", sat: 78, bright: 94, hue: -8, tintOn: true, tint: "#1c4a5a", tintA: 22, vig: "#08202c", vigS: 55, style: "none", pColor: "#9ff0ea", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, own: { style: "vortex", pColor: "#9ff0ea", pOpacity: 80, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "ground", pAngle: 0, pEye: 26, pSpin: "cw" } },
  floodwater: { labelKey: "perceived-reality.Moments.Presets.floodwater", sat: 74, bright: 100, hue: -4, tintOn: true, tint: "#3a6a86", tintA: 18, vig: "#102836", vigS: 35, style: "none", pColor: "#cfe8f8", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, own: { style: "surge", pColor: "#cfe8f8", pOpacity: 90, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "ground", pAngle: 0, pEye: 26 } },
  prismbloom: { labelKey: "perceived-reality.Moments.Presets.prismbloom", sat: 118, bright: 104, hue: 0, tintOn: false, tint: "#808080", tintA: 0, vig: "#1c1430", vigS: 28, style: "none", pColor: "#ff7ad9", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, own: { style: "bloom", pColor: "#ff7ad9", pOpacity: 75, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "ground", pAngle: 0, pEye: 26, pSpread: 100 } },
  borealis: { labelKey: "perceived-reality.Moments.Presets.borealis", sat: 112, bright: 94, hue: 0, tintOn: true, tint: "#10264a", tintA: 22, vig: "#040a1a", vigS: 50, style: "none", pColor: "#5dffa8", pOpacity: 100, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, own: { style: "aurora", pColor: "#5dffa8", pOpacity: 90, pDensity: 100, pSpeed: 100, pSize: 100, pSits: "over", pAngle: 0, pEye: 26, pSpread: 70, pBands: 3 } }
};

// effort tiers. core low performance mode counts as balanced
const _PR_EFFORT = {
  full: { density: 1, stride: 1 },
  balanced: { density: 0.75, stride: 1 },
  light: { density: 0.5, stride: 2 }
};

window.prEffort = function() {
  let chosen = "full";
  try {
    chosen = game.settings.get(PR_MODULE_ID, "effectDetail") ?? "full";
  } catch (err) {
    // during startup so not registered
  }
  if (chosen === "full" && canvas?.performance?.mode === 0) chosen = "balanced";
  return _PR_EFFORT[chosen] ?? _PR_EFFORT.full;
};

window.prAtmoParticles = function(cfg) {
  return _prAtmoRead(cfg ?? {});
};

function _prAtmoFlatStyleDefaults(style) {
  const presets = Object.values(PR_ATMO_PRESETS);
  const source = presets.find(p => p.own?.style === style)?.own
    ?? presets.find(p => p.style === style)
    ?? PR_ATMO_PRESETS.none;
  const out = {};
  for (const [k, v] of Object.entries(source)) {
    if (/^p[A-Z]/.test(k)) out[k] = v;
  }
  out.pGlow = prFxCan(style, "glow");
  return out;
}

window.PR_ATMO_SECTIONS = ["bg", "fg", "pt"];

// keep saved numbers so old atmospheres read the same
function _prAtmoSectionFrom(fields, style) {
  const read = _prAtmoRead(fields);
  const kept = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);
  return {
    style,
    color: read.color,
    opacity: kept(fields.pOpacity, read.opacity * 100),
    density: kept(fields.pDensity, read.density * 100),
    speed: kept(fields.pSpeed, read.speed * 100),
    size: kept(fields.pSize, read.size * 100),
    sits: read.sits,
    angle: kept(fields.pAngle, read.angle),
    eye: kept(fields.pEye, read.eye),
    spin: read.spin,
    spread: kept(fields.pSpread, read.spread * 100),
    bands: kept(fields.pBands, read.bands)
  };
}

function _prAtmoNoSection() {
  return _prAtmoSectionFrom({ style: "none" }, "none");
}

const _PR_ATMO_FLAT_KEYS = new Set(["preset", "labelKey", "own", "sat", "bright", "hue", "tintOn", "tint", "tintA",
  "vig", "vigS", "style", "motes", "moteC", "moteCount", "moteDir", "moteAngle"]);
const _PR_ATMO_V2_KEYS = new Set(["v", "preset", "mood", "bg", "fg", "pt", "glow", "ptGlow"]);

function _prAtmoVisualKey(k) {
  return _PR_ATMO_FLAT_KEYS.has(k) || _PR_ATMO_V2_KEYS.has(k) || /^[op][A-Z]/.test(k);
}

window.prAtmoToV2 = function(cfg) {
  if (cfg?.v === 2) return cfg;
  const flat = prMigrateAtmosphereConfig(cfg ?? {}) ?? {};
  const ownFields = _prAtmoOwnFields(flat);
  const own = _prAtmoRead(ownFields);
  const added = prAtmoParticles(flat);
  const out = { v: 2 };
  for (const [k, v] of Object.entries(flat)) {
    if (!_prAtmoVisualKey(k)) out[k] = v;
  }
  out.preset = flat.preset ?? "none";
  out.mood = {
    sat: flat.sat ?? 100,
    bright: flat.bright ?? 100,
    hue: flat.hue ?? 0,
    tintOn: flat.tintOn ?? (flat.tintA ?? 0) > 0,
    tint: flat.tint ?? "#808080",
    tintA: flat.tintA ?? 0,
    vig: flat.vig ?? "#000000",
    vigS: flat.vigS ?? 0
  };
  out.bg = _prAtmoNoSection();
  out.fg = _prAtmoNoSection();
  if (own.style === "bloom") {
    out.bg = _prAtmoSectionFrom(ownFields, "prism");
    out.fg = _prAtmoSectionFrom(ownFields, "blooms");
  } else if (own.style !== "none") {
    out[prFxCan(own.style, "bg") ? "bg" : "fg"] = _prAtmoSectionFrom(ownFields, own.style);
  }
  out.pt = added.style === "none" ? _prAtmoNoSection()
    : _prAtmoSectionFrom(flat, added.style === "bloom" ? "blooms" : added.style);
  out.glow = own.glow;
  out.ptGlow = added.glow;
  return out;
};

window.prAtmoSectionFx = function(section, glow) {
  const c = section ?? {};
  return _prAtmoRead({
    style: c.style ?? "none",
    pColor: c.color,
    pOpacity: c.opacity,
    pDensity: c.density,
    pSpeed: c.speed,
    pSize: c.size,
    pSits: c.sits,
    pAngle: c.angle,
    pEye: c.eye,
    pSpin: c.spin,
    pSpread: c.spread,
    pBands: c.bands,
    pGlow: glow === true
  });
};

window.prAtmoStyleSection = function(style) {
  const source = style === "prism" || style === "blooms" ? "bloom" : style;
  return _prAtmoSectionFrom({ ..._prAtmoFlatStyleDefaults(source), style }, style);
};

window.prAtmoPresetConfig = function(id) {
  const key = PR_ATMO_PRESETS[id] ? id : "none";
  const flat = Object.assign({}, PR_ATMO_PRESETS[key], { preset: key });
  delete flat.labelKey;
  delete flat.own;
  const cfg = prAtmoToV2(flat);
  cfg.glow = prFxCan(cfg.bg.style, "glow") || prFxCan(cfg.fg.style, "glow");
  cfg.ptGlow = prFxCan(cfg.pt.style, "glow");
  return cfg;
};

window.prAtmoApplyPreset = function(cfg, id) {
  for (const k of Object.keys(cfg)) {
    if (_prAtmoVisualKey(k)) delete cfg[k];
  }
  return Object.assign(cfg, prAtmoPresetConfig(id));
};

window.prAtmoResetSection = function(cfg, key) {
  const base = prAtmoPresetConfig(cfg.preset);
  cfg[key] = base[key];
  if (key === "pt") cfg.ptGlow = base.ptGlow;
  if (key === "bg" || key === "fg") cfg.glow = base.glow;
};

window.prAtmoEdited = function(cfg, key) {
  const base = prAtmoPresetConfig(cfg.preset);
  const differs = (a, b) => {
    for (const k of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
      if ((a ?? {})[k] !== (b ?? {})[k]) return true;
    }
    return false;
  };
  const part = k => {
    if (k === "pt") return differs(cfg.pt, base.pt) || cfg.ptGlow !== base.ptGlow;
    if (k === "bg" || k === "fg") return differs(cfg[k], base[k]) || cfg.glow !== base.glow;
    return differs(cfg[k], base[k]);
  };
  if (key) return part(key);
  return ["mood", ...PR_ATMO_SECTIONS].some(part);
};

window.prAtmoOwnParticles = function(cfg) {
  return _prAtmoRead(_prAtmoOwnFields(cfg ?? {}));
};

function _prAtmoOwnFields(c) {
  const presetOwn = PR_ATMO_PRESETS[c.preset]?.own;
  const style = c.oStyle ?? presetOwn?.style ?? "none";
  if (style === "none") return { style: "none" };
  const own = presetOwn?.style === style ? presetOwn : _prAtmoFlatStyleDefaults(style);
  return {
    style,
    pColor: c.oColor ?? own.pColor,
    pOpacity: c.oOpacity ?? own.pOpacity,
    pDensity: c.oDensity ?? own.pDensity,
    pSpeed: c.oSpeed ?? own.pSpeed,
    pSize: c.oSize ?? own.pSize,
    pSits: c.oSits ?? own.pSits,
    pAngle: c.oAngle ?? own.pAngle,
    pSpin: c.oSpin ?? own.pSpin,
    pSpread: c.oSpread ?? own.pSpread,
    pBands: c.oBands ?? own.pBands,
    pEye: c.oEye ?? own.pEye,
    pGlow: c.oGlow ?? own.pGlow
  };
}

function _prAtmoRead(c) {
  const legacyCount = Number(c.moteCount);
  const legacyDir = c.moteDir ?? "up";
  const legacyAngle = legacyDir === "down" ? 180 : legacyDir === "angle" ? (Number(c.moteAngle) || 0) : 0;
  const num = (v, fallback) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

  const style = c.style ?? (c.motes ? "motes" : "none");
  return {
    style,
    color: c.pColor ?? c.moteC ?? "#ffe8b0",
    opacity: Math.max(0, Math.min(100, num(c.pOpacity, 100))) / 100,
    density: Math.max(10, Math.min(250, num(c.pDensity, Number.isFinite(legacyCount) ? (legacyCount / 14) * 100 : 100))) / 100,
    speed: Math.max(20, Math.min(300, num(c.pSpeed, 100))) / 100,
    size: Math.max(10, Math.min(250, num(c.pSize, 100))) / 100,
    angle: ((num(c.pAngle, legacyAngle) % 360) + 360) % 360,
    eye: Math.max(0, Math.min(200, num(c.pEye, 26))),
    spin: c.pSpin === "ccw" ? "ccw" : "cw",
    spread: Math.max(0, Math.min(100, num(c.pSpread, 100))) / 100,
    bands: Math.max(1, Math.min(6, Math.round(num(c.pBands, 3)))),
    sits: (c.pSits === "ground" && prFxCan(c.style ?? "", "ground")) ? "ground" : "over",
    // draws above the darkness, old saves stay unlit
    glow: c.pGlow === true && prFxCan(style, "glow")
  };
}

window.prTransitionPhases = function(cfg, durSec) {
  const total = Math.max(0.4, Number(durSec) || 0);
  const minOut = 0.2;
  let easeIn = Number(cfg?.easeIn);
  let hold = Number(cfg?.hold);
  // use the old 45/20/35 for existing moments
  if (!Number.isFinite(easeIn) || easeIn < 0) easeIn = total * 0.45;
  if (!Number.isFinite(hold) || hold < 0) hold = total * 0.20;
  easeIn = Math.min(easeIn, Math.max(0, total - minOut));
  hold = Math.min(hold, Math.max(0, total - easeIn - minOut));
  const easeOut = Math.max(minOut, total - easeIn - hold);
  return { total, easeIn, hold, easeOut };
};

window.prSheenSweep = function(cfg) {
  const t = PR_TRANSITIONS[cfg?.style] ?? {};
  const sides = ["left", "right", "top", "bottom"];
  const side = (v, fallback) => (sides.includes(v) ? v : fallback);
  const tilt = Number(cfg?.tilt);
  const sweep = Number(cfg?.sweep ?? t.sweep);
  return {
    from: side(cfg?.from, t.from ?? "left"),
    to: side(cfg?.to, t.to ?? "right"),
    tilt: Number.isFinite(tilt) ? (((tilt % 360) + 360) % 360) : (t.tilt ?? 0),
    sweep: Math.max(30, Math.min(300, Number.isFinite(sweep) ? sweep : 100)) / 100
  };
};

// shared color: hidden = 1 - (1 - cover)(1 - tint)
function _prCoverHiding(hidden, intensity) {
  const k = (0.75 + 0.92) / 2 * Math.max(0, Math.min(100, intensity)) / 100;
  const c = k > 0 ? ((1 + k) - Math.sqrt((1 + k) ** 2 - 4 * k * hidden)) / (2 * k) : hidden;
  return Math.round(c * 20) * 5;
}

window.prTransitionCover = function(cfg) {
  const c = Number(cfg?.cover);
  if (Number.isFinite(c)) return Math.max(0, Math.min(100, c));
  // older clips without coverage keep the tint only look
  const intensity = Number(cfg?.intensity ?? 90);
  const i = Number.isFinite(intensity) ? intensity : 90;
  return _prCoverHiding((0.75 + 0.92) / 2 * Math.max(0, Math.min(100, i)) / 100, i);
};

window.PR_CLIP_ROW = {
  transition: "transition",
  narration: "narration",
  sound: "sound",
  fx: "fx",
  perception: "state",
  object: "state",
  atmosphere: "state",
  disguise: "state"
};

window.prSnapTime = function(t) {
  return Math.max(0, Math.round(t * 2) / 2);
};

window.prLift = function(rgb, amount) {
  return String(rgb).split(",")
    .map(v => Math.round(Number(v) + (255 - Number(v)) * amount))
    .join(",");
};

window.prTurnHue = function(rgb, deg) {
  const [r, g, b] = String(rgb).split(",").map(v => Number(v) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  if (!d) return rgb;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (((h * 60 + deg) % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r1, g1, b1].map(v => Math.round((v + m) * 255)).join(",");
};

const _prRnd = (a, b) => a + Math.random() * (b - a);

window.prHexHue = function(hex) {
  const n = parseInt(String(hex ?? "").replace("#", ""), 16);
  if (!Number.isFinite(n)) return 0;
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((((h * 60) % 360) + 360) % 360);
};

window.prHexToRgba = function(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
};

// 1.1.0 motes format, imports can still have it
window.prMigrateAtmosphereConfig = function(cfg) {
  if (!cfg || typeof cfg !== "object") return cfg;
  const legacy = ["motes", "moteC", "moteCount", "moteDir", "moteAngle"];
  if (!legacy.some(k => k in cfg)) return cfg;

  const read = prAtmoParticles(cfg);
  const out = foundry.utils.deepClone(cfg);
  for (const k of legacy) delete out[k];
  out.style = read.style;
  out.pColor = read.color;
  out.pOpacity = read.opacity * 100;
  out.pDensity = read.density * 100;
  out.pSpeed = read.speed * 100;
  out.pSize = read.size * 100;
  out.pAngle = read.angle;
  out.pEye = read.eye;
  out.pSits = read.sits;
  out.pSpin = read.spin;
  out.pSpread = read.spread * 100;
  out.pBands = read.bands;
  return out;
};

window.prNewClip = function(type) {
  const clip = { id: foundry.utils.randomID(), type, start: 0, dur: 0, config: {} };
  if (type === "transition") {
    const t = PR_TRANSITIONS.mist;
    clip.dur = t.dur;
    clip.config = { style: "mist", c1: t.c1, c2: t.c2, count: t.count, blur: t.blur, intensity: t.intensity, cover: t.cover, audience: "all", group: PR_PERCEPTION_GROUPS[0].id };
  } else if (type === "narration") {
    clip.dur = 6;
    clip.config = { textDefault: "", perGroup: {} };
  } else if (type === "sound") {
    clip.dur = 4;
    clip.config = { path: "", volume: 0.8, loop: false, audience: "all", group: PR_PERCEPTION_GROUPS[0].id };
  } else if (type === "fx") {
    clip.dur = 8;
    clip.config = { mode: "preset", preset: "", type: "", options: {}, direction: "", speed: "", density: "", color: "#ffffff", colorApply: false, audience: "all", group: PR_PERCEPTION_GROUPS[0].id };
  } else if (type === "perception") {
    clip.config = { tokenIds: [], group: PR_PERCEPTION_GROUPS[0].id, action: "grant" };
  } else if (type === "object") {
    clip.config = { targetType: "token", ids: [], group: PR_PERCEPTION_GROUPS[0].id, action: "add" };
  } else if (type === "atmosphere") {
    clip.config = Object.assign({ group: PR_PERCEPTION_GROUPS[0].id, autoEnd: 0 }, prAtmoPresetConfig("none"));
    delete clip.config.labelKey;
  } else if (type === "disguise") {
    clip.config = { tokenIds: [], group: PR_PERCEPTION_GROUPS[0].id, action: "set", img: "", name: "", hideNameplate: false, disposition: "" };
  }
  return clip;
};

window.prNewMoment = function(sceneId) {
  return {
    id: foundry.utils.randomID(),
    name: game.i18n.localize("perceived-reality.Moments.NewMomentName"),
    trigger: "manual",
    sceneId: sceneId ?? null,
    clips: []
  };
};

function _prMigrateNarrationClip(clip) {
  if (clip.type !== "narration") return;
  const cfg = clip.config ?? {};
  if (cfg.perGroup) return;
  const migrated = { textDefault: "", perGroup: {} };
  if (cfg.group) {
    migrated.textDefault = cfg.textOther ?? "";
    migrated.perGroup[cfg.group] = cfg.textPerceiver ?? "";
  } else {
    migrated.textDefault = cfg.textPerceiver ?? "";
  }
  clip.config = migrated;
}

window.prGetAllMoments = function() {
  const raw = game.settings.get(PR_MODULE_ID, "momentLibrary");
  const moments = Array.isArray(raw) ? foundry.utils.deepClone(raw) : [];
  for (const moment of moments) {
    for (const clip of moment.clips ?? []) _prMigrateNarrationClip(clip);
  }
  return moments;
};

window.prSaveAllMoments = async function(list) {
  await game.settings.set(PR_MODULE_ID, "momentLibrary", list);
};

window.prGetMomentsForScene = function(sceneId) {
  return prGetAllMoments().filter(m => (m.sceneId ?? null) === (sceneId ?? null));
};

window.prSaveMomentsForScene = async function(sceneId, moments) {
  const all = prGetAllMoments().filter(m => (m.sceneId ?? null) !== (sceneId ?? null));
  for (const m of moments) m.sceneId = sceneId ?? null;
  await prSaveAllMoments(all.concat(moments));
};

window.prDeleteMoment = async function(momentId) {
  const all = prGetAllMoments().filter(m => m.id !== momentId);
  await prSaveAllMoments(all);
};

window.prGetMomentById = function(momentId) {
  return prGetAllMoments().find(m => m.id === momentId) ?? null;
};

window.prMomentDuration = function(moment) {
  let end = 0;
  for (const clip of moment.clips ?? []) {
    end = Math.max(end, (clip.start ?? 0) + (clip.dur ?? 0));
    if (clip.type === "atmosphere" && clip.config?.autoEnd > 0) {
      end = Math.max(end, (clip.start ?? 0) + clip.config.autoEnd);
    }
  }
  return end;
};

window.prMomentMissingTargets = function(moment, scene) {
  if (!scene) return 0;
  const collections = { token: scene.tokens, tile: scene.tiles, light: scene.lights, wall: scene.walls };
  let count = 0;
  for (const clip of moment?.clips ?? []) {
    const cfg = clip.config ?? {};
    let type = null;
    let ids = [];
    if (clip.type === "perception") { type = "token"; ids = cfg.tokenIds; }
    else if (clip.type === "disguise" && !(cfg.action === "unset" && cfg.allTokens)) { type = "token"; ids = cfg.tokenIds; }
    else if (clip.type === "object") { type = cfg.targetType; ids = cfg.ids; }
    const collection = collections[type];
    if (!collection) continue;
    count += (ids ?? []).filter(id => !collection.get(id)).length;
  }
  return count;
};

// escapeHTML is v13+ looks like
window.prEscapeHtml = function(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
};

window.prGroupsForTokenDoc = function(tokenDoc) {
  const groups = new Set();
  if (!tokenDoc) return groups;

  const rawModes = tokenDoc.detectionModes ?? {};
  const modeList = Array.isArray(rawModes)
    ? rawModes
    : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));
  for (const mode of modeList) {
    if (!mode.enabled) continue;
    const match = PR_PERCEPTION_GROUPS.find(g => prDetectionModeIdForGroup(g.id) === mode.id);
    if (match) groups.add(match.id);
  }
  for (const g of tokenDoc.getFlag(PR_MODULE_ID, "viewerGroups") ?? []) groups.add(g);
  for (const g of prEffectGroupsForActor(tokenDoc.actor)) groups.add(g);
  return groups;
};

window.prViewAsOverride = null;

window.prPreviewedToken = function(override) {
  if (override?.mode !== "token" || !override.tokenId) return null;
  if (override.sceneId && (override.sceneId !== canvas?.scene?.id)) return null;
  return canvas?.scene?.tokens?.get(override.tokenId) ?? null;
};

function _prClientViewerContext() {
  const isGM = game.user?.isGM ?? false;
  const override = isGM ? window.prViewAsOverride : null;
  const tokenDoc = prPreviewedToken(override);
  if (tokenDoc) return { seesAll: false, tokenDoc };
  if (override?.mode === "all") return { seesAll: true, tokenDoc: null };
  if (override?.mode === "group" && override.groupId) return { seesAll: false, tokenDoc: null, groups: new Set([override.groupId]) };

  const gmSeeAll = isGM && (game.settings.get(PR_MODULE_ID, "gmSeeAll") ?? true);

  const controlled = canvas.tokens?.controlled ?? [];
  let viewer = controlled[0]?.document ?? null;
  if (!viewer && !isGM) viewer = prGetDefaultPlayerToken()?.document ?? null;

  if (isGM && (gmSeeAll || !viewer)) return { seesAll: true, tokenDoc: null };

  return { seesAll: false, tokenDoc: viewer ?? null };
}

window.prClientViewerToken = function() {
  const override = game.user?.isGM ? window.prViewAsOverride : null;
  if (override?.mode === "group") return null;
  const previewed = prPreviewedToken(override);
  if (previewed) return previewed;
  const controlled = canvas?.tokens?.controlled ?? [];
  if (controlled[0]?.document) return controlled[0].document;
  const { tokenDoc } = _prClientViewerContext();
  if (tokenDoc) return tokenDoc;
  return game.user?.isGM ? null : (prGetDefaultPlayerToken()?.document ?? null);
};

window.prClientPerceivedGroups = function() {
  const { seesAll, tokenDoc, groups } = _prClientViewerContext();
  return seesAll ? null : (groups ?? prGroupsForTokenDoc(tokenDoc));
};


window.prClientPerceivedGroupsAtTime = function(moment, atTime) {
  const context = _prClientViewerContext();
  const { seesAll, tokenDoc } = context;
  if (seesAll) return null;
  const groups = context.groups ?? prGroupsForTokenDoc(tokenDoc);
  if (!tokenDoc) return groups;

  const relevant = (moment?.clips ?? [])
    .filter(c => c.type === "perception" && (c.start ?? 0) <= atTime && (c.config?.tokenIds ?? []).includes(tokenDoc.id))
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  for (const clip of relevant) {
    const cfg = clip.config ?? {};
    if (cfg.action === "grant") groups.add(cfg.group);
    else groups.delete(cfg.group);
  }
  return groups;
};

window.prPerceptionView = function() {
  const { seesAll, tokenDoc, groups } = _prClientViewerContext();
  const isGM = game.user?.isGM ?? false;
  return {
    isGM,
    seesAll,
    tokenDoc,
    groups: seesAll ? null : (groups ?? prGroupsForTokenDoc(tokenDoc)),
    preview: isGM && !seesAll && (!!tokenDoc || !!groups)
  };
};

window.prPerceives = function(view, groups) {
  if (!groups?.length) return true;
  if (!view || view.seesAll) return true;
  return groups.some(g => view.groups?.has(g));
};

window.prPerceptionSignature = function() {
  const view = prPerceptionView();
  if (view.seesAll) return null;
  return [...(view.groups ?? [])].sort().join(",");
};

window.prApplyPerceptionView = function(override) {
  window.prViewAsOverride = override ?? null;
  prRefreshTokenPerception?.();
  prRefreshTilePerception?.();
  prRefreshLightPerception?.();
  prRefreshWallPerception?.();
  prRefreshTokenDisguises?.();
  Hooks.callAll("prPerceptionViewChanged", window.prViewAsOverride);
};

window.prTargetPoint = function(targetType, doc) {
  if (targetType === "token") {
    const placeable = canvas.tokens?.get(doc.id);
    if (placeable) return placeable.center;
    const size = canvas.grid?.size ?? 100;
    return { x: doc.x + size / 2, y: doc.y + size / 2 };
  }
  if (targetType === "tile") {
    const placeable = canvas.tiles?.get(doc.id);
    if (placeable) return placeable.center;
    return { x: doc.x + (doc.width ?? 0) / 2, y: doc.y + (doc.height ?? 0) / 2 };
  }
  if (targetType === "light") return { x: doc.x, y: doc.y };
  const c = doc.c ?? [0, 0, 0, 0];
  return { x: (c[0] + c[2]) / 2, y: (c[1] + c[3]) / 2 };
};

// canvas.ping broadcasts to players so ping locally
window.prLocatePoint = function(point) {
  if (!point || !canvas?.ready) return;
  try {
    canvas.animatePan({ x: point.x, y: point.y, duration: 250 });
    const types = CONFIG.Canvas.pings.types;
    canvas.controls?.handlePing(game.user, point, { scene: canvas.scene.id, style: types.PULSE, zoom: canvas.stage.scale.x });
  } catch (err) {
    console.error("[perceived-reality] locate ping failed:", err);
  }
};

window.prResolveNarrationText = function(cfg, moment, atTime) {
  const perGroup = cfg.perGroup ?? {};
  const perceived = moment ? prClientPerceivedGroupsAtTime(moment, atTime ?? 0) : prClientPerceivedGroups();
  for (const group of PR_PERCEPTION_GROUPS) {
    const override = perGroup[group.id];
    if (!override) continue;
    if (perceived === null || perceived.has(group.id)) return override;
  }
  return cfg.textDefault ?? "";
};

window.prAudienceMatch = function(audience, group, moment, atTime) {
  if (audience === "all" || !audience) return true;
  const groups = moment ? prClientPerceivedGroupsAtTime(moment, atTime ?? 0) : prClientPerceivedGroups();
  const perceives = groups === null || groups.has(group);
  return audience === "perceivers" ? perceives : !perceives;
};
