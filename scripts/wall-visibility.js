let _prWallViewerGroups = new Set();
let _prWallIsGM = false;
let _prWallGmSeeAll = false;
let _prWallHasSelection = false;

window.refreshWallPerception = function() {
  if (!canvas?.scene) return;

  _prWallIsGM = game.user?.isGM ?? false;
  _prWallGmSeeAll = _prWallIsGM && (game.settings.get(MODULE_ID, "gmSeeAll") ?? true);
  _prWallViewerGroups = new Set();

  const controlled = canvas.tokens?.controlled ?? [];
  _prWallHasSelection = controlled.length > 0;

  // Players keep perceiving via their own character perception group. GMs always see the real persisted door
  let viewerToken = controlled[0]?.document ?? null;
  if (!viewerToken && !_prWallIsGM) viewerToken = getDefaultPlayerToken()?.document ?? null;

  if (viewerToken) {
    const rawModes = viewerToken.detectionModes ?? {};

    const modeList = Array.isArray(rawModes)
      ? rawModes
      : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));

    for (const mode of modeList) {
      if (!mode.enabled) continue;
      const match = PERCEPTION_GROUPS.find(g => detectionModeIdForGroup(g.id) === mode.id);
      if (match) _prWallViewerGroups.add(match.id);
    }

    for (const g of viewerToken.getFlag(MODULE_ID, "viewerGroups") ?? []) {
      _prWallViewerGroups.add(g);
    }

    for (const effect of viewerToken.actor?.effects ?? []) {
      if (effect.disabled) continue;
      const efGroups = effect.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
      if (Array.isArray(efGroups)) {
        for (const g of efGroups) _prWallViewerGroups.add(g);
      }
    }
  }

  for (const wall of canvas.walls?.placeables ?? []) {
    _applyWallDoorOverride(wall);
  }

  // Force recompute of document mutations to update the cached edges sight/movement
  canvas.perception?.update({ refreshEdges: true, refreshVision: true });
};

// For non-GMs: a secret door with a matching group acts like a normal door, and a normal door without a match is hidden as a plain wall.
async function _applyWallDoorOverride(wall) {
  const wallDoc = wall.document;
  const realDoorType = wallDoc._source?.door ?? wallDoc.door;
  if (realDoorType === CONST.WALL_DOOR_TYPES.NONE) return;

  const groups = wallDoc.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
  const hasGroups = groups?.length > 0;
  const matches = hasGroups && groups.some(g => _prWallViewerGroups.has(g));

  let targetType = realDoorType;
  if (realDoorType === CONST.WALL_DOOR_TYPES.SECRET) {
    const revealed = !_prWallIsGM && hasGroups && matches;
    targetType = revealed ? CONST.WALL_DOOR_TYPES.DOOR : CONST.WALL_DOOR_TYPES.SECRET;
  } else if (realDoorType === CONST.WALL_DOOR_TYPES.DOOR && hasGroups) {
    const hidden = !_prWallIsGM && !matches;
    targetType = hidden ? CONST.WALL_DOOR_TYPES.NONE : CONST.WALL_DOOR_TYPES.DOOR;
  }

  wallDoc.door = targetType;
  // Sync the placeable's edge for sight/movement
  if (wall.edge) wall.edge.door = targetType;

  const dim = _prWallIsGM && hasGroups && !_prWallGmSeeAll && _prWallHasSelection && !matches;
  const doorAlpha = dim ? GM_DIM_ALPHA_ICON : 1;

  // Foundry doesn't build a DoorControl for a secret door type on non-GM clients so build one
  try {
    if (targetType === CONST.WALL_DOOR_TYPES.NONE) {
      // Remove the icon since isVisible reads the persisted door type and Foundry keeps re-showing it
      if (wall.doorControl) {
        canvas.controls.doors.removeChild(wall.doorControl);
        wall.doorControl.destroy();
        wall.doorControl = null;
      }
      return;
    }

    let dc = wall.doorControl;
    if (!dc) {
      dc = new DoorControl(wall);
      canvas.controls.doors.addChild(dc);
      wall.doorControl = dc;
      await dc.draw();
    }
    dc.visible = dc.isVisible;
    dc.alpha = doorAlpha;
    applyDesaturation(dc, dim);
  } catch (err) {
    console.error("[perceived-reality] wall", wall.id, "doorControl setup failed:", err);
  }
}

Hooks.on("drawWall", function(wall) { _applyWallDoorOverride(wall); });

Hooks.on("canvasReady", function() { refreshWallPerception(); });
Hooks.on("controlToken", function() { refreshWallPerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[MODULE_ID]) refreshWallPerception();
});
Hooks.on("createWall", function() { refreshWallPerception(); });
Hooks.on("updateWall", function() { refreshWallPerception(); });
Hooks.on("deleteWall", function() { refreshWallPerception(); });
Hooks.on("createActiveEffect", function() { refreshWallPerception(); });
Hooks.on("deleteActiveEffect", function() { refreshWallPerception(); });
Hooks.on("updateActiveEffect", function() { refreshWallPerception(); });
