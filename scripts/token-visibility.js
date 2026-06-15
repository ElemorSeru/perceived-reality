let _prTokenViewerGroups = new Set();
let _prTokenIsGM = false;
let _prTokenGmSeeAll = false;
let _prTokenHasSelection = false;

window.refreshTokenPerception = function() {
  if (!canvas?.scene) return;

  _prTokenIsGM = game.user?.isGM ?? false;
  _prTokenGmSeeAll = _prTokenIsGM && (game.settings.get(MODULE_ID, "gmSeeAll") ?? true);

  _prTokenViewerGroups = new Set();

  // Prefer the controlled token but fall back to an owned token for players who haven't selected one. so we dont lose visibility of them
  const controlled = canvas.tokens?.controlled ?? [];
  _prTokenHasSelection = controlled.length > 0;
  let viewerToken = controlled[0]?.document ?? null;

  if (!viewerToken && !_prTokenIsGM) {
    viewerToken = getDefaultPlayerToken()?.document ?? null;
  }

  if (viewerToken) {
    const rawModes = viewerToken.detectionModes ?? {};

    const modeList = Array.isArray(rawModes)
      ? rawModes
      : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));

    for (const mode of modeList) {
      if (!mode.enabled) continue;
      const match = PERCEPTION_GROUPS.find(g => detectionModeIdForGroup(g.id) === mode.id);
      if (match) _prTokenViewerGroups.add(match.id);
    }

    // Flag fallback
    const flagGroups = viewerToken.getFlag(MODULE_ID, "viewerGroups") ?? [];
    for (const g of flagGroups) _prTokenViewerGroups.add(g);
  }

  // Redraw every token since a token may have just lost its last grouping
  for (const token of canvas.tokens?.placeables ?? []) {
    token.renderFlags?.set({ refreshState: true });
  }
};

Hooks.on("refreshToken", function(token) {
  const tokenGroups = token.document.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
  const baseVisible = token.visible;

  if (!tokenGroups || tokenGroups.length === 0) {
    const baseAlpha = token.document.alpha ?? 1;
    token.visible = baseVisible;
    token.alpha = baseAlpha;
    if (token.mesh) { token.mesh.visible = baseVisible; token.mesh.alpha = baseAlpha; applyDesaturation(token.mesh, false); }
    return;
  }

  const matches = tokenGroups.some(g => _prTokenViewerGroups.has(g));

  if (_prTokenIsGM && !_prTokenGmSeeAll && _prTokenHasSelection) {
    // GM preview mode: stay selectable and dim instead of hiding
    const baseAlpha = token.document.alpha ?? 1;
    const dim = token.document.hidden || !matches;
    const alpha = dim ? Math.min(baseAlpha, GM_DIM_ALPHA) : baseAlpha;
    token.visible = baseVisible;
    token.alpha = alpha;
    if (token.mesh) { token.mesh.visible = baseVisible; token.mesh.alpha = alpha; applyDesaturation(token.mesh, dim); }
    return;
  }

  // gmSeeAll on, GM with nothing selected, or a player: simple show/hide
  const groupVisible = _prTokenGmSeeAll || (_prTokenIsGM && !_prTokenHasSelection) || matches;
  const visible = baseVisible && groupVisible;

  token.visible = visible;
  if (token.mesh) { token.mesh.visible = visible; applyDesaturation(token.mesh, false); }

  if (_prTokenIsGM) {
    const baseAlpha = token.document.alpha ?? 1;
    token.alpha = baseAlpha;
    if (token.mesh) token.mesh.alpha = baseAlpha;
  }
});

Hooks.on("canvasReady", function() { refreshTokenPerception(); });
Hooks.on("controlToken", function() { refreshTokenPerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[MODULE_ID]) refreshTokenPerception();
});
Hooks.on("createActiveEffect", function() { refreshTokenPerception(); });
Hooks.on("deleteActiveEffect", function() { refreshTokenPerception(); });
Hooks.on("updateActiveEffect", function() { refreshTokenPerception(); });
