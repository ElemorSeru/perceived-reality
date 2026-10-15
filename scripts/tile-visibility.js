let _prTileView = null;

window.prRefreshTilePerception = function() {
  if (!canvas?.scene) return;

  _prTileView = prPerceptionView();

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

  const view = _prTileView ?? (_prTileView = prPerceptionView());
  const matches = prPerceives(view, tileGroups);

  if (view.preview) {
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

  const visible = baseVisible && matches;

  if (tile.mesh) { tile.mesh.visible = visible; prApplyDesaturation(tile.mesh, false); }
  if (tile.object) tile.object.visible = visible;
  tile.visible = visible;

  if (view.isGM) {
    const baseAlpha = tile.document.alpha ?? 1;
    tile.alpha = baseAlpha;
    if (tile.mesh) tile.mesh.alpha = baseAlpha;
    if (tile.object) tile.object.alpha = baseAlpha;
  }
});

Hooks.on("canvasReady", function() { prRefreshTilePerception(); });
Hooks.on("updateTile", function() { prRequestRefresh("prRefreshTilePerception"); });
Hooks.on("controlToken", function() { prRefreshTilePerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRequestRefresh("prRefreshTilePerception");
});
