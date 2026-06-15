Hooks.once("ready", () => {
  console.log(`[perceived-reality] v${game.modules.get(MODULE_ID)?.version ?? "?"} ready.`);
  console.log(`[perceived-reality] Running on Foundry generation ${game.release?.generation}.`);

  refreshTilePerception();
  refreshLightPerception();
  if (typeof refreshTokenPerception === "function") refreshTokenPerception();
  else console.error("[perceived-reality] refreshTokenPerception is not defined -- token-visibility.js may not have loaded. Try a full Foundry restart.");
  if (typeof refreshWallPerception === "function") refreshWallPerception();
  else console.error("[perceived-reality] refreshWallPerception is not defined -- wall-visibility.js may not have loaded. Try a full Foundry restart.");
});

Hooks.on("applyTokenStatusEffect", async (token, statusId, active) => {
  const group = PERCEPTION_GROUPS.find(g => statusIdForGroup(g.id) === statusId);
  if (!group) return;

  const tokenDoc = token.document ?? token;
  const modeId = detectionModeIdForGroup(group.id);
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
    console.error("[perceived-reality] applyTokenStatusEffect update failed:", err);
  }

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  refreshTilePerception();
  if (typeof refreshLightPerception === "function") refreshLightPerception();
  if (typeof refreshTokenPerception === "function") refreshTokenPerception();
  if (typeof refreshWallPerception === "function") refreshWallPerception();
});

Hooks.on("applyTokenStatusEffect", (_token, statusId, _active) => {
  const isOurs = PERCEPTION_GROUPS.some(g => statusIdForGroup(g.id) === statusId);
  if (isOurs) {
    refreshTilePerception();
    if (typeof refreshLightPerception === "function") refreshLightPerception();
    if (typeof refreshTokenPerception === "function") refreshTokenPerception();
    if (typeof refreshWallPerception === "function") refreshWallPerception();
  }
});
