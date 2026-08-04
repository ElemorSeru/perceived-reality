Hooks.once("init", () => {
  const gen = game.release?.generation ?? 0;

  if (typeof PR_PERCEPTION_GROUPS === "undefined") {
    console.error("[perceived-reality] PR_PERCEPTION_GROUPS undefined; constants.js load order problem.");
    return;
  }

  const isV14 = gen >= 14;

  for (const group of PR_PERCEPTION_GROUPS) {
    const modeId = prDetectionModeIdForGroup(group.id);
    const statusId = prStatusIdForGroup(group.id);

    const entry = {
      id: statusId,
      name: group.labelKey,
      img: group.icon,
      changes: [],
      flags: {
        [PR_MODULE_ID]: {
          [PR_FLAG_PERCEPTION_GROUPS]: [group.id],
        },
      },
    };

    CONFIG.statusEffects.push(entry);
  }
});

window.prGetActiveGroupsForToken = function(tokenDoc) {
  const actor = tokenDoc?.actor;
  if (!actor) return new Set();

  const groups = new Set();

  for (const effect of actor.effects ?? []) {
    if (effect.disabled) continue;
    const flagGroups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
    if (Array.isArray(flagGroups)) {
      for (const g of flagGroups) groups.add(g);
    }
  }

  for (const statusId of actor.statuses ?? []) {
    const match = PR_PERCEPTION_GROUPS.find(g => prStatusIdForGroup(g.id) === statusId);
    if (match) groups.add(match.id);
  }

  return groups;
};
