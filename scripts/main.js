Hooks.once("ready", () => {
  console.log(`[perceived-reality] v${game.modules.get(PR_MODULE_ID)?.version ?? "?"} ready.`);
  console.log(`[perceived-reality] Running on Foundry generation ${game.release?.generation}.`);

  if ((game.release?.generation ?? 0) < 13) document.body.classList.add("pr-legacy-theme");

  prRefreshTilePerception();
  prRefreshLightPerception();
  prRefreshTokenPerception();
  prRefreshWallPerception();
});

async function _prSetDetectionModeForToken(tokenDoc, modeId, active) {
  const raw = tokenDoc.detectionModes ?? {};

  try {
    if (Array.isArray(raw)) {
      // For V13: detectionModes is an array of { id, enabled, range } objects
      const modes = foundry.utils.deepClone(raw);
      if (active) {
        if (!modes.some(m => m.id === modeId)) {
          modes.push({ id: modeId, enabled: true, range: 0 });
        }
      } else {
        const idx = modes.findIndex(m => m.id === modeId);
        if (idx !== -1) modes.splice(idx, 1);
      }
      await tokenDoc.update({ detectionModes: modes });
    } else {
      // For V14: only touch this one mode key, sending the whole object failed validation.
      const updateData = {};
      if (active) {
        updateData[`detectionModes.${modeId}`] = { enabled: true, range: 0 };
      } else {
        updateData[`detectionModes.-=${modeId}`] = null;
      }
      await tokenDoc.update(updateData);
    }
  } catch (err) {
    console.error("[perceived-reality] detection mode update failed:", err);
  }
}

function _prTokensForActor(actor) {
  if (!actor) return [];
  if (actor.isToken && actor.token) return [actor.token];
  return (canvas.tokens?.placeables ?? [])
    .filter(t => t.actor?.id === actor.id)
    .map(t => t.document);
}

Hooks.on("applyTokenStatusEffect", async (token, statusId, active) => {
  const group = PR_PERCEPTION_GROUPS.find(g => prStatusIdForGroup(g.id) === statusId);
  if (!group) return;

  const tokenDoc = token.document ?? token;
  const modeId = prDetectionModeIdForGroup(group.id);
  await _prSetDetectionModeForToken(tokenDoc, modeId, active);

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  prRefreshTilePerception();
  prRefreshLightPerception();
  prRefreshTokenPerception();
  prRefreshWallPerception();
});

// hook unreliable in dnd5e v12 so sync via effects
Hooks.on("createActiveEffect", async (effect) => {
  const groups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  if (!Array.isArray(groups)) return;

  for (const tokenDoc of _prTokensForActor(effect.parent)) {
    for (const groupId of groups) {
      await _prSetDetectionModeForToken(tokenDoc, prDetectionModeIdForGroup(groupId), true);
    }
  }
});

Hooks.on("deleteActiveEffect", async (effect) => {
  const groups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  if (!Array.isArray(groups)) return;

  for (const tokenDoc of _prTokensForActor(effect.parent)) {
    for (const groupId of groups) {
      await _prSetDetectionModeForToken(tokenDoc, prDetectionModeIdForGroup(groupId), false);
    }
  }
});
