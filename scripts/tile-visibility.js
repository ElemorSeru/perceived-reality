let _prViewerGroups = new Set();
let _prIsGM = false;
let _prGmSeeAll = false;
let _prHasSelection = false;

window.prRefreshTilePerception = function() {
  if (!canvas?.scene) return;

  _prIsGM = game.user?.isGM ?? false;
  _prGmSeeAll = _prIsGM && (game.settings.get(PR_MODULE_ID, "gmSeeAll") ?? true);

  _prViewerGroups = new Set();

  const controlled = canvas.tokens?.controlled ?? [];
  _prHasSelection = controlled.length > 0;

  // Players keep perceiving via their own character; GMs fall back to gmSeeAll / preview-on-select.
  let viewerToken = controlled[0]?.document ?? null;
  if (!viewerToken && !_prIsGM) viewerToken = prGetDefaultPlayerToken()?.document ?? null;

  if (viewerToken) {
    const rawModes = viewerToken.detectionModes ?? {};

    const modeList = Array.isArray(rawModes)
      ? rawModes
      : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));

    for (const mode of modeList) {
      if (!mode.enabled) continue;
      const match = PR_PERCEPTION_GROUPS.find(g => prDetectionModeIdForGroup(g.id) === mode.id);
      if (match) _prViewerGroups.add(match.id);
    }

    const flagGroups = viewerToken.getFlag(PR_MODULE_ID, "viewerGroups") ?? [];
    for (const g of flagGroups) _prViewerGroups.add(g);

    for (const effect of viewerToken.actor?.effects ?? []) {
      if (effect.disabled) continue;
      const efGroups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
      if (Array.isArray(efGroups)) {
        for (const g of efGroups) _prViewerGroups.add(g);
      }
    }
  }

  // Redraw every tile since a tile may have just lost its last grouping
  for (const tile of canvas.tiles?.placeables ?? []) {
    tile.renderFlags?.set({ refreshState: true });
  }
};

Hooks.on("refreshTile", function(tile) {
  const tileGroups = tile.document.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  const baseVisible = tile.visible;

  if (!tileGroups || tileGroups.length === 0) {
    const baseAlpha = tile.document.alpha ?? 1;
    tile.visible = baseVisible;
    tile.alpha = baseAlpha;
    if (tile.mesh) { tile.mesh.visible = baseVisible; tile.mesh.alpha = baseAlpha; prApplyDesaturation(tile.mesh, false); }
    if (tile.object) { tile.object.visible = baseVisible; tile.object.alpha = baseAlpha; }
    return;
  }

  const matches = tileGroups.some(g => _prViewerGroups.has(g));

  if (_prIsGM && !_prGmSeeAll && _prHasSelection) {
    // GM preview mode: stay visible and dim instead of hiding what the selected token can't perceive
    const baseAlpha = tile.document.alpha ?? 1;
    const dim = tile.document.hidden || !matches;
    const alpha = dim ? Math.min(baseAlpha, PR_GM_DIM_ALPHA) : baseAlpha;
    tile.visible = baseVisible;
    tile.alpha = alpha;
    if (tile.mesh) { tile.mesh.visible = baseVisible; tile.mesh.alpha = alpha; prApplyDesaturation(tile.mesh, dim); }
    if (tile.object) { tile.object.visible = baseVisible; tile.object.alpha = alpha; }
    return;
  }

  // gmSeeAll on, GM with nothing selected, or a player: show/hide
  const groupVisible = _prGmSeeAll || (_prIsGM && !_prHasSelection) || matches;
  const visible = baseVisible && groupVisible;

  if (tile.mesh) { tile.mesh.visible = visible; prApplyDesaturation(tile.mesh, false); }
  if (tile.object) tile.object.visible = visible;
  tile.visible = visible;

  if (_prIsGM) {
    const baseAlpha = tile.document.alpha ?? 1;
    tile.alpha = baseAlpha;
    if (tile.mesh) tile.mesh.alpha = baseAlpha;
    if (tile.object) tile.object.alpha = baseAlpha;
  }
});

Hooks.on("canvasReady", function() { prRefreshTilePerception(); });
Hooks.on("updateTile", function() { prRefreshTilePerception(); });
Hooks.on("controlToken", function() { prRefreshTilePerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRefreshTilePerception();
});

Hooks.on("createActiveEffect", function() { prRefreshTilePerception(); });
Hooks.on("deleteActiveEffect", function() { prRefreshTilePerception(); });
Hooks.on("updateActiveEffect", function() { prRefreshTilePerception(); });
