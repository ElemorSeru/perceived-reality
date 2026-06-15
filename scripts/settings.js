Hooks.once("init", () => {

  // Per group display label overrides
  for (const group of PERCEPTION_GROUPS) {
    game.settings.register(MODULE_ID, `label.${group.id}`, {
      name: game.i18n.format("perceived-reality.Settings.GroupLabel.Name", { group: group.id.toUpperCase() }),
      hint: game.i18n.localize("perceived-reality.Settings.GroupLabel.Hint"),
      scope: "world",
      config: true,
      type: String,
      default: "",
    });
  }

  game.settings.register(MODULE_ID, "gmSeeAll", {
    name: game.i18n.localize("perceived-reality.Settings.GmSeeAll.Name"),
    hint: game.i18n.localize("perceived-reality.Settings.GmSeeAll.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    // Re run perception immediately on save so visibility/dimming updates without needing to reload
    onChange: () => {
      window.refreshTokenPerception?.();
      window.refreshTilePerception?.();
      window.refreshLightPerception?.();
      window.refreshWallPerception?.();
    },
  });

});

// Calling at render time and after "ready"
window.getGroupLabel = function(groupId) {
  const group = PERCEPTION_GROUPS.find(g => g.id === groupId);
  if (!group) return groupId;
  const override = game.settings.get(MODULE_ID, `label.${groupId}`);
  if (override && override.trim().length > 0) return override.trim();
  return game.i18n.localize(group.labelKey);
}
