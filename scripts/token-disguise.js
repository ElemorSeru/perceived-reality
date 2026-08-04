window.PR_FLAG_DISGUISES = "disguises";

const _prDisguiseTextureCache = new Map();
const _prDisguiseLoading = new Set();
const _prLoadTexture = foundry.canvas?.loadTexture ?? loadTexture;

function _prEnsureDisguiseTexture(path) {
  if (!path || _prDisguiseTextureCache.has(path) || _prDisguiseLoading.has(path)) return;
  _prDisguiseLoading.add(path);
  _prLoadTexture(path).then(tex => {
    _prDisguiseLoading.delete(path);
    if (!tex) return;
    _prDisguiseTextureCache.set(path, tex);
    for (const token of canvas.tokens?.placeables ?? []) token.renderFlags?.set({ refreshMesh: true });
  }).catch(err => {
    _prDisguiseLoading.delete(path);
    console.error("[perceived-reality] disguise texture failed to load:", path, err);
  });
}

function _prDisguiseEntryForViewer(tokenDoc, perspective) {
  if (perspective.seesTruth) return null;
  if (perspective.selfId && tokenDoc.id === perspective.selfId) return null;
  const disguises = tokenDoc.getFlag(PR_MODULE_ID, PR_FLAG_DISGUISES) ?? {};
  for (const group of PR_PERCEPTION_GROUPS) {
    const entry = disguises[group.id];
    if (!entry?.enabled || !entry.img) continue;
    if (perspective.groups === null || perspective.groups.has(group.id)) return entry;
  }
  return null;
}

window.prClientDisguisePerspective = function() {
  const isGM = game.user?.isGM ?? false;
  if (!isGM) return { seesTruth: false, groups: prClientPerceivedGroups(), selfId: null };

  const seeAll = game.settings.get(PR_MODULE_ID, "gmSeeAllDisguises") ?? true;
  if (seeAll) return { seesTruth: true, groups: null, selfId: null };

  const controlled = canvas.tokens?.controlled ?? [];
  const viewer = controlled[0]?.document ?? null;
  if (!viewer) return { seesTruth: false, groups: null, selfId: null };

  return { seesTruth: false, groups: prGroupsForTokenDoc(viewer), selfId: viewer.id };
};

window.prRefreshTokenDisguises = function() {
  if (!canvas?.scene) return;

  const perspective = prClientDisguisePerspective();

  for (const token of canvas.tokens?.placeables ?? []) {
    const entry = _prDisguiseEntryForViewer(token.document, perspective);
    if (entry) _prEnsureDisguiseTexture(entry.img);
    token.renderFlags?.set({ refreshState: true, refreshMesh: true });
  }
};

Hooks.on("refreshToken", function(token) {
  if (!token.document) return;

  const perspective = prClientDisguisePerspective();
  const entry = _prDisguiseEntryForViewer(token.document, perspective);

  if (entry) {
    _prEnsureDisguiseTexture(entry.img);
    const tex = _prDisguiseTextureCache.get(entry.img);
    if (tex && token.mesh && token.mesh.texture !== PIXI.Texture.EMPTY) {
      if (!token._prDisguised) token._prRealTexture = token.mesh.texture;
      if (token.mesh.texture !== tex) token.mesh.texture = tex;
      token._prDisguised = true;
    }

    if (token.nameplate) {
      if (entry.hideNameplate) token.nameplate.visible = false;
      else if (entry.name) token.nameplate.text = entry.name;
    }

    if (entry.disposition && token.border) {
      const color = CONFIG.Canvas.dispositionColors[entry.disposition];
      if (color !== undefined) token.border.tint = color;
    }
  } else if (token._prDisguised) {
    if (token.mesh && token._prRealTexture) token.mesh.texture = token._prRealTexture;
    if (token.nameplate) token.nameplate.text = token.document.name;
    token._prDisguised = false;
    token._prRealTexture = null;
  }
});

Hooks.on("canvasReady", function() { prRefreshTokenDisguises(); });
Hooks.on("controlToken", function() { prRefreshTokenDisguises(); });
Hooks.on("updateToken", function(_doc, change) {
  if (change.flags?.[PR_MODULE_ID]) prRefreshTokenDisguises();
});
Hooks.on("createActiveEffect", function() { prRefreshTokenDisguises(); });
Hooks.on("deleteActiveEffect", function() { prRefreshTokenDisguises(); });
Hooks.on("updateActiveEffect", function() { prRefreshTokenDisguises(); });
