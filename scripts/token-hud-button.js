// Track the currently open panel so we can restore it after HUD re-renders
let _prHudOpenPanel = null;
let _prHudPanelTokenId = null;
let _prHudPanelWasOpen = false;

function _prHudRemoveOpenPanel() {
  if (_prHudOpenPanel) {
    _prHudPanelWasOpen = _prHudOpenPanel.classList.contains("pr-panel-open");
    _prHudOpenPanel.remove();
    _prHudOpenPanel = null;
  } else {
    _prHudPanelWasOpen = false;
  }
}

Hooks.on("renderTokenHUD", function(hud, html, _data) {
  // GM / Assistant GM only
  if (!game.user.isGM) return;

  const el = html instanceof HTMLElement ? html : html[0];
  if (!el) return;

  // Guard against double injection
  if (el.querySelector(".pr-hud-btn")) return;

  const tokenDoc = hud.object?.document;
  if (!tokenDoc) return;

  // Row clicks re-render the HUD and kills the panel so reopen it after
  const reopenAfter = _prHudOpenPanel?.classList.contains("pr-panel-open")
    && _prHudPanelTokenId === tokenDoc.id;

  _prHudRemoveOpenPanel();
  _prHudPanelTokenId = tokenDoc.id;

  const currentGroups = _prHudReadViewerGroups(tokenDoc);
  const effectGroups = prGetActiveGroupsForToken(tokenDoc);

  const btn = document.createElement("div");
  btn.className = "control-icon pr-hud-btn" + ((currentGroups.size + effectGroups.size) > 0 ? " pr-hud-active" : "");
  btn.dataset.tooltip = game.i18n.localize("perceived-reality.HUD.ButtonTooltip");
  btn.innerHTML = '<i class="fa-solid fa-eye-low-vision"></i>';

  const leftCol = el.querySelector(".col.left");
  if (leftCol) leftCol.appendChild(btn);
  else el.appendChild(btn);

  const panel = _prHudBuildPanel(currentGroups, btn, tokenDoc, effectGroups);
  document.body.appendChild(panel);
  _prHudOpenPanel = panel;

  function positionPanel() {
    const rect = btn.getBoundingClientRect();
    panel.style.left = (rect.right + 6) + "px";
    panel.style.top = rect.top + "px";
  }

  function openPanel() {
    positionPanel();
    panel.classList.add("pr-panel-open");
    setTimeout(function() {
      document.addEventListener("click", onOutsideClick, true);
    }, 0);
  }

  function closePanel() {
    panel.classList.remove("pr-panel-open");
    document.removeEventListener("click", onOutsideClick, true);
  }

  function onOutsideClick(e) {
    if (!btn.contains(e.target) && !panel.contains(e.target)) {
      closePanel();
    }
  }

  if (reopenAfter) openPanel();

  btn.addEventListener("click", function(e) {
    e.stopPropagation();
    if (panel.classList.contains("pr-panel-open")) {
      closePanel();
    } else {
      openPanel();
    }
  });

  // Clean up when HUD closes for any reason
  Hooks.once("closeTokenHUD", function() {
    closePanel();
    _prHudRemoveOpenPanel();
  });
});

function _prHudReadViewerGroups(tokenDoc) {
  const flagGroups = tokenDoc.getFlag(PR_MODULE_ID, "viewerGroups");
  if (Array.isArray(flagGroups)) return new Set(flagGroups);

  // older builds stored picks only as detection modes
  const active = new Set();
  const raw = tokenDoc.detectionModes ?? {};

  if (Array.isArray(raw)) {
    // V13: [{ id, enabled, range }]
    for (const mode of raw) {
      if (!mode?.enabled) continue;
      const match = PR_PERCEPTION_GROUPS.find(g => prDetectionModeIdForGroup(g.id) === mode.id);
      if (match) active.add(match.id);
    }
  } else {
    // V14: { "mode-id": { enabled, range }, ... }
    for (const modeId of Object.keys(raw)) {
      if (!raw[modeId]?.enabled) continue;
      const match = PR_PERCEPTION_GROUPS.find(g => prDetectionModeIdForGroup(g.id) === modeId);
      if (match) active.add(match.id);
    }
  }

  for (const g of prGetActiveGroupsForToken(tokenDoc)) active.delete(g);
  return active;
}
window.prReadViewerGroups = _prHudReadViewerGroups;

function _prHudBuildPanel(currentGroups, btn, tokenDoc, effectGroups = new Set()) {
  const localGroups = new Set(currentGroups);

  const panel = document.createElement("div");
  panel.className = "pr-picker-panel";
  panel.style.position = "fixed";

  const title = document.createElement("div");
  title.className = "pr-picker-title";
  title.textContent = game.i18n.localize("perceived-reality.HUD.PanelTitle");
  panel.appendChild(title);

  const hint = document.createElement("div");
  hint.className = "pr-picker-hint";
  hint.textContent = game.i18n.localize("perceived-reality.HUD.PanelHint");
  panel.appendChild(hint);

  for (const group of PR_PERCEPTION_GROUPS) {
    const label = prGetGroupLabel(group.id);
    const isActive = localGroups.has(group.id);

    const row = document.createElement("div");
    row.className = "pr-picker-row" + (isActive ? " pr-active" : "");
    row.dataset.group = group.id;

    const img = document.createElement("img");
    img.src = group.icon;
    img.className = "pr-picker-icon";
    img.alt = "";

    const span = document.createElement("span");
    span.textContent = label;

    row.appendChild(img);
    row.appendChild(span);

    if (effectGroups.has(group.id)) {
      row.classList.add("pr-from-effect");
      row.dataset.tooltip = game.i18n.localize("perceived-reality.HUD.FromEffectHint");
      const badge = document.createElement("span");
      badge.className = "pr-picker-badge";
      badge.textContent = game.i18n.localize("perceived-reality.HUD.FromEffect");
      row.appendChild(badge);
    }

    row.addEventListener("click", async function(e) {
      e.stopPropagation();

      if (localGroups.has(group.id)) {
        localGroups.delete(group.id);
        row.classList.remove("pr-active");
      } else {
        localGroups.add(group.id);
        row.classList.add("pr-active");
      }
      btn.classList.toggle("pr-hud-active", (localGroups.size + effectGroups.size) > 0);

      await prCommitViewerGroups(tokenDoc, localGroups, { render: false });
    });

    panel.appendChild(row);
  }

  return panel;
}

// pf2e only accepts its own conditions so this set groups
function _prHudGridTakenOver() {
  return !!game.pf2e?.StatusEffects;
}

function _prHudGroupForStatus(statusId) {
  return PR_PERCEPTION_GROUPS.find(g => prStatusIdForGroup(g.id) === statusId) ?? null;
}

function _prHudMarkStatusGrid(grid) {
  const tokenDoc = canvas.tokens?.hud?.object?.document;
  if (!tokenDoc) return;
  const groups = _prHudReadViewerGroups(tokenDoc);
  for (const control of grid.querySelectorAll(".effect-control")) {
    const group = _prHudGroupForStatus(control.dataset.statusId);
    if (group) control.classList.toggle("active", groups.has(group.id));
  }
}

async function _prHudOnStatusGrid(event) {
  const control = event.target.closest?.(".effect-control");
  const group = control ? _prHudGroupForStatus(control.dataset.statusId) : null;
  if (!group) return;
  // capture the phase, ahead of the system's handler
  event.preventDefault();
  event.stopPropagation();

  const hudDoc = canvas.tokens?.hud?.object?.document;
  if (!hudDoc) return;
  const targets = (canvas.tokens?.controlled ?? []).map(t => t.document);
  if (!targets.includes(hudDoc)) targets.push(hudDoc);
  const add = (event.type === "click") && !_prHudReadViewerGroups(hudDoc).has(group.id);
  for (const tokenDoc of targets) {
    const groups = _prHudReadViewerGroups(tokenDoc);
    if (add) groups.add(group.id);
    else groups.delete(group.id);
    await prCommitViewerGroups(tokenDoc, groups, { render: false });
  }
}

Hooks.on("renderTokenHUD", function(_hud, html) {
  if (!game.user.isGM || !_prHudGridTakenOver()) return;
  const el = html instanceof HTMLElement ? html : html[0];
  const grid = el?.querySelector(".status-effects");
  if (!grid) return;
  if (!grid.dataset.prGroups) {
    grid.dataset.prGroups = "1";
    grid.addEventListener("click", _prHudOnStatusGrid, true);
    grid.addEventListener("contextmenu", _prHudOnStatusGrid, true);
  }
  // mark them after the system swaps its icons
  queueMicrotask(() => _prHudMarkStatusGrid(grid));
});

window.prCommitViewerGroups = async function(tokenDoc, localGroups, options = {}) {
  try {
    await tokenDoc.update({ [`flags.${PR_MODULE_ID}.viewerGroups`]: Array.from(localGroups) }, options);
    await prReconcileDetectionModes(tokenDoc);
  } catch (err) {
    console.error("[perceived-reality] commit failed:", err);
  }

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  for (const name of ["prRefreshTilePerception", "prRefreshLightPerception", "prRefreshTokenPerception"]) prRequestRefresh(name);
};