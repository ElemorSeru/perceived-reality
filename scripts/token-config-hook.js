function _prConfigEl(html) {
  return html instanceof HTMLElement ? html : html[0];
}

function _prRegisterConfigHook(hookName, type) {
  Hooks.on(hookName, (app, html, _data) => {
    const doc = app.document ?? app.object?.document;
    if (!doc) return;
    if (!game.user.isGM) return;
    _prInjectGroupSection(app, _prConfigEl(html), doc, type);
    if (type === "token") _prInjectDisguiseSection(app, _prConfigEl(html), doc);
  });
}

_prRegisterConfigHook("renderTokenConfig", "token");
_prRegisterConfigHook("renderTokenConfig5e", "token");
_prRegisterConfigHook("renderTileConfig", "tile");
_prRegisterConfigHook("renderAmbientLightConfig", "light");
_prRegisterConfigHook("renderWallConfig", "wall");

function _prInjectGroupSection(app, el, doc, type) {
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

  const currentGroups = doc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS) ?? [];

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
    const rows = PR_PERCEPTION_GROUPS.map(group => {
      const label = prGetGroupLabel(group.id);
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
    checkbox.addEventListener("change", () => _prWriteGroupFlag(el, doc));
  });

  const updateBtn = el.querySelector('button[type="submit"], .update-token, footer button');
  if (updateBtn) {
    updateBtn.addEventListener("click", () => _prWriteGroupFlag(el, doc), { capture: true });
  }
}

async function _prWriteGroupFlag(el, doc) {
  const checkedGroups = [];
  el.querySelectorAll("[data-pr-group]:checked").forEach(input => {
    checkedGroups.push(input.dataset.prGroup);
  });

  try {
    await doc.update(
      { [`flags.${PR_MODULE_ID}.${PR_FLAG_PERCEPTION_GROUPS}`]: checkedGroups },
      { render: false }
    );
  } catch(e) {
    console.error(`[perceived-reality] Flag save failed:`, e);
  }

  canvas.perception?.update({ refreshVision: true });
  prRefreshTilePerception();
  prRefreshLightPerception();
  prRefreshTokenPerception();
  prRefreshWallPerception();
}

function _prMkEl(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function _prInjectDisguiseSection(app, el, doc) {
  const appEl = app?.element;
  const root = appEl instanceof HTMLElement ? appEl
    : (appEl && appEl[0] instanceof HTMLElement) ? appEl[0]
    : el;

  const existing = root.querySelector(".pr-token-disguise-section");
  const openGroupIds = new Set();
  if (existing) {
    existing.querySelectorAll(".pr-disguise-group-row.open").forEach(row => {
      if (row.dataset.prGroup) openGroupIds.add(row.dataset.prGroup);
    });
    existing.remove();
  }

  const sightField = el.querySelector('[name="sight.visionMode"], [name="sight.range"], [name="sight.angle"]');
  if (!sightField) return;

  const disguises = foundry.utils.deepClone(doc.getFlag(PR_MODULE_ID, PR_FLAG_DISGUISES) ?? {});

  const fieldset = _prMkEl("fieldset", "pr-token-disguise-section pr-vision-fieldset");
  fieldset.appendChild(_prMkEl("legend", "", game.i18n.localize("perceived-reality.Disguise.SectionLabel")));
  fieldset.appendChild(_prMkEl("p", "notes pr-vision-hint", game.i18n.localize("perceived-reality.Disguise.SectionHint")));

  const list = _prMkEl("div", "pr-disguise-groups");
  fieldset.appendChild(list);
  for (const group of PR_PERCEPTION_GROUPS) {
    const row = _prBuildDisguiseGroupRow(doc, group, disguises);
    row.dataset.prGroup = group.id;
    if (openGroupIds.has(group.id)) row.classList.add("open");
    list.appendChild(row);
  }

  const target =
    sightField.closest("section.tab") ??
    sightField.closest("div.tab") ??
    sightField.closest("[data-application-part]") ??
    sightField.closest("fieldset") ??
    sightField.closest("form") ??
    el;
  target.appendChild(fieldset);

  requestAnimationFrame(() => {
    app?.setPosition?.({ height: "auto" });
  });
}

function _prBuildDisguiseGroupRow(doc, group, disguises) {
  const row = _prMkEl("div", "pr-disguise-group-row");

  const head = _prMkEl("div", "pr-disguise-group-head");
  const icon = document.createElement("img");
  icon.src = group.icon;
  icon.className = "pr-vision-icon";
  icon.alt = "";
  head.appendChild(icon);
  head.appendChild(_prMkEl("span", "pr-disguise-group-name", prGetGroupLabel(group.id)));
  const status = _prMkEl("span", "pr-disguise-status");
  head.appendChild(status);
  head.appendChild(_prMkEl("i", "fa-solid fa-chevron-right pr-disguise-caret"));
  row.appendChild(head);
  head.addEventListener("click", () => row.classList.toggle("open"));

  const editor = _prMkEl("div", "pr-disguise-editor");
  row.appendChild(editor);

  async function writeEntry(next) {
    try {
      if (next === null) {
        await doc.update({ [`flags.${PR_MODULE_ID}.${PR_FLAG_DISGUISES}.-=${group.id}`]: null }, { render: false });
      } else {
        await doc.update({ [`flags.${PR_MODULE_ID}.${PR_FLAG_DISGUISES}.${group.id}`]: next }, { render: false });
      }
    } catch (err) {
      console.error("[perceived-reality] disguise save failed:", err);
    }
  }

  function setStatus(hasEntry) {
    status.textContent = game.i18n.localize(hasEntry ? "perceived-reality.Disguise.GroupSet" : "perceived-reality.Disguise.GroupNotSet");
    status.classList.toggle("set", hasEntry);
  }

  function renderEditor(currentEntry) {
    editor.innerHTML = "";
    setStatus(!!currentEntry?.img);

    const picker = prBuildActorPicker({
      initialImg: currentEntry?.img,
      initialName: currentEntry?.name,
      onPick: async (picked) => {
        const next = Object.assign({ enabled: true, hideNameplate: false, disposition: "" }, currentEntry, {
          enabled: true, img: picked.img, name: picked.name
        });
        await writeEntry(next);
        disguises[group.id] = next;
        renderEditor(next);
      },
      onClear: async () => {
        if (!currentEntry?.img) return;
        await writeEntry(null);
        delete disguises[group.id];
        renderEditor(null);
      }
    });
    editor.appendChild(picker);

    if (!currentEntry?.img) return;

    const controls = _prMkEl("div", "pr-disguise-controls");

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "pr-actorpick-toggle";
    toggleLabel.title = game.i18n.localize("perceived-reality.Disguise.ToggleLabel");
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = currentEntry.enabled !== false;
    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(_prMkEl("span", "track"));
    toggleInput.addEventListener("change", async () => {
      const next = Object.assign({}, currentEntry, { enabled: toggleInput.checked });
      await writeEntry(next);
      disguises[group.id] = next;
    });
    controls.appendChild(toggleLabel);
    editor.appendChild(controls);

    const hideRow = document.createElement("label");
    hideRow.className = "pr-disguise-opt-row";
    const hideInput = document.createElement("input");
    hideInput.type = "checkbox";
    hideInput.checked = !!currentEntry.hideNameplate;
    hideRow.appendChild(hideInput);
    hideRow.appendChild(_prMkEl("span", "", game.i18n.localize("perceived-reality.Disguise.HideNameplate")));
    hideInput.addEventListener("change", async () => {
      const next = Object.assign({}, currentEntry, { hideNameplate: hideInput.checked });
      await writeEntry(next);
      disguises[group.id] = next;
    });
    editor.appendChild(hideRow);
    editor.appendChild(_prMkEl("p", "pr-disguise-hint-small", game.i18n.localize("perceived-reality.Disguise.HideNameplateHint")));

    const dispRow = document.createElement("label");
    dispRow.className = "pr-disguise-opt-row";
    const dispCheck = document.createElement("input");
    dispCheck.type = "checkbox";
    dispCheck.checked = !!currentEntry.disposition;
    dispRow.appendChild(dispCheck);
    dispRow.appendChild(_prMkEl("span", "", game.i18n.localize("perceived-reality.Disguise.ShowAsDisposition")));
    const dispSelect = document.createElement("select");
    for (const key of PR_DISPOSITION_KEYS) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = prDispositionLabel(key);
      if (currentEntry.disposition === key) opt.selected = true;
      dispSelect.appendChild(opt);
    }
    dispSelect.disabled = !dispCheck.checked;
    dispRow.appendChild(dispSelect);
    const swatch = _prMkEl("span", "disp-swatch");
    dispRow.appendChild(swatch);

    function syncSwatch() {
      const color = CONFIG.Canvas.dispositionColors[dispSelect.value];
      swatch.style.background = color !== undefined ? "#" + color.toString(16).padStart(6, "0") : "transparent";
    }
    syncSwatch();

    async function commitDisposition() {
      const next = Object.assign({}, currentEntry, { disposition: dispCheck.checked ? dispSelect.value : "" });
      await writeEntry(next);
      disguises[group.id] = next;
    }
    dispCheck.addEventListener("change", () => { dispSelect.disabled = !dispCheck.checked; commitDisposition(); });
    dispSelect.addEventListener("change", () => { syncSwatch(); if (dispCheck.checked) commitDisposition(); });

    editor.appendChild(dispRow);
  }

  const initial = disguises[group.id] ?? null;
  renderEditor(initial);
  if (initial?.img) row.classList.add("open");

  return row;
}
