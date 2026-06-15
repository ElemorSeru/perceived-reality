console.log("[perceived-reality] Loading module...");

window.MODULE_ID = "perceived-reality";

window.FLAG_PERCEPTION_GROUPS = "perceptionGroups";

window.GROUP_ALL = "all";

window.GM_DIM_ALPHA = 0.5;

window.GM_DIM_ALPHA_ICON = 0.2;

window.PERCEPTION_GROUPS = [
  { id: "group-a", labelKey: "perceived-reality.Groups.A.Label", icon: "modules/perceived-reality/assets/icons/group-a.svg" },
  { id: "group-b", labelKey: "perceived-reality.Groups.B.Label", icon: "modules/perceived-reality/assets/icons/group-b.svg" },
  { id: "group-c", labelKey: "perceived-reality.Groups.C.Label", icon: "modules/perceived-reality/assets/icons/group-c.svg" },
  { id: "group-d", labelKey: "perceived-reality.Groups.D.Label", icon: "modules/perceived-reality/assets/icons/group-d.svg" },
  { id: "group-e", labelKey: "perceived-reality.Groups.E.Label", icon: "modules/perceived-reality/assets/icons/group-e.svg" },
  { id: "group-f", labelKey: "perceived-reality.Groups.F.Label", icon: "modules/perceived-reality/assets/icons/group-f.svg" },
];

window.statusIdForGroup = function(groupId) {
  return `${MODULE_ID}.${groupId}`;
};

window.detectionModeIdForGroup = function(groupId) {
  return `${MODULE_ID}-detect-${groupId}`;
};

// Viewer fallback when nothing is controlled, players only.
window.getDefaultPlayerToken = function() {
  const placeables = canvas.tokens?.placeables ?? [];

  const characterId = game.user?.character?.id;
  if (characterId) {
    const own = placeables.find(t => t.actor?.id === characterId);
    if (own) return own;
  }

  return placeables.find(t => t.actor?.isOwner) ?? null;
};

// Stronger GM preview mismatch indicator
window.applyDesaturation = function(obj, desaturate) {
  if (!obj) return;

  if (desaturate) {
    if (!obj._prDesatFilter) {
      const ColorMatrixFilter = PIXI.ColorMatrixFilter ?? PIXI.filters.ColorMatrixFilter;
      obj._prDesatFilter = new ColorMatrixFilter();
      obj._prDesatFilter.desaturate();
    }
    const filters = obj.filters ?? [];
    if (!filters.includes(obj._prDesatFilter)) obj.filters = [...filters, obj._prDesatFilter];
  } else if (obj.filters?.length) {
    const filters = obj.filters.filter(f => f !== obj._prDesatFilter);
    obj.filters = filters.length ? filters : null;
  }
};
