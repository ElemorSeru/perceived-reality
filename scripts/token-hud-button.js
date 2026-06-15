// Track the currently open panel so we can restore it after HUD re-renders
let _openPanel = null;
let _panelTokenId = null;
let _panelWasOpen = false;

function _removeOpenPanel() {
  if (_openPanel) {
    _panelWasOpen = _openPanel.classList.contains("pr-panel-open");
    _openPanel.remove();
    _openPanel = null;
  } else {
    _panelWasOpen = false;
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
  const reopenAfter = _openPanel?.classList.contains("pr-panel-open")
    && _panelTokenId === tokenDoc.id;

  _removeOpenPanel();
  _panelTokenId = tokenDoc.id;

  const currentGroups = _readViewerGroups(tokenDoc);

  const btn = document.createElement("div");
  btn.className = "control-icon pr-hud-btn" + (currentGroups.size > 0 ? " pr-hud-active" : "");
  btn.dataset.tooltip = game.i18n.localize("perceived-reality.HUD.ButtonTooltip");
  btn.innerHTML = '<i class="fa-solid fa-eye-low-vision"></i>';

  const leftCol = el.querySelector(".col.left");
  if (leftCol) leftCol.appendChild(btn);
  else el.appendChild(btn);

  const panel = _buildPanel(currentGroups, btn, tokenDoc);
  document.body.appendChild(panel);
  _openPanel = panel;

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
    _removeOpenPanel();
  });
});

function _readViewerGroups(tokenDoc) {
  const active = new Set();
  const raw = tokenDoc.detectionModes ?? {};

  if (Array.isArray(raw)) {
    // V13: [{ id, enabled, range }]
    for (const mode of raw) {
      if (!mode?.enabled) continue;
      const match = PERCEPTION_GROUPS.find(g => detectionModeIdForGroup(g.id) === mode.id);
      if (match) active.add(match.id);
    }
  } else {
    // V14: { "mode-id": { enabled, range }, ... }
    for (const modeId of Object.keys(raw)) {
      if (!raw[modeId]?.enabled) continue;
      const match = PERCEPTION_GROUPS.find(g => detectionModeIdForGroup(g.id) === modeId);
      if (match) active.add(match.id);
    }
  }

  const flagGroups = tokenDoc.getFlag(MODULE_ID, "viewerGroups") ?? [];
  for (const g of flagGroups) active.add(g);

  return active;
}

function _buildPanel(currentGroups, btn, tokenDoc) {
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

  for (const group of PERCEPTION_GROUPS) {
    const label = getGroupLabel(group.id);
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

    row.addEventListener("click", async function(e) {
      e.stopPropagation();

      if (localGroups.has(group.id)) {
        localGroups.delete(group.id);
        row.classList.remove("pr-active");
      } else {
        localGroups.add(group.id);
        row.classList.add("pr-active");
      }
      btn.classList.toggle("pr-hud-active", localGroups.size > 0);

      await _commitViewerGroups(tokenDoc, localGroups);
    });

    panel.appendChild(row);
  }

  return panel;
}

async function _commitViewerGroups(tokenDoc, localGroups) {
  const groupIds = Array.from(localGroups);
  const raw = tokenDoc.detectionModes ?? {};
  const isV14 = !Array.isArray(raw);

  try {
    if (isV14) {
      // V14: partial update for mode keys
      const updateData = {};

      if ("perceived-reality" in raw) {
        updateData["detectionModes.-=perceived-reality"] = null;
      }

      for (const group of PERCEPTION_GROUPS) {
        const modeId = detectionModeIdForGroup(group.id);
        if (localGroups.has(group.id)) {
          updateData[`detectionModes.${modeId}`] = { enabled: true, range: 0 };
        } else {
          updateData[`detectionModes.-=${modeId}`] = null;
        }
      }

      await tokenDoc.update(updateData);
    } else {
      // V13: detectionModes is an array since full replacement is the only option.
      const others = foundry.utils.deepClone(raw).filter(function(m) {
        return !PERCEPTION_GROUPS.some(g => detectionModeIdForGroup(g.id) === m.id);
      });
      for (const group of PERCEPTION_GROUPS) {
        if (localGroups.has(group.id)) {
          others.push({ id: detectionModeIdForGroup(group.id), enabled: true, range: 0 });
        }
      }
      await tokenDoc.update({ detectionModes: others });
    }

    await tokenDoc.setFlag(MODULE_ID, "viewerGroups", groupIds);
  } catch (err) {
    console.error("[perceived-reality] commit failed:", err);
  }

  canvas.perception?.update({ refreshVision: true, refreshLighting: true });
  refreshTilePerception();
  if (typeof refreshLightPerception === "function") refreshLightPerception();
  if (typeof refreshTokenPerception === "function") refreshTokenPerception();
}
