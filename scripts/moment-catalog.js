window.PRMomentCatalogClass = null;

Hooks.once("init", function() {
  const AppV2 = foundry.applications?.api?.ApplicationV2;
  const HbsMixin = foundry.applications?.api?.HandlebarsApplicationMixin;
  if (!AppV2 || !HbsMixin) {
    console.error("[perceived-reality] ApplicationV2 unavailable; Moment Catalog disabled.");
    return;
  }

  const PR_MC_ACCENT_TYPES = ["transition", "narration", "sound", "fx"];

  function loc(key) { return game.i18n.localize(`perceived-reality.Moments.${key}`); }

  function mkEl(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function resolveDialogClass() {
    return foundry.applications?.api?.DialogV2;
  }

  class PRMomentCatalog extends HbsMixin(AppV2) {
    static DEFAULT_OPTIONS = {
      id: "pr-moment-catalog",
      classes: ["pr-moment-catalog"],
      window: { title: "perceived-reality.Moments.CatalogTitle", resizable: true },
      position: { width: 780, height: 560 }
    };

    static PARTS = {
      body: { template: "modules/perceived-reality/templates/moment-catalog.hbs" }
    };

    async _prepareContext() { return {}; }

    _onRender() {
      this._root = this.element.querySelector(".pr-mc-root");
      this._build();
    }

    _build() {
      const root = this._root;
      if (!root) return;
      const scrollTop = root.scrollTop;
      root.innerHTML = "";

      const moments = prGetAllMoments();
      if (!moments.length) {
        root.appendChild(mkEl("div", "pr-mc-empty", loc("CatalogEmpty")));
        return;
      }

      const groups = new Map();
      for (const m of moments) {
        const key = m.sceneId ?? "__unassigned";
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(m);
      }

      const sections = [];
      for (const [key, list] of groups) {
        if (key === "__unassigned") continue;
        const scene = game.scenes.get(key);
        sections.push({ key, name: scene?.name ?? loc("CatalogUnknownScene"), list });
      }
      sections.sort((a, b) => a.name.localeCompare(b.name));
      if (groups.has("__unassigned")) {
        sections.push({ key: "__unassigned", name: loc("CatalogUnassigned"), list: groups.get("__unassigned") });
      }

      for (const section of sections) {
        const sectionEl = mkEl("div", "pr-mc-section");
        sectionEl.appendChild(mkEl("div", "pr-mc-section-title", `${section.name} (${section.list.length})`));
        const grid = mkEl("div", "pr-mc-grid");
        for (const moment of section.list.slice().sort((a, b) => a.name.localeCompare(b.name))) {
          grid.appendChild(this._buildTile(moment));
        }
        sectionEl.appendChild(grid);
        root.appendChild(sectionEl);
      }

      root.scrollTop = scrollTop;
    }

    _tileAccentType(moment) {
      const clips = (moment.clips ?? []).filter(c => PR_MC_ACCENT_TYPES.includes(c.type));
      if (!clips.length) return null;
      return clips.slice().sort((a, b) => a.start - b.start)[0].type;
    }

    _buildTile(moment) {
      const tile = mkEl("div", "pr-mc-tile");
      tile.dataset.momentId = moment.id;

      const accentType = this._tileAccentType(moment);
      if (accentType) tile.dataset.accent = accentType;

      const visualWrap = mkEl("div", "pr-mc-visual-wrap");
      const visual = mkEl("div", "pr-mc-visual");
      visual.appendChild(mkEl("i", "fa-solid fa-wand-sparkles pr-mc-visual-icon"));
      visualWrap.appendChild(visual);
      visualWrap.appendChild(mkEl("div", "pr-mc-fold"));

      const kebab = mkEl("button", "pr-mc-kebab");
      kebab.type = "button";
      kebab.title = loc("CatalogMenuTitle");
      kebab.innerHTML = '<i class="fa-solid fa-ellipsis-vertical"></i>';
      kebab.addEventListener("click", (e) => {
        e.stopPropagation();
        this._toggleMenu(moment, visualWrap);
      });
      visualWrap.appendChild(kebab);

      const strip = mkEl("div", "pr-mc-strip");
      strip.appendChild(mkEl("div", "pr-mc-name", moment.name));

      tile.appendChild(visualWrap);
      tile.appendChild(strip);
      return tile;
    }

    _toggleMenu(moment, anchor) {
      const already = anchor.querySelector(".pr-mc-menu");
      this._root.querySelectorAll(".pr-mc-menu").forEach(m => m.remove());
      if (already) return;

      const menu = mkEl("div", "pr-mc-menu");

      const runBtn = mkEl("button", "", loc("CatalogRun"));
      runBtn.type = "button";
      runBtn.addEventListener("click", (e) => { e.stopPropagation(); menu.remove(); this._runMoment(moment); });

      const editBtn = mkEl("button", "", loc("CatalogEdit"));
      editBtn.type = "button";
      editBtn.addEventListener("click", (e) => { e.stopPropagation(); menu.remove(); prOpenMomentBuilderForMoment(moment.id); this.close(); });

      const delBtn = mkEl("button", "pr-mc-menu-danger", loc("CatalogDelete"));
      delBtn.type = "button";
      delBtn.addEventListener("click", (e) => { e.stopPropagation(); menu.remove(); this._confirmDelete(moment); });

      menu.appendChild(runBtn);
      menu.appendChild(editBtn);
      menu.appendChild(delBtn);
      anchor.appendChild(menu);

      const onOutside = (e) => {
        if (!menu.contains(e.target)) {
          menu.remove();
          document.removeEventListener("pointerdown", onOutside, true);
        }
      };
      setTimeout(() => document.addEventListener("pointerdown", onOutside, true), 0);
    }

    _runMoment(moment) {
      const scene = game.scenes?.active ?? canvas?.scene;
      if (!scene) {
        ui.notifications.warn(loc("Notify.NoScene"));
        return;
      }
      prRunMoment(foundry.utils.deepClone(moment), scene);
    }

    async _confirmDelete(moment) {
      const DialogClass = resolveDialogClass();
      const confirmed = await DialogClass.wait({
        classes: ["pr-mb-dialog"],
        window: { title: loc("CatalogDeleteTitle") },
        content: `<p>${game.i18n.format("perceived-reality.Moments.CatalogDeleteContent", { name: moment.name })}</p>`,
        buttons: [
          { action: "delete", label: loc("CatalogDelete"), icon: "fa-solid fa-trash", callback: () => true },
          { action: "cancel", label: loc("CatalogDeleteCancel"), icon: "fa-solid fa-xmark", default: true, callback: () => false }
        ],
        rejectClose: false
      });
      if (!confirmed) return;
      await prDeleteMoment(moment.id);
      this._build();
    }
  }

  window.PRMomentCatalogClass = PRMomentCatalog;
});

window.prOpenMomentCatalog = function() {
  if (!game.user.isGM) return;
  if (!window.PRMomentCatalogClass) return;
  new PRMomentCatalogClass().render(true);
};
