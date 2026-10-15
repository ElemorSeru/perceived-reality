// namespaced on v13+, bare script classes on v12
function _prShelterFilterClass(name) {
  const found = foundry.canvas?.rendering?.filters?.[name] ?? globalThis[name];
  if (found) return found;
  if (name === "VoidFilter" && typeof VoidFilter === "function") return VoidFilter;
  if (name === "WeatherOcclusionMaskFilter" && typeof WeatherOcclusionMaskFilter === "function") return WeatherOcclusionMaskFilter;
  return null;
}

function _prRegionMeshClass() {
  return foundry.canvas?.placeables?.regions?.RegionMesh
    ?? foundry.canvas?.regions?.RegionMesh
    ?? globalThis.RegionMesh
    ?? null;
}

function _prRegionSuppresses(region) {
  const behaviors = region?.behaviors ?? region?.document?.behaviors ?? [];
  for (const behavior of behaviors) {
    if (!behavior.disabled && behavior.type === "suppressWeather") return true;
  }
  return false;
}

window.prSuppressingRegions = function() {
  return (canvas?.regions?.placeables ?? []).filter(_prRegionSuppresses);
};

window.prWeatherRestrictingTiles = function() {
  return (canvas?.tiles?.placeables ?? []).filter(tile =>
    tile.document?.restrictions?.weather && !tile.document.hidden && tile.mesh);
};

// v12 asks the placeable, v13+ does the document
function _prRegionHolds(region, point, elevation) {
  const doc = region?.document;
  try {
    if (typeof doc?.testPoint === "function") return doc.testPoint({ x: point.x, y: point.y, elevation });
    if (typeof region?.testPoint === "function") return region.testPoint(point, elevation);
  } catch (err) {
    console.warn("[perceived-reality] a region could not be tested for shelter", err);
  }
  return false;
};

let _prShelterEpoch = 0;
window.prShelterEpoch = function() {
  return _prShelterEpoch;
};

window.prRoofsOverViewer = function() {
  const token = prClientViewerToken()?.object;
  const center = token?.center;
  if (!center) return [];
  const elevation = token.document.elevation ?? 0;
  return prWeatherRestrictingTiles().filter(tile =>
    (tile.document.elevation ?? 0) >= elevation && tile.mesh.containsCanvasPoint(center));
};

window.prShelterCutRoofs = function(layer) {
  if (!layer || layer.destroyed) return;
  const roofs = prRoofsOverViewer().filter(tile => tile.mesh.texture);
  const key = roofs.map(tile => tile.id).join("|");
  if (layer._prRoofKey === key) return;
  layer._prRoofKey = key;
  for (const cut of layer._prRoofCuts ?? []) cut.destroy();
  layer._prRoofCuts = [];
  if (!roofs.length) return;

  if (!layer.filters?.length) {
    const Void = _prShelterFilterClass("VoidFilter");
    if (!Void) return;
    const filter = Void.create();
    filter.blendMode = PIXI.BLEND_MODES.SCREEN;
    _prShelterFilters(layer, [filter]);
  }
  for (const tile of roofs) {
    const cut = new PIXI.Sprite(tile.mesh.texture);
    cut.anchor.copyFrom(tile.mesh.anchor);
    cut.transform.setFromMatrix(tile.mesh.canvasTransform);
    cut.eventMode = "none";
    layer._prRoofCuts.push(_prShelterEraser(layer, cut));
  }
};

const _PR_SHELTER_CUT_Z = 1e9;

// counter the layer alpha so it erases it fully
function _prShelterEraser(layer, eraser) {
  eraser.blendMode = PIXI.BLEND_MODES.ERASE;
  eraser.zIndex = _PR_SHELTER_CUT_Z;
  eraser.alpha = layer.alpha > 0 ? 1 / layer.alpha : 1;
  layer.sortableChildren = true;
  return layer.addChild(eraser);
}

function _prShelterFilters(layer, filters) {
  layer.filters = filters;
  layer.filterArea = canvas.app.renderer.screen;
}

window.prShelterGround = function(layer, elevation) {
  const regions = prSuppressingRegions();
  const tiles = prWeatherRestrictingTiles();
  if (!regions.length && !tiles.length) return false;

  const filters = [];
  if (tiles.length) {
    const Occlusion = _prShelterFilterClass("WeatherOcclusionMaskFilter");
    const depth = canvas?.masks?.depth?.renderTexture;
    if (Occlusion && depth) {
      const filter = Occlusion.create({ occlusionTexture: depth });
      filter.elevation = elevation;
      filter.uniforms.useOcclusion = true;
      filter.uniforms.occlusionWeights = [0, 0, 1, 0];
      filters.push(filter);
    }
  }

  const meshes = [];
  if (regions.length) {
    const RegionMeshClass = _prRegionMeshClass();
    if (RegionMeshClass) {
      for (const region of regions) {
        try {
          meshes.push(_prShelterEraser(layer, new RegionMeshClass(region)));
        } catch (err) {
          console.warn("[perceived-reality] a suppression region could not be drawn", err);
        }
      }
    }
  }

  if (meshes.length && !filters.length) {
    const Void = _prShelterFilterClass("VoidFilter");
    if (Void) filters.push(Void.create());
  }
  if (!filters.length) {
    for (const mesh of meshes) { layer.removeChild(mesh); mesh.destroy(); }
    return false;
  }
  for (const filter of filters) filter.blendMode = PIXI.BLEND_MODES.SCREEN;
  _prShelterFilters(layer, filters);
  return true;
};

function _prShelterChanged() {
  _prShelterEpoch++;
  prRequestRefresh("prApplyAtmosphereFromScene");
}

function _prTileShelters(doc) {
  return doc.parent === canvas?.scene && !!doc.restrictions?.weather;
}

Hooks.on("createTile", function(doc) {
  if (_prTileShelters(doc)) _prShelterChanged();
});

Hooks.on("deleteTile", function(doc) {
  if (_prTileShelters(doc)) _prShelterChanged();
});

const _PR_TILE_SHELTER_KEYS = ["hidden", "elevation", "texture", "x", "y", "width", "height", "rotation"];

Hooks.on("updateTile", function(doc, change) {
  if (doc.parent !== canvas?.scene) return;
  if (("restrictions" in change) || (doc.restrictions?.weather && _PR_TILE_SHELTER_KEYS.some(key => key in change))) {
    _prShelterChanged();
  }
});

for (const hook of ["createRegion", "updateRegion", "deleteRegion"]) {
  Hooks.on(hook, function(doc) {
    if (doc.parent === canvas?.scene && _prRegionSuppresses(doc)) _prShelterChanged();
  });
}

for (const hook of ["createRegionBehavior", "updateRegionBehavior", "deleteRegionBehavior"]) {
  Hooks.on(hook, function(behavior) {
    if (behavior.type === "suppressWeather" && behavior.parent?.parent === canvas?.scene) _prShelterChanged();
  });
}

function _prViewerMoved(doc) {
  if (prClientViewerToken()?.id !== doc?.id) return;
  prRequestRefresh("prApplyAtmosphereFromScene");
}

Hooks.on("updateToken", function(doc, change) {
  if (("x" in change) || ("y" in change) || ("elevation" in change) || ("_regions" in change)) _prViewerMoved(doc);
});

// v14 moves by waypoint, refresh again when it stops
Hooks.on("moveToken", function(doc) { _prViewerMoved(doc); });
Hooks.on("stopToken", function(doc) { _prViewerMoved(doc); });
