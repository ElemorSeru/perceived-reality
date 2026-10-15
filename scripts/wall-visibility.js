function _prWallResolveDoorControlClass() {
  return foundry.canvas?.containers?.DoorControl ?? DoorControl;
}

let _prWallViewerGroups = new Set();
let _prWallIsGM = false;
let _prWallPreview = false;

window.prRefreshWallPerception = function() {
  if (!canvas?.scene) return;

  _prWallIsGM = game.user?.isGM ?? false;
  _prWallViewerGroups = new Set();
  _prWallPreview = false;

  // Players keep perceiving via their own character perception group. GMs always see the real persisted door
  if (_prWallIsGM) {
    const view = prPerceptionView();
    _prWallPreview = view.preview;
    _prWallViewerGroups = view.groups ?? new Set();
  } else {
    const viewerToken = canvas.tokens?.controlled[0]?.document ?? prGetDefaultPlayerToken()?.document ?? null;
    if (viewerToken) _prWallViewerGroups = prGroupsForTokenDoc(viewerToken);
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

  const dim = _prWallIsGM && hasGroups && _prWallPreview && !matches;
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
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRequestRefresh("prRefreshWallPerception");
});
Hooks.on("createWall", function() { prRequestRefresh("prRefreshWallPerception"); });
Hooks.on("updateWall", function() { prRequestRefresh("prRefreshWallPerception"); });
Hooks.on("deleteWall", function() { prRequestRefresh("prRefreshWallPerception"); });
