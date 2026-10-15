let _prTokenView = null;

window.prRefreshTokenPerception = function() {
  if (!canvas?.scene) return;

  _prTokenView = prPerceptionView();

  // Redraw every token since a token may have just lost its last grouping
  for (const token of canvas.tokens?.placeables ?? []) {
    token.renderFlags?.set({ refreshState: true });
  }
};

Hooks.on("refreshToken", function(token) {
  const tokenGroups = token.document.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  const baseVisible = token.visible;

  if (!tokenGroups || tokenGroups.length === 0) {
    const baseAlpha = token.document.alpha ?? 1;
    token.visible = baseVisible;
    token.alpha = baseAlpha;
    if (token.mesh) { token.mesh.visible = baseVisible; token.mesh.alpha = baseAlpha; prApplyDesaturation(token.mesh, false); }
    return;
  }

  const view = _prTokenView ?? (_prTokenView = prPerceptionView());

  const ownsIt = !view.isGM && token.document.isOwner;
  const matches = ownsIt || prPerceives(view, tokenGroups);

  if (view.preview) {
    // GM preview mode: stay selectable and dim instead of hiding
    const baseAlpha = token.document.alpha ?? 1;
    const dim = token.document.hidden || !matches;
    const alpha = dim ? Math.min(baseAlpha, PR_GM_DIM_ALPHA) : baseAlpha;
    token.visible = baseVisible;
    token.alpha = alpha;
    if (token.mesh) { token.mesh.visible = baseVisible; token.mesh.alpha = alpha; prApplyDesaturation(token.mesh, dim); }
    return;
  }

  const visible = baseVisible && matches;

  token.visible = visible;
  if (token.mesh) { token.mesh.visible = visible; prApplyDesaturation(token.mesh, false); }

  if (view.isGM) {
    const baseAlpha = token.document.alpha ?? 1;
    token.alpha = baseAlpha;
    if (token.mesh) token.mesh.alpha = baseAlpha;
  }
});

Hooks.on("canvasReady", function() { prRefreshTokenPerception(); });
Hooks.on("controlToken", function() { prRefreshTokenPerception(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRequestRefresh("prRefreshTokenPerception");
});
