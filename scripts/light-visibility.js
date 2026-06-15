let _prLightViewerGroups = new Set();
let _prLightIsGM = false;
let _prLightGmSeeAll = false;
let _prLightHasSelection = false;
let _prLightApplying = false;

window.refreshLightPerception = function() {
  if (!canvas?.scene) return;

  _prLightIsGM = game.user?.isGM ?? false;
  _prLightGmSeeAll = _prLightIsGM && (game.settings.get(MODULE_ID, "gmSeeAll") ?? true);
  _prLightViewerGroups = new Set();

  const controlled = canvas.tokens?.controlled ?? [];
  _prLightHasSelection = controlled.length > 0;

  // Players keep perceiving via their own character; only GMs fall back to gmSeeAll / preview-on-select.
  let viewerToken = controlled[0]?.document ?? null;
  if (!viewerToken && !_prLightIsGM) viewerToken = getDefaultPlayerToken()?.document ?? null;

  if (viewerToken) {
    const rawModes = viewerToken.detectionModes ?? {};
    const modeList = Array.isArray(rawModes)
      ? rawModes
      : Object.entries(rawModes).map(([id, val]) => Object.assign({ id }, val));

    for (const mode of modeList) {
      if (!mode.enabled) continue;
      const match = PERCEPTION_GROUPS.find(g => detectionModeIdForGroup(g.id) === mode.id);
      if (match) _prLightViewerGroups.add(match.id);
    }
    for (const g of viewerToken.getFlag(MODULE_ID, "viewerGroups") ?? []) {
      _prLightViewerGroups.add(g);
    }

    for (const effect of viewerToken.actor?.effects ?? []) {
      if (effect.disabled) continue;
      const efGroups = effect.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
      if (Array.isArray(efGroups)) {
        for (const g of efGroups) _prLightViewerGroups.add(g);
      }
    }
  }

  _applyAllLightPerception();
};

function _lightShouldBeVisible(lightDoc) {
  const groups = lightDoc.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
  if (!groups?.length) return true;

  // Keep a light Foundry already hid, hidden regardless of groups but the GM still sees it.
  const baseVisible = !lightDoc.hidden || _prLightIsGM;

  if (_prLightIsGM && !_prLightGmSeeAll && _prLightHasSelection) {
    // GM preview mode: keep the source active; fading the icon communicates the mismatch
    return baseVisible;
  }

  const groupVisible = _prLightGmSeeAll || (_prLightIsGM && !_prLightHasSelection) || groups.some(g => _prLightViewerGroups.has(g));
  return baseVisible && groupVisible;
}

// In GM preview mode, dim the light's control icon when the selected token can't perceive it.
function _applyLightIconAlpha(light, groups) {
  if (!light.controlIcon) return;

  if (_prLightIsGM && !_prLightGmSeeAll && _prLightHasSelection) {
    const matches = groups.some(g => _prLightViewerGroups.has(g));
    const dim = light.document.hidden || !matches;
    light.controlIcon.alpha = dim ? GM_DIM_ALPHA : 1;
    applyDesaturation(light.controlIcon, dim);
  } else {
    light.controlIcon.alpha = 1;
    applyDesaturation(light.controlIcon, false);
  }
}

// Keep it local to this client. Reinitializes the rendered source's alpha/luminosity and not the persisted document
function _applyLightIlluminationDim(light, groups) {
  const src = light.lightSource;
  if (!src?.initialize) return;

  const cfg = light.document.config ?? light.document;
  const baseAlpha = cfg.alpha ?? 0.5;
  const baseLuminosity = cfg.luminosity ?? 0.5;

  if (_prLightIsGM && !_prLightGmSeeAll && _prLightHasSelection) {
    const matches = groups.some(g => _prLightViewerGroups.has(g));
    const dim = light.document.hidden || !matches;
    if (dim) {
      src.initialize({ alpha: baseAlpha * GM_DIM_ALPHA, luminosity: baseLuminosity * GM_DIM_ALPHA });
      return;
    }
  }

  // gmSeeAll on, no selection, or a match: restore to the document's own values
  src.initialize({ alpha: baseAlpha, luminosity: baseLuminosity });
}

// triggerRefresh=false when called mid refresh to avoid restarting the source rebuild.
function _applyAllLightPerception(triggerRefresh = true) {
  if (_prLightApplying) return;
  _prLightApplying = true;
  try {
    for (const light of canvas.lighting?.placeables ?? []) {
      const groups = light.document.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
      if (!groups?.length) {
        _resetLightPerception(light);
        continue;
      }
      _enforceSingleLight(light, _lightShouldBeVisible(light.document));
      _applyLightIconAlpha(light, groups);
      _applyLightIlluminationDim(light, groups);
    }
    if (triggerRefresh) _triggerLightingRefresh();
  } finally {
    _prLightApplying = false;
  }
}

function _enforceSingleLight(light, visible) {
  light.visible = visible;

  const src = light.lightSource;
  const sources = canvas.effects?.lightSources;
  if (!src || !sources) return;

  if (visible) {
    _sourcesAdd(sources, src, light);
  } else {
    _sourcesRemove(sources, src, light);
  }
}

// No group restriction. Clear any leftover GM preview dim and restore full visibility.
function _resetLightPerception(light) {
  _enforceSingleLight(light, !light.document.hidden || _prLightIsGM);
  if (light.controlIcon) { light.controlIcon.alpha = 1; applyDesaturation(light.controlIcon, false); }

  const src = light.lightSource;
  if (src?.initialize) {
    const cfg = light.document.config ?? light.document;
    src.initialize({ alpha: cfg.alpha ?? 0.5, luminosity: cfg.luminosity ?? 0.5 });
  }
}

function _sourcesRemove(sources, src, light) {
  if (sources instanceof Map) {
    // Try every plausible key I guess.
    sources.delete(src.sourceId);
    sources.delete(light.sourceId);
    sources.delete(light.id);
    sources.delete(src);
  } else {
    sources.delete(src);
  }
}

function _sourcesAdd(sources, src, light) {
  if (sources instanceof Map) {
    const key = src.sourceId ?? light.sourceId ?? light.id;
    if (key) sources.set(key, src);
  } else {
    sources.add(src);
  }
}

// Intercept add/set so hidden lights can't sneak back in during Foundry's refresh.
function _patchLightSourcesCollection() {
  const sources = canvas.effects?.lightSources;
  if (!sources || sources._prPatched) return;

  if (sources instanceof Map) {
    const _origSet = sources.set.bind(sources);
    sources.set = function(key, src) {
      const light = canvas.lighting?.placeables?.find(
        l => l.lightSource === src || l.sourceId === key || l.id === key
      );
      if (light) {
        const groups = light.document.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
        if (groups?.length && !_lightShouldBeVisible(light.document)) {
          return this; // block insertion
        }
      }
      return _origSet(key, src);
    };
  } else {
    const _origAdd = sources.add.bind(sources);
    sources.add = function(src) {
      const light = canvas.lighting?.placeables?.find(l => l.lightSource === src);
      if (light) {
        const groups = light.document.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
        if (groups?.length && !_lightShouldBeVisible(light.document)) {
          return this; // block insertion
        }
      }
      return _origAdd(src);
    };
  }

  sources._prPatched = true;
}

// Avoid canvas.effects.refreshLighting(), that rebuilds the source list and undoes the deletions.
function _triggerLightingRefresh() {
  canvas.perception?.update({ refreshLighting: true, refreshVision: false });
}

Hooks.on("refreshAmbientLight", function(light) {
  if (_prLightApplying) return;
  const groups = light.document.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);

  if (!groups?.length) {
    _resetLightPerception(light);
    return;
  }

  const visible = _lightShouldBeVisible(light.document);
  light.visible = visible;
  _applyLightIconAlpha(light, groups);
  _applyLightIlluminationDim(light, groups);

  // re-enforce source state in case Foundry re-added.
  const src = light.lightSource;
  const sources = canvas.effects?.lightSources;
  if (src && sources && !visible) {
    _sourcesRemove(sources, src, light);
  }
});

// triggerRefresh=false since we're already inside a Foundry refresh
Hooks.on("initializeLightSources", function() {
  _patchLightSourcesCollection();
  _applyAllLightPerception(false);
});

Hooks.on("canvasReady", () => {
  _patchLightSourcesCollection();
  refreshLightPerception();
});
Hooks.on("controlToken", () => refreshLightPerception());
Hooks.on("updateToken", (_doc, change) => {
  if (change.detectionModes || change.flags?.[MODULE_ID]) refreshLightPerception();
});
Hooks.on("updateAmbientLight", () => refreshLightPerception());
Hooks.on("createAmbientLight", () => refreshLightPerception());
Hooks.on("deleteAmbientLight", () => refreshLightPerception());
Hooks.on("createActiveEffect", () => refreshLightPerception());
Hooks.on("deleteActiveEffect", () => refreshLightPerception());
Hooks.on("updateActiveEffect", () => refreshLightPerception());
