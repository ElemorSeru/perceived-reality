Hooks.once("init", () => {

  // Per group display label overrides
  for (const group of PR_PERCEPTION_GROUPS) {
    game.settings.register(PR_MODULE_ID, `label.${group.id}`, {
      name: game.i18n.format("perceived-reality.Settings.GroupLabel.Name", { group: group.id.toUpperCase() }),
      hint: game.i18n.localize("perceived-reality.Settings.GroupLabel.Hint"),
      scope: "world",
      config: true,
      type: String,
      default: "",
    });
  }

  game.settings.register(PR_MODULE_ID, "momentLibrary", {
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  game.settings.register(PR_MODULE_ID, "momentLibraryMigrated", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false,
  });

  game.settings.register(PR_MODULE_ID, "fxLedger", {
    scope: "world",
    config: false,
    type: Array,
    default: [],
  });

  game.settings.register(PR_MODULE_ID, "updateCheckCache", {
    scope: "client",
    config: false,
    type: Object,
    default: null,
  });

  game.settings.register(PR_MODULE_ID, "gmSeeAll", {
    name: game.i18n.localize("perceived-reality.Settings.GmSeeAll.Name"),
    hint: game.i18n.localize("perceived-reality.Settings.GmSeeAll.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    // Re run perception immediately on save so visibility/dimming updates without needing to reload
    onChange: () => {
      prRefreshTokenPerception();
      prRefreshTilePerception();
      prRefreshLightPerception();
      prRefreshWallPerception();
    },
  });

  game.settings.register(PR_MODULE_ID, "gmSeeAllDisguises", {
    name: game.i18n.localize("perceived-reality.Settings.GmSeeAllDisguises.Name"),
    hint: game.i18n.localize("perceived-reality.Settings.GmSeeAllDisguises.Hint"),
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => {
      prRefreshTokenDisguises();
    },
  });

});

// Calling at render time and after "ready"
window.prGetGroupLabel = function(groupId) {
  const group = PR_PERCEPTION_GROUPS.find(g => g.id === groupId);
  if (!group) return groupId;
  const override = game.settings.get(PR_MODULE_ID, `label.${groupId}`);
  if (override && override.trim().length > 0) return override.trim();
  return game.i18n.localize(group.labelKey);
}
