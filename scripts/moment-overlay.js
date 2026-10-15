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
  _prOverlayLayer("pr-ov-curtain");
  return atmo;
}


function _prRgb(hex) {
  const n = parseInt(String(hex ?? "").replace("#", ""), 16);
  if (!Number.isFinite(n)) return "255,232,176";
  return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
}

window.prApplyAtmosphereFromScene = function() {
  if (!canvas?.scene) return;
  _prEnsureOverlayLayers();

  const atmo = document.getElementById("pr-ov-atmo");
  const tint = document.getElementById("pr-ov-tint");
  const vig = document.getElementById("pr-ov-vig");

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
    for (const slot of PR_ATMO_SECTIONS) _prApplyParticleLayer(prAtmoSectionFx(null), slot);
    return;
  }

  cfg = prAtmoToV2(cfg);
  const mood = cfg.mood ?? {};
  const sat = mood.sat ?? 100;
  const bright = mood.bright ?? 100;
  const hue = mood.hue ?? 0;
  atmo.style.backdropFilter = (sat === 100 && bright === 100 && hue === 0)
    ? ""
    : "saturate(" + sat + "%) brightness(" + bright + "%) hue-rotate(" + hue + "deg)";
  const tintOn = mood.tintOn ?? (mood.tintA ?? 0) > 0;
  tint.style.background = tintOn ? prHexToRgba(mood.tint ?? "#808080", (mood.tintA ?? 0) / 100) : "transparent";
  vig.style.boxShadow = (mood.vigS ?? 0) > 0
    ? "inset 0 0 22vw 8vw " + prHexToRgba(mood.vig ?? "#000000", (mood.vigS ?? 0) / 100)
    : "none";

  _prApplyParticleLayer(prAtmoSectionFx(cfg.bg, cfg.glow), "bg");
  _prApplyParticleLayer(prAtmoSectionFx(cfg.fg, cfg.glow), "fg");
  _prApplyParticleLayer(prAtmoSectionFx(cfg.pt, cfg.ptGlow), "pt");
};

function _prApplyParticleLayer(fx, slot) {
  fx.rgb = _prRgb(fx.color);
  if (!(fx.opacity > 0)) fx = { ...fx, style: "none" };
  prGroundApply(fx, slot);
}

function _prBuildCurtain(cfg, durSec) {
  const curtain = document.getElementById("pr-ov-curtain");
  curtain.innerHTML = "";
  const t = PR_TRANSITIONS[cfg.style] ?? PR_TRANSITIONS.mist;

  curtain.style.background = "transparent";

  const cover = document.createElement("div");
  cover.className = "pr-ov-cover";
  cover.style.background = cfg.c2 || t.c2 || "#000000";
  cover.style.opacity = prTransitionCover(cfg) / 100;
  curtain.appendChild(cover);

  const look = document.createElement("div");
  look.className = "pr-ov-look";
  look.style.opacity = (cfg.intensity ?? 90) / 100;
  const glow = t.fx === "sheen" ? "transparent" : prHexToRgba(cfg.c1, 0.35);
  const tint = prTransitionCover(cfg) / 100;
  look.style.background =
    "radial-gradient(ellipse 85% 65% at 50% 60%, " + glow + " 0%, transparent 75%), " +
    "linear-gradient(180deg, " + prHexToRgba(cfg.c2, 0.75 * tint) + ", " + prHexToRgba(cfg.c2, 0.92 * tint) + ")";
  curtain.appendChild(look);

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
      look.appendChild(b);
    }
  } else if (fx === "bands") {
    for (let i = 0; i < n; i++) {
      const b = document.createElement("div");
      b.className = "pr-ov-band";
      b.style.top = (8 + i * (80 / Math.max(1, n))) + "%";
      b.style.background = "linear-gradient(180deg, transparent, " + prHexToRgba(cfg.c1, 0.4) + ", transparent)";
      b.style.animationDelay = (i * 0.7) + "s";
      look.appendChild(b);
    }
  } else if (fx === "pulse") {
    const p = document.createElement("div");
    p.className = "pr-ov-pulse";
    p.style.background = "radial-gradient(ellipse at center, transparent 30%, " + prHexToRgba(cfg.c1, 0.85) + " 78%)";
    look.appendChild(p);
  } else if (fx === "sheen") {
    const sweep = prSheenSweep(cfg);
    const across = sweep.from === "left" || sweep.from === "right";
    const edge = (side) => {
      if (side === "left") return { x: "-160%", y: "0" };
      if (side === "right") return { x: "160%", y: "0" };
      if (side === "top") return { x: "0", y: "-160%" };
      return { x: "0", y: "160%" };
    };
    const enter = edge(sweep.from);
    const leave = edge(sweep.to);
    const phases = prTransitionPhases(cfg, durSec);
    const casc = Math.max(0.05, Math.min(0.9, 0.45 * sweep.sweep));
    const inDur = Math.max(0.05, phases.easeIn * (1 - casc));
    const outDur = Math.max(0.05, phases.easeOut * (1 - casc));
    const outAt = phases.easeIn + phases.hold;
    const gap = n > 1 ? 1 / (n - 1) : 0;
    const hue = 0;
    const spread = 100 / Math.max(1, n);
    const slats = document.createElement("div");
    slats.className = "pr-ov-slats";
    slats.style.setProperty("--pr-tilt", sweep.tilt + "deg");
    look.appendChild(slats);

    for (let i = 0; i < n; i++) {
      const g = document.createElement("div");
      g.className = "pr-ov-slat";
      const at = (d) => Math.round(hue + i * (300 / Math.max(1, n)) + d) % 360;
      g.style.background = "linear-gradient(" + (across ? "100deg" : "190deg") + ", " +
        "hsla(" + at(0) + ",95%,72%,0) 0%, " +
        "hsla(" + at(40) + ",97%,76%,.62) 14%, " +
        "hsla(" + at(110) + ",92%,72%,.5) 33%, " +
        "hsla(" + at(185) + ",96%,76%,.62) 52%, " +
        "hsla(" + at(260) + ",93%,76%,.5) 71%, " +
        "hsla(" + at(320) + ",95%,76%,.56) 88%, " +
        "hsla(" + at(360) + ",95%,72%,0) 100%)";
      if (across) {
        g.style.left = "-10%";
        g.style.width = "120%";
        g.style.top = (i * spread) + "%";
        g.style.height = (spread * 0.94) + "%";
      } else {
        g.style.top = "-10%";
        g.style.height = "120%";
        g.style.left = (i * spread) + "%";
        g.style.width = (spread * 0.94) + "%";
      }
      g.style.setProperty("--pr-in-x", enter.x);
      g.style.setProperty("--pr-in-y", enter.y);
      g.style.setProperty("--pr-out-x", leave.x);
      g.style.setProperty("--pr-out-y", leave.y);
      g.style.setProperty("--pr-sb", (Math.max(0, cfg.blur ?? 3) * 0.5 + (i % 3) * 0.9).toFixed(1) + "px");
      const seq = i * gap;
      g.style.animationDuration = inDur.toFixed(2) + "s, " + outDur.toFixed(2) + "s, 7s";
      g.style.animationDelay = (seq * phases.easeIn * casc).toFixed(3) + "s, " +
        (outAt + seq * phases.easeOut * casc).toFixed(3) + "s, " + (-i * 0.4) + "s";
      slats.appendChild(g);
    }
  } else if (fx === "flash") {
    const f = document.createElement("div");
    f.className = "pr-ov-flash";
    f.style.background = prHexToRgba(cfg.c1, 0.85);
    f.style.animationDuration = (1.4 + Math.random()) + "s";
    look.appendChild(f);
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
  const { curtain, warp } = _prBuildCurtain(cfg, durSec);
  const phases = prTransitionPhases(cfg, durSec);
  const total = phases.total * 1000;
  const inMs = phases.easeIn * 1000;
  const outMs = phases.easeOut * 1000;

  const atmo = document.getElementById("pr-ov-atmo");
  const prevFilter = atmo.style.backdropFilter;
  atmo.style.backdropFilter = (prevFilter ? prevFilter + " " : "") + "blur(" + (cfg.blur ?? 6) + "px) brightness(0.85)";
  if (warp) curtain.classList.add("pr-ov-warp");

  curtain.style.transition = "opacity " + inMs + "ms ease";
  requestAnimationFrame(() => { curtain.style.opacity = 1; });

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

Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRequestRefresh("prApplyAtmosphereFromScene");
});

Hooks.on("updateActor", function(actor) {
  if (actor?.token || actor?.getActiveTokens?.().length) prRequestRefresh("prApplyAtmosphereFromScene");
});

Hooks.on("updateScene", function(scene, change) {
  if (scene.id !== canvas?.scene?.id) return;
  if (change.flags?.[PR_MODULE_ID]) prApplyAtmosphereFromScene();
});
