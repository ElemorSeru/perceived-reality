let _prViewerGroups = new Set();
let _prIsGM = false;
let _prGmSeeAll = false;
let _prHasSelection = false;

window.refreshTilePerception = function() {
  if (!canvas?.scene) return;

  _prIsGM = game.user?.isGM ?? false;
  _prGmSeeAll = _prIsGM && (game.settings.get(MODULE_ID, "gmSeeAll") ?? true);

  _prViewerGroups = new Set();

  const controlled = canvas.tokens?.controlled ?? [];
  _prHasSelection = controlled.length > 0;

  // Players keep perceiving via their own character; GMs fall back to gmSeeAll / preview-on-select.
  let viewerToken = controlled[0]?.document ?? null;
  if (!viewerToken && !_prIsGM) viewerToken = getDefaultPlayerToken()?.document ?? null;

  if (viewerToken) {
    const rawModes = viewerToken.detectionModes ?? {};

    const modeList = Array.isArray(rawModes)
      ? rawModes
      : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));

    for (const mode of modeList) {
      if (!mode.enabled) continue;
      const match = PERCEPTION_GROUPS.find(g => detectionModeIdForGroup(g.id) === mode.id);
      if (match) _prViewerGroups.add(match.id);
    }

    const flagGroups = viewerToken.getFlag(MODULE_ID, "viewerGroups") ?? [];
    for (const g of flagGroups) _prViewerGroups.add(g);
  }

  // Redraw every tile since a tile may have just lost its last grouping
  for (const tile of canvas.tiles?.placeables ?? []) {
    tile.renderFlags?.set({ refreshState: true });
  }
};

Hooks.on("refreshTile", function(tile) {
  const tileGroups = tile.document.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
  const baseVisible = tile.visible;

  if (!tileGroups || tileGroups.length === 0) {
    const baseAlpha = tile.document.alpha ?? 1;
    tile.visible = baseVisible;
    tile.alpha = baseAlpha;
    if (tile.mesh) { tile.mesh.visible = baseVisible; tile.mesh.alpha = baseAlpha; applyDesaturation(tile.mesh, false); }
    if (tile.object) { tile.object.visible = baseVisible; tile.object.alpha = baseAlpha; }
    return;
  }

  const matches = tileGroups.some(g => _prViewerGroups.has(g));

  if (_prIsGM && !_prGmSeeAll && _prHasSelection) {
    // GM preview mode: stay visible and dim instead of hiding what the selected token can't perceive
    const baseAlpha = tile.document.alpha ?? 1;
    const dim = tile.document.hidden || !matches;
    const alpha = dim ? Math.min(baseAlpha, GM_DIM_ALPHA) : baseAlpha;
    tile.visible = baseVisible;
    tile.alpha = alpha;
    if (tile.mesh) { tile.mesh.visible = baseVisible; tile.mesh.alpha = alpha; applyDesaturation(tile.mesh, dim); }
    if (tile.object) { tile.object.visible = baseVisible; tile.object.alpha = alpha; }
    return;
  }

  // gmSeeAll on, GM with nothing selected, or a player: show/hide
  const groupVisible = _prGmSeeAll || (_prIsGM && !_prHasSelection) || matches;
  const visible = baseVisible && groupVisible;

  if (tile.mesh) { tile.mesh.visible = visible; applyDesaturation(tile.mesh, false); }
  if (tile.object) tile.object.visible = visible;
  tile.visible = visible;

  if (_prIsGM) {
    const baseAlpha = tile.document.alpha ?? 1;
    tile.alpha = baseAlpha;
    if (tile.mesh) tile.mesh.alpha = baseAlpha;
    if (tile.object) tile.object.alpha = baseAlpha;
  }
});

Hooks.on("canvasReady", function() { refreshTilePerception(); });
Hooks.on("updateTile", function() { refreshTilePerception(); });
Hooks.on("controlToken", function() { refreshTilePerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[MODULE_ID]) refreshTilePerception();
});

Hooks.on("createActiveEffect", function() { refreshTilePerception(); });
Hooks.on("deleteActiveEffect", function() { refreshTilePerception(); });
Hooks.on("updateActiveEffect", function() { refreshTilePerception(); });
