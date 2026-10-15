function _prRegisterStatus(entry) {
  const statuses = CONFIG.statusEffects;
  if (Array.isArray(statuses)) {
    if (!statuses.some(s => s?.id === entry.id)) statuses.push(entry);
    return true;
  }
  if (statuses && typeof statuses === "object") {
    statuses[entry.id] = entry;
    return true;
  }
  return false;
}

// setup since dnd5e 5.x rebuilds it in i18nInit
Hooks.once("setup", () => {
  if (typeof PR_PERCEPTION_GROUPS === "undefined") {
    console.error("[perceived-reality] PR_PERCEPTION_GROUPS undefined; constants.js load order problem.");
    return;
  }

  for (const group of PR_PERCEPTION_GROUPS) {
    const entry = {
      id: prStatusIdForGroup(group.id),
      name: group.labelKey,
      img: group.icon,
      changes: [],
      flags: {
        [PR_MODULE_ID]: {
          [PR_FLAG_PERCEPTION_GROUPS]: [group.id],
        },
      },
    };

    if (!_prRegisterStatus(entry)) {
      console.warn("[perceived-reality] CONFIG.statusEffects is not a shape we recognize; " +
        "use the token HUD group picker instead.");
      return;
    }
  }

  if (game.system.id === "pf2e") _prBridgePf2eStatuses();
});

// pf2e won't take custom ActiveEffects so make an item instead
function _prBridgePf2eStatuses() {
  const proto = CONFIG.Actor.documentClass?.prototype;
  const original = proto?.toggleStatusEffect;
  if (typeof original !== "function") return;
  proto.toggleStatusEffect = function(statusId, options = {}) {
    const group = PR_PERCEPTION_GROUPS.find(g => prStatusIdForGroup(g.id) === statusId);
    if (!group) return original.call(this, statusId, options);
    return prTogglePf2eGroupEffect(this, group, options.active);
  };
}

window.prTogglePf2eGroupEffect = async function(actor, group, active) {
  const existing = actor.items.filter(i => i.type === "effect" && i.getFlag(PR_MODULE_ID, "statusGroup") === group.id);
  const wanted = active ?? !existing.length;
  if (!wanted) {
    if (existing.length) await actor.deleteEmbeddedDocuments("Item", existing.map(i => i.id));
    return false;
  }
  if (existing.length) return true;
  await actor.createEmbeddedDocuments("Item", [{
    name: game.i18n.localize(group.labelKey),
    type: "effect",
    img: group.icon,
    system: {
      rules: [{ key: "RollOption", domain: "all", option: `${PR_MODULE_ID}:${group.id}` }],
      duration: { value: -1, unit: "unlimited", expiry: null, sustained: false },
      tokenIcon: { show: true }
    },
    flags: { [PR_MODULE_ID]: { statusGroup: group.id } }
  }]);
  return true;
};

window.prEffectGroupsForActor = function(actor) {
  const groups = new Set();
  for (const effect of actor?.appliedEffects ?? []) {
    const flagGroups = effect.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
    if (Array.isArray(flagGroups)) {
      for (const g of flagGroups) groups.add(g);
    }
  }
  // pf2e grants through RollOption rules
  const options = actor?.rollOptions?.all ?? {};
  for (const group of PR_PERCEPTION_GROUPS) {
    if (options[`${PR_MODULE_ID}:${group.id}`] === true) groups.add(group.id);
  }
  return groups;
};

window.prGetActiveGroupsForToken = function(tokenDoc) {
  const actor = tokenDoc?.actor;
  if (!actor) return new Set();

  const groups = prEffectGroupsForActor(actor);

  for (const statusId of actor.statuses ?? []) {
    const match = PR_PERCEPTION_GROUPS.find(g => prStatusIdForGroup(g.id) === statusId);
    if (match) groups.add(match.id);
  }

  return groups;
};
