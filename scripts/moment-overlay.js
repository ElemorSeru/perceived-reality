function _prOverlayLayer(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}

function _prEnsureOverlayLayers() {
  const atmo = _prOverlayLayer("pr-ov-atmo");
  _prOverlayLayer("pr-ov-tint");
  _prOverlayLayer("pr-ov-vig");
  _prOverlayLayer("pr-ov-motes");
  _prOverlayLayer("pr-ov-curtain");
  return atmo;
}

function _prRebuildMotes(motes, count, dir) {
  motes.innerHTML = "";
  motes.dataset.count = count;
  motes.dataset.dir = dir;
  for (let i = 0; i < count; i++) {
    const m = document.createElement("div");
    m.className = "pr-ov-mote pr-ov-mote-" + dir;
    m.style.left = (5 + Math.random() * 88) + "%";
    m.style.top = (18 + Math.random() * 72) + "%";
    m.style.animationDuration = (5 + Math.random() * 6) + "s";
    m.style.animationDelay = (Math.random() * 6) + "s";
    motes.appendChild(m);
  }
}

window.prApplyAtmosphereFromScene = function() {
  if (!canvas?.scene) return;
  _prEnsureOverlayLayers();

  const atmo = document.getElementById("pr-ov-atmo");
  const tint = document.getElementById("pr-ov-tint");
  const vig = document.getElementById("pr-ov-vig");
  const motes = document.getElementById("pr-ov-motes");

  const byGroup = canvas.scene.getFlag(PR_MODULE_ID, PR_ATMO_FLAG) ?? {};
  const perceived = prClientPerceivedGroups();

  let cfg = null;
  for (const group of PR_PERCEPTION_GROUPS) {
    const c = byGroup[group.id];
    if (!c) continue;
    if (perceived === null || perceived.has(group.id)) { cfg = c; break; }
  }

  if (!cfg || cfg.preset === "none") {
    atmo.style.backdropFilter = "";
    tint.style.background = "transparent";
    vig.style.boxShadow = "none";
    motes.classList.remove("pr-ov-on");
    return;
  }

  atmo.style.backdropFilter =
    "saturate(" + (cfg.sat ?? 100) + "%) brightness(" + (cfg.bright ?? 100) + "%) hue-rotate(" + (cfg.hue ?? 0) + "deg)";
  const tintOn = cfg.tintOn ?? (cfg.tintA ?? 0) > 0;
  tint.style.background = tintOn ? prHexToRgba(cfg.tint ?? "#808080", (cfg.tintA ?? 0) / 100) : "transparent";
  vig.style.boxShadow = (cfg.vigS ?? 0) > 0
    ? "inset 0 0 22vw 8vw " + prHexToRgba(cfg.vig ?? "#000000", (cfg.vigS ?? 0) / 100)
    : "none";

  const moteCount = Math.max(0, cfg.moteCount ?? 14);
  const moteDir = cfg.moteDir ?? "up";
  if (motes.dataset.count !== String(moteCount) || motes.dataset.dir !== moteDir) {
    _prRebuildMotes(motes, moteCount, moteDir);
  }
  if (moteDir === "angle") {
    const rad = (cfg.moteAngle ?? 0) * Math.PI / 180;
    motes.style.setProperty("--pr-mote-dx", (130 * Math.sin(rad)) + "px");
    motes.style.setProperty("--pr-mote-dy", (-130 * Math.cos(rad)) + "px");
  }
  motes.classList.toggle("pr-ov-on", !!cfg.motes && moteCount > 0);
  for (const m of motes.querySelectorAll(".pr-ov-mote")) {
    m.style.background = prHexToRgba(cfg.moteC ?? "#ffe8b0", 0.85);
    m.style.boxShadow = "0 0 6px " + prHexToRgba(cfg.moteC ?? "#ffe8b0", 0.9);
  }
};

function _prBuildCurtain(cfg) {
  const curtain = document.getElementById("pr-ov-curtain");
  curtain.innerHTML = "";
  const t = PR_TRANSITIONS[cfg.style] ?? PR_TRANSITIONS.mist;

  curtain.style.background =
    "radial-gradient(ellipse 85% 65% at 50% 60%, " + prHexToRgba(cfg.c1, 0.35) + " 0%, transparent 75%), " +
    "linear-gradient(180deg, " + prHexToRgba(cfg.c2, 0.75) + ", " + prHexToRgba(cfg.c2, 0.92) + ")";

  const fx = t.fx;
  const n = cfg.count ?? t.count;

  if (fx === "blobs") {
    for (let i = 0; i < n; i++) {
      const b = document.createElement("div");
      b.className = "pr-ov-blob";
      const size = 30 + Math.random() * 34;
      b.style.width = size + "%";
      b.style.height = (size * 0.6) + "%";
      b.style.left = (Math.random() * 80 - 10) + "%";
      b.style.top = (Math.random() * 80 - 10) + "%";
      b.style.background = "radial-gradient(ellipse at center, " + prHexToRgba(cfg.c1, 0.5) + " 0%, transparent 70%)";
      b.style.animationDuration = (7 + Math.random() * 5) + "s";
      b.style.animationDelay = (-Math.random() * 6) + "s";
      curtain.appendChild(b);
    }
  } else if (fx === "bands") {
    for (let i = 0; i < n; i++) {
      const b = document.createElement("div");
      b.className = "pr-ov-band";
      b.style.top = (8 + i * (80 / Math.max(1, n))) + "%";
      b.style.background = "linear-gradient(180deg, transparent, " + prHexToRgba(cfg.c1, 0.4) + ", transparent)";
      b.style.animationDelay = (i * 0.7) + "s";
      curtain.appendChild(b);
    }
  } else if (fx === "pulse") {
    const p = document.createElement("div");
    p.className = "pr-ov-pulse";
    p.style.background = "radial-gradient(ellipse at center, transparent 30%, " + prHexToRgba(cfg.c1, 0.85) + " 78%)";
    curtain.appendChild(p);
  } else if (fx === "flash") {
    const f = document.createElement("div");
    f.className = "pr-ov-flash";
    f.style.background = prHexToRgba(cfg.c1, 0.85);
    f.style.animationDuration = (1.4 + Math.random()) + "s";
    curtain.appendChild(f);
  } else if (fx !== "none") {
    for (let i = 0; i < n; i++) {
      const g = document.createElement("div");
      let cls = "pr-ov-dot";
      let anim = "pr-ov-anim-rise";
      if (fx === "rise") { anim = "pr-ov-anim-rise"; }
      else if (fx === "fall") { anim = "pr-ov-anim-fall"; }
      else if (fx === "fallrot") { anim = "pr-ov-anim-fallrot"; }
      else if (fx === "petal") { cls = "pr-ov-petal"; anim = "pr-ov-anim-fallrot"; }
      else if (fx === "rain") { cls = "pr-ov-streakv"; anim = "pr-ov-anim-rain"; }
      else if (fx === "side") { cls = "pr-ov-streakh"; anim = "pr-ov-anim-side"; }
      else if (fx === "diag") { cls = "pr-ov-streakv"; anim = "pr-ov-anim-diag"; }
      else if (fx === "blink") { anim = "pr-ov-anim-blink"; }
      g.className = cls + " " + anim;

      if (cls === "pr-ov-dot") {
        const s = fx === "blink" && cfg.style === "static" ? 2 : 4 + Math.random() * 3;
        g.style.width = s + "px";
        g.style.height = s + "px";
      } else if (cls === "pr-ov-petal") {
        g.style.width = "10px";
        g.style.height = "7px";
      } else if (cls === "pr-ov-streakv") {
        g.style.height = (14 + Math.random() * 14) + "px";
      } else {
        g.style.width = (18 + Math.random() * 16) + "px";
      }

      g.style.background = cfg.c1;
      g.style.boxShadow = "0 0 " + (fx === "blink" ? 9 : 7) + "px " + prHexToRgba(cfg.c1, 0.85);
      g.style.left = (2 + Math.random() * 94) + "%";
      g.style.top = (fx === "fall" || fx === "fallrot" || fx === "petal" || fx === "rain" || fx === "diag"
        ? -8 + Math.random() * 40
        : 20 + Math.random() * 70) + "%";
      const durBase = fx === "rain" ? 1.1 : fx === "side" ? 1.8 : fx === "diag" ? 2 : 2.6;
      g.style.animationDuration = (durBase + Math.random() * durBase * 0.8) + "s";
      g.style.animationDelay = (Math.random() * 2) + "s";
      curtain.appendChild(g);
    }
  }

  return { curtain, warp: !!t.warp };
}

let _prTransitionTimers = [];

function _prClearTransitionTimers() {
  for (const id of _prTransitionTimers) clearTimeout(id);
  _prTransitionTimers = [];
}

window.prStopTransitionLocal = function() {
  _prClearTransitionTimers();
  _prEnsureOverlayLayers();
  const curtain = document.getElementById("pr-ov-curtain");
  curtain.style.transition = "";
  curtain.style.opacity = 0;
  curtain.innerHTML = "";
  curtain.classList.remove("pr-ov-warp");
  prApplyAtmosphereFromScene();
};

window.prPlayTransitionClip = function(cfg, durSec) {
  _prClearTransitionTimers();
  _prEnsureOverlayLayers();
  const { curtain, warp } = _prBuildCurtain(cfg);
  const total = Math.max(1, durSec) * 1000;
  const inMs = total * 0.45;
  const outMs = total * 0.35;

  const atmo = document.getElementById("pr-ov-atmo");
  const prevFilter = atmo.style.backdropFilter;
  atmo.style.backdropFilter = (prevFilter ? prevFilter + " " : "") + "blur(" + (cfg.blur ?? 6) + "px) brightness(0.85)";
  if (warp) curtain.classList.add("pr-ov-warp");

  curtain.style.transition = "opacity " + inMs + "ms ease";
  requestAnimationFrame(() => { curtain.style.opacity = (cfg.intensity ?? 90) / 100; });

  _prTransitionTimers.push(setTimeout(() => {
    curtain.style.transition = "opacity " + outMs + "ms ease";
    curtain.style.opacity = 0;
    prApplyAtmosphereFromScene();
  }, total - outMs));

  _prTransitionTimers.push(setTimeout(() => {
    curtain.classList.remove("pr-ov-warp");
    curtain.innerHTML = "";
  }, total + 200));
};

let _prNarrationTimers = [];
let _prNarrationInterval = null;

function _prClearNarrationTimers() {
  if (_prNarrationInterval) { clearInterval(_prNarrationInterval); _prNarrationInterval = null; }
  for (const id of _prNarrationTimers) clearTimeout(id);
  _prNarrationTimers = [];
}

window.prClearNarrationLocal = function() {
  _prClearNarrationTimers();
  document.body.classList.remove("pr-ov-narrating");
  const box = document.getElementById("pr-ov-narration");
  if (box) box.textContent = "";
};

window.prPlayNarrationClip = function(cfg, durSec, moment, atTime) {
  _prClearNarrationTimers();
  _prEnsureOverlayLayers();
  const text = prResolveNarrationText(cfg, moment, atTime);
  if (!text) { document.body.classList.remove("pr-ov-narrating"); return; }

  const top = _prOverlayLayer("pr-ov-lb-top");
  const bottom = _prOverlayLayer("pr-ov-lb-bottom");
  const box = _prOverlayLayer("pr-ov-narration");
  top.className = "pr-ov-lb pr-ov-lb-top";
  bottom.className = "pr-ov-lb pr-ov-lb-bottom";
  box.className = "pr-ov-narration";
  box.textContent = "";

  document.body.classList.add("pr-ov-narrating");

  const typeMs = 32;
  const total = Math.max(2, durSec) * 1000;
  const typeTime = text.length * typeMs;
  const holdTime = Math.max(800, total - typeTime - 1600);

  let i = 0;
  _prNarrationInterval = setInterval(() => {
    i += 1;
    box.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(_prNarrationInterval);
      _prNarrationInterval = null;
      _prNarrationTimers.push(setTimeout(() => {
        document.body.classList.remove("pr-ov-narrating");
        _prNarrationTimers.push(setTimeout(() => { box.textContent = ""; }, 900));
      }, holdTime));
    }
  }, typeMs);
};

window.prPlaySoundClip = async function(cfg, durSec) {
  if (!cfg.path) return;
  const helper = foundry.audio?.AudioHelper;
  try {
    const sound = await helper.play({ src: cfg.path, volume: cfg.volume ?? 0.8, loop: !!cfg.loop }, false);
    if (cfg.loop && sound) {
      setTimeout(() => { try { sound.stop(); } catch (e) { } }, Math.max(1, durSec) * 1000);
    }
  } catch (err) {
    console.error("[perceived-reality] sound playback failed:", err);
  }
};

window.prClearOverlayLocal = function() {
  _prClearTransitionTimers();
  _prClearNarrationTimers();
  _prEnsureOverlayLayers();

  const curtain = document.getElementById("pr-ov-curtain");
  curtain.style.transition = "";
  curtain.style.opacity = 0;
  curtain.innerHTML = "";
  curtain.classList.remove("pr-ov-warp");

  document.getElementById("pr-ov-atmo").style.backdropFilter = "";
  document.getElementById("pr-ov-tint").style.background = "transparent";
  document.getElementById("pr-ov-vig").style.boxShadow = "none";
  document.getElementById("pr-ov-motes").classList.remove("pr-ov-on");

  const box = document.getElementById("pr-ov-narration");
  if (box) box.textContent = "";
  document.body.classList.remove("pr-ov-narrating");

  prFxStopAllLocal();

  prApplyAtmosphereFromScene();
};

Hooks.on("canvasReady", function() {
  _prEnsureOverlayLayers();
  prApplyAtmosphereFromScene();
});

Hooks.on("controlToken", function() { prApplyAtmosphereFromScene(); });
Hooks.on("createActiveEffect", function() { prApplyAtmosphereFromScene(); });
Hooks.on("deleteActiveEffect", function() { prApplyAtmosphereFromScene(); });
Hooks.on("updateActiveEffect", function() { prApplyAtmosphereFromScene(); });

Hooks.on("updateScene", function(scene, change) {
  if (scene.id !== canvas?.scene?.id) return;
  if (change.flags?.[PR_MODULE_ID]) prApplyAtmosphereFromScene();
});
