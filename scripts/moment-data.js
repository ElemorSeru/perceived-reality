window.PR_MOMENT_FLAG = "moments";
window.PR_ATMO_FLAG = "atmospheres";

window.PR_TRANSITIONS = {
  mist: { labelKey: "perceived-reality.Moments.Transitions.mist", fx: "blobs", c1: "#ccd2e2", c2: "#6a7290", count: 5, blur: 7, intensity: 92, dur: 3.5 },
  blackout: { labelKey: "perceived-reality.Moments.Transitions.blackout", fx: "none", c1: "#000000", c2: "#000000", count: 0, blur: 4, intensity: 97, dur: 3 },
  pollen: { labelKey: "perceived-reality.Moments.Transitions.pollen", fx: "rise", c1: "#ffe682", c2: "#a08030", count: 34, blur: 6, intensity: 80, dur: 4 },
  ripple: { labelKey: "perceived-reality.Moments.Transitions.ripple", fx: "bands", c1: "#b4dcff", c2: "#3a5c80", count: 3, blur: 5, intensity: 55, dur: 3.5, warp: true },
  ember: { labelKey: "perceived-reality.Moments.Transitions.ember", fx: "fall", c1: "#ff8c3c", c2: "#601408", count: 26, blur: 6, intensity: 85, dur: 4 },
  snow: { labelKey: "perceived-reality.Moments.Transitions.snow", fx: "fallrot", c1: "#ffffff", c2: "#8ba0c0", count: 30, blur: 5, intensity: 75, dur: 4 },
  rain: { labelKey: "perceived-reality.Moments.Transitions.rain", fx: "rain", c1: "#9fb8d8", c2: "#2e3c50", count: 40, blur: 6, intensity: 80, dur: 3.5 },
  sand: { labelKey: "perceived-reality.Moments.Transitions.sand", fx: "side", c1: "#e0c080", c2: "#78582c", count: 38, blur: 7, intensity: 88, dur: 3.5 },
  fireflies: { labelKey: "perceived-reality.Moments.Transitions.fireflies", fx: "blink", c1: "#d8ff8c", c2: "#16280f", count: 22, blur: 4, intensity: 70, dur: 4.5 },
  static: { labelKey: "perceived-reality.Moments.Transitions.static", fx: "blink", c1: "#ffffff", c2: "#08080f", count: 55, blur: 8, intensity: 90, dur: 3 },
  bloodmist: { labelKey: "perceived-reality.Moments.Transitions.bloodmist", fx: "blobs", c1: "#c03040", c2: "#40060e", count: 5, blur: 7, intensity: 88, dur: 4 },
  spores: { labelKey: "perceived-reality.Moments.Transitions.spores", fx: "rise", c1: "#a0d060", c2: "#26380f", count: 24, blur: 8, intensity: 85, dur: 4.5 },
  starfall: { labelKey: "perceived-reality.Moments.Transitions.starfall", fx: "diag", c1: "#ffffff", c2: "#0c1228", count: 18, blur: 4, intensity: 78, dur: 4 },
  ghostlight: { labelKey: "perceived-reality.Moments.Transitions.ghostlight", fx: "blobs", c1: "#bfe8ff", c2: "#1c3240", count: 4, blur: 10, intensity: 75, dur: 4.5 },
  shadow: { labelKey: "perceived-reality.Moments.Transitions.shadow", fx: "pulse", c1: "#000000", c2: "#140c1e", count: 1, blur: 6, intensity: 92, dur: 4 },
  haze: { labelKey: "perceived-reality.Moments.Transitions.haze", fx: "rise", c1: "#ffd882", c2: "#8a6828", count: 12, blur: 5, intensity: 65, dur: 3.5 },
  petals: { labelKey: "perceived-reality.Moments.Transitions.petals", fx: "petal", c1: "#ffb0c8", c2: "#502636", count: 26, blur: 4, intensity: 70, dur: 4.5 },
  ash: { labelKey: "perceived-reality.Moments.Transitions.ash", fx: "fallrot", c1: "#b0a8a0", c2: "#241c16", count: 32, blur: 7, intensity: 88, dur: 4 },
  lightning: { labelKey: "perceived-reality.Moments.Transitions.lightning", fx: "flash", c1: "#e8f0ff", c2: "#10141e", count: 1, blur: 5, intensity: 90, dur: 3.5 },
  dream: { labelKey: "perceived-reality.Moments.Transitions.dream", fx: "blobs", c1: "#b088e0", c2: "#1e1030", count: 5, blur: 9, intensity: 85, dur: 5, warp: true }
};

window.PR_ATMO_PRESETS = {
  none: { labelKey: "perceived-reality.Moments.Presets.none", sat: 100, bright: 100, hue: 0, tintOn: false, tint: "#808080", tintA: 0, vig: "#000000", vigS: 0, motes: false, moteC: "#ffe8b0", moteCount: 14, moteDir: "up" },
  fey: { labelKey: "perceived-reality.Moments.Presets.fey", sat: 145, bright: 108, hue: -10, tintOn: true, tint: "#8a50c8", tintA: 20, vig: "#503078", vigS: 40, motes: true, moteC: "#ffe8b0", moteCount: 14, moteDir: "up" },
  dread: { labelKey: "perceived-reality.Moments.Presets.dread", sat: 35, bright: 84, hue: 0, tintOn: true, tint: "#1e3c64", tintA: 34, vig: "#0a1428", vigS: 75, motes: false, moteC: "#a0c8e8", moteCount: 14, moteDir: "up" },
  ashen: { labelKey: "perceived-reality.Moments.Presets.ashen", sat: 15, bright: 90, hue: 0, tintOn: true, tint: "#6a5a40", tintA: 28, vig: "#201a14", vigS: 70, motes: false, moteC: "#c0b8a8", moteCount: 14, moteDir: "up" },
  sickly: { labelKey: "perceived-reality.Moments.Presets.sickly", sat: 70, bright: 94, hue: 38, tintOn: true, tint: "#4a6a20", tintA: 26, vig: "#141c08", vigS: 55, motes: true, moteC: "#c8e870", moteCount: 14, moteDir: "up" }
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

window.prHexToRgba = function(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
};

window.prNewClip = function(type) {
  const clip = { id: foundry.utils.randomID(), type, start: 0, dur: 0, config: {} };
  if (type === "transition") {
    const t = PR_TRANSITIONS.mist;
    clip.dur = t.dur;
    clip.config = { style: "mist", c1: t.c1, c2: t.c2, count: t.count, blur: t.blur, intensity: t.intensity, audience: "all", group: PR_PERCEPTION_GROUPS[0].id };
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
    clip.config = Object.assign({ group: PR_PERCEPTION_GROUPS[0].id, preset: "none", autoEnd: 0 }, PR_ATMO_PRESETS.none);
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
  for (const effect of tokenDoc.actor?.effects ?? []) {
    if (effect.disabled) continue;
    const efGroups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
    if (Array.isArray(efGroups)) {
      for (const g of efGroups) groups.add(g);
    }
  }
  return groups;
};

window.prViewAsOverride = null;

function _prClientViewerContext() {
  const isGM = game.user?.isGM ?? false;
  const override = isGM ? window.prViewAsOverride : null;
  if (override?.mode === "token" && override.tokenId) {
    const tokenDoc = canvas?.scene?.tokens?.get(override.tokenId);
    if (tokenDoc) return { seesAll: false, tokenDoc };
  }
  if (override?.mode === "all") return { seesAll: true, tokenDoc: null };

  const gmSeeAll = isGM && (game.settings.get(PR_MODULE_ID, "gmSeeAll") ?? true);

  const controlled = canvas.tokens?.controlled ?? [];
  let viewer = controlled[0]?.document ?? null;
  if (!viewer && !isGM) viewer = prGetDefaultPlayerToken()?.document ?? null;

  if (isGM && (gmSeeAll || !viewer)) return { seesAll: true, tokenDoc: null };

  return { seesAll: false, tokenDoc: viewer ?? null };
}

window.prClientPerceivedGroups = function() {
  const { seesAll, tokenDoc } = _prClientViewerContext();
  return seesAll ? null : prGroupsForTokenDoc(tokenDoc);
};

window.prClientPerceivedGroupsAtTime = function(moment, atTime) {
  const { seesAll, tokenDoc } = _prClientViewerContext();
  if (seesAll) return null;
  const groups = prGroupsForTokenDoc(tokenDoc);
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
