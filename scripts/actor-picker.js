window.PR_DISPOSITION_KEYS = ["HOSTILE", "NEUTRAL", "FRIENDLY", "SECRET"];

window.prDispositionLabel = function(key) {
  return game.i18n.localize(`TOKEN.DISPOSITION.${key}`);
};

window.prSearchActorSources = async function(query) {
  const q = (query ?? "").trim().toLowerCase();
  const limit = 25;

  const world = [];
  for (const actor of game.actors ?? []) {
    if (q && !actor.name.toLowerCase().includes(q)) continue;
    world.push({ img: actor.img, name: actor.name });
    if (world.length >= limit) break;
  }

  const packs = [];
  for (const pack of game.packs ?? []) {
    if (pack.documentName !== "Actor") continue;
    let index;
    try {
      index = await pack.getIndex();
    } catch (err) {
      console.error("[perceived-reality] compendium index failed:", pack.collection, err);
      continue;
    }
    const entries = [];
    for (const entry of index) {
      if (q && !entry.name?.toLowerCase().includes(q)) continue;
      entries.push({ img: entry.img, name: entry.name });
      if (entries.length >= limit) break;
    }
    if (entries.length) packs.push({ label: pack.metadata.label, entries });
  }

  return { world, packs };
};

window.prBuildActorPicker = function({ initialImg, initialName, onPick, onClear, placeholder } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "pr-actorpick";

  const searchWrap = document.createElement("div");
  searchWrap.className = "pr-actorpick-search";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder ?? game.i18n.localize("perceived-reality.Disguise.SearchPlaceholder");
  searchWrap.appendChild(input);
  wrap.appendChild(searchWrap);

  const results = document.createElement("div");
  results.className = "pr-actorpick-results";
  wrap.appendChild(results);

  const preview = document.createElement("div");
  preview.className = "pr-actorpick-preview";
  wrap.appendChild(preview);

  function renderPreview(img, name) {
    preview.innerHTML = "";
    if (!img && !name) {
      preview.classList.remove("pr-actorpick-preview-on");
      return;
    }
    preview.classList.add("pr-actorpick-preview-on");

    const thumb = document.createElement("div");
    thumb.className = "pr-actorpick-thumb pr-actorpick-thumb-lg";
    if (img) thumb.style.backgroundImage = `url("${img}")`;
    preview.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "pr-actorpick-preview-name";
    info.textContent = name || "";
    preview.appendChild(info);

    const clear = document.createElement("span");
    clear.className = "pr-actorpick-preview-clear";
    clear.textContent = game.i18n.localize("perceived-reality.Disguise.Clear");
    clear.addEventListener("click", () => {
      renderPreview("", "");
      onClear?.();
    });
    preview.appendChild(clear);
  }

  renderPreview(initialImg, initialName);

  function renderEmpty(key) {
    results.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "pr-actorpick-empty";
    empty.textContent = game.i18n.localize(`perceived-reality.Disguise.${key}`);
    results.appendChild(empty);
  }

  function addGroup(label, entries) {
    const head = document.createElement("div");
    head.className = "pr-actorpick-source";
    head.textContent = label;
    results.appendChild(head);
    for (const entry of entries) {
      const row = document.createElement("div");
      row.className = "pr-actorpick-row";
      const thumb = document.createElement("div");
      thumb.className = "pr-actorpick-thumb";
      if (entry.img) thumb.style.backgroundImage = `url("${entry.img}")`;
      row.appendChild(thumb);
      const name = document.createElement("span");
      name.className = "pr-actorpick-row-name";
      name.textContent = entry.name;
      row.appendChild(name);
      row.addEventListener("click", () => {
        renderPreview(entry.img, entry.name);
        results.innerHTML = "";
        input.value = "";
        onPick(entry);
      });
      results.appendChild(row);
    }
  }

  async function runSearch() {
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ""; return; }
    const { world, packs } = await prSearchActorSources(q);
    if (!world.length && !packs.length) { renderEmpty("NoResults"); return; }
    results.innerHTML = "";
    if (world.length) addGroup(game.i18n.localize("perceived-reality.Disguise.WorldActors"), world);
    for (const pack of packs) addGroup(pack.label, pack.entries);
  }

  let debounceId = null;
  input.addEventListener("input", () => {
    if (debounceId) clearTimeout(debounceId);
    debounceId = setTimeout(runSearch, 220);
  });

  return wrap;
};
