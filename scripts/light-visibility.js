let _prLightView = null;
let _prLightApplying = false;

function _prLightCurrentView() {
  if (!_prLightView) _prLightView = prPerceptionView();
  return _prLightView;
}

window.prRefreshLightPerception = function() {
  if (!canvas?.scene) return;

  _prLightView = prPerceptionView();
  _prLightApplyAllPerception();
};

function _prLightShouldBeVisible(lightDoc) {
  const groups = lightDoc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  if (!groups?.length) return true;

  const view = _prLightCurrentView();

  // Keep a light Foundry already hid, hidden regardless of groups but the GM still sees it.
  const baseVisible = !lightDoc.hidden || view.isGM;

  if (view.preview) return baseVisible;

  return baseVisible && prPerceives(view, groups);
}

// In GM preview mode, dim the light's control icon when the selected token can't perceive it.
function _prLightApplyIconAlpha(light, groups) {
  if (!light.controlIcon) return;

  const view = _prLightCurrentView();
  if (view.preview) {
    const dim = light.document.hidden || !prPerceives(view, groups);
    light.controlIcon.alpha = dim ? PR_GM_DIM_ALPHA : 1;
    prApplyDesaturation(light.controlIcon, dim);
  } else {
    light.controlIcon.alpha = 1;
    prApplyDesaturation(light.controlIcon, false);
  }
}

// Keep it local to this client. Reinitializes the rendered source's alpha/luminosity and not the persisted document
function _prLightApplyIlluminationDim(light, groups) {
  const src = light.lightSource;
  if (!src?.initialize) return;

  const cfg = light.document.config ?? light.document;
  const baseAlpha = cfg.alpha ?? 0.5;
  const baseLuminosity = cfg.luminosity ?? 0.5;

  if (_prLightCurrentView().preview) {
    const dim = light.document.hidden || !prPerceives(_prLightCurrentView(), groups);
    if (dim) {
      src.initialize({ alpha: baseAlpha * PR_GM_DIM_ALPHA, luminosity: baseLuminosity * PR_GM_DIM_ALPHA });
      return;
    }
  }

  // gmSeeAll on, no selection, or a match: restore to the document's own values
  src.initialize({ alpha: baseAlpha, luminosity: baseLuminosity });
}

// triggerRefresh=false when called mid refresh to avoid restarting the source rebuild.
function _prLightApplyAllPerception(triggerRefresh = true) {
  if (_prLightApplying) return;
  _prLightApplying = true;
  try {
    for (const light of canvas.lighting?.placeables ?? []) {
      const groups = light.document.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
      if (!groups?.length) {
        _prLightResetPerception(light);
        continue;
      }
      _prLightEnforceSingle(light, _prLightShouldBeVisible(light.document));
      _prLightApplyIconAlpha(light, groups);
      _prLightApplyIlluminationDim(light, groups);
    }
    if (triggerRefresh) _prLightTriggerRefresh();
  } finally {
    _prLightApplying = false;
  }
}

function _prLightEnforceSingle(light, visible) {
  light.visible = visible;

  const src = light.lightSource;
  const sources = canvas.effects?.lightSources;
  if (!src || !sources) return;

  if (visible) {
    _prLightSourcesAdd(sources, src, light);
  } else {
    _prLightSourcesRemove(sources, src, light);
  }
}

// No group restriction. Clear any leftover GM preview dim and restore full visibility.
function _prLightResetPerception(light) {
  _prLightEnforceSingle(light, !light.document.hidden || _prLightCurrentView().isGM);
  if (light.controlIcon) { light.controlIcon.alpha = 1; prApplyDesaturation(light.controlIcon, false); }

  const src = light.lightSource;
  if (src?.initialize) {
    const cfg = light.document.config ?? light.document;
    src.initialize({ alpha: cfg.alpha ?? 0.5, luminosity: cfg.luminosity ?? 0.5 });
  }
}

function _prLightSourcesRemove(sources, src, light) {
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

function _prLightSourcesAdd(sources, src, light) {
  if (sources instanceof Map) {
    const key = src.sourceId ?? light.sourceId ?? light.id;
    if (key) sources.set(key, src);
  } else {
    sources.add(src);
  }
}

let _prLightIndex = null;

function _prLightIndexInvalidate() {
  _prLightIndex = null;
}

function _prLightIndexed() {
  if (_prLightIndex) return _prLightIndex;
  const byKey = new Map();
  const bySource = new Map();
  for (const light of canvas.lighting?.placeables ?? []) {
    if (light.sourceId) byKey.set(light.sourceId, light);
    if (light.id) byKey.set(light.id, light);
    // best effort since sources get reassigned but keys don't
    if (light.lightSource) bySource.set(light.lightSource, light);
  }
  _prLightIndex = { byKey, bySource };
  return _prLightIndex;
}

function _prLightFor(key, src) {
  const index = _prLightIndexed();
  if (src) {
    const bySource = index.bySource.get(src);
    if (bySource) return bySource;
  }
  return (key == null) ? null : (index.byKey.get(key) ?? null);
}

// Intercept add/set so hidden lights can't sneak back in during Foundry's refresh.
function _prLightPatchSourcesCollection() {
  const sources = canvas.effects?.lightSources;
  if (!sources || sources._prPatched) return;

  if (sources instanceof Map) {
    const _origSet = sources.set.bind(sources);
    sources.set = function(key, src) {
      const light = _prLightFor(key, src);
      if (light) {
        const groups = light.document.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
        if (groups?.length && !_prLightShouldBeVisible(light.document)) {
          return this; // block insertion
        }
      }
      return _origSet(key, src);
    };
  } else {
    const _origAdd = sources.add.bind(sources);
    sources.add = function(src) {
      const light = _prLightFor(null, src);
      if (light) {
        const groups = light.document.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
        if (groups?.length && !_prLightShouldBeVisible(light.document)) {
          return this; // block insertion
        }
      }
      return _origAdd(src);
    };
  }

  sources._prPatched = true;
}

// Avoid canvas.effects.refreshLighting(), that rebuilds the source list and undoes the deletions.
function _prLightTriggerRefresh() {
  canvas.perception?.update({ refreshLighting: true, refreshVision: false });
}

Hooks.on("refreshAmbientLight", function(light) {
  if (_prLightApplying) return;
  const groups = light.document.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);

  if (!groups?.length) {
    _prLightResetPerception(light);
    return;
  }

  const visible = _prLightShouldBeVisible(light.document);
  light.visible = visible;
  _prLightApplyIconAlpha(light, groups);
  _prLightApplyIlluminationDim(light, groups);

  // re-enforce source state in case Foundry re-added.
  const src = light.lightSource;
  const sources = canvas.effects?.lightSources;
  if (src && sources && !visible) {
    _prLightSourcesRemove(sources, src, light);
  }
});

// triggerRefresh=false since we're already inside a Foundry refresh
Hooks.on("initializeLightSources", function() {
  _prLightIndexInvalidate();
  _prLightPatchSourcesCollection();
  _prLightApplyAllPerception(false);
});

Hooks.on("canvasReady", () => {
  _prLightIndexInvalidate();
  _prLightPatchSourcesCollection();
  prRefreshLightPerception();
});
Hooks.on("controlToken", () => prRefreshLightPerception());
Hooks.on("updateToken", (_doc, change) => {
  if (change.detectionModes || change.flags?.[PR_MODULE_ID]) prRequestRefresh("prRefreshLightPerception");
});
Hooks.on("updateAmbientLight", () => { _prLightIndexInvalidate(); prRequestRefresh("prRefreshLightPerception"); });
Hooks.on("createAmbientLight", () => { _prLightIndexInvalidate(); prRequestRefresh("prRefreshLightPerception"); });
Hooks.on("deleteAmbientLight", () => { _prLightIndexInvalidate(); prRequestRefresh("prRefreshLightPerception"); });
