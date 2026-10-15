Hooks.once("ready", () => {
  console.log(`[perceived-reality] v${game.modules.get(PR_MODULE_ID)?.version ?? "?"} ready.`);
  console.log(`[perceived-reality] Running on Foundry generation ${game.release?.generation}.`);

  if ((game.release?.generation ?? 0) < 13) document.body.classList.add("pr-legacy-theme");

  prRefreshTilePerception();
  prRefreshLightPerception();
  prRefreshTokenPerception();
  prRefreshWallPerception();
});

async function _prWriteDetectionModes(tokenDoc, desired) {
  const raw = tokenDoc.detectionModes ?? {};
  const ours = PR_PERCEPTION_GROUPS.map(g => [prDetectionModeIdForGroup(g.id), g.id]);

  try {
    if (Array.isArray(raw)) {
      // read source since pf2e 6 drops these when preparing
      const saved = Array.isArray(tokenDoc._source?.detectionModes) ? tokenDoc._source.detectionModes : [];
      const current = new Set(saved.filter(m => m?.enabled).map(m => ours.find(([modeId]) => modeId === m.id)?.[1]).filter(Boolean));
      const stray = saved.some(m => m?.id === PR_MODULE_ID);
      if (!stray && current.size === desired.size && [...desired].every(g => current.has(g))) return;
      // v13 array, rebuild from source since prepared ranges fail validation
      const stored = tokenDoc._source?.detectionModes;
      const modes = foundry.utils.deepClone(Array.isArray(stored) ? stored : [])
        .filter(m => m?.id !== PR_MODULE_ID && !ours.some(([modeId]) => modeId === m?.id));
      for (const [modeId, groupId] of ours) {
        if (desired.has(groupId)) modes.push({ id: modeId, enabled: true, range: 0 });
      }
      await tokenDoc.update({ detectionModes: modes });
      return;
    }

    // v14 only touch our keys, sending the whole object fails
    const updateData = {};
    // read source since pf2e drops ours when preparing
    const saved = tokenDoc._source?.detectionModes ?? raw;
    // early builds used the module id as a mode
    if (PR_MODULE_ID in saved) Object.assign(updateData, prUnsetKey("detectionModes", PR_MODULE_ID));
    for (const [modeId, groupId] of ours) {
      if (desired.has(groupId)) {
        if (!saved[modeId]?.enabled) updateData[`detectionModes.${modeId}`] = { enabled: true, range: 0 };
      } else if (modeId in saved) Object.assign(updateData, prUnsetKey("detectionModes", modeId));
    }
    if (Object.keys(updateData).length) await tokenDoc.update(updateData);
  } catch (err) {
    console.error("[perceived-reality] detection mode update failed:", err);
  }
}

// hooks fire on every client so only the active GM writes
function _prIsPerceptionWriter() {
  const gm = game.users?.activeGM;
  return gm ? gm.isSelf : !!game.user?.isGM;
}

const _prReconcileChains = new Map();

// single writer so an ending grant can't drop picks
window.prReconcileDetectionModes = function(tokenDoc) {
  if (!tokenDoc || !_prIsPerceptionWriter()) return Promise.resolve();
  const key = tokenDoc.uuid;
  const run = (_prReconcileChains.get(key) ?? Promise.resolve()).catch(() => {}).then(async () => {
    const desired = new Set(tokenDoc.getFlag(PR_MODULE_ID, "viewerGroups") ?? []);
    for (const groupId of prGetActiveGroupsForToken(tokenDoc)) desired.add(groupId);
    await _prWriteDetectionModes(tokenDoc, desired);
  });
  _prReconcileChains.set(key, run);
  const clear = () => { if (_prReconcileChains.get(key) === run) _prReconcileChains.delete(key); };
  run.then(clear, clear);
  return run;
};

function _prTokensForActor(actor) {
  if (!actor) return [];
  if (actor.isToken && actor.token) return [actor.token];
  // read scene data. During scene load the canvas has no tokens
  const tokens = [];
  for (const scene of game.scenes ?? []) {
    for (const tokenDoc of scene.tokens) {
      if (tokenDoc.actorId === actor.id) tokens.push(tokenDoc);
    }
  }
  return tokens;
}

Hooks.on("applyTokenStatusEffect", async (token, statusId) => {
  const group = PR_PERCEPTION_GROUPS.find(g => prStatusIdForGroup(g.id) === statusId);
  if (!group) return;

  await prReconcileDetectionModes(token.document ?? token);

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  for (const name of ["prRefreshTilePerception", "prRefreshLightPerception", "prRefreshTokenPerception", "prRefreshWallPerception"]) {
    prRequestRefresh(name);
  }
});

// an item's effects have the item as parent
function _prEffectActor(effect) {
  const parent = effect?.parent;
  return parent?.documentName === "Item" ? parent.actor : parent;
}

// hook unreliable in dnd5e v12 so sync via effects
async function _prReconcileForEffect(effect) {
  const groups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  if (!Array.isArray(groups)) return;

  for (const tokenDoc of _prTokensForActor(_prEffectActor(effect))) {
    await prReconcileDetectionModes(tokenDoc);
  }
}

// equip changes and dnd5e 6 conditions skip effect hooks
const _prEffectGroupSignatures = new Map();
const PR_VIEW_REFRESHERS = ["prRefreshTokenPerception", "prRefreshTilePerception", "prRefreshLightPerception",
  "prRefreshWallPerception", "prRefreshTokenDisguises", "prApplyAtmosphereFromScene"];

function _prGroupSignature(actor) {
  return [...prEffectGroupsForActor(actor)].sort().join(",");
}

async function _prOnActorStateChange(actor) {
  if (!actor) return;
  const signature = _prGroupSignature(actor);
  if (_prEffectGroupSignatures.get(actor.uuid) === signature) return;
  _prEffectGroupSignatures.set(actor.uuid, signature);
  for (const name of PR_VIEW_REFRESHERS) prRequestRefresh(name);
  const tokens = _prTokensForActor(actor);
  const copies = actor.isToken ? [] : tokens.filter(t => !t.actorLink);
  for (const tokenDoc of tokens) if (!copies.includes(tokenDoc)) await prReconcileDetectionModes(tokenDoc);
  // v12 and v13 pass base actor changes to copied tokens a task after the hooks
  if (copies.length) await new Promise(resolve => setTimeout(resolve, 0));
  for (const tokenDoc of copies) await prReconcileDetectionModes(tokenDoc);
}

Hooks.on("updateActor", actor => _prOnActorStateChange(actor));
// most effects dont change groups so skip the full refresh
for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
  Hooks.on(hook, effect => _prOnActorStateChange(_prEffectActor(effect)));
}
// record groups now so the first unrelated effect isn't a change
function _prRecordGroups(actor) {
  if (actor && !_prEffectGroupSignatures.has(actor.uuid)) _prEffectGroupSignatures.set(actor.uuid, _prGroupSignature(actor));
}
Hooks.on("canvasReady", () => {
  for (const token of canvas.tokens?.placeables ?? []) _prRecordGroups(token.actor);
});
Hooks.on("createToken", tokenDoc => _prRecordGroups(tokenDoc.actor));
// Turn or time expiry updates no document
for (const hook of ["updateCombat", "updateWorldTime"]) {
  Hooks.on(hook, () => {
    for (const token of canvas?.tokens?.placeables ?? []) _prOnActorStateChange(token.actor);
  });
}
for (const hook of ["createItem", "updateItem", "deleteItem"]) {
  Hooks.on(hook, item => _prOnActorStateChange(item.actor));
}

// any GM writes the flag and only the active GM writes modes
Hooks.on("updateToken", (tokenDoc, change) => {
  const ours = change?.flags?.[PR_MODULE_ID];
  if (ours && (("viewerGroups" in ours) || ("-=viewerGroups" in ours))) prReconcileDetectionModes(tokenDoc);
});

Hooks.on("createActiveEffect", _prReconcileForEffect);
Hooks.on("deleteActiveEffect", _prReconcileForEffect);
Hooks.on("updateActiveEffect", _prReconcileForEffect);
