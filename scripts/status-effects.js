Hooks.once("init", () => {
  const gen = game.release?.generation ?? 0;

  if (typeof PERCEPTION_GROUPS === "undefined") {
    console.error("[perceived-reality] PERCEPTION_GROUPS undefined; constants.js load order problem.");
    return;
  }

  const isV14 = gen >= 14;

  for (const group of PERCEPTION_GROUPS) {
    const modeId = detectionModeIdForGroup(group.id);
    const statusId = statusIdForGroup(group.id);

    const entry = {
      id: statusId,
      name: group.labelKey,
      img: group.icon,
      changes: [],
      flags: {
        [MODULE_ID]: {
          [FLAG_PERCEPTION_GROUPS]: [group.id],
        },
      },
    };

    CONFIG.statusEffects.push(entry);
  }
});

window.getActiveGroupsForToken = function(tokenDoc) {
  const actor = tokenDoc?.actor;
  if (!actor) return new Set();

  const groups = new Set();

  for (const effect of actor.effects ?? []) {
    if (effect.disabled) continue;
    const flagGroups = effect.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS);
    if (Array.isArray(flagGroups)) {
      for (const g of flagGroups) groups.add(g);
    }
  }

  for (const statusId of actor.statuses ?? []) {
    const match = PERCEPTION_GROUPS.find(g => statusIdForGroup(g.id) === statusId);
    if (match) groups.add(match.id);
  }

  return groups;
};
