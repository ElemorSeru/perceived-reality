const _PR_SOCKET = "module.perceived-reality";

// One shared overlay winner per stretch of time. Ties go to the most recent clip
function _prTrackSegments(moment, type, evaluate) {
  const clips = (moment.clips ?? []).filter(c => c.type === type);
  if (!clips.length) return [];

  const boundarySet = new Set([0]);
  for (const c of clips) {
    const start = c.start ?? 0;
    boundarySet.add(start);
    boundarySet.add(start + Math.max(c.dur ?? 0, 0.001));
  }
  const boundaries = Array.from(boundarySet).sort((a, b) => a - b);

  const windows = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const wStart = boundaries[i];
    const wEnd = boundaries[i + 1];
    if (wEnd <= wStart) continue;
    const active = clips.filter(c => (c.start ?? 0) <= wStart && (c.start ?? 0) + Math.max(c.dur ?? 0, 0.001) > wStart);

    let winner = null;
    let bestSpecificity = -Infinity;
    for (const c of active) {
      const { eligible, specificity } = evaluate(c, wStart);
      if (!eligible) continue;
      const better = !winner || specificity > bestSpecificity ||
        (specificity === bestSpecificity && (c.start ?? 0) > (winner.start ?? 0));
      if (better) { winner = c; bestSpecificity = specificity; }
    }
    windows.push({ start: wStart, end: wEnd, winner });
  }

  const segments = [];
  for (const w of windows) {
    const last = segments[segments.length - 1];
    if (last && (last.winner?.id ?? null) === (w.winner?.id ?? null)) last.end = w.end;
    else segments.push({ start: w.start, end: w.end, winner: w.winner });
  }
  return segments;
}

function _prScheduleTrack(moment, type, evaluate, playFn, stopFn) {
  for (const seg of _prTrackSegments(moment, type, evaluate)) {
    setTimeout(() => {
      if (seg.winner) playFn(seg.winner, seg.end - seg.start);
      else stopFn();
    }, seg.start * 1000);
  }
}

function _prNarrationSpecificity(clip, moment, atTime) {
  const cfg = clip.config ?? {};
  const resolved = prResolveNarrationText(cfg, moment, atTime);
  return resolved && resolved !== (cfg.textDefault ?? "") ? 1 : 0;
}

function _prPresentMoment(moment) {
  _prScheduleTrack(moment, "narration",
    (clip, atTime) => ({ eligible: true, specificity: _prNarrationSpecificity(clip, moment, atTime) }),
    (clip, durSec) => prPlayNarrationClip(clip.config, durSec, moment, clip.start ?? 0),
    () => prClearNarrationLocal()
  );

  _prScheduleTrack(moment, "transition",
    (clip, atTime) => ({ eligible: prAudienceMatch(clip.config.audience, clip.config.group, moment, atTime), specificity: 0 }),
    (clip, durSec) => prPlayTransitionClip(clip.config, durSec),
    () => prStopTransitionLocal()
  );

  for (const clip of moment.clips ?? []) {
    const delay = (clip.start ?? 0) * 1000;
    if (clip.type === "sound") {
      setTimeout(() => {
        if (prAudienceMatch(clip.config.audience, clip.config.group, moment, clip.start ?? 0)) {
          prPlaySoundClip(clip.config, clip.dur);
        }
      }, delay);
    } else if (clip.type === "fx" && clip.config.audience !== "all") {
      setTimeout(() => {
        if (prAudienceMatch(clip.config.audience, clip.config.group, moment, clip.start ?? 0)) {
          prFxPlayLocal(clip);
        }
      }, delay);
    }
  }
}

async function _prClearAtmosphereGroup(scene, group) {
  await scene.update({ [`flags.${PR_MODULE_ID}.${PR_ATMO_FLAG}.-=${group}`]: null });
  if (scene.id === canvas?.scene?.id) prApplyAtmosphereFromScene();
}

async function _prExecuteStateClip(clip, scene) {
  const cfg = clip.config ?? {};
  try {
    if (clip.type === "perception") {
      for (const tokenId of cfg.tokenIds ?? []) {
        const tokenDoc = scene.tokens.get(tokenId);
        if (!tokenDoc) continue;
        const grant = cfg.action === "grant";
        await _prSetDetectionModeForToken(tokenDoc, prDetectionModeIdForGroup(cfg.group), grant);
        const current = new Set(tokenDoc.getFlag(PR_MODULE_ID, "viewerGroups") ?? []);
        if (grant) current.add(cfg.group);
        else current.delete(cfg.group);
        await tokenDoc.setFlag(PR_MODULE_ID, "viewerGroups", Array.from(current));
      }
    } else if (clip.type === "object") {
      const collections = { token: scene.tokens, tile: scene.tiles, light: scene.lights, wall: scene.walls };
      const collection = collections[cfg.targetType];
      if (!collection) return;
      for (const id of cfg.ids ?? []) {
        const doc = collection.get(id);
        if (!doc) continue;
        const current = new Set(doc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS) ?? []);
        if (cfg.action === "add") current.add(cfg.group);
        else current.delete(cfg.group);
        await doc.update({ [`flags.${PR_MODULE_ID}.${PR_FLAG_PERCEPTION_GROUPS}`]: Array.from(current) });
      }
    } else if (clip.type === "atmosphere") {
      if (cfg.preset === "none") {
        await scene.update({ [`flags.${PR_MODULE_ID}.${PR_ATMO_FLAG}.-=${cfg.group}`]: null });
      } else {
        const byGroup = foundry.utils.deepClone(scene.getFlag(PR_MODULE_ID, PR_ATMO_FLAG) ?? {});
        byGroup[cfg.group] = {
          preset: cfg.preset, sat: cfg.sat, bright: cfg.bright, hue: cfg.hue,
          tintOn: cfg.tintOn, tint: cfg.tint, tintA: cfg.tintA, vig: cfg.vig, vigS: cfg.vigS,
          motes: cfg.motes, moteC: cfg.moteC, moteCount: cfg.moteCount, moteDir: cfg.moteDir, moteAngle: cfg.moteAngle
        };
        await scene.setFlag(PR_MODULE_ID, PR_ATMO_FLAG, byGroup);
      }
      if (scene.id === canvas?.scene?.id) prApplyAtmosphereFromScene();
      if (cfg.preset !== "none" && cfg.autoEnd > 0) {
        setTimeout(() => _prClearAtmosphereGroup(scene, cfg.group), cfg.autoEnd * 1000);
      }
    } else if (clip.type === "disguise") {
      const targetDocs = (cfg.action === "unset" && cfg.allTokens)
        ? (scene.tokens?.contents ?? [])
        : (cfg.tokenIds ?? []).map(id => scene.tokens.get(id)).filter(Boolean);
      for (const tokenDoc of targetDocs) {
        const existing = tokenDoc.getFlag(PR_MODULE_ID, PR_FLAG_DISGUISES) ?? {};
        if (cfg.action === "set") {
          const next = Object.assign({}, existing[cfg.group], {
            enabled: true, img: cfg.img, name: cfg.name,
            hideNameplate: !!cfg.hideNameplate, disposition: cfg.disposition || ""
          });
          await tokenDoc.update({ [`flags.${PR_MODULE_ID}.${PR_FLAG_DISGUISES}.${cfg.group}`]: next });
        } else {
          const current = existing[cfg.group];
          if (current) {
            await tokenDoc.update({ [`flags.${PR_MODULE_ID}.${PR_FLAG_DISGUISES}.${cfg.group}.enabled`]: false });
          }
        }
      }
    }
  } catch (err) {
    console.error("[perceived-reality] state step failed:", err);
  }

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  prRefreshTilePerception();
  prRefreshLightPerception();
  prRefreshTokenPerception();
  prRefreshWallPerception();
  prRefreshTokenDisguises();
}

window.prRunMoment = function(moment, scene) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("perceived-reality.Moments.Notify.GMOnly"));
    return;
  }
  scene = scene ?? canvas.scene;
  if (!scene || !moment) return;

  game.socket.emit(_PR_SOCKET, { type: "pr-run-moment", moment });
  _prPresentMoment(moment);

  for (const clip of moment.clips ?? []) {
    if (clip.type === "fx") {
      if (clip.config?.audience !== "all") continue;
      if (!prFxAvailable()) {
        console.info("[perceived-reality] fxmaster not active; skipping fx clip");
        continue;
      }
      setTimeout(async () => {
        const record = await prFxPlayGlobal(clip, scene);
        if (record) setTimeout(() => prFxStopGlobal(record), Math.max(0.5, clip.dur ?? 0) * 1000);
      }, (clip.start ?? 0) * 1000);
      continue;
    }
    if (PR_CLIP_ROW[clip.type] !== "state") continue;
    setTimeout(() => _prExecuteStateClip(clip, scene), (clip.start ?? 0) * 1000);
  }
};

window.prRunMomentByName = function(nameOrId, scene) {
  scene = scene ?? canvas.scene;
  if (!scene) return;
  const moments = prGetMomentsForScene(scene.id);
  const moment = moments.find(m => m.id === nameOrId || m.name === nameOrId);
  if (!moment) {
    ui.notifications.warn(game.i18n.format("perceived-reality.Moments.Notify.NotFound", { name: nameOrId }));
    return;
  }
  prRunMoment(moment, scene);
};

async function _prMigrateSceneMoments() {
  if (!game.user.isGM) return;
  if (game.settings.get(PR_MODULE_ID, "momentLibraryMigrated")) return;

  const all = prGetAllMoments();
  const seen = new Set(all.map(m => m.id));
  let changed = false;

  for (const scene of game.scenes?.contents ?? []) {
    const raw = scene.getFlag(PR_MODULE_ID, PR_MOMENT_FLAG);
    if (!Array.isArray(raw) || !raw.length) continue;
    for (const m of raw) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      all.push(Object.assign({}, m, { sceneId: scene.id }));
      changed = true;
    }
    await scene.unsetFlag(PR_MODULE_ID, PR_MOMENT_FLAG);
  }

  if (changed) await prSaveAllMoments(all);
  await game.settings.set(PR_MODULE_ID, "momentLibraryMigrated", true);
}

Hooks.on("deleteScene", async function(scene) {
  if (!game.user.isGM) return;
  const all = prGetAllMoments();
  let changed = false;
  for (const m of all) {
    if (m.sceneId === scene.id) { m.sceneId = null; changed = true; }
  }
  if (changed) await prSaveAllMoments(all);
});

async function _prClearScenePerception(scene) {
  if (!scene) return;

  for (const tokenDoc of scene.tokens ?? []) {
    for (const group of PR_PERCEPTION_GROUPS) {
      await _prSetDetectionModeForToken(tokenDoc, prDetectionModeIdForGroup(group.id), false);
    }
    if (tokenDoc.getFlag(PR_MODULE_ID, "viewerGroups")) {
      await tokenDoc.unsetFlag(PR_MODULE_ID, "viewerGroups");
    }
    if (tokenDoc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS)) {
      await tokenDoc.unsetFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
    }
  }

  for (const collection of [scene.tiles, scene.lights, scene.walls]) {
    for (const doc of collection ?? []) {
      if (doc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS)) {
        await doc.unsetFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
      }
    }
  }
}

window.prClearAllMomentEffects = async function() {
  if (!game.user.isGM) return;
  const scene = canvas?.scene;
  if (scene) await scene.unsetFlag(PR_MODULE_ID, PR_ATMO_FLAG);

  const ledger = _prFxLedgerRead();
  for (const record of ledger) await prFxStopGlobal(record);

  game.socket.emit(_PR_SOCKET, { type: "pr-clear-overlay" });
  prClearOverlayLocal();
  ui.notifications.info(game.i18n.localize("perceived-reality.Moments.Notify.Cleared"));
};

window.prClearAllPerceptionState = async function() {
  if (!game.user.isGM) return;
  const scene = canvas?.scene;
  await _prClearScenePerception(scene);

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  prRefreshTilePerception();
  prRefreshLightPerception();
  prRefreshTokenPerception();
  prRefreshWallPerception();

  ui.notifications.info(game.i18n.localize("perceived-reality.Moments.Notify.PerceptionCleared"));
};

async function _prClearSceneDisguises(scene) {
  if (!scene) return;

  for (const tokenDoc of scene.tokens ?? []) {
    if (tokenDoc.getFlag(PR_MODULE_ID, PR_FLAG_DISGUISES)) {
      await tokenDoc.unsetFlag(PR_MODULE_ID, PR_FLAG_DISGUISES);
    }
  }
}

window.prClearAllDisguises = async function() {
  if (!game.user.isGM) return;
  const scene = canvas?.scene;
  await _prClearSceneDisguises(scene);

  prRefreshTokenDisguises();

  ui.notifications.info(game.i18n.localize("perceived-reality.Moments.Notify.DisguisesCleared"));
};

Hooks.once("ready", async function() {
  game.socket.on(_PR_SOCKET, function(data) {
    if (data?.type === "pr-run-moment" && data.moment) _prPresentMoment(data.moment);
    if (data?.type === "pr-clear-overlay") prClearOverlayLocal();
  });

  await _prMigrateSceneMoments();

  window.PerceivedRealityMoments = {
    open: (scene) => prOpenMomentBuilder(scene),
    run: (nameOrId, scene) => prRunMomentByName(nameOrId, scene),
    catalog: () => prOpenMomentCatalog()
  };
  const mod = game.modules.get(PR_MODULE_ID);
  if (mod) mod.api = Object.assign(mod.api ?? {}, window.PerceivedRealityMoments);
});

Hooks.on("updateScene", function(scene, change) {
  if (!game.user.isGM || change.active !== true) return;
  const moments = prGetMomentsForScene(scene.id).filter(m => m.trigger === "activation");
  if (!moments.length) return;
  setTimeout(() => {
    for (const moment of moments) prRunMoment(moment, scene);
  }, 3000);
});

Hooks.once("init", function() {
  game.keybindings.register(PR_MODULE_ID, "openMomentBuilder", {
    name: "perceived-reality.Moments.KeybindOpen",
    editable: [{ key: "KeyM", modifiers: ["Control", "Shift"] }],
    restricted: true,
    onDown: () => { prOpenMomentBuilder(); return true; }
  });
});

function _prSceneContextEntryV12(entries) {
  entries.push({
    name: "perceived-reality.Moments.MenuOpen",
    icon: '<i class="fa-solid fa-wand-sparkles"></i>',
    condition: () => game.user.isGM,
    callback: (header) => {
      const li = header.closest(".directory-item");
      const id = li?.data?.("documentId") ?? li?.[0]?.dataset?.documentId;
      const scene = id ? game.scenes.get(id) : null;
      prOpenMomentBuilder(scene ?? undefined);
    }
  });
  entries.push({
    name: "perceived-reality.Moments.CatalogMenuOpen",
    icon: '<i class="fa-solid fa-table-cells-large"></i>',
    condition: () => game.user.isGM,
    callback: () => prOpenMomentCatalog()
  });
}

function _prSceneContextEntryV13(entries) {
  entries.push({
    label: "perceived-reality.Moments.MenuOpen",
    icon: '<i class="fa-solid fa-wand-sparkles"></i>',
    visible: () => game.user.isGM,
    onClick: (event, target) => {
      const id = target?.dataset?.entryId;
      const scene = id ? game.scenes.get(id) : null;
      prOpenMomentBuilder(scene ?? undefined);
    }
  });
  entries.push({
    label: "perceived-reality.Moments.CatalogMenuOpen",
    icon: '<i class="fa-solid fa-table-cells-large"></i>',
    visible: () => game.user.isGM,
    onClick: () => prOpenMomentCatalog()
  });
}

Hooks.on("getSceneDirectoryEntryContext", (html, entries) => _prSceneContextEntryV12(entries));
Hooks.on("getSceneContextOptions", (app, entries) => _prSceneContextEntryV13(entries));

