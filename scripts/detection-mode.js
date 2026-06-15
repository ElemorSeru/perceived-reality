function resolveDetectionModeClass() {
  return foundry.canvas?.perception?.DetectionMode ?? DetectionMode;
}

Hooks.once("init", () => {
  const BaseDetectionMode = resolveDetectionModeClass();

  for (const group of PERCEPTION_GROUPS) {
    const modeId = detectionModeIdForGroup(group.id);

    const mode = new (class extends BaseDetectionMode {
      constructor() {
        super({
          id: modeId,
          label: `perceived-reality.DetectionMode.${group.id}`,
          type: BaseDetectionMode.DETECTION_TYPES.OTHER,
          walls: false,
          angle: false,
          tokenConfig: false,
        });
        this._prGroupId = group.id;
      }

      _canDetect(visionSource, target) {
        const targetDoc = target?.document;
        if (!targetDoc) return false;

        const targetGroups = targetDoc.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
        if (!targetGroups || targetGroups.length === 0) return false;

        if (game.user.isGM && game.settings.get(MODULE_ID, "gmSeeAll")) return true;

        if (!targetGroups.includes(this._prGroupId)) return false;

        return true;
      }

      // Range/LOS are irrelevant for these modes; always pass through
      _testRange(visionSource, mode, target, test) {
        return true;
      }

      _testLOS(visionSource, mode, target, test) {
        return true;
      }
    })();

    CONFIG.Canvas.detectionModes[modeId] = mode;
  }
});

// Wrap on ready hook so CONFIG.Canvas.detectionModes.basicSight is the final instance.
Hooks.once("ready", () => {
  const bs = CONFIG.Canvas.detectionModes.basicSight;
  if (!bs) {
    console.error("[perceived-reality] CONFIG.Canvas.detectionModes.basicSight not found, cannot wrap.");
    return;
  }
  if (bs._prWrapped) return;

  const _origCanDetect = bs._canDetect.bind(bs);
  bs._canDetect = function(visionSource, target) {
    const targetDoc = target?.document;
    const targetGroups = targetDoc?.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
    if (targetGroups && targetGroups.length > 0) {
      if (game.user.isGM && game.settings.get(MODULE_ID, "gmSeeAll")) return true;
      return false;
    }
    return _origCanDetect(visionSource, target);
  };
  bs._prWrapped = true;
});
