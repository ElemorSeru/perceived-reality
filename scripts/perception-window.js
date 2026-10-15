window.PRPerceptionWindowClass = null;

const PR_PW_TOOL = "perceived-reality-perception";

const PR_PW_TYPES = [
  { type: "token", collection: "tokens", layer: "tokens", doc: "Token", label: "Tokens", kind: "KindToken", icon: "fa-solid fa-user", section: ".pr-token-section" },
  { type: "tile", collection: "tiles", layer: "tiles", doc: "Tile", label: "Tiles", kind: "KindTile", icon: "fa-solid fa-cubes", section: ".pr-tile-section" },
  { type: "light", collection: "lights", layer: "lighting", doc: "AmbientLight", label: "Lights", kind: "KindLight", icon: "fa-regular fa-lightbulb", section: ".pr-light-section" },
  { type: "wall", collection: "walls", layer: "walls", doc: "Wall", label: "Doors", kind: "KindDoor", icon: "fa-solid fa-door-closed", section: ".pr-wall-section" }
];

const PR_PW_IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif|bmp)$/i;

function _prPwLoc(key) { return game.i18n.localize(`perceived-reality.Window.${key}`); }
function _prPwFormat(key, data) { return game.i18n.format(`perceived-reality.Window.${key}`, data); }

function _prPwEl(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}

// the GM client rewrites door on hidden walls so read source
function _prPwDoorType(doc) {
  return doc._source?.door ?? doc.door ?? 0;
}

function _prPwDocs(type) {
  const scene = canvas?.scene;
  const t = PR_PW_TYPES.find(x => x.type === type);
  if (!scene || !t) return [];
  const docs = scene[t.collection]?.contents ?? [];
  return type === "wall" ? docs.filter(d => _prPwDoorType(d) > 0) : docs;
}

function _prPwSeenBy(doc) {
  const groups = doc.getFlag(PR_MODULE_ID, PR_FLAG_PERCEPTION_GROUPS);
  return Array.isArray(groups) ? groups : [];
}

function _prPwDisguised(doc) {
  const entries = doc.getFlag(PR_MODULE_ID, PR_FLAG_DISGUISES) ?? {};
  return PR_PERCEPTION_GROUPS.map(g => g.id).filter(id => entries[id]?.img);
}

function _prPwTagged(type, doc) {
  if (_prPwSeenBy(doc).length) return true;
  if (type !== "token") return false;
  return prReadViewerGroups(doc).size > 0 || prGetActiveGroupsForToken(doc).size > 0 || _prPwDisguised(doc).length > 0;
}

function _prPwNearest(x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const t of canvas?.scene?.tokens ?? []) {
    const dist = Math.hypot((t.x ?? 0) - x, (t.y ?? 0) - y);
    if (dist < bestDist) { bestDist = dist; best = t; }
  }
  return best?.name ?? null;
}

function _prPwName(type, doc) {
  if (type === "token") return doc.name || doc.id;
  if (type === "tile") {
    const file = (doc.texture?.src ?? "").split("/").pop();
    if (!file) return _prPwLoc("Tile");
    let name = file.replace(/\.[^.]+$/, "");
    try { name = decodeURIComponent(name); } catch { /* keep the raw name */ }
    return name;
  }
  const point = prTargetPoint(type, doc);
  const near = _prPwNearest(point.x, point.y);
  if (type === "light") return near ? _prPwFormat("LightNear", { name: near }) : _prPwLoc("Light");
  const secret = _prPwDoorType(doc) === CONST.WALL_DOOR_TYPES.SECRET;
  if (secret) return near ? _prPwFormat("SecretDoorNear", { name: near }) : _prPwLoc("SecretDoor");
  return near ? _prPwFormat("DoorNear", { name: near }) : _prPwLoc("Door");
}

function _prPwThumbSrc(type, doc) {
  if (type !== "token" && type !== "tile") return null;
  const src = doc.texture?.src ?? "";
  return PR_PW_IMAGE_EXT.test(src) ? src : null;
}

function _prPwLightColor(doc) {
  const color = doc.config?.color;
  if (color === null || color === undefined) return null;
  return typeof color === "number" ? "#" + color.toString(16).padStart(6, "0") : String(color);
}

let _prPwRing = null;

function _prPwHideRing() {
  if (_prPwRing && !_prPwRing.destroyed) _prPwRing.destroy();
  _prPwRing = null;
}

function _prPwShowRing(type, doc) {
  _prPwHideRing();
  if (!canvas?.ready || !canvas.controls || doc.parent?.id !== canvas.scene?.id) return;
  const scale = canvas.stage.scale.x || 1;
  const size = canvas.dimensions?.size ?? 100;
  const pad = 6 / scale;
  const g = new PIXI.Graphics();
  g.eventMode = "none";
  g.lineStyle(4 / scale, 0xc4a8ff, 0.95);
  if (type === "token" || type === "tile") {
    const b = doc.object?.bounds;
    const w = b?.width ?? (type === "token" ? (doc.width ?? 1) * size : doc.width ?? 0);
    const h = b?.height ?? (type === "token" ? (doc.height ?? 1) * size : doc.height ?? 0);
    g.drawRoundedRect((b?.x ?? doc.x) - pad, (b?.y ?? doc.y) - pad, w + pad * 2, h + pad * 2, 8 / scale);
  } else if (type === "light") {
    g.drawCircle(doc.x, doc.y, size * 0.5);
  } else {
    const c = doc.c ?? [0, 0, 0, 0];
    const mid = prTargetPoint("wall", doc);
    g.moveTo(c[0], c[1]);
    g.lineTo(c[2], c[3]);
    g.drawCircle(mid.x, mid.y, size * 0.4);
  }
  canvas.controls.addChild(g);
  _prPwRing = g;
}

Hooks.on("canvasTearDown", () => { _prPwRing = null; });

function _prPwSegmentDistance(point, c) {
  const [x1, y1, x2, y2] = c ?? [0, 0, 0, 0];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((point.x - x1) * dx + (point.y - y1) * dy) / len)) : 0;
  return Math.hypot(point.x - (x1 + t * dx), point.y - (y1 + t * dy));
}

function _prPwHitTest(point) {
  const size = canvas.dimensions?.size ?? 100;
  const hits = [];
  for (const wall of canvas.walls?.placeables ?? []) {
    const doc = wall.document;
    if (_prPwDoorType(doc) <= 0) continue;
    const mid = prTargetPoint("wall", doc);
    if (Math.hypot(point.x - mid.x, point.y - mid.y) <= size * 0.35 || _prPwSegmentDistance(point, doc.c) <= size * 0.1) {
      hits.push({ type: "wall", doc });
    }
  }
  for (const light of canvas.lighting?.placeables ?? []) {
    const doc = light.document;
    if (Math.hypot(point.x - doc.x, point.y - doc.y) <= size * 0.35) hits.push({ type: "light", doc });
  }
  const byHeight = (a, b) => ((b.document.elevation ?? 0) - (a.document.elevation ?? 0)) || ((b.document.sort ?? 0) - (a.document.sort ?? 0));
  for (const token of [...(canvas.tokens?.placeables ?? [])].sort(byHeight)) {
    if (token.bounds?.contains(point.x, point.y)) hits.push({ type: "token", doc: token.document });
  }
  for (const tile of [...(canvas.tiles?.placeables ?? [])].sort(byHeight)) {
    // alpha 0 so clear parts of the art still count
    const inside = tile.mesh?.containsCanvasPoint ? tile.mesh.containsCanvasPoint(point, 0) : tile.bounds?.contains(point.x, point.y);
    if (inside) hits.push({ type: "tile", doc: tile.document });
  }
  return hits;
}

function _prPwKey(hit) { return `${hit.type}.${hit.doc.id}`; }

// light icons only draw on the lighting layer so mark them
function _prPwDrawLightMarkers() {
  const size = canvas.dimensions?.size ?? 100;
  const g = new PIXI.Graphics();
  g.eventMode = "none";
  for (const light of canvas.lighting?.placeables ?? []) {
    const { x, y } = light.document;
    g.lineStyle(size * 0.04, 0xc4a8ff, 0.95);
    g.beginFill(0x120c1c, 0.75);
    g.drawCircle(x, y, size * 0.22);
    g.endFill();
    g.beginFill(0xc4a8ff, 0.95);
    g.drawCircle(x, y, size * 0.07);
    g.endFill();
  }
  canvas.controls.addChild(g);
  return g;
}

// on the stage so wheel zoom still finds #board
function _prPwStartPick(app) {
  if (!canvas?.ready || !canvas.controls) return null;
  const catcher = new PIXI.Container();
  catcher.eventMode = "static";
  catcher.cursor = "crosshair";
  catcher.hitArea = new PIXI.Rectangle(-1e7, -1e7, 2e7, 2e7);
  // v12 and v13 sort the stage by zIndex
  catcher.zIndex = Number.MAX_SAFE_INTEGER;
  canvas.stage.addChild(catcher);
  const markers = _prPwDrawLightMarkers();
  const label = _prPwEl("div", "pr-pw-pick-label");
  label.hidden = true;
  document.body.appendChild(label);
  let last = null;
  let frame = 0;

  const clientOf = event => ({ x: event.clientX, y: event.clientY });
  const sameSpot = (spot, hits) => !!last && hits.length > 1 && Math.hypot(last.x - spot.x, last.y - spot.y) < 6;

  const onMove = event => {
    const point = event.getLocalPosition(canvas.stage);
    const { x, y } = clientOf(event);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const hits = _prPwHitTest(point);
      if (!hits.length) {
        _prPwHideRing();
        label.hidden = true;
        return;
      }
      const again = sameSpot({ x, y }, hits);
      const hit = again ? hits[(last.index + 1) % hits.length] : hits[0];
      _prPwShowRing(hit.type, hit.doc);
      const kind = _prPwLoc(PR_PW_TYPES.find(x => x.type === hit.type).kind);
      const parts = [`${kind}: ${_prPwName(hit.type, hit.doc)}`];
      if (!again && hits.length > 1) parts.push(_prPwFormat("PickMore", { count: hits.length - 1 }));
      if (!again && app._picks.includes(_prPwKey(hit))) parts.push(_prPwLoc("PickUnpick"));
      label.textContent = parts.join(" - ");
      label.style.left = `${x + 16}px`;
      label.style.top = `${y + 14}px`;
      label.hidden = false;
    });
  };

  const onDown = event => {
    event.stopPropagation();
    if (event.button === 2) {
      app._setPicking(false);
      return;
    }
    if (event.button !== 0) return;
    const hits = _prPwHitTest(event.getLocalPosition(canvas.stage));
    const spot = clientOf(event);
    const toggle = event.shiftKey;
    if (!hits.length) {
      last = null;
      if (!toggle) app._selectOnly(null);
      return;
    }
    if (sameSpot(spot, hits) && last.added) {
      const index = (last.index + 1) % hits.length;
      const next = _prPwKey(hits[index]);
      app._unpick(last.added);
      app._pick(next);
      last = { ...spot, index, added: next };
    } else {
      const key = _prPwKey(hits[0]);
      if (!toggle) {
        app._selectOnly(key);
        last = { ...spot, index: 0, added: key };
      } else if (app._picks.includes(key)) {
        app._unpick(key);
        last = { ...spot, index: 0, added: null };
      } else {
        app._pick(key);
        last = { ...spot, index: 0, added: key };
      }
    }
    onMove(event);
  };

  // core's Esc would close this window so stop it
  const onKey = event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    app._setPicking(false);
  };

  catcher.on("pointermove", onMove);
  catcher.on("pointerdown", onDown);

  for (const type of ["pointerup", "pointerupoutside"]) catcher.on(type, event => event.stopPropagation());
  window.addEventListener("keydown", onKey, true);

  return {
    catcher,
    stop() {
      window.removeEventListener("keydown", onKey, true);
      cancelAnimationFrame(frame);
      if (!catcher.destroyed) catcher.destroy();
      if (!markers.destroyed) markers.destroy();
      label.remove();
      _prPwHideRing();
    }
  };
}

function _prPwEffectActor(effect) {
  const parent = effect?.parent;
  return parent?.documentName === "Item" ? parent.actor : parent;
}

Hooks.once("init", function() {
  game.keybindings.register(PR_MODULE_ID, "openPerceptionWindow", {
    name: "perceived-reality.Window.KeybindOpen",
    editable: [{ key: "KeyE", modifiers: ["Control", "Shift"] }],
    restricted: true,
    onDown: () => { prTogglePerceptionWindow(); return true; }
  });

  const AppV2 = foundry.applications?.api?.ApplicationV2;
  const HbsMixin = foundry.applications?.api?.HandlebarsApplicationMixin;
  if (!AppV2 || !HbsMixin) {
    console.error("[perceived-reality] ApplicationV2 unavailable; Perception window disabled.");
    return;
  }

  class PRPerceptionWindow extends HbsMixin(AppV2) {
    static current = null;

    static DEFAULT_OPTIONS = {
      id: "pr-perception-window",
      classes: ["pr-perception-window"],
      window: { title: "perceived-reality.Window.Title", icon: "fa-solid fa-eye-low-vision", resizable: true },
      position: { width: 470, height: 640 }
    };

    static PARTS = {
      body: { template: "modules/perceived-reality/templates/perception-window.hbs" }
    };

    constructor(options) {
      super(options);
      this._mode = "seenby";
      this._filter = "all";
      this._search = "";
      this._collapsed = new Set();
      this._hookIds = [];
      this._pending = { all: false, selected: false, view: false, sections: new Set(), docs: new Map() };
      this._frame = 0;
      this._prevOverride = window.prViewAsOverride ?? null;
      this._ownOverride = undefined;
      this._settingView = false;
      this._picks = [];
      this._picking = false;
      this._pickSession = null;
      this._intended = new Map();
      this._saving = null;
      this.trace = { listBuilds: 0, sectionBuilds: 0, selectedBuilds: 0, rowsReplaced: 0, rowsUnchanged: 0, updatesIgnored: 0, writes: 0 };
    }

    async _prepareContext() { return {}; }

    _onFirstRender(context, options) {
      super._onFirstRender?.(context, options);
      PRPerceptionWindow.current = this;
      for (const t of PR_PW_TYPES) {
        this._listen(`create${t.doc}`, doc => this._onDocChange(t, doc, null));
        this._listen(`update${t.doc}`, (doc, change) => this._onDocChange(t, doc, change));
        this._listen(`delete${t.doc}`, doc => this._onDocChange(t, doc, null));
        this._listen(`control${t.doc}`, () => this._queue({ selected: true }));
      }
      this._listen("renderSceneControls", () => this._queue({ selected: true }));
      this._listen("canvasReady", () => {
        this._picks = [];
        this._dropStalePreview();
        this._queue({ all: true });
      });
      this._listen("canvasTearDown", () => this._setPicking(false));
      this._listen("prPerceptionViewChanged", override => this._onViewChanged(override));
      for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
        this._listen(hook, effect => this._onActorChange(_prPwEffectActor(effect)));
      }
      for (const hook of ["createItem", "updateItem", "deleteItem"]) {
        this._listen(hook, item => this._onActorChange(item?.actor));
      }
      this._listen("updateActor", (actor, change) => {
        this._onActorChange(actor);
        if (change && "ownership" in change) this._queue({ view: true });
      });
    }

    _onRender(context, options) {
      super._onRender?.(context, options);
      this._root = this.element.querySelector(".pr-pw-root");
      if (!this._root) return;
      this._buildShell();
      this._buildList();
    }

    async _onClose(options) {
      for (const [name, id] of this._hookIds) Hooks.off(name, id);
      this._hookIds = [];
      if (this._frame) cancelAnimationFrame(this._frame);
      this._frame = 0;
      this._setPicking(false);
      _prPwHideRing();
      if (this._ownOverride !== undefined && window.prViewAsOverride === this._ownOverride) {
        this._settingView = true;
        prApplyPerceptionView(this._tokenPreviewValid(this._prevOverride, false) ? this._prevOverride : null);
        window.prApplyAtmosphereFromScene?.();
        this._settingView = false;
      }
      if (PRPerceptionWindow.current === this) PRPerceptionWindow.current = null;
      return super._onClose(options);
    }

    _listen(name, fn) {
      this._hookIds.push([name, Hooks.on(name, fn)]);
    }

    _onDocChange(t, doc, change) {
      if (doc.parent?.id !== canvas?.scene?.id) return;
      if (t.type === "token" && (!change || "name" in change || "actorId" in change || "actorLink" in change)) this._queue({ view: true });
      if (!change) {
        this._queue({ section: t.type, selected: true });
        return;
      }
      const relevant = change.flags?.[PR_MODULE_ID] !== undefined || "name" in change || "texture" in change
        || "door" in change || "detectionModes" in change || "config" in change;
      if (!relevant) {
        this.trace.updatesIgnored++;
        return;
      }
      if (t.type === "wall" && "door" in change) {
        this._queue({ section: "wall", selected: true });
        return;
      }
      this._queue({ doc: [t, doc] });
    }

    _onActorChange(actor) {
      if (!actor || !canvas?.scene) return;
      for (const tokenDoc of canvas.scene.tokens) {
        if (tokenDoc.actor?.uuid === actor.uuid || (tokenDoc.actorLink && tokenDoc.actorId === actor.id)) {
          this._queue({ doc: [PR_PW_TYPES[0], tokenDoc] });
        }
      }
    }

    _onViewChanged(override) {
      if (this._settingView) return;

      this._prevOverride = override ?? null;
      this._ownOverride = undefined;
      this._syncViewSelect();
    }

    _queue({ all, selected, view, section, doc }) {
      const p = this._pending;
      if (all) p.all = true;
      if (selected) p.selected = true;
      if (view) p.view = true;
      if (section) p.sections.add(section);
      if (doc) p.docs.set(`${doc[0].type}.${doc[1].id}`, doc);
      if (!this._frame) this._frame = requestAnimationFrame(() => this._flush());
    }

    _flush() {
      this._frame = 0;
      const p = this._pending;
      this._pending = { all: false, selected: false, view: false, sections: new Set(), docs: new Map() };
      if (!this.rendered || !this._root) return;
      if (p.all) {
        this._buildList();
        return;
      }
      if (p.view) this._buildViewSelect();
      const keep = this._list.scrollTop;
      for (const type of p.sections) this._buildSection(type);
      if (p.selected) this._buildSelected();
      for (const [t, doc] of p.docs.values()) {
        if (p.selected && p.sections.has(t.type)) continue;
        this._refreshDoc(t, doc);
      }
      this._updateFoot();
      this._list.scrollTop = keep;
    }

    _buildShell() {
      const root = this._root;
      root.innerHTML = "";

      const viewBar = _prPwEl("div", "pr-pw-bar");
      viewBar.appendChild(_prPwEl("span", "pr-pw-label", _prPwLoc("ViewingAs")));
      const viewSel = _prPwEl("select", "pr-pw-select");
      viewSel.title = _prPwLoc("ViewHint");
      viewSel.addEventListener("change", () => this._setView(viewSel.value));
      viewBar.appendChild(viewSel);
      root.appendChild(viewBar);
      this._viewSel = viewSel;

      const toolBar = _prPwEl("div", "pr-pw-bar");
      toolBar.appendChild(this._buildSeg([
        ["seenby", "ModeSeenBy", "ModeSeenByHint"],
        ["sees", "ModeSees", "ModeSeesHint"]
      ], () => this._mode, value => { this._mode = value; this._buildList(); }, "pr-pw-mode"));
      const search = _prPwEl("input", "pr-pw-search");
      search.type = "text";
      search.placeholder = _prPwLoc("Search");
      search.value = this._search;
      search.addEventListener("input", () => {
        this._search = search.value.trim().toLowerCase();
        for (const t of PR_PW_TYPES) this._buildSection(t.type);
      });
      toolBar.appendChild(search);
      toolBar.appendChild(this._buildSeg([
        ["all", "FilterAll", null],
        ["tagged", "FilterTagged", "FilterTaggedHint"]
      ], () => this._filter, value => {
        this._filter = value;
        for (const t of PR_PW_TYPES) this._buildSection(t.type);
        this._updateFoot();
      }, "pr-pw-filter"));
      const pick = this._iconButton("fa-solid fa-arrow-pointer", _prPwLoc("PickStart"));
      pick.classList.add("pr-pw-pick");
      pick.addEventListener("click", () => this._setPicking(!this._picking));
      toolBar.appendChild(pick);
      this._pickBtn = pick;
      root.appendChild(toolBar);

      const cols = _prPwEl("div", "pr-pw-cols");
      cols.appendChild(_prPwEl("span", "pr-pw-col-name", ""));
      for (const group of PR_PERCEPTION_GROUPS) {
        const img = _prPwEl("img", "pr-pw-col-icon");
        img.src = group.icon;
        img.alt = "";
        img.title = prGetGroupLabel(group.id);
        cols.appendChild(img);
      }
      for (let i = 0; i < 3; i++) cols.appendChild(_prPwEl("span"));
      root.appendChild(cols);

      this._list = _prPwEl("div", "pr-pw-list");
      root.appendChild(this._list);
      this._selEl = null;
      this._secEls = {};

      this._foot = _prPwEl("div", "pr-pw-foot");
      root.appendChild(this._foot);
    }

    _buildSeg(options, get, set, cls) {
      const seg = _prPwEl("div", `pr-pw-seg ${cls}`);
      for (const [value, labelKey, hintKey] of options) {
        const btn = _prPwEl("button", "pr-pw-seg-btn", _prPwLoc(labelKey));
        btn.type = "button";
        btn.dataset.value = value;
        if (hintKey) btn.title = _prPwLoc(hintKey);
        btn.classList.toggle("pr-pw-on", get() === value);
        btn.addEventListener("click", () => {
          set(value);
          for (const b of seg.querySelectorAll(".pr-pw-seg-btn")) b.classList.toggle("pr-pw-on", b.dataset.value === get());
        });
        seg.appendChild(btn);
      }
      return seg;
    }

    _buildList() {
      this.trace.listBuilds++;
      const keep = this._list.scrollTop;
      this._list.innerHTML = "";
      this._selEl = null;
      this._secEls = {};
      this._root.classList.toggle("pr-pw-mode-sees", this._mode === "sees");
      this._buildViewSelect();
      if (!canvas?.scene) {
        this._list.appendChild(_prPwEl("div", "pr-pw-empty", _prPwLoc("NoScene")));
        this._updateFoot();
        return;
      }
      this._buildSelected();
      for (const t of PR_PW_TYPES) this._buildSection(t.type);
      this._updateFoot();
      this._list.scrollTop = keep;
    }

    _buildViewSelect() {
      const sel = this._viewSel;
      sel.innerHTML = "";
      sel.appendChild(this._option("", _prPwLoc("ViewNormal")));
      const party = (canvas?.scene?.tokens?.contents ?? [])
        .filter(t => t.actor?.hasPlayerOwner)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      if (party.length) {
        const list = _prPwEl("optgroup");
        list.label = _prPwLoc("ViewParty");
        for (const t of party) list.appendChild(this._option(`token:${t.id}`, t.name));
        sel.appendChild(list);
      }
      const groups = _prPwEl("optgroup");
      groups.label = _prPwLoc("ViewGroups");
      for (const group of PR_PERCEPTION_GROUPS) groups.appendChild(this._option(`group:${group.id}`, prGetGroupLabel(group.id)));
      sel.appendChild(groups);
      this._dropStalePreview();
      this._syncViewSelect();
    }

    _option(value, label) {
      const option = _prPwEl("option", "", label);
      option.value = value;
      return option;
    }

    _syncViewSelect() {
      const sel = this._viewSel;
      if (!sel) return;
      const override = window.prViewAsOverride;
      const value = override?.mode === "token" ? `token:${override.tokenId}`
        : override?.mode === "group" ? `group:${override.groupId}`
        : "";
      sel.value = [...sel.options].some(o => o.value === value) ? value : "";
    }

    // copied scenes keep token ids so check the scene too
    _tokenPreviewValid(override, party) {
      if (override?.mode !== "token") return true;
      if (override.sceneId && override.sceneId !== canvas?.scene?.id) return false;
      const tokenDoc = canvas?.scene?.tokens?.get(override.tokenId);
      return !!tokenDoc && (!party || !!tokenDoc.actor?.hasPlayerOwner);
    }

    _dropStalePreview() {
      const own = this._ownOverride;
      if (own?.mode !== "token" || window.prViewAsOverride !== own) return;
      if (!this._tokenPreviewValid(own, true)) this._setView("");
    }

    _setView(value) {
      const [mode, id] = value.split(":");
      const override = mode === "token" ? { mode, tokenId: id, sceneId: canvas?.scene?.id }
        : mode === "group" ? { mode, groupId: id }
        : null;
      this._ownOverride = override;
      this._settingView = true;
      prApplyPerceptionView(override);
      window.prApplyAtmosphereFromScene?.();
      this._settingView = false;
    }

    _sectionShell(key, title) {
      const sec = _prPwEl("div", "pr-pw-sec");
      sec.dataset.sec = key;
      sec.classList.toggle("pr-pw-collapsed", this._collapsed.has(key));
      const head = _prPwEl("div", "pr-pw-sec-head");
      head.appendChild(_prPwEl("i", "fa-solid fa-caret-down pr-pw-caret"));
      head.appendChild(_prPwEl("span", "pr-pw-sec-title", title));
      const count = _prPwEl("span", "pr-pw-count");
      head.appendChild(count);
      head.addEventListener("click", () => {
        if (this._collapsed.has(key)) this._collapsed.delete(key);
        else this._collapsed.add(key);
        sec.classList.toggle("pr-pw-collapsed", this._collapsed.has(key));
      });
      sec.appendChild(head);
      const body = _prPwEl("div", "pr-pw-sec-body");
      sec.appendChild(body);
      return { sec, head, body, count };
    }

    _place(sec, key) {
      const order = ["selected", ...PR_PW_TYPES.map(t => t.type)];
      const old = key === "selected" ? this._selEl : this._secEls[key];
      if (old?.isConnected) {
        old.replaceWith(sec);
        return;
      }
      const after = order.slice(order.indexOf(key) + 1)
        .map(k => k === "selected" ? this._selEl : this._secEls[k])
        .find(el => el?.isConnected);
      if (after) this._list.insertBefore(sec, after);
      else this._list.appendChild(sec);
    }

    _matches(t, doc, name) {
      if (this._filter === "tagged" && !_prPwTagged(t.type, doc)) return false;
      if (this._search && !(name ?? _prPwName(t.type, doc)).toLowerCase().includes(this._search)) return false;
      return true;
    }

    _buildSection(type) {
      if (!canvas?.scene || !this._list) return;
      const t = PR_PW_TYPES.find(x => x.type === type);
      this.trace.sectionBuilds++;
      const { sec, body, count } = this._sectionShell(type, _prPwLoc(t.label));
      sec.hidden = this._mode === "sees" && type !== "token";
      const names = new Map(_prPwDocs(type).map(doc => [doc, _prPwName(type, doc)]));
      const docs = [...names.keys()]
        .filter(doc => this._matches(t, doc, names.get(doc)))
        .sort((a, b) => names.get(a).localeCompare(names.get(b)));
      count.textContent = String(docs.length);
      if (!docs.length) body.appendChild(_prPwEl("div", "pr-pw-empty", _prPwLoc("NothingMatches")));
      for (const doc of docs) body.appendChild(this._buildRow(t, doc));
      this._place(sec, type);
      this._secEls[type] = sec;
    }

    _selectionEntries() {
      const entries = [];
      const seen = new Set();
      const layer = canvas?.activeLayer;
      const t = PR_PW_TYPES.find(x => canvas?.[x.layer] && canvas[x.layer] === layer);
      for (const object of t ? (layer.controlled ?? []) : []) {
        const doc = object.document;
        if (!doc || (t.type === "wall" && _prPwDoorType(doc) <= 0)) continue;
        entries.push({ t, doc, picked: false });
        seen.add(`${t.type}.${doc.id}`);
      }
      this._picks = this._picks.filter(key => {
        const [type, id] = key.split(".");
        const pt = PR_PW_TYPES.find(x => x.type === type);
        const doc = canvas?.scene?.[pt?.collection]?.get(id);
        if (doc && !seen.has(key)) entries.push({ t: pt, doc, picked: true });
        return !!doc;
      });
      return entries;
    }

    _buildSelected() {
      if (!canvas?.scene || !this._list) return;
      this.trace.selectedBuilds++;
      const { sec, head, body, count } = this._sectionShell("selected", _prPwLoc("Selected"));
      sec.classList.add("pr-pw-sel");
      const entries = this._selectionEntries();
      count.textContent = String(entries.length);
      if (!entries.length) {
        body.appendChild(_prPwEl("div", "pr-pw-empty", _prPwLoc("SelectedEmpty")));
      } else {
        const clear = _prPwEl("button", "pr-pw-clear", _prPwLoc("Clear"));
        clear.type = "button";
        clear.title = _prPwLoc("ClearHint");
        clear.addEventListener("click", event => {
          event.stopPropagation();
          this._clearSelection();
        });
        head.appendChild(clear);
        if (entries.length > 1) body.appendChild(this._buildBulkRow(entries));
        for (const entry of entries) body.appendChild(this._buildRow(entry.t, entry.doc, entry.picked, true));
      }
      this._place(sec, "selected");
      this._selEl = sec;
    }

    _clearSelection() {
      this._selectOnly(null);
    }

    _selectOnly(key) {
      this._picks = key ? [key] : [];
      if (canvas?.activeLayer?.controlled?.length) canvas.activeLayer.releaseAll();
      this._queue({ selected: true });
    }

    _deselect(t, doc, picked) {
      if (picked) this._unpick(`${t.type}.${doc.id}`);
      else doc.object?.release();
      this._queue({ selected: true });
    }

    _pick(key) {
      if (!this._picks.includes(key)) this._picks.push(key);
      this._queue({ selected: true });
    }

    _unpick(key) {
      this._picks = this._picks.filter(k => k !== key);
      this._queue({ selected: true });
    }

    _setPicking(on) {
      if (on === this._picking) return;
      if (on) {
        this._pickSession = _prPwStartPick(this);
        if (!this._pickSession) return;
      } else {
        this._pickSession?.stop();
        this._pickSession = null;
      }
      this._picking = on;
      if (this._pickBtn) {
        this._pickBtn.classList.toggle("pr-pw-on", on);
        this._pickBtn.title = _prPwLoc(on ? "PickStop" : "PickStart");
      }
      this._updateFoot();
    }

    _editable(t) {
      return this._mode === "seenby" || t.type === "token";
    }

    _sig(t, doc) {
      const parts = [this._mode, _prPwName(t.type, doc), _prPwThumbSrc(t.type, doc), _prPwLightColor(doc), _prPwSeenBy(doc).join()];
      if (t.type === "token") {
        parts.push([...prReadViewerGroups(doc)].sort().join(), [...prGetActiveGroupsForToken(doc)].sort().join(), _prPwDisguised(doc).join());
      }
      return JSON.stringify(parts);
    }

    _groupState(docs, groupId) {
      if (this._mode === "seenby") {
        return { count: docs.filter(d => _prPwSeenBy(d).includes(groupId)).length, effect: false };
      }
      const count = docs.filter(d => prReadViewerGroups(d).has(groupId)).length;
      const effect = !count && docs.some(d => prGetActiveGroupsForToken(d).has(groupId));
      return { count, effect };
    }

    _appendChips(row, entries, bulk) {
      const usable = entries.filter(e => this._editable(e.t));
      const docs = usable.map(e => e.doc);
      for (const group of PR_PERCEPTION_GROUPS) {
        const chip = _prPwEl("button", "pr-pw-chip");
        chip.type = "button";
        chip.dataset.group = group.id;
        const img = _prPwEl("img");
        img.src = group.icon;
        img.alt = "";
        chip.appendChild(img);
        row.appendChild(chip);
        if (!usable.length) {
          chip.disabled = true;
          chip.classList.add("pr-pw-hidden");
          continue;
        }
        const label = prGetGroupLabel(group.id);
        const { count, effect } = this._groupState(docs, group.id);
        chip.classList.toggle("pr-pw-on", count > 0 && count === usable.length);
        chip.classList.toggle("pr-pw-mixed", count > 0 && count < usable.length);
        chip.classList.toggle("pr-pw-effect", effect);
        chip.title = effect ? _prPwFormat("ChipEffect", { label })
          : bulk ? _prPwFormat("ChipCount", { label, count, total: usable.length })
          : label;
        chip.addEventListener("click", event => {
          event.stopPropagation();
          this._toggle(usable, group.id);
        });
      }
    }

    _buildBulkRow(entries) {
      const row = _prPwEl("div", "pr-pw-row pr-pw-bulk");
      const who = _prPwEl("div", "pr-pw-who");
      const thumb = _prPwEl("span", "pr-pw-thumb");
      thumb.appendChild(_prPwEl("i", "fa-solid fa-layer-group"));
      who.appendChild(thumb);
      const key = this._mode === "sees" ? "AllTokens" : "AllSelected";
      const n = entries.filter(e => this._editable(e.t)).length;
      who.appendChild(_prPwEl("span", "pr-pw-name", _prPwFormat(key, { count: n })));
      row.appendChild(who);
      this._appendChips(row, entries, true);
      for (let i = 0; i < 3; i++) row.appendChild(_prPwEl("span"));
      row.addEventListener("mouseenter", () => _prPwHideRing());
      return row;
    }

    _buildRow(t, doc, picked = false, inSelected = false) {
      const row = _prPwEl("div", "pr-pw-row");
      row.classList.toggle("pr-pw-picked", picked);
      row.dataset.key = `${t.type}.${doc.id}`;
      row.dataset.sig = this._sig(t, doc);
      if (!this._editable(t)) row.classList.add("pr-pw-off");

      const who = _prPwEl("div", "pr-pw-who");
      const thumb = _prPwEl("span", "pr-pw-thumb");
      const src = _prPwThumbSrc(t.type, doc);
      if (src) {
        const img = _prPwEl("img");
        img.src = src;
        img.alt = "";
        thumb.appendChild(img);
      } else {
        const icon = _prPwEl("i", t.icon);
        const color = t.type === "light" ? _prPwLightColor(doc) : null;
        if (color) icon.style.color = color;
        thumb.appendChild(icon);
      }
      who.appendChild(thumb);
      const name = _prPwEl("span", "pr-pw-name", _prPwName(t.type, doc));
      name.title = _prPwLoc("MoveTo");
      who.appendChild(name);
      if (picked) who.appendChild(_prPwEl("span", "pr-pw-tag", _prPwLoc("Picked")));
      if (inSelected) {
        const desel = _prPwEl("button", "pr-pw-desel");
        desel.type = "button";
        desel.title = _prPwLoc("Deselect");
        desel.appendChild(_prPwEl("i", "fa-solid fa-xmark"));
        desel.addEventListener("click", event => {
          event.stopPropagation();
          this._deselect(t, doc, picked);
        });
        who.appendChild(desel);
      }
      who.addEventListener("click", () => prLocatePoint(prTargetPoint(t.type, doc)));
      row.appendChild(who);

      this._appendChips(row, [{ t, doc }], false);

      if (t.type === "token") {
        const disguised = _prPwDisguised(doc);
        const mask = this._iconButton("fa-solid fa-masks-theater", disguised.length
          ? _prPwFormat("DisguiseSet", { groups: disguised.map(id => prGetGroupLabel(id)).join(", ") })
          : _prPwLoc("DisguiseNone"));
        mask.classList.add("pr-pw-mask");
        mask.classList.toggle("pr-pw-on", disguised.length > 0);
        mask.addEventListener("click", () => this._openConfig(doc, ".pr-token-disguise-section"));
        row.appendChild(mask);
      } else {
        row.appendChild(_prPwEl("span"));
      }

      const move = this._iconButton("fa-solid fa-location-crosshairs", _prPwLoc("MoveTo"));
      move.addEventListener("click", () => prLocatePoint(prTargetPoint(t.type, doc)));
      row.appendChild(move);

      const config = this._iconButton("fa-solid fa-gear", _prPwLoc("OpenConfig"));
      config.addEventListener("click", () => this._openConfig(doc, t.section));
      row.appendChild(config);

      row.addEventListener("mouseenter", () => _prPwShowRing(t.type, doc));
      row.addEventListener("mouseleave", () => _prPwHideRing());
      return row;
    }

    _iconButton(icon, title) {
      const btn = _prPwEl("button", "pr-pw-icon-btn");
      btn.type = "button";
      btn.title = title;
      btn.appendChild(_prPwEl("i", icon));
      return btn;
    }

    _refreshDoc(t, doc) {
      if (!this._list) return;
      const live = canvas?.scene?.[t.collection]?.get(doc.id);
      const section = this._secEls[t.type];
      const inSection = !!section?.querySelector(`.pr-pw-row[data-key="${t.type}.${doc.id}"]`);
      if (live && !section?.hidden && inSection !== this._matches(t, live)) {
        this._buildSection(t.type);
      }
      const sig = live ? this._sig(t, live) : null;
      const inSelected = !!this._selEl?.querySelector(`.pr-pw-row[data-key="${t.type}.${doc.id}"]`);
      for (const row of this._list.querySelectorAll(`.pr-pw-row[data-key="${t.type}.${doc.id}"]`)) {
        if (sig && row.dataset.sig === sig) {
          this.trace.rowsUnchanged++;
          continue;
        }
        this.trace.rowsReplaced++;
        if (!live) {
          row.remove();
          continue;
        }
        row.replaceWith(this._buildRow(t, live, row.classList.contains("pr-pw-picked"), !!row.closest(".pr-pw-sel")));
      }
      const bulk = this._selEl?.querySelector(".pr-pw-bulk");
      if (bulk && inSelected) {
        const entries = this._selectionEntries();
        if (entries.length > 1) bulk.replaceWith(this._buildBulkRow(entries));
      }
    }

    _updateFoot() {
      if (!this._foot) return;
      this._foot.classList.toggle("pr-pw-picking", this._picking);
      if (this._picking) {
        this._foot.textContent = _prPwLoc("PickHint");
        return;
      }
      let tagged = 0;
      let total = 0;
      for (const t of PR_PW_TYPES) {
        for (const doc of _prPwDocs(t.type)) {
          total++;
          if (_prPwTagged(t.type, doc)) tagged++;
        }
      }
      this._foot.textContent = canvas?.scene ? _prPwFormat("TaggedCount", { tagged, total }) : "";
    }

    // a second click can come before the first save returns
    _groupsFor(mode, t, doc) {
      const asked = this._intended.get(`${mode}.${t.type}.${doc.id}`);
      if (asked) return new Set(asked);
      return mode === "seenby" ? new Set(_prPwSeenBy(doc)) : prReadViewerGroups(doc);
    }

    _toggle(entries, groupId) {
      const mode = this._mode;
      const usable = mode === "seenby" ? entries : entries.filter(e => e.t.type === "token");
      if (!usable.length) return;
      const allOn = usable.every(e => this._groupsFor(mode, e.t, e.doc).has(groupId));
      const changes = usable.map(e => {
        const groups = this._groupsFor(mode, e.t, e.doc);
        if (allOn) groups.delete(groupId);
        else groups.add(groupId);
        const key = `${mode}.${e.t.type}.${e.doc.id}`;
        this._intended.set(key, groups);
        return { key, doc: e.doc, groups };
      });
      this.trace.writes += changes.length;
      this._saving = (this._saving ?? Promise.resolve()).catch(() => {}).then(async () => {
        if (mode === "seenby") await prCommitSeenByGroups(changes.map(c => ({ doc: c.doc, groups: [...c.groups] })));
        else for (const c of changes) await prCommitViewerGroups(c.doc, c.groups, { render: false });
      }).finally(() => {
        for (const c of changes) if (this._intended.get(c.key) === c.groups) this._intended.delete(c.key);
      });
      return this._saving;
    }

    async _openConfig(doc, selector) {
      const sheet = doc.sheet;
      if (!sheet) return;
      await sheet.render(true);
      // render hook adds the section so wait for it
      for (let i = 0; i < 40; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        const root = sheet.element instanceof HTMLElement ? sheet.element : sheet.element?.[0];
        const section = root?.querySelector(selector);
        if (!section) continue;
        // v12 token config nests tabs
        const tabs = [];
        for (let el = section.closest("[data-tab]"); el; el = el.parentElement?.closest("[data-tab]")) tabs.unshift(el);
        for (const tab of tabs) {
          const { tab: name, group } = tab.dataset;
          try {
            if (typeof sheet.changeTab === "function") sheet.changeTab(name, group ?? "sheet");
            // v12 sheets don't name tab groups
            else root.querySelector(`nav${group ? `[data-group="${group}"]` : ""} [data-tab="${name}"]`)?.click();
          } catch (err) {
            console.warn("[perceived-reality] couldn't switch the config tab:", err);
          }
        }
        section.scrollIntoView({ block: "start" });
        return;
      }
    }
  }

  window.PRPerceptionWindowClass = PRPerceptionWindow;
});

window.prOpenPerceptionWindow = function() {
  if (!game.user?.isGM || !window.PRPerceptionWindowClass) return null;
  const current = PRPerceptionWindowClass.current;
  if (current?.rendered) {
    current.bringToFront?.();
    return current;
  }
  const width = PRPerceptionWindowClass.DEFAULT_OPTIONS.position.width;
  const app = new PRPerceptionWindowClass({ position: { left: Math.max(10, window.innerWidth - width - 340), top: 60 } });
  app.render(true);
  return app;
};

window.prTogglePerceptionWindow = function() {
  const current = window.PRPerceptionWindowClass?.current;
  if (current?.rendered) current.close();
  else prOpenPerceptionWindow();
};

// v12 passes arrays of controls and tools, v13+ records
Hooks.on("getSceneControlButtons", controls => {
  if (!game.user?.isGM) return;
  const tool = { name: PR_PW_TOOL, title: "perceived-reality.Window.ToolTitle", icon: "fa-solid fa-eye-low-vision", button: true };
  if (Array.isArray(controls)) {
    for (const name of ["token", "tiles", "lighting", "walls"]) {
      const bar = controls.find(c => c.name === name);
      if (Array.isArray(bar?.tools) && !bar.tools.some(x => x.name === PR_PW_TOOL)) {
        bar.tools.push({ ...tool, onClick: () => prOpenPerceptionWindow() });
      }
    }
    return;
  }
  for (const name of ["tokens", "tiles", "lighting", "walls"]) {
    const bar = controls?.[name];
    if (!bar?.tools) continue;
    bar.tools[PR_PW_TOOL] = { ...tool, order: Object.keys(bar.tools).length, visible: true, onChange: () => prOpenPerceptionWindow() };
  }
});

async function _prPwOpenForScene(sceneId) {
  const scene = sceneId ? game.scenes.get(sceneId) : null;
  if (scene && scene.id !== canvas?.scene?.id) await scene.view();
  prOpenPerceptionWindow();
}

Hooks.on("getSceneDirectoryEntryContext", (html, entries) => {
  entries.push({
    name: "perceived-reality.Window.MenuOpen",
    icon: '<i class="fa-solid fa-eye-low-vision"></i>',
    condition: () => game.user.isGM,
    callback: li => _prPwOpenForScene(li?.data?.("documentId") ?? li?.[0]?.dataset?.documentId)
  });
});

// navigation entries have sceneId, directory entries entryId
function _prPwSceneIdOf(target) {
  const el = target?.[0] ?? target;
  return el?.dataset?.sceneId ?? el?.dataset?.entryId;
}

// v13 reads name, condition, and callback, v14 reads label, visible, and onClick
Hooks.on("getSceneContextOptions", (app, entries) => {
  entries.push({
    name: "perceived-reality.Window.MenuOpen",
    label: "perceived-reality.Window.MenuOpen",
    icon: '<i class="fa-solid fa-eye-low-vision"></i>',
    condition: () => game.user.isGM,
    visible: () => game.user.isGM,
    callback: target => _prPwOpenForScene(_prPwSceneIdOf(target)),
    onClick: (event, target) => _prPwOpenForScene(_prPwSceneIdOf(target))
  });
});
