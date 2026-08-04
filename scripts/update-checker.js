const _PR_UPDATE_REPO = "ElemorSeru/perceived-reality";
const _PR_UPDATE_CACHE_HOURS = 12;
const _PR_UPDATE_MAIN_WINDOW_ID = "pr-moment-builder";
const _PR_UPDATE_MAIN_WINDOW_CLASS = "PRMomentBuilder";

window.PR_updateInfo = null;

function _prUpdateCompareVersions(a, b) {
  const pa = String(a ?? "").replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
  const pb = String(b ?? "").replace(/^v/i, "").split(".").map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

function _prUpdateEscapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function _prUpdateMarkdownToHtml(md) {
  const lines = String(md ?? "").replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const trimmed = raw.trim();
    const escaped = _prUpdateEscapeHtml(trimmed).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    if (/^#{1,3}\s+/.test(trimmed)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h4>${escaped.replace(/^#{1,3}\s+/, "")}</h4>`;
    } else if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${escaped.replace(/^[-*]\s+/, "")}</li>`;
    } else if (trimmed === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${escaped}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

async function _prUpdateFetchReleases() {
  const res = await fetch(`https://api.github.com/repos/${_PR_UPDATE_REPO}/releases`, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!res.ok) throw new Error("github releases request failed: " + res.status);
  return await res.json();
}

async function _prCheckForUpdate() {
  const installed = game.modules.get(PR_MODULE_ID)?.version;
  if (!installed) return null;

  const cached = game.settings.get(PR_MODULE_ID, "updateCheckCache");
  const now = Date.now();
  if (cached?.checkedAt && cached.installedVersion === installed && (now - cached.checkedAt) < _PR_UPDATE_CACHE_HOURS * 3600 * 1000) {
    return cached.result ?? null;
  }

  let releases;
  try {
    releases = await _prUpdateFetchReleases();
  } catch (err) {
    console.warn("[perceived-reality] update check failed:", err);
    return cached?.result ?? null;
  }

  const newer = [];
  for (const rel of Array.isArray(releases) ? releases : []) {
    if (rel.draft) continue;
    const tag = rel.tag_name ?? rel.name ?? "";
    if (_prUpdateCompareVersions(tag, installed) <= 0) break;
    newer.push({ version: tag, date: rel.published_at, body: rel.body ?? "" });
  }

  const result = newer.length ? { latest: newer[0].version, releases: newer } : null;
  await game.settings.set(PR_MODULE_ID, "updateCheckCache", { checkedAt: now, installedVersion: installed, result });
  return result;
}

function _prUpdateResolveDialogClass() {
  return foundry.applications?.api?.DialogV2;
}

function _prUpdateBuildChangelogContent(info) {
  let html = '<div class="pr-update-changelog">';
  for (const rel of info.releases) {
    const dateStr = rel.date ? new Date(rel.date).toLocaleDateString(game.i18n.lang, { year: "numeric", month: "short", day: "numeric" }) : "";
    html += `<div class="pr-update-release">
      <div class="pr-update-release-head">
        <span class="pr-update-version">${_prUpdateEscapeHtml(rel.version)}</span>
        <span class="pr-update-date">${_prUpdateEscapeHtml(dateStr)}</span>
      </div>
      ${_prUpdateMarkdownToHtml(rel.body || game.i18n.localize("perceived-reality.UpdateCheck.NoNotes"))}
    </div>`;
  }
  html += `<div class="pr-update-foot"><a href="https://github.com/${_PR_UPDATE_REPO}/releases" target="_blank" rel="noopener">${game.i18n.localize("perceived-reality.UpdateCheck.ViewHistory")}</a></div>`;
  html += "</div>";
  return html;
}

async function _prOpenChangelogPanel(info) {
  if (!info) return;
  const DialogClass = _prUpdateResolveDialogClass();
  if (!DialogClass) {
    console.error("[perceived-reality] DialogV2 unavailable, cannot show changelog panel.");
    return;
  }
  await DialogClass.wait({
    classes: ["pr-mb-dialog", "pr-update-dialog"],
    window: { title: game.i18n.localize("perceived-reality.UpdateCheck.Title"), resizable: true },
    position: { width: 480, height: 520 },
    content: _prUpdateBuildChangelogContent(info),
    buttons: [
      { action: "close", label: game.i18n.localize("perceived-reality.UpdateCheck.Close"), default: true, callback: () => true }
    ],
    rejectClose: false
  });
}

function _prInjectUpdateBadge(app, element) {
  const el = element instanceof HTMLElement ? element : (element?.[0] ?? app?.element);
  const header = el?.querySelector?.(".window-header");
  const closeBtn = header?.querySelector?.('button[data-action="close"]');
  if (!header || !closeBtn) return;

  const existing = header.querySelector(".pr-update-badge");
  if (existing) existing.remove();
  if (!PR_updateInfo) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "header-control fa-solid fa-arrows-rotate icon pr-update-badge";
  btn.dataset.tooltip = game.i18n.format("perceived-reality.UpdateCheck.Tooltip", { version: PR_updateInfo.latest });
  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    _prOpenChangelogPanel(PR_updateInfo);
  });
  closeBtn.insertAdjacentElement("beforebegin", btn);
}

function _prRefreshUpdateSurfaces() {
  const mb = foundry.applications?.instances?.get?.(_PR_UPDATE_MAIN_WINDOW_ID);
  if (mb) _prInjectUpdateBadge(mb, mb.element);
}

Hooks.on(`render${_PR_UPDATE_MAIN_WINDOW_CLASS}`, (app, element) => _prInjectUpdateBadge(app, element));

Hooks.once("ready", async () => {
  if (!game.user.isGM) return;
  PR_updateInfo = await _prCheckForUpdate();
  if (PR_updateInfo) _prRefreshUpdateSurfaces();
});
