function _el(html) {
  return html instanceof HTMLElement ? html : html[0];
}

function _registerConfigHook(hookName, type) {
  Hooks.on(hookName, (app, html, _data) => {
    const doc = app.document ?? app.object?.document;
    if (!doc) return;
    if (!game.user.isGM) return;
    _injectGroupSection(app, _el(html), doc, type);
  });
}

_registerConfigHook("renderTokenConfig", "token");
_registerConfigHook("renderTokenConfig5e", "token");
_registerConfigHook("renderTileConfig", "tile");
_registerConfigHook("renderAmbientLightConfig", "light");
_registerConfigHook("renderWallConfig", "wall");

function _injectGroupSection(app, el, doc, type) {
  const appEl = app?.element;
  const root = appEl instanceof HTMLElement ? appEl
    : (appEl && appEl[0] instanceof HTMLElement) ? appEl[0]
    : el;
  if (root.querySelector(`.pr-${type}-section`)) return;

  // Anchor to sight field since I couldnt figure out how to find the subtab today
  let sightField = null;
  if (type === "token") {
    sightField = el.querySelector(
      '[name="sight.visionMode"], [name="sight.range"], [name="sight.angle"]'
    );
    if (!sightField) return;
  }

  const currentGroups = doc.getFlag(MODULE_ID, FLAG_PERCEPTION_GROUPS) ?? [];

  const sectionKeys = {
    token: "TokenConfig",
    tile: "TileConfig",
    light: "LightConfig",
    wall: "WallConfig",
  };
  const sectionKey = sectionKeys[type] ?? "LightConfig";
  const sectionLabel = game.i18n.localize(`perceived-reality.${sectionKey}.SectionLabel`);

  let sectionHint;
  if (type === "wall") {
    const hintKey = doc.door === CONST.WALL_DOOR_TYPES.SECRET ? "SectionHintSecret"
      : doc.door === CONST.WALL_DOOR_TYPES.DOOR ? "SectionHintDoor"
      : "SectionHintNone";
    sectionHint = game.i18n.localize(`perceived-reality.WallConfig.${hintKey}`);
  } else {
    sectionHint = game.i18n.localize(`perceived-reality.${sectionKey}.SectionHint`);
  }

  let sectionHtml;

  if (type === "token" || type === "tile" || type === "light" || type === "wall") {
    const guardClass = type === "token" ? "pr-token-section"
      : type === "light" ? "pr-light-section"
      : type === "wall" ? "pr-wall-section"
      : "pr-tile-section";
    const rows = PERCEPTION_GROUPS.map(group => {
      const label = getGroupLabel(group.id);
      const checked = currentGroups.includes(group.id) ? "checked" : "";
      return `
        <div class="pr-vision-row">
          <img src="${group.icon}" class="pr-vision-icon" title="${label}" alt="" />
          <label class="pr-vision-label" for="pr-${group.id}">${label}</label>
          <input type="checkbox"
                 id="pr-${group.id}"
                 data-pr-group="${group.id}"
                 ${checked} />
        </div>`;
    }).join("");

    sectionHtml = `
      <fieldset class="${guardClass} pr-vision-fieldset">
        <legend>${sectionLabel}</legend>
        <p class="notes pr-vision-hint">${sectionHint}</p>
        <div class="pr-vision-header">
          <span class="pr-vision-col-group">${game.i18n.localize("perceived-reality.TokenConfig.ColumnGroup")}</span>
          <span class="pr-vision-col-enabled">${game.i18n.localize("perceived-reality.TokenConfig.ColumnEnabled")}</span>
        </div>
        ${rows}
      </fieldset>`;
  }

  let target;
  let insertMode = "beforeend";
  if (type === "token") {
    target =
      sightField.closest("section.tab") ??
      sightField.closest("div.tab") ??
      sightField.closest("[data-application-part]") ??
      sightField.closest("fieldset") ??
      sightField.closest("form") ??
      el;
  } else if (type === "wall") {
    const doorField = el.querySelector('[name="door"]');
    target = doorField?.closest(".form-group") ?? el.querySelector("form") ?? el;
    insertMode = "afterend";
  } else {
    const tabAttr = "basic";
    target =
      el.querySelector(`section.tab[data-tab="${tabAttr}"]`) ??
      el.querySelector(`div.tab[data-tab="${tabAttr}"]`) ??
      el.querySelector(`[data-application-part="${tabAttr}"]`) ??
      el.querySelector("section.tab") ??
      el.querySelector("div.tab") ??
      el.querySelector("form") ??
      el;
  }

  target.insertAdjacentHTML(insertMode, sectionHtml);

  requestAnimationFrame(() => {
    app?.setPosition?.({ height: "auto" });
  });

  const section = el.querySelector(`.pr-${type}-section`);
  section?.querySelectorAll("[data-pr-group]").forEach(checkbox => {
    checkbox.addEventListener("change", () => _writeGroupFlag(el, doc));
  });

  const updateBtn = el.querySelector('button[type="submit"], .update-token, footer button');
  if (updateBtn) {
    updateBtn.addEventListener("click", () => _writeGroupFlag(el, doc), { capture: true });
  }
}

async function _writeGroupFlag(el, doc) {
  const checkedGroups = [];
  el.querySelectorAll("[data-pr-group]:checked").forEach(input => {
    checkedGroups.push(input.dataset.prGroup);
  });

  try {
    await doc.update(
      { [`flags.${MODULE_ID}.${FLAG_PERCEPTION_GROUPS}`]: checkedGroups },
      { render: false }
    );
  } catch(e) {
    console.error(`[perceived-reality] Flag save failed:`, e);
  }

  canvas.perception?.update({ refreshVision: true });
  refreshTilePerception();
  if (typeof refreshLightPerception === "function") refreshLightPerception();
  if (typeof refreshTokenPerception === "function") refreshTokenPerception();
  if (typeof refreshWallPerception === "function") refreshWallPerception();
}
