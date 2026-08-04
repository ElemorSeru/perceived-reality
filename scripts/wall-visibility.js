function _prWallResolveDoorControlClass() {
  return foundry.canvas?.containers?.DoorControl ?? DoorControl;
}

let _prWallViewerGroups = new Set();
let _prWallIsGM = false;
let _prWallGmSeeAll = false;
let _prWallHasSelection = false;

window.prRefreshWallPerception = function() {
  if (!canvas?.scene) return;

  _prWallIsGM = game.user?.isGM ?? false;
  _prWallGmSeeAll = _prWallIsGM && (game.settings.get(PR_MODULE_ID, "gmSeeAll") ?? true);
  _prWallViewerGroups = new Set();

  const controlled = canvas.tokens?.controlled ?? [];
  _prWallHasSelection = controlled.length > 0;

  // Players keep perceiving via their own character perception group. GMs always see the real persisted door
  let viewerToken = controlled[0]?.document ?? null;
  if (!viewerToken && !_prWallIsGM) viewerToken = prGetDefaultPlayerToken()?.document ?? null;

  if (viewerToken) {
    const rawModes = viewerToken.detectionModes ?? {};

    const modeList = Array.isArray(rawModes)
      ? rawModes
      : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));

    for (const mode of modeList) {
      if (!mode.enabled) continue;
      const match = PR_PERCEPTION_GROUPS.find(g => prDetectionModeIdForGroup(g.id) === mode.id);
      if (match) _prWallViewerGroups.add(match.id);
    }

    for (const g of viewerToken.getFlag(PR_MODULE_ID, "viewerGroups") ?? []) {
      _prWallViewerGroups.add(g);
    }

    for (const effect of viewerToken.actor?.effects ?? []) {
      if (effect.disabled) continue;
      const efGroups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
      if (Array.isArray(efGroups)) {
        for (const g of efGroups) _prWallViewerGroups.add(g);
      }
    }
  }

  for (const wall of canvas.walls?.placeables ?? []) {
    _prWallApplyDoorOverride(wall);
  }

  // Force recompute of document mutations to update the cached edges sight/movement
  const perceptionFlags = { refreshVision: true };
  // obsolete in v14 but still need it earlier
  if (!canvas.perception?.constructor?.RENDER_FLAGS?.refreshEdges?.deprecated) {
    perceptionFlags.refreshEdges = true;
  }
  canvas.perception?.update(perceptionFlags);
};

// For non-GMs: a secret door with a matching group acts like a normal door, and a normal door without a match is hidden as a plain wall.
async function _prWallApplyDoorOverride(wall) {
  const wallDoc = wall.document;
  const realDoorType = wallDoc._source?.door ?? wallDoc.door;
  if (realDoorType === CONST.WALL_DOOR_TYPES.NONE) return;

  const groups = wallDoc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
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
  const doorAlpha = dim ? PR_GM_DIM_ALPHA_ICON : 1;

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
      const DoorControlClass = _prWallResolveDoorControlClass();
      dc = new DoorControlClass(wall);
      canvas.controls.doors.addChild(dc);
      wall.doorControl = dc;
      await dc.draw();
    }
    dc.visible = dc.isVisible;
    dc.alpha = doorAlpha;
    prApplyDesaturation(dc, dim);
  } catch (err) {
    console.error("[perceived-reality] wall", wall.id, "doorControl setup failed:", err);
  }
}

Hooks.on("drawWall", function(wall) { _prWallApplyDoorOverride(wall); });

Hooks.on("canvasReady", function() { prRefreshWallPerception(); });
Hooks.on("controlToken", function() { prRefreshWallPerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRefreshWallPerception();
});
Hooks.on("createWall", function() { prRefreshWallPerception(); });
Hooks.on("updateWall", function() { prRefreshWallPerception(); });
Hooks.on("deleteWall", function() { prRefreshWallPerception(); });
Hooks.on("createActiveEffect", function() { prRefreshWallPerception(); });
Hooks.on("deleteActiveEffect", function() { prRefreshWallPerception(); });
Hooks.on("updateActiveEffect", function() { prRefreshWallPerception(); });
