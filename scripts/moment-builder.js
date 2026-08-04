window.PRMomentBuilderClass = null;
window.PR_LANE_PX = 44;

Hooks.once("init", function() {
  const AppV2 = foundry.applications?.api?.ApplicationV2;
  const HbsMixin = foundry.applications?.api?.HandlebarsApplicationMixin;
  if (!AppV2 || !HbsMixin) {
    console.error("[perceived-reality] ApplicationV2 unavailable; Moment Builder disabled.");
    return;
  }

  const ROWS = ["transition", "narration", "sound", "fx", "state"];
  const ROW_TYPES = { transition: ["transition"], narration: ["narration"], sound: ["sound"], fx: ["fx"], state: ["perception", "object", "atmosphere", "disguise"] };

  const ZOOM_STEPS = [8, 16, 40, 80, 160];
  const ZOOM_DEFAULT = 40;
  const TICK_STEPS = [0.5, 1, 2, 5, 10];
  const TICK_MIN_PX = 44;
  const TL_PAD_PX = 320;
  const TL_GUTTER_PX = 90;
  const TL_MIN_SEC = 10;
  const DRAG_EDGE_PX = 48;
  const DRAG_SCROLL_PX = 14;

  function visibleRows(moment) {
    if (prFxAvailable()) return ROWS;
    if ((moment.clips ?? []).some(c => c.type === "fx")) return ROWS;
    return ROWS.filter(r => r !== "fx");
  }

  function loc(key) { return game.i18n.localize(`perceived-reality.Moments.${key}`); }

  function resolveDialogClass() {
    return foundry.applications?.api?.DialogV2;
  }

  async function confirmDelete(titleKey, contentHtml) {
    const DialogClass = resolveDialogClass();
    return await DialogClass.wait({
      classes: ["pr-mb-dialog"],
      window: { title: loc(titleKey) },
      content: contentHtml,
      buttons: [
        { action: "delete", label: loc("CatalogDelete"), icon: "fa-solid fa-trash", callback: () => true },
        { action: "cancel", label: loc("CatalogDeleteCancel"), icon: "fa-solid fa-xmark", default: true, callback: () => false }
      ],
      rejectClose: false
    });
  }

  function mkEl(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function mkIconButton(icon, label, tone) {
    const btn = document.createElement("button");
    btn.type = "button";
    if (tone) btn.dataset.tone = tone;
    btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${label}`;
    return btn;
  }

  function mkSelect(options, value, onChange) {
    const s = document.createElement("select");
    for (const [v, label] of options) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      if (v === value) o.selected = true;
      s.appendChild(o);
    }
    s.addEventListener("change", () => onChange(s.value));
    return s;
  }

  function mkField(label, control) {
    const wrap = mkEl("div", "pr-mb-field");
    wrap.appendChild(mkEl("label", "", label));
    wrap.appendChild(control);
    return wrap;
  }

  function mkRange(label, min, max, step, value, unit, onChange) {
    const wrap = mkEl("div", "pr-mb-field");
    const head = mkEl("label");
    const val = mkEl("span", "pr-mb-range-val", value + unit);
    head.textContent = label + " ";
    head.appendChild(val);
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.addEventListener("input", () => {
      val.textContent = input.value + unit;
      onChange(parseFloat(input.value));
    });
    wrap.appendChild(head);
    wrap.appendChild(input);
    return wrap;
  }

  function mkColor(label, value, onChange) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = value;
    input.addEventListener("input", () => onChange(input.value));
    return mkField(label, input);
  }

  function groupOptions() {
    return PR_PERCEPTION_GROUPS.map(g => [g.id, prGetGroupLabel(g.id)]);
  }

  class PRMomentBuilder extends HbsMixin(AppV2) {
    static DEFAULT_OPTIONS = {
      id: "pr-moment-builder",
      classes: ["pr-moment-builder"],
      window: { title: "perceived-reality.Moments.BuilderTitle", resizable: true },
      position: { width: 1000, height: 660 }
    };

    static PARTS = {
      body: { template: "modules/perceived-reality/templates/moment-builder.hbs" }
    };

    constructor(pickerScene, options = {}, groupSceneId, initialMomentId) {
      super(options);
      this._scene = pickerScene;
      this._groupSceneId = groupSceneId !== undefined ? groupSceneId : (pickerScene?.id ?? null);
      this._moments = prGetMomentsForScene(this._groupSceneId);
      if (!this._moments.length) this._moments.push(prNewMoment(this._groupSceneId));
      this._mi = 0;
      if (initialMomentId) {
        const idx = this._moments.findIndex(m => m.id === initialMomentId);
        if (idx !== -1) this._mi = idx;
      }
      this._selId = null;
      this._pps = ZOOM_DEFAULT;
      this._tlScrollLeft = 0;
      window.prViewAsOverride = { mode: "all" };
    }

    async _onClose(options) {
      window.prViewAsOverride = { mode: "all" };
      prApplyAtmosphereFromScene();
      return super._onClose(options);
    }

    get momentData() { return this._moments[this._mi]; }

    async _prepareContext() { return {}; }

    _onRender() {
      this._root = this.element.querySelector(".pr-mb-root");
      this._build();
      if (!this._didInitialFit) {
        this._didInitialFit = true;
        if (this._applyFit()) this._build();
      }
    }

    _rebuild() {
      const scroller = this._root?.querySelector(".pr-mb-timeline-scroll");
      if (scroller) this._tlScrollLeft = scroller.scrollLeft;
      this._saveInspectorScroll();
      this._build();
    }

    _saveInspectorScroll() {
      const insp = this._root?.querySelector(".pr-mb-inspector");
      if (insp) {
        this._inspScrollTop = insp.scrollTop;
        this._inspScrollClip = this._inspBuiltFor ?? null;
      }
    }

    _restoreInspectorScroll() {
      const insp = this._root?.querySelector(".pr-mb-inspector");
      if (!insp) return;
      insp.scrollTop = this._inspScrollClip === this._selId ? (this._inspScrollTop ?? 0) : 0;
    }

    _build() {
      const root = this._root;
      if (!root) return;
      root.innerHTML = "";
      root.appendChild(this._buildToolbar());
      root.appendChild(this._buildPalette());
      const main = mkEl("div", "pr-mb-main");
      const timelineWrap = mkEl("div", "pr-mb-timeline-wrap");
      timelineWrap.appendChild(this._buildTimeline());
      timelineWrap.appendChild(this._buildZoomStepper());
      main.appendChild(timelineWrap);
      main.appendChild(this._buildInspector());
      root.appendChild(main);

      const scroller = root.querySelector(".pr-mb-timeline-scroll");
      if (scroller) scroller.scrollLeft = this._tlScrollLeft;
      this._restoreInspectorScroll();
    }

    _buildToolbar() {
      const bar = mkEl("div", "pr-mb-toolbar");
      const moment = this.momentData;

      const left = mkEl("div", "pr-mb-toolbar-left");

      const groupScene = this._groupSceneId ? game.scenes.get(this._groupSceneId) : null;
      const groupLabel = mkEl("div", "pr-mb-group-label", groupScene?.name ?? loc("CatalogUnassigned"));
      groupLabel.title = loc("GroupLabelHint");
      left.appendChild(groupLabel);

      const momentSel = mkSelect(
        this._moments.map((m, i) => [String(i), m.name]),
        String(this._mi),
        v => { this._mi = parseInt(v); this._selId = null; this._applyFit(); this._rebuild(); }
      );
      momentSel.classList.add("pr-mb-moment-pick");
      left.appendChild(momentSel);

      left.appendChild(mkEl("div", "pr-mb-toolbar-divider"));

      const identity = mkEl("div", "pr-mb-toolbar-group");
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "pr-mb-name";
      nameInput.value = moment.name;
      nameInput.placeholder = loc("NamePlaceholder");
      identity.appendChild(nameInput);

      identity.appendChild(mkSelect(
        [["manual", loc("TriggerManual")], ["activation", loc("TriggerActivation")]],
        moment.trigger,
        v => { moment.trigger = v; }
      ));
      left.appendChild(identity);

      left.appendChild(mkEl("div", "pr-mb-toolbar-divider"));

      const preview = mkEl("div", "pr-mb-toolbar-group");
      preview.appendChild(this._buildViewAsField());
      left.appendChild(preview);

      bar.appendChild(left);

      const actions = mkEl("div", "pr-mb-toolbar-actions");

      const btnRun = mkIconButton("fa-play", loc("Run"), "positive");
      btnRun.addEventListener("click", async () => {
        await prSaveMomentsForScene(this._groupSceneId, this._moments);
        prRunMoment(foundry.utils.deepClone(this.momentData), this._scene);
        this._animatePlayhead();
      });
      actions.appendChild(btnRun);

      const btnCatalog = mkIconButton("fa-table-cells-large", loc("Catalog"));
      btnCatalog.addEventListener("click", () => prOpenMomentCatalog());
      actions.appendChild(btnCatalog);

      actions.appendChild(mkEl("div", "pr-mb-toolbar-divider"));

      const btnNew = mkIconButton("fa-plus", loc("NewMoment"));
      btnNew.addEventListener("click", () => {
        this._moments.push(prNewMoment(this._groupSceneId));
        this._mi = this._moments.length - 1;
        this._selId = null;
        this._applyFit();
        this._rebuild();
      });
      actions.appendChild(btnNew);

      const btnSave = mkIconButton("fa-floppy-disk", loc("Save"), "positive");
      btnSave.addEventListener("click", async () => {
        await prSaveMomentsForScene(this._groupSceneId, this._moments);
        ui.notifications.info(loc("Notify.Saved"));
      });
      actions.appendChild(btnSave);

      const btnDelete = mkIconButton("fa-trash", loc("DeleteMoment"), "danger");
      btnDelete.addEventListener("click", async () => {
        const confirmed = await confirmDelete("CatalogDeleteTitle", `<p>${game.i18n.format("perceived-reality.Moments.CatalogDeleteContent", { name: this.momentData.name })}</p>`);
        if (!confirmed) return;
        this._moments.splice(this._mi, 1);
        if (!this._moments.length) this._moments.push(prNewMoment(this._groupSceneId));
        this._mi = Math.max(0, this._mi - 1);
        this._selId = null;
        this._rebuild();
      });
      actions.appendChild(btnDelete);

      actions.appendChild(mkEl("div", "pr-mb-toolbar-divider"));

      const btnClear = mkIconButton("fa-broom", loc("ClearEffects"));
      btnClear.title = loc("ClearEffectsHint");
      btnClear.addEventListener("click", () => prClearAllMomentEffects());
      actions.appendChild(btnClear);

      const btnClearPerception = mkIconButton("fa-eye-low-vision", loc("ClearPerception"));
      btnClearPerception.title = loc("ClearPerceptionHint");
      btnClearPerception.addEventListener("click", () => prClearAllPerceptionState());
      actions.appendChild(btnClearPerception);

      const btnClearDisguises = mkIconButton("fa-user-secret", loc("ClearDisguises"));
      btnClearDisguises.title = loc("ClearDisguisesHint");
      btnClearDisguises.addEventListener("click", () => prClearAllDisguises());
      actions.appendChild(btnClearDisguises);

      bar.appendChild(actions);

      nameInput.addEventListener("change", () => {
        moment.name = nameInput.value || loc("NewMomentName");
        momentSel.options[this._mi].textContent = moment.name;
      });

      return bar;
    }

    _buildViewAsField() {
      const wrap = mkEl("div", "pr-mb-viewas");
      const icon = mkEl("i", "fa-solid fa-eye pr-mb-viewas-icon");
      wrap.appendChild(icon);

      const current = window.prViewAsOverride?.mode === "token" ? window.prViewAsOverride.tokenId : "all";
      const options = [["all", loc("ViewAsAll")]].concat(
        this._scene.tokens.contents.map(t => [t.id, t.name])
      );
      const select = mkSelect(options, current, v => {
        window.prViewAsOverride = v === "all" ? { mode: "all" } : { mode: "token", tokenId: v };
        prApplyAtmosphereFromScene();
        prRefreshTokenDisguises();
      });
      select.title = loc("ViewAsHint");
      wrap.appendChild(select);
      return wrap;
    }

    _zoomIndex() {
      let best = 0;
      for (let i = 1; i < ZOOM_STEPS.length; i++) {
        if (Math.abs(ZOOM_STEPS[i] - this._pps) < Math.abs(ZOOM_STEPS[best] - this._pps)) best = i;
      }
      return best;
    }

    _buildZoomStepper() {
      const wrap = mkEl("div", "pr-mb-zoomstep");
      const at = this._zoomIndex();

      const btnOut = mkEl("button", "pr-mb-zoom-btn");
      btnOut.innerHTML = '<i class="fa-solid fa-minus"></i>';
      btnOut.title = loc("ZoomOut");
      btnOut.disabled = at <= 0;

      const step = this._tickInterval();
      const label = mkEl("span", "pr-mb-zoom-label",
        game.i18n.format("perceived-reality.Moments.ZoomTick", { n: step < 1 ? step.toFixed(1) : String(step) }));
      label.title = loc("ZoomTickHint");

      const btnIn = mkEl("button", "pr-mb-zoom-btn");
      btnIn.innerHTML = '<i class="fa-solid fa-plus"></i>';
      btnIn.title = loc("ZoomIn");
      btnIn.disabled = at >= ZOOM_STEPS.length - 1;

      const btnReset = mkEl("button", "pr-mb-zoom-btn");
      btnReset.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
      btnReset.title = loc("ZoomReset");

      const applyZoom = (i) => {
        this._pps = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, i))];
        this._rebuild();
      };

      btnOut.addEventListener("click", () => applyZoom(at - 1));
      btnIn.addEventListener("click", () => applyZoom(at + 1));
      btnReset.addEventListener("click", () => applyZoom(ZOOM_STEPS.indexOf(ZOOM_DEFAULT)));

      wrap.appendChild(btnOut);
      wrap.appendChild(label);
      wrap.appendChild(btnIn);
      wrap.appendChild(btnReset);
      return wrap;
    }

    _buildPalette() {
      const pal = mkEl("div", "pr-mb-palette");
      const types = ["transition", "narration", "sound", "perception", "object", "atmosphere", "disguise"];
      if (prFxAvailable()) types.splice(3, 0, "fx");
      for (const type of types) {
        const btn = mkEl("button", "pr-mb-add pr-mb-add-" + type, "+ " + loc("Add." + type));
        btn.title = loc("AddHint." + type);
        btn.addEventListener("click", () => {
          const clip = prNewClip(type);
          const row = PR_CLIP_ROW[type];
          let end = 0;
          for (const c of this.momentData.clips) {
            if (PR_CLIP_ROW[c.type] === row) end = Math.max(end, c.start + Math.max(c.dur, 0.5));
          }
          clip.start = prSnapTime(end);
          this.momentData.clips.push(clip);
          this._selId = clip.id;
          this._rebuild();
        });
        pal.appendChild(btn);
      }
      return pal;
    }

    _padSeconds() {
      return Math.max(2, TL_PAD_PX / this._pps);
    }

    _timelineWidth() {
      const dur = Math.max(TL_MIN_SEC, prMomentDuration(this.momentData) + this._padSeconds());
      return Math.ceil(dur * 2) / 2 * this._pps;
    }

    _applyTimelineWidth() {
      const width = this._timelineWidth();
      const tl = this._root?.querySelector(".pr-mb-timeline");
      if (tl) tl.style.width = (width + TL_GUTTER_PX) + "px";
      for (const el of this._root?.querySelectorAll(".pr-mb-ruler-track, .pr-mb-lane") ?? []) {
        el.style.width = width + "px";
      }
    }

    _tickInterval() {
      for (const step of TICK_STEPS) {
        if (step * this._pps >= TICK_MIN_PX) return step;
      }
      return TICK_STEPS[TICK_STEPS.length - 1];
    }

    _fitZoom() {
      const scroller = this._root?.querySelector(".pr-mb-timeline-scroll");
      const avail = (scroller?.clientWidth ?? 0) - TL_GUTTER_PX;
      if (avail <= 0) return null;
      const content = prMomentDuration(this.momentData);
      const byContent = content > 0 ? avail / content : Infinity;
      const want = Math.min(byContent, ZOOM_DEFAULT);
      let pick = ZOOM_STEPS[0];
      for (const s of ZOOM_STEPS) if (s <= want) pick = s;
      return pick;
    }

    _applyFit() {
      const pps = this._fitZoom();
      if (!pps || pps === this._pps) return false;
      this._pps = pps;
      return true;
    }

    _autoScrollDrag(clientX) {
      const scroller = this._root?.querySelector(".pr-mb-timeline-scroll");
      if (!scroller) return;
      const r = scroller.getBoundingClientRect();
      if (clientX > r.right - DRAG_EDGE_PX) scroller.scrollLeft += DRAG_SCROLL_PX;
      else if (clientX < r.left + DRAG_EDGE_PX) scroller.scrollLeft -= DRAG_SCROLL_PX;
    }

    _computeLanes(clips, isMarker) {
      if (isMarker) return { laneOf: new Map(clips.map(c => [c.id, 0])), laneCount: 1 };
      const items = clips.map(c => ({
        clip: c,
        s: c.start,
        e: c.start + Math.max(c.dur, 0.001)
      })).sort((a, b) => a.s - b.s || a.e - b.e);

      const laneEnds = [];
      const laneOf = new Map();
      for (const item of items) {
        let lane = laneEnds.findIndex(end => end <= item.s + 1e-6);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(item.e); }
        else laneEnds[lane] = item.e;
        laneOf.set(item.clip.id, lane);
      }
      return { laneOf, laneCount: Math.max(1, laneEnds.length) };
    }

    _buildTimeline() {
      const scroll = mkEl("div", "pr-mb-timeline-scroll");
      const tl = mkEl("div", "pr-mb-timeline");
      const width = this._timelineWidth();
      tl.style.width = (width + 90) + "px";

      const ruler = mkEl("div", "pr-mb-ruler");
      ruler.appendChild(mkEl("div", "pr-mb-row-label", ""));
      const rulerTrack = mkEl("div", "pr-mb-ruler-track");
      rulerTrack.style.width = width + "px";
      const seconds = width / this._pps;
      const tickStep = this._tickInterval();
      for (let i = 0; i * tickStep <= seconds; i++) {
        const t = i * tickStep;
        const tick = mkEl("div", "pr-mb-tick", tickStep < 1 ? t.toFixed(1) : String(t));
        tick.style.left = (t * this._pps) + "px";
        rulerTrack.appendChild(tick);
      }
      ruler.appendChild(rulerTrack);
      tl.appendChild(ruler);

      for (const row of visibleRows(this.momentData)) {
        const isMarkerRow = row === "state";
        const rowClips = this.momentData.clips.filter(c => PR_CLIP_ROW[c.type] === row);
        const { laneOf, laneCount } = this._computeLanes(rowClips, isMarkerRow);

        const rowEl = mkEl("div", "pr-mb-row pr-mb-row-" + row);
        rowEl.appendChild(mkEl("div", "pr-mb-row-label", loc("Rows." + row)));
        const track = mkEl("div", "pr-mb-lane");
        track.style.width = width + "px";
        track.style.height = (laneCount * PR_LANE_PX) + "px";
        track.style.backgroundSize = (this._pps / 2) + "px 100%";

        for (const clip of rowClips) {
          track.appendChild(this._buildClipEl(clip, laneOf.get(clip.id) ?? 0));
        }
        rowEl.appendChild(track);
        tl.appendChild(rowEl);
      }

      const playhead = mkEl("div", "pr-mb-playhead");
      playhead.style.display = "none";
      tl.appendChild(playhead);
      this._playheadEl = playhead;

      scroll.appendChild(tl);
      return scroll;
    }

    _clipAudienceSuffix(clip) {
      const cfg = clip.config;
      if (clip.type === "narration") {
        const groups = Object.keys(cfg.perGroup ?? {});
        if (!groups.length) return "";
        return " (" + loc("Inspector.AudienceDiverges") + ": " + groups.map(g => prGetGroupLabel(g)).join(", ") + ")";
      }
      if (clip.type === "transition" || clip.type === "sound" || clip.type === "fx") {
        if (!cfg.audience || cfg.audience === "all") return "";
        const key = cfg.audience === "perceivers" ? "Inspector.AudiencePerceivers" : "Inspector.AudienceOthers";
        return " (" + prGetGroupLabel(cfg.group) + ": " + loc(key) + ")";
      }
      return "";
    }

    _clipLabel(clip) {
      let base;
      if (clip.type === "transition") base = game.i18n.localize(PR_TRANSITIONS[clip.config.style]?.labelKey ?? "");
      else if (clip.type === "narration") base = loc("Add.narration");
      else if (clip.type === "sound") {
        const path = clip.config.path ?? "";
        base = path ? path.split("/").pop() : loc("Add.sound");
      } else if (clip.type === "fx") {
        const cfg = clip.config;
        if (cfg.mode === "preset") base = cfg.preset || loc("Add.fx");
        else {
          const types = cfg.mode === "filter" ? prFxFilterTypes() : prFxParticleTypes();
          base = types.find(t => t[0] === cfg.type)?.[1] ?? loc("Add.fx");
        }
      } else if (clip.type === "perception") return loc("Add.perception") + ": " + prGetGroupLabel(clip.config.group);
      else if (clip.type === "object") return loc("Add.object") + ": " + prGetGroupLabel(clip.config.group);
      else if (clip.type === "atmosphere") return loc("Add.atmosphere") + ": " + prGetGroupLabel(clip.config.group);
      else if (clip.type === "disguise") return loc("Add.disguise") + ": " + prGetGroupLabel(clip.config.group);
      else return clip.type;
      return base + this._clipAudienceSuffix(clip);
    }

    _buildClipEl(clip, laneIdx) {
      const isMarker = PR_CLIP_ROW[clip.type] === "state";
      const el = mkEl("div", isMarker ? "pr-mb-marker pr-mb-marker-" + clip.type : "pr-mb-clip pr-mb-clip-" + clip.type);
      el.dataset.clipId = clip.id;
      el.style.left = (clip.start * this._pps) + "px";
      const top = laneIdx * PR_LANE_PX + (isMarker ? 12 : 6);
      el.style.top = top + "px";
      if (!isMarker) el.style.width = Math.max(12, clip.dur * this._pps) + "px";
      if (clip.id === this._selId) el.classList.add("pr-mb-selected");
      el.title = this._clipLabel(clip);

      if (!isMarker) {
        el.appendChild(mkEl("span", "pr-mb-clip-label", this._clipLabel(clip)));
        if (clip.type === "transition") {
          const band = mkEl("div", "pr-mb-covered");
          band.style.left = "45%";
          band.style.width = "20%";
          el.appendChild(band);
        }
        const handle = mkEl("div", "pr-mb-resize");
        el.appendChild(handle);
      }

      el.addEventListener("pointerdown", (e) => this._onClipPointerDown(e, clip, el, isMarker));

      if (clip.type === "atmosphere" && clip.config?.autoEnd > 0) {
        const frag = document.createDocumentFragment();
        frag.appendChild(el);

        const endLine = mkEl("div", "pr-mb-marker-endline");
        endLine.style.left = (clip.start * this._pps) + "px";
        endLine.style.top = (top + 7) + "px";
        endLine.style.width = (clip.config.autoEnd * this._pps) + "px";
        frag.appendChild(endLine);

        const endDot = mkEl("div", "pr-mb-marker-enddot");
        endDot.style.left = ((clip.start + clip.config.autoEnd) * this._pps) + "px";
        endDot.style.top = (top + 3) + "px";
        frag.appendChild(endDot);

        return frag;
      }

      return el;
    }

    _onClipPointerDown(e, clip, el, isMarker) {
      e.preventDefault();
      e.stopPropagation();
      if (this._selId !== clip.id) {
        this._selId = clip.id;
        this._rebuild();
        el = this._root.querySelector(`[data-clip-id="${clip.id}"]`);
        if (!el) return;
      }

      const resize = !isMarker && e.target.classList.contains("pr-mb-resize");
      const scroller = this._root.querySelector(".pr-mb-timeline-scroll");
      const startX = e.clientX;
      const startScroll = scroller?.scrollLeft ?? 0;
      const origStart = clip.start;
      const origDur = clip.dur;
      const pps = this._pps;
      let moved = false;

      const onMove = (ev) => {
        this._autoScrollDrag(ev.clientX);
        const scrolled = (scroller?.scrollLeft ?? startScroll) - startScroll;
        const dt = ((ev.clientX - startX) + scrolled) / pps;
        if (Math.abs(ev.clientX - startX) > 2 || scrolled) moved = true;
        if (resize) {
          clip.dur = Math.max(0.5, prSnapTime(origDur + dt));
          el.style.width = Math.max(12, clip.dur * pps) + "px";
        } else {
          clip.start = prSnapTime(origStart + dt);
          el.style.left = (clip.start * pps) + "px";
        }
        this._applyTimelineWidth();
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (moved) this._rebuild();
        else this._rebuildInspector();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    }

    _rebuildInspector() {
      this._saveInspectorScroll();
      const old = this._root.querySelector(".pr-mb-inspector");
      if (old) old.replaceWith(this._buildInspector());
      this._restoreInspectorScroll();
    }

    _selectedClip() {
      return this.momentData.clips.find(c => c.id === this._selId) ?? null;
    }

    _buildInspector() {
      this._inspBuiltFor = this._selId;
      const panel = mkEl("div", "pr-mb-inspector");
      const clip = this._selectedClip();

      if (!clip) {
        panel.appendChild(mkEl("div", "pr-mb-inspector-empty", loc("Inspector.NoSelection")));
        return panel;
      }

      const head = mkEl("div", "pr-mb-inspector-head");

      const headTop = mkEl("div", "pr-mb-inspector-headtop");
      headTop.appendChild(mkEl("span", "pr-mb-inspector-title", loc("Add." + clip.type)));
      const btnDel = mkIconButton("fa-trash", loc("Inspector.Delete"), "danger");
      btnDel.classList.add("pr-mb-inspector-delete");
      btnDel.addEventListener("click", async () => {
        const confirmed = await confirmDelete("Inspector.DeleteConfirmTitle", `<p>${loc("Inspector.DeleteConfirmContent")}</p>`);
        if (!confirmed) return;
        const i = this.momentData.clips.findIndex(c => c.id === clip.id);
        if (i !== -1) this.momentData.clips.splice(i, 1);
        this._selId = null;
        this._rebuild();
      });
      headTop.appendChild(btnDel);
      head.appendChild(headTop);

      const headFields = mkEl("div", "pr-mb-inspector-headfields");

      const startInput = document.createElement("input");
      startInput.type = "number";
      startInput.min = "0";
      startInput.step = "0.5";
      startInput.value = clip.start;
      startInput.addEventListener("change", () => {
        clip.start = prSnapTime(parseFloat(startInput.value) || 0);
        this._rebuild();
      });
      headFields.appendChild(mkField(loc("Inspector.Start"), startInput));

      if (PR_CLIP_ROW[clip.type] !== "state") {
        const durInput = document.createElement("input");
        durInput.type = "number";
        durInput.min = "0.5";
        durInput.step = "0.5";
        durInput.value = clip.dur;
        durInput.addEventListener("change", () => {
          clip.dur = Math.max(0.5, prSnapTime(parseFloat(durInput.value) || 0.5));
          this._rebuild();
        });
        headFields.appendChild(mkField(loc("Inspector.Duration"), durInput));
      } else if (clip.type === "atmosphere") {
        const endInput = document.createElement("input");
        endInput.type = "number";
        endInput.min = "0";
        endInput.step = "0.5";
        endInput.value = clip.config.autoEnd || "";
        endInput.placeholder = loc("Inspector.AtmoAutoEndNever");
        endInput.addEventListener("change", () => {
          clip.config.autoEnd = Math.max(0, prSnapTime(parseFloat(endInput.value) || 0));
          this._rebuild();
        });
        headFields.appendChild(mkField(loc("Inspector.AtmoAutoEnd"), endInput));
      }

      head.appendChild(headFields);
      panel.appendChild(head);

      const grid = mkEl("div", "pr-mb-inspector-grid");
      panel.appendChild(grid);
      const cfg = clip.config;

      if (clip.type === "transition") {
        const styleOptions = Object.keys(PR_TRANSITIONS).map(id => [id, game.i18n.localize(PR_TRANSITIONS[id].labelKey)]);
        grid.appendChild(mkField(loc("Inspector.Style"), mkSelect(styleOptions, cfg.style, v => {
          const t = PR_TRANSITIONS[v];
          Object.assign(cfg, { style: v, c1: t.c1, c2: t.c2, count: t.count, blur: t.blur, intensity: t.intensity });
          this._rebuild();
        })));
        this._appendAudienceFields(grid, cfg);
        grid.appendChild(mkColor(loc("Inspector.PrimaryColor"), cfg.c1, v => { cfg.c1 = v; }));
        grid.appendChild(mkColor(loc("Inspector.BackdropColor"), cfg.c2, v => { cfg.c2 = v; }));
        grid.appendChild(mkRange(loc("Inspector.Particles"), 0, 70, 1, cfg.count, "", v => { cfg.count = v; }));
        grid.appendChild(mkRange(loc("Inspector.SceneBlur"), 0, 14, 1, cfg.blur, "px", v => { cfg.blur = v; }));
        grid.appendChild(mkRange(loc("Inspector.Intensity"), 20, 100, 5, cfg.intensity, "%", v => { cfg.intensity = v; }));
      } else if (clip.type === "narration") {
        const taDefault = document.createElement("textarea");
        taDefault.value = cfg.textDefault ?? "";
        taDefault.addEventListener("input", () => { cfg.textDefault = taDefault.value; });
        grid.appendChild(mkField(loc("Inspector.Text"), taDefault));

        const perGroup = cfg.perGroup ?? (cfg.perGroup = {});
        const overridesWrap = mkEl("div", "pr-mb-field pr-mb-narration-overrides");
        overridesWrap.appendChild(mkEl("label", "", loc("Inspector.GroupOverrides")));

        for (const group of PR_PERCEPTION_GROUPS) {
          if (!(group.id in perGroup)) continue;
          const row = mkEl("div", "pr-mb-narration-override-row");
          row.appendChild(mkEl("span", "pr-mb-narration-override-label", prGetGroupLabel(group.id)));
          const ta = document.createElement("textarea");
          ta.value = perGroup[group.id];
          ta.addEventListener("input", () => { perGroup[group.id] = ta.value; });
          row.appendChild(ta);
          const btnRemove = mkIconButton("fa-xmark", "", "danger");
          btnRemove.title = loc("Inspector.RemoveOverride");
          btnRemove.addEventListener("click", () => {
            delete perGroup[group.id];
            this._rebuildInspector();
          });
          row.appendChild(btnRemove);
          overridesWrap.appendChild(row);
        }

        const remaining = PR_PERCEPTION_GROUPS.filter(g => !(g.id in perGroup));
        if (remaining.length) {
          const addRow = mkEl("div", "pr-mb-narration-add-row");
          const sel = mkSelect(remaining.map(g => [g.id, prGetGroupLabel(g.id)]), remaining[0].id, () => {});
          addRow.appendChild(sel);
          const btnAdd = mkIconButton("fa-plus", loc("Inspector.AddOverride"));
          btnAdd.addEventListener("click", () => {
            perGroup[sel.value] = "";
            this._rebuildInspector();
          });
          addRow.appendChild(btnAdd);
          overridesWrap.appendChild(addRow);
        }

        grid.appendChild(overridesWrap);
      } else if (clip.type === "sound") {
        const pathWrap = mkEl("div", "pr-mb-field pr-mb-path");
        pathWrap.appendChild(mkEl("label", "", loc("Inspector.SoundPath")));
        const pathRow = mkEl("div", "pr-mb-path-row");
        const pathInput = document.createElement("input");
        pathInput.type = "text";
        pathInput.value = cfg.path;
        pathInput.addEventListener("change", () => { cfg.path = pathInput.value; });
        const browse = mkEl("button", "", loc("Inspector.Browse"));
        browse.addEventListener("click", () => {
          const FP = foundry.applications?.apps?.FilePicker?.implementation
            ?? foundry.applications?.apps?.FilePicker
            ?? FilePicker;
          const picker = new FP({
            type: "audio",
            current: cfg.path,
            callback: (path) => { cfg.path = path; pathInput.value = path; }
          });
          picker.browse();
        });
        pathRow.appendChild(pathInput);
        pathRow.appendChild(browse);
        pathWrap.appendChild(pathRow);
        grid.appendChild(pathWrap);
        grid.appendChild(mkRange(loc("Inspector.Volume"), 0, 100, 5, Math.round((cfg.volume ?? 0.8) * 100), "%", v => { cfg.volume = v / 100; }));
        grid.appendChild(mkField(loc("Inspector.Loop"), mkSelect([["no", loc("Inspector.LoopOff")], ["yes", loc("Inspector.LoopOn")]], cfg.loop ? "yes" : "no", v => { cfg.loop = v === "yes"; })));
        this._appendAudienceFields(grid, cfg);
      } else if (clip.type === "fx") {
        if (!prFxAvailable()) {
          grid.appendChild(mkEl("div", "pr-mb-fx-missing", loc("Inspector.FxMissing")));
        } else {
          const modeOptions = [["preset", loc("Inspector.FxModePreset")]];
          if (prFxParticleTypes().length) modeOptions.push(["particle", loc("Inspector.FxModeParticle")]);
          if (prFxFilterTypes().length) modeOptions.push(["filter", loc("Inspector.FxModeFilter")]);
          grid.appendChild(mkField(loc("Inspector.FxMode"), mkSelect(modeOptions, cfg.mode, v => {
            cfg.mode = v;
            cfg.type = "";
            cfg.options = {};
            if (v === "preset") cfg.audience = "all";
            this._rebuild();
          })));

          if (cfg.mode === "preset") {
            const presets = prFxPresetList();
            const presetOptions = [["", loc("Inspector.FxPickPreset")]].concat(presets.map(name => [name, name]));
            grid.appendChild(mkField(loc("Inspector.FxPreset"), mkSelect(presetOptions, cfg.preset, v => { cfg.preset = v; this._rebuild(); })));

            const dirOptions = [["", loc("Inspector.FxDefault")], ["n", "N"], ["ne", "NE"], ["e", "E"], ["se", "SE"], ["s", "S"], ["sw", "SW"], ["w", "W"], ["nw", "NW"]];
            grid.appendChild(mkField(loc("Inspector.FxDirection"), mkSelect(dirOptions, cfg.direction, v => { cfg.direction = v; })));

            const levelOptions = [["", loc("Inspector.FxDefault")], ["very-low", loc("Inspector.FxVeryLow")], ["low", loc("Inspector.FxLow")], ["medium", loc("Inspector.FxMedium")], ["high", loc("Inspector.FxHigh")], ["very-high", loc("Inspector.FxVeryHigh")]];
            grid.appendChild(mkField(loc("Inspector.FxSpeed"), mkSelect(levelOptions, cfg.speed, v => { cfg.speed = v; })));
            grid.appendChild(mkField(loc("Inspector.FxDensity"), mkSelect(levelOptions, cfg.density, v => { cfg.density = v; })));

            const colorRow = mkEl("div", "pr-mb-fx-color-row");
            const applyCb = document.createElement("input");
            applyCb.type = "checkbox";
            applyCb.checked = !!cfg.colorApply;
            applyCb.addEventListener("change", () => { cfg.colorApply = applyCb.checked; });
            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.value = cfg.color || "#ffffff";
            colorInput.addEventListener("input", () => { cfg.color = colorInput.value; cfg.colorApply = true; applyCb.checked = true; });
            colorRow.appendChild(applyCb);
            colorRow.appendChild(colorInput);
            grid.appendChild(mkField(loc("Inspector.FxColor"), colorRow));

            grid.appendChild(mkEl("div", "pr-mb-fx-note", loc("Inspector.FxPresetEveryone")));
          } else {
            const types = cfg.mode === "filter" ? prFxFilterTypes() : prFxParticleTypes();
            const typeOptions = [["", loc("Inspector.FxPickType")]].concat(types);
            grid.appendChild(mkField(loc("Inspector.FxType"), mkSelect(typeOptions, cfg.type, v => {
              cfg.type = v;
              cfg.options = v ? prFxDefaults(cfg.mode === "filter" ? "filter" : "particle", v) : {};
              this._rebuild();
            })));
            if (cfg.type) this._appendFxParamFields(grid, cfg);
            this._appendAudienceFields(grid, cfg);
          }
        }
      } else if (clip.type === "perception") {
        grid.appendChild(mkField(loc("Inspector.Action"), mkSelect([["grant", loc("Inspector.ActionGrant")], ["remove", loc("Inspector.ActionRemove")]], cfg.action, v => { cfg.action = v; })));
        grid.appendChild(mkField(loc("Inspector.Group"), mkSelect(groupOptions(), cfg.group, v => { cfg.group = v; })));
        grid.appendChild(this._buildTargetPicker(loc("Inspector.Tokens"), this._scene.tokens.contents.map(t => [t.id, t.name]), cfg.tokenIds, "token"));
      } else if (clip.type === "object") {
        grid.appendChild(mkField(loc("Inspector.TargetType"), mkSelect(
          [["token", loc("Inspector.Tokens")], ["tile", loc("Inspector.Tiles")], ["light", loc("Inspector.Lights")], ["wall", loc("Inspector.Doors")]],
          cfg.targetType,
          v => { cfg.targetType = v; cfg.ids = []; this._rebuildInspector(); }
        )));
        grid.appendChild(mkField(loc("Inspector.Action"), mkSelect([["add", loc("Inspector.ActionAdd")], ["remove", loc("Inspector.ActionRemoveGroup")]], cfg.action, v => { cfg.action = v; })));
        grid.appendChild(mkField(loc("Inspector.Group"), mkSelect(groupOptions(), cfg.group, v => { cfg.group = v; })));
        grid.appendChild(this._buildTargetPicker(loc("Inspector.Targets"), this._objectChoices(cfg.targetType), cfg.ids, cfg.targetType));
      } else if (clip.type === "atmosphere") {
        grid.appendChild(mkField(loc("Inspector.Group"), mkSelect(groupOptions(), cfg.group, v => { cfg.group = v; })));
        const presetOptions = Object.keys(PR_ATMO_PRESETS).map(id => [id, game.i18n.localize(PR_ATMO_PRESETS[id].labelKey)]);
        grid.appendChild(mkField(loc("Inspector.Preset"), mkSelect(presetOptions, cfg.preset, v => {
          const p = Object.assign({}, PR_ATMO_PRESETS[v]);
          delete p.labelKey;
          Object.assign(cfg, p, { preset: v });
          this._rebuildInspector();
        })));
        grid.appendChild(mkRange(loc("Inspector.Saturation"), 0, 200, 5, cfg.sat, "%", v => { cfg.sat = v; }));
        grid.appendChild(mkRange(loc("Inspector.Brightness"), 50, 150, 2, cfg.bright, "%", v => { cfg.bright = v; }));
        grid.appendChild(mkRange(loc("Inspector.HueShift"), -180, 180, 5, cfg.hue, "deg", v => { cfg.hue = v; }));
        const tintOn = cfg.tintOn ?? (cfg.tintA ?? 0) > 0;
        grid.appendChild(mkField(loc("Inspector.TintEnabled"), mkSelect([["off", loc("Inspector.LoopOff")], ["on", loc("Inspector.LoopOn")]], tintOn ? "on" : "off", v => { cfg.tintOn = v === "on"; this._rebuildInspector(); })));
        if (tintOn) {
          grid.appendChild(mkColor(loc("Inspector.TintColor"), cfg.tint, v => { cfg.tint = v; }));
          grid.appendChild(mkRange(loc("Inspector.TintStrength"), 0, 60, 2, cfg.tintA, "%", v => { cfg.tintA = v; }));
        }
        grid.appendChild(mkColor(loc("Inspector.VignetteColor"), cfg.vig, v => { cfg.vig = v; }));
        grid.appendChild(mkRange(loc("Inspector.VignetteStrength"), 0, 100, 5, cfg.vigS, "%", v => { cfg.vigS = v; }));
        grid.appendChild(mkField(loc("Inspector.Motes"), mkSelect([["off", loc("Inspector.LoopOff")], ["on", loc("Inspector.LoopOn")]], cfg.motes ? "on" : "off", v => { cfg.motes = v === "on"; })));
        grid.appendChild(mkColor(loc("Inspector.MoteColor"), cfg.moteC, v => { cfg.moteC = v; }));
        grid.appendChild(mkRange(loc("Inspector.MoteCount"), 0, 40, 1, cfg.moteCount ?? 14, "", v => { cfg.moteCount = v; }));
        grid.appendChild(mkField(loc("Inspector.MoteDirection"), mkSelect([
          ["up", loc("Inspector.MoteDirUp")],
          ["down", loc("Inspector.MoteDirDown")],
          ["angle", loc("Inspector.MoteDirAngle")]
        ], cfg.moteDir ?? "up", v => { cfg.moteDir = v; this._rebuildInspector(); })));
        if (cfg.moteDir === "angle") {
          grid.appendChild(mkRange(loc("Inspector.MoteAngle"), 0, 359, 1, cfg.moteAngle ?? 0, "deg", v => { cfg.moteAngle = v; }));
        }
      } else if (clip.type === "disguise") {
        grid.appendChild(mkField(loc("Inspector.Action"), mkSelect([["set", loc("Inspector.ActionSet")], ["unset", loc("Inspector.ActionUnset")]], cfg.action, v => { cfg.action = v; this._rebuildInspector(); })));
        grid.appendChild(mkField(loc("Inspector.Group"), mkSelect(groupOptions(), cfg.group, v => { cfg.group = v; })));
        grid.appendChild(mkEl("p", "pr-mb-hint-small", loc("Inspector.DisguiseGroupHint")));

        if (cfg.action === "unset") {
          const allRow = mkEl("div", "pr-mb-opt-row");
          const allInput = document.createElement("input");
          allInput.type = "checkbox";
          allInput.checked = !!cfg.allTokens;
          allInput.addEventListener("change", () => { cfg.allTokens = allInput.checked; this._rebuildInspector(); });
          allRow.appendChild(allInput);
          allRow.appendChild(mkEl("span", "", loc("Inspector.DisguiseUnsetAll")));
          grid.appendChild(allRow);
        }

        if (!(cfg.action === "unset" && cfg.allTokens)) {
          grid.appendChild(this._buildTargetPicker(loc("Inspector.Tokens"), this._scene.tokens.contents.map(t => [t.id, t.name]), cfg.tokenIds, "token"));
        }

        if (cfg.action === "set") {
          const appearanceWrap = mkEl("div", "pr-mb-field pr-mb-disguise-appearance");
          appearanceWrap.appendChild(mkEl("label", "", game.i18n.localize("perceived-reality.Disguise.Appearance")));
          const picker = prBuildActorPicker({
            initialImg: cfg.img,
            initialName: cfg.name,
            onPick: (picked) => { cfg.img = picked.img; cfg.name = picked.name; },
            onClear: () => { cfg.img = ""; cfg.name = ""; }
          });
          appearanceWrap.appendChild(picker);
          grid.appendChild(appearanceWrap);

          const hideRow = mkEl("div", "pr-mb-opt-row");
          const hideInput = document.createElement("input");
          hideInput.type = "checkbox";
          hideInput.checked = !!cfg.hideNameplate;
          hideInput.addEventListener("change", () => { cfg.hideNameplate = hideInput.checked; });
          hideRow.appendChild(hideInput);
          hideRow.appendChild(mkEl("span", "", game.i18n.localize("perceived-reality.Disguise.HideNameplate")));
          grid.appendChild(hideRow);
          grid.appendChild(mkEl("p", "pr-mb-hint-small", game.i18n.localize("perceived-reality.Disguise.HideNameplateHint")));

          const dispRow = mkEl("div", "pr-mb-opt-row");
          const dispCheck = document.createElement("input");
          dispCheck.type = "checkbox";
          dispCheck.checked = !!cfg.disposition;
          dispRow.appendChild(dispCheck);
          dispRow.appendChild(mkEl("span", "", game.i18n.localize("perceived-reality.Disguise.ShowAsDisposition")));
          const dispSelect = document.createElement("select");
          for (const key of PR_DISPOSITION_KEYS) {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = prDispositionLabel(key);
            if (cfg.disposition === key) opt.selected = true;
            dispSelect.appendChild(opt);
          }
          dispSelect.disabled = !dispCheck.checked;
          dispRow.appendChild(dispSelect);
          const swatch = mkEl("span", "disp-swatch");
          dispRow.appendChild(swatch);
          const syncSwatch = () => {
            const color = CONFIG.Canvas.dispositionColors[dispSelect.value];
            swatch.style.background = color !== undefined ? "#" + color.toString(16).padStart(6, "0") : "transparent";
          };
          syncSwatch();
          dispCheck.addEventListener("change", () => {
            dispSelect.disabled = !dispCheck.checked;
            cfg.disposition = dispCheck.checked ? dispSelect.value : "";
          });
          dispSelect.addEventListener("change", () => { syncSwatch(); if (dispCheck.checked) cfg.disposition = dispSelect.value; });
          grid.appendChild(dispRow);
        }
      }

      return panel;
    }

    _appendFxParamFields(grid, cfg) {
      const params = prFxParams(cfg.mode === "filter" ? "filter" : "particle", cfg.type);
      for (const [key, def] of Object.entries(params)) {
        const label = def?.label ? game.i18n.localize(def.label) : key;
        const current = cfg.options[key] !== undefined ? cfg.options[key] : def?.value;

        if (def?.type === "range") {
          grid.appendChild(mkRange(label, def.min ?? 0, def.max ?? 1, def.step ?? 0.1, Number(current ?? 0), "", v => { cfg.options[key] = v; }));
        } else if (def?.type === "checkbox") {
          grid.appendChild(mkField(label, mkSelect([["off", loc("Inspector.LoopOff")], ["on", loc("Inspector.LoopOn")]], current ? "on" : "off", v => { cfg.options[key] = v === "on"; })));
        } else if (def?.type === "color") {
          const cur = (current && typeof current === "object") ? Object.assign({ value: "#ffffff", apply: false }, current) : { value: "#ffffff", apply: false };
          cfg.options[key] = cur;
          const row = mkEl("div", "pr-mb-fx-color-row");
          const applyCb = document.createElement("input");
          applyCb.type = "checkbox";
          applyCb.checked = !!cur.apply;
          applyCb.addEventListener("change", () => { cur.apply = applyCb.checked; });
          const colorInput = document.createElement("input");
          colorInput.type = "color";
          colorInput.value = cur.value || "#ffffff";
          colorInput.addEventListener("input", () => { cur.value = colorInput.value; cur.apply = true; applyCb.checked = true; });
          row.appendChild(applyCb);
          row.appendChild(colorInput);
          grid.appendChild(mkField(label, row));
        } else if (def?.type === "select") {
          const opts = Object.entries(def.options ?? {}).map(([v, k]) => [v, game.i18n.localize(String(k))]);
          grid.appendChild(mkField(label, mkSelect(opts, String(current ?? ""), v => { cfg.options[key] = v; })));
        } else if (def?.type === "multi-select") {
          const selected = Array.isArray(current) ? current.slice() : [];
          cfg.options[key] = selected;
          const list = mkEl("div", "pr-mb-target-list");
          for (const [v, k] of Object.entries(def.options ?? {})) {
            const row = mkEl("label", "pr-mb-target-row");
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = selected.includes(v);
            cb.addEventListener("change", () => {
              const i = selected.indexOf(v);
              if (cb.checked && i === -1) selected.push(v);
              else if (!cb.checked && i !== -1) selected.splice(i, 1);
            });
            row.appendChild(cb);
            row.appendChild(mkEl("span", "", game.i18n.localize(String(k))));
            list.appendChild(row);
          }
          const wrap = mkEl("div", "pr-mb-field pr-mb-targets");
          wrap.appendChild(mkEl("label", "", label));
          wrap.appendChild(list);
          grid.appendChild(wrap);
        }
      }
    }

    _appendAudienceFields(grid, cfg) {
      grid.appendChild(mkField(loc("Inspector.Audience"), mkSelect(
        [["all", loc("Inspector.AudienceAll")], ["perceivers", loc("Inspector.AudiencePerceivers")], ["others", loc("Inspector.AudienceOthers")]],
        cfg.audience,
        v => { cfg.audience = v; this._rebuildInspector(); }
      )));
      if (cfg.audience !== "all") {
        grid.appendChild(mkField(loc("Inspector.Group"), mkSelect(groupOptions(), cfg.group, v => { cfg.group = v; })));
      }
    }

    _nearestTokenLabel(x, y) {
      const tokens = this._scene.tokens.contents;
      if (!tokens.length) return "";
      let best = null;
      let bestDist = Infinity;
      for (const t of tokens) {
        const dist = Math.hypot((t.x ?? 0) - x, (t.y ?? 0) - y);
        if (dist < bestDist) { bestDist = dist; best = t; }
      }
      return best ? " - " + loc("Inspector.Near") + " " + best.name : "";
    }

    _objectChoices(targetType) {
      if (targetType === "token") return this._scene.tokens.contents.map(t => [t.id, t.name]);
      if (targetType === "tile") {
        return this._scene.tiles.contents.map(t => {
          const src = t.texture?.src ?? "";
          const base = src ? src.split("/").pop() : t.id.slice(0, 8);
          const hint = src ? "" : this._nearestTokenLabel(t.x, t.y);
          return [t.id, base + hint];
        });
      }
      if (targetType === "light") {
        return this._scene.lights.contents.map(l => {
          const base = l.id.slice(0, 8) + " (" + Math.round(l.x) + ", " + Math.round(l.y) + ")";
          return [l.id, base + this._nearestTokenLabel(l.x, l.y)];
        });
      }
      return this._scene.walls.contents
        .filter(w => (w.door ?? 0) > 0)
        .map(w => [w.id, w.id.slice(0, 8) + " (" + (w.door === 2 ? loc("Inspector.SecretDoor") : loc("Inspector.Door")) + ")"]);
    }

    _prTargetPoint(targetType, doc) {
      if (targetType === "token") {
        const placeable = canvas.tokens?.get(doc.id);
        if (placeable) return placeable.center;
        const size = canvas.grid?.size ?? 100;
        return { x: doc.x + size / 2, y: doc.y + size / 2 };
      }
      if (targetType === "tile") {
        const placeable = canvas.tiles?.get(doc.id);
        if (placeable) return placeable.center;
        return { x: doc.x + (doc.width ?? 0) / 2, y: doc.y + (doc.height ?? 0) / 2 };
      }
      if (targetType === "light") return { x: doc.x, y: doc.y };
      const c = doc.c ?? [0, 0, 0, 0];
      return { x: (c[0] + c[2]) / 2, y: (c[1] + c[3]) / 2 };
    }

    _prLocateTarget(targetType, id) {
      if (!this._scene || canvas?.scene?.id !== this._scene.id) return;
      const collections = { token: this._scene.tokens, tile: this._scene.tiles, light: this._scene.lights, wall: this._scene.walls };
      const doc = collections[targetType]?.get(id);
      if (!doc) return;
      const point = this._prTargetPoint(targetType, doc);
      try {
        canvas.animatePan({ x: point.x, y: point.y, duration: 250 });
        const types = CONFIG.Canvas.pings.types;
        canvas.controls?.handlePing(game.user, point, { scene: canvas.scene.id, style: types.PULSE, zoom: canvas.stage.scale.x });
      } catch (err) {
        console.error("[perceived-reality] locate ping failed:", err);
      }
    }

    _buildTargetPicker(label, choices, selectedIds, targetType) {
      const wrap = mkEl("div", "pr-mb-field pr-mb-targets");
      wrap.appendChild(mkEl("label", "", label));
      const list = mkEl("div", "pr-mb-target-list");
      if (!choices.length) {
        list.appendChild(mkEl("div", "pr-mb-target-empty", loc("Inspector.NoTargets")));
      }
      const canLocate = !!targetType && this._scene && canvas?.scene?.id === this._scene.id;
      for (const [id, name] of choices) {
        const row = mkEl("div", "pr-mb-target-row");
        const cbLabel = mkEl("label", "pr-mb-target-cb-label");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = selectedIds.includes(id);
        cb.addEventListener("change", () => {
          const i = selectedIds.indexOf(id);
          if (cb.checked && i === -1) selectedIds.push(id);
          else if (!cb.checked && i !== -1) selectedIds.splice(i, 1);
        });
        cbLabel.appendChild(cb);
        cbLabel.appendChild(mkEl("span", "", name));
        row.appendChild(cbLabel);
        if (canLocate) {
          const btnLocate = mkIconButton("fa-crosshairs", "");
          btnLocate.classList.add("pr-mb-target-locate");
          btnLocate.title = loc("Inspector.Locate");
          btnLocate.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this._prLocateTarget(targetType, id);
          });
          row.appendChild(btnLocate);
        }
        list.appendChild(row);
      }
      wrap.appendChild(list);
      return wrap;
    }

    _animatePlayhead() {
      const playhead = this._playheadEl;
      if (!playhead) return;
      const total = prMomentDuration(this.momentData);
      if (total <= 0) return;
      const pps = this._pps;
      const startTime = performance.now();
      playhead.style.display = "block";

      const tick = (now) => {
        const t = (now - startTime) / 1000;
        if (t >= total || !playhead.isConnected) {
          playhead.style.display = "none";
          return;
        }
        playhead.style.left = (90 + t * pps) + "px";
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  window.PRMomentBuilderClass = PRMomentBuilder;
});

window.prOpenMomentBuilder = function(scene) {
  if (!game.user.isGM) return;
  scene = scene ?? canvas?.scene ?? game.scenes?.active;
  if (!scene) {
    ui.notifications.warn(game.i18n.localize("perceived-reality.Moments.Notify.NoScene"));
    return;
  }
  if (!window.PRMomentBuilderClass) return;
  new PRMomentBuilderClass(scene, {}, scene.id).render(true);
};

window.prOpenMomentBuilderForMoment = function(momentId) {
  if (!game.user.isGM) return;
  const moment = prGetMomentById(momentId);
  if (!moment) {
    ui.notifications.warn(game.i18n.localize("perceived-reality.Moments.Notify.MomentGone"));
    return;
  }
  const groupSceneId = moment.sceneId ?? null;
  const pickerScene = groupSceneId ? game.scenes.get(groupSceneId) : (canvas?.scene ?? game.scenes?.active);
  if (!pickerScene) {
    ui.notifications.warn(game.i18n.localize("perceived-reality.Moments.Notify.NoScene"));
    return;
  }
  if (!window.PRMomentBuilderClass) return;
  new PRMomentBuilderClass(pickerScene, {}, groupSceneId, momentId).render(true);
};
