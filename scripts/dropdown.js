let _prDropdownOpen = null;

window.prEnhanceSelect = function(select) {
  if (!select || select.multiple || select.size > 1 || select.dataset.prDropdown) return select;
  select.dataset.prDropdown = "1";
  select.addEventListener("mousedown", event => {
    if (event.button !== 0) return;
    event.preventDefault();
    if (_prDropdownOpen?.select === select) _prDropdownClose();
    else _prDropdownShow(select);
  });
  select.addEventListener("keydown", event => _prDropdownKey(select, event));
  return select;
};

window.prEnhanceSelects = function(root) {
  for (const select of root?.querySelectorAll?.("select") ?? []) prEnhanceSelect(select);
};

function _prDropdownShow(select) {
  if (select.disabled) return;
  _prDropdownClose();
  select.focus();
  const style = getComputedStyle(select);
  const list = document.createElement("div");
  list.className = "pr-dropdown";
  list.setAttribute("role", "listbox");
  list.style.fontSize = style.fontSize;
  list.style.fontFamily = style.fontFamily;
  list.style.color = style.color;
  list.style.setProperty("--pr-dd-bg", style.backgroundColor);
  list.style.setProperty("--pr-dd-border", style.borderColor);
  const accent = style.getPropertyValue("--pr-mb-accent").trim();
  if (accent) list.style.setProperty("--pr-dd-accent", accent);

  const items = [];
  const addOption = (option, parent) => {
    const row = document.createElement("div");
    row.className = "pr-dropdown-option";
    row.setAttribute("role", "option");
    row.textContent = option.textContent;
    if (option.dataset.note) row.appendChild(Object.assign(document.createElement("span"), { className: "pr-dropdown-note", textContent: option.dataset.note }));
    if (option.disabled || parent?.disabled) row.classList.add("disabled");
    if (option.selected) row.classList.add("selected");
    row.setAttribute("aria-selected", String(option.selected));
    const index = items.length;
    row.addEventListener("pointermove", () => _prDropdownActivate(index, false));
    row.addEventListener("click", () => _prDropdownPick(index));
    items.push({ row, option, disabled: row.classList.contains("disabled") });
    list.appendChild(row);
  };
  for (const child of select.children) {
    if (child.tagName === "OPTGROUP") {
      const head = document.createElement("div");
      head.className = "pr-dropdown-group";
      if (child.dataset.tone) head.dataset.tone = child.dataset.tone;
      if (child.dataset.icon) head.appendChild(Object.assign(document.createElement("i"), { className: child.dataset.icon }));
      head.appendChild(document.createTextNode(child.label));
      list.appendChild(head);
      for (const option of child.children) addOption(option, child);
    } else if (child.tagName === "OPTION") addOption(child, null);
  }
  if (!items.length) return;

  document.body.appendChild(list);
  _prDropdownOpen = { select, list, items, active: -1, typed: "", typedAt: 0 };
  _prDropdownActivate(Math.max(0, items.findIndex(i => i.option.selected)), true);
  _prDropdownPlace();
  document.addEventListener("pointerdown", _prDropdownOutside, true);
  window.addEventListener("resize", _prDropdownClose);
  const follow = () => {
    if (_prDropdownOpen?.list !== list) return;
    if (!select.isConnected || !select.offsetParent) { _prDropdownClose(); return; }
    _prDropdownPlace();
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

function _prDropdownPlace() {
  const { select, list } = _prDropdownOpen;
  const rect = select.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - 8;
  const above = rect.top - 8;
  const wanted = Math.min(list.scrollHeight, 320);
  const up = below < wanted && above > below;
  list.style.minWidth = rect.width + "px";
  list.style.maxHeight = Math.max(80, Math.min(320, up ? above : below)) + "px";
  const width = list.offsetWidth;
  list.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - width - 4)) + "px";
  list.style.top = up ? Math.max(4, rect.top - list.offsetHeight - 2) + "px" : (rect.bottom + 2) + "px";
}

function _prDropdownActivate(index, scroll) {
  const open = _prDropdownOpen;
  if (!open || index < 0 || index >= open.items.length) return;
  open.items[open.active]?.row.classList.remove("active");
  open.active = index;
  open.items[index].row.classList.add("active");
  if (scroll) open.items[index].row.scrollIntoView({ block: "nearest" });
}

function _prDropdownStep(from, by) {
  const { items } = _prDropdownOpen;
  let i = from;
  for (let n = 0; n < items.length; n++) {
    const next = i + by;
    if (next < 0 || next >= items.length) return i;
    i = next;
    if (!items[i].disabled) return i;
  }
  return from;
}

function _prDropdownPick(index) {
  const open = _prDropdownOpen;
  const item = open?.items[index];
  if (!item || item.disabled) return;
  const { select } = open;
  _prDropdownClose();
  select.focus();
  if (select.value === item.option.value && item.option.selected) return;
  item.option.selected = true;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function _prDropdownKey(select, event) {
  const open = _prDropdownOpen?.select === select ? _prDropdownOpen : null;
  const key = event.key;
  if (!open) {
    if (key === "Enter" || key === " " || key === "ArrowDown" || key === "ArrowUp" || (event.altKey && key === "ArrowDown")) {
      event.preventDefault();
      _prDropdownShow(select);
    }
    return;
  }
  const page = 8;
  const moves = {
    ArrowDown: () => _prDropdownStep(open.active, 1),
    ArrowUp: () => _prDropdownStep(open.active, -1),
    PageDown: () => _prDropdownStep(Math.min(open.items.length - 1, open.active + page - 1), 1),
    PageUp: () => _prDropdownStep(Math.max(0, open.active - page + 1), -1),
    Home: () => _prDropdownStep(-1, 1),
    End: () => _prDropdownStep(open.items.length, -1)
  };
  if (moves[key]) {
    event.preventDefault();
    _prDropdownActivate(moves[key](), true);
  } else if (key === "Enter" || key === " ") {
    event.preventDefault();
    _prDropdownPick(open.active);
  } else if (key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    _prDropdownClose();
  } else if (key === "Tab") {
    _prDropdownClose();
  } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    const now = Date.now();
    open.typed = (now - open.typedAt > 700 ? "" : open.typed) + key.toLowerCase();
    open.typedAt = now;
    const hit = open.items.findIndex(i => !i.disabled && i.option.textContent.trim().toLowerCase().startsWith(open.typed));
    if (hit !== -1) _prDropdownActivate(hit, true);
  }
}

function _prDropdownOutside(event) {
  const open = _prDropdownOpen;
  if (!open || open.list.contains(event.target) || event.target === open.select) return;
  _prDropdownClose();
}

function _prDropdownClose() {
  const open = _prDropdownOpen;
  if (!open) return;
  _prDropdownOpen = null;
  open.list.remove();
  document.removeEventListener("pointerdown", _prDropdownOutside, true);
  window.removeEventListener("resize", _prDropdownClose);
}
