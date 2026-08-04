window.prFxAvailable = function() {
  return !!(game.modules?.get?.("fxmaster")?.active && globalThis.FXMASTER?.api?.effects);
};

window.prFxAudienceCapable = function() {
  return prFxAvailable() && !!(globalThis.CONFIG?.fxmaster?.particleEffects || globalThis.CONFIG?.fxmaster?.filterEffects);
};

function _prFxRegistryTypes(registry) {
  const out = [];
  for (const [id, cls] of Object.entries(registry ?? {})) {
    if (typeof cls !== "function") continue;
    const label = cls.label ? game.i18n.localize(cls.label) : id;
    out.push([id, label]);
  }
  out.sort((a, b) => a[1].localeCompare(b[1]));
  return out;
}

window.prFxParticleTypes = function() {
  return _prFxRegistryTypes(globalThis.CONFIG?.fxmaster?.particleEffects);
};

window.prFxFilterTypes = function() {
  return _prFxRegistryTypes(globalThis.CONFIG?.fxmaster?.filterEffects);
};

window.prFxParams = function(kind, type) {
  const registry = kind === "filter" ? globalThis.CONFIG?.fxmaster?.filterEffects : globalThis.CONFIG?.fxmaster?.particleEffects;
  const cls = registry?.[type];
  if (typeof cls !== "function") return {};
  try {
    return cls.parameters ?? {};
  } catch (err) {
    console.warn("[perceived-reality] fxmaster parameters unreadable for", type, err);
    return {};
  }
};

window.prFxDefaults = function(kind, type) {
  const params = prFxParams(kind, type);
  const out = {};
  for (const [key, def] of Object.entries(params)) {
    out[key] = foundry.utils.deepClone(def?.value);
  }
  return out;
};

window.prFxPresetList = function() {
  try {
    const list = globalThis.FXMASTER?.api?.presets?.list?.();
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn("[perceived-reality] fxmaster preset list failed:", err);
    return [];
  }
};

function _prFxLedgerRead() {
  const raw = game.settings.get(PR_MODULE_ID, "fxLedger");
  return Array.isArray(raw) ? foundry.utils.deepClone(raw) : [];
}

async function _prFxLedgerWrite(list) {
  await game.settings.set(PR_MODULE_ID, "fxLedger", list);
}

function _prFxPresetOverrides(cfg) {
  const opts = {};
  if (cfg.direction !== "" && cfg.direction !== undefined) opts.direction = cfg.direction;
  if (cfg.speed !== "" && cfg.speed !== undefined) opts.speed = cfg.speed;
  if (cfg.density !== "" && cfg.density !== undefined) opts.density = cfg.density;
  if (cfg.colorApply && cfg.color) opts.color = cfg.color;
  return opts;
}

window.prFxPlayGlobal = async function(clip, scene) {
  if (!prFxAvailable()) return null;
  const cfg = clip.config ?? {};
  const record = { key: "pr-fx-" + clip.id + "-" + foundry.utils.randomID(8), sceneId: scene?.id ?? null, mode: cfg.mode };
  try {
    if (cfg.mode === "preset") {
      if (!cfg.preset) return null;
      record.name = cfg.preset;
      await FXMASTER.api.presets.play(cfg.preset, Object.assign({ scene: scene?.uuid ?? undefined, silent: true }, _prFxPresetOverrides(cfg)));
    } else {
      if (!cfg.type) return null;
      const def = { type: cfg.type, options: foundry.utils.deepClone(cfg.options ?? {}) };
      record.def = def;
      const payload = cfg.mode === "filter" ? { filters: [def] } : { particles: [def] };
      payload.scene = scene?.uuid ?? undefined;
      const res = await FXMASTER.api.effects.play(payload);
      record.ids = Array.isArray(res) ? res : (res?.particles ?? res?.filters ?? []);
    }
  } catch (err) {
    console.error("[perceived-reality] fxmaster play failed:", err);
    return null;
  }
  const ledger = _prFxLedgerRead();
  ledger.push(record);
  await _prFxLedgerWrite(ledger);
  return record;
};

window.prFxStopGlobal = async function(record) {
  if (!record || !prFxAvailable()) return;
  const scene = record.sceneId ? game.scenes.get(record.sceneId) : null;
  try {
    if (record.mode === "preset") {
      await FXMASTER.api.presets.stop(record.name, { scene: scene?.uuid ?? undefined, silent: true });
    } else {
      const entries = Array.isArray(record.ids) && record.ids.length ? record.ids : [record.def].filter(Boolean);
      if (entries.length) {
        const payload = record.mode === "filter" ? { filters: entries } : { particles: entries };
        payload.scene = scene?.uuid ?? undefined;
        await FXMASTER.api.effects.stop(payload);
      }
    }
  } catch (err) {
    console.error("[perceived-reality] fxmaster stop failed:", err);
  }
  const ledger = _prFxLedgerRead().filter(r => r.key !== record.key);
  await _prFxLedgerWrite(ledger);
};

Hooks.once("ready", async function() {
  if (!game.user.isGM) return;
  const ledger = _prFxLedgerRead();
  if (!ledger.length) return;
  if (!prFxAvailable()) {
    await _prFxLedgerWrite([]);
    return;
  }
  for (const record of ledger) {
    await prFxStopGlobal(record);
  }
});

window.prFxLocalActive = [];

const _PR_FX_FADE_MS = 1200;

function _prFxWrapParticleOptions(options) {
  return Object.fromEntries(Object.entries(options ?? {}).map(([k, v]) => [k, { value: v }]));
}

window.prFxPlayLocal = function(clip) {
  const cfg = clip.config ?? {};
  if (!prFxAudienceCapable() || cfg.mode === "preset" || !cfg.type) return;
  const durMs = Math.max(0.5, clip.dur ?? 0) * 1000;

  if (cfg.mode === "filter") {
    const cls = globalThis.CONFIG?.fxmaster?.filterEffects?.[cfg.type];
    if (typeof cls !== "function") return;
    const target = canvas.environment ?? canvas.primary;
    if (!target) return;
    let filter;
    try {
      filter = new cls(foundry.utils.deepClone(cfg.options ?? {}), "pr-fx-" + clip.id);
      target.filters = (target.filters ?? []).concat(filter);
      filter.play?.();
    } catch (err) {
      console.warn("[perceived-reality] local fxmaster filter failed:", err);
      return;
    }
    const handle = { kind: "filter", filter, target, timer: null };
    handle.timer = setTimeout(() => _prFxStopLocalHandle(handle), durMs);
    prFxLocalActive.push(handle);
    return;
  }

  const cls = globalThis.CONFIG?.fxmaster?.particleEffects?.[cfg.type];
  if (typeof cls !== "function" || !canvas?.stage) return;
  let eff;
  try {
    eff = new cls(_prFxWrapParticleOptions(cfg.options));
    canvas.stage.addChild(eff);
    eff.play({ prewarm: false });
    if (typeof eff.fadeIn === "function") {
      eff.alpha = 0;
      eff.fadeIn({ timeout: _PR_FX_FADE_MS });
    }
  } catch (err) {
    console.warn("[perceived-reality] local fxmaster particle failed:", err);
    try { eff?.destroy?.(); } catch (e) { console.debug(e); }
    return;
  }
  const handle = { kind: "particle", eff, timer: null };
  handle.timer = setTimeout(() => _prFxStopLocalHandle(handle), Math.max(0, durMs - _PR_FX_FADE_MS));
  prFxLocalActive.push(handle);
};

async function _prFxStopLocalHandle(handle) {
  const i = prFxLocalActive.indexOf(handle);
  if (i !== -1) prFxLocalActive.splice(i, 1);
  if (handle.timer) clearTimeout(handle.timer);
  try {
    if (handle.kind === "filter") {
      await handle.filter.stop?.();
      if (Array.isArray(handle.target.filters)) {
        handle.target.filters = handle.target.filters.filter(f => f !== handle.filter);
      }
    } else {
      if (typeof handle.eff.fadeOut === "function") await handle.eff.fadeOut({ timeout: _PR_FX_FADE_MS });
      handle.eff.stop?.();
      handle.eff.parent?.removeChild?.(handle.eff);
      handle.eff.destroy?.({ children: true });
    }
  } catch (err) {
    console.warn("[perceived-reality] local fxmaster stop failed:", err);
  }
}

window.prFxStopAllLocal = function() {
  for (const handle of prFxLocalActive.slice()) _prFxStopLocalHandle(handle);
};

Hooks.on("canvasTearDown", function() {
  for (const handle of prFxLocalActive.slice()) {
    if (handle.timer) clearTimeout(handle.timer);
  }
  prFxLocalActive.length = 0;
});
