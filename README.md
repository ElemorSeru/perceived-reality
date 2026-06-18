# GM Tools: Perceived Reality

[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/Elemor)
[![Foundry Version](https://img.shields.io/badge/Foundry-v12-informational?style=for-the-badge)](https://foundryvtt.com)
[![Module Version](https://img.shields.io/badge/Version-1.0.0-success?style=for-the-badge)](https://github.com/ElemorSeru/perceived-reality/releases/latest)
<img alt="GitHub Downloads (all assets, latest release)" src="https://img.shields.io/github/downloads/ElemorSeru/perceived-reality/latest/total">

A Foundry VTT module that lets the GM assign tokens, tiles, lights, and doors to **perception groups**. Only the players whose characters belong to a matching group can see (or use) those objects, while everyone else perceives the canvas as if they were never there. Built for hallucinations, illusions, invisible creatures, hidden passages, and any other "not everyone sees the same thing" moment, all on the same shared scene.

---

## History / Reasoning

A lot of the best horror and mystery moments at the table come from players not being on the same page about what's actually in the room. A charmed PC sees their friend as a monster. A character under a hallucination spell sees a perfectly safe hallway, while everyone else sees the pit trap in front of them. A rogue spots a hidden door that the rest of the party walks right past.

Foundry doesn't really have a clean way to do this without duplicating scenes, juggling multiple maps, or relying on the players' honesty. Perceived Reality grew out of wanting that "split reality" moment to just work on one shared canvas: tag the things that should only be visible to certain players, tag the players (or apply a status effect) so they're in that group, and the canvas updates live for everyone without anyone needing to leave the scene.

---

## Perception Groups

The module ships with six perception groups (Group A through Group F). Any object, token, tile, light, or door can be assigned to one or more of these groups from its normal configuration sheet. A new "Perceived Reality" section is added directly to the Token, Tile, Light, and Wall config windows.

Group names default to "Perception: Group A" through "Group F", but each group's display name can be overridden per-world from the module settings (handy for renaming them to something like "Cursed Sight" or "Thieves' Cant").

A token only needs to belong to **one** of an object's assigned groups to perceive it, objects can be assigned to multiple groups at once.

---

## What Can Be Hidden

### Tokens & Tiles

Assign one or more perception groups to a token or tile, and only players whose characters share a matching group will see it rendered on their canvas. Everyone else's canvas behaves as if it isn't there at all, no flicker, no placeholder, no "hidden" icon for players.

### Lights

Lights work the same way, with one extra wrinkle: a restricted light's illumination is also hidden from non-matching players, not just its control icon. To everyone outside the group, the room stays exactly as dark (or as lit by other sources) as it would be without that light.

### Walls & Doors

Walls can be restricted too, and the behavior depends on the wall's existing Door type:

- **A regular Door** assigned to one or more groups becomes a normal, usable door for matching players, and a plain solid wall (no door icon, no opening) for everyone else.
- **A Secret Door** assigned to one or more groups is revealed as a normal door to matching players, while remaining a secret door (invisible, like any other secret door) to everyone else, including non-matching players.
- Walls with no Door type are unaffected. assigning groups to a plain wall has no effect, since there's nothing to reveal or hide.

This means a hidden passage can be "secret to the party but obvious to the rogue's player," or a corridor can "exist" for one player's hallucination while being a dead-end wall for the rest of the table.

---

## Viewer Groups: Who Can Perceive What

A token "belongs" to a perception group through its **viewer groups**, which can be set in two ways:

### Token HUD Button

GMs get a new eye icon on the Token HUD. Clicking it opens a small panel listing all six perception groups, click any of them to toggle that token in or out of the group. This is the quickest way to permanently assign a PC (or any token) to a group, for example, giving the party rogue permanent access to a hidden-door group.

### Status Effects (Active Effects)

Each perception group also has a matching status effect that can be applied to a token through the normal status effect menu, or via spells, items, or active effects in your system. While the effect is active, that token can perceive everything assigned to that group, and it's removed the moment the effect ends.

This is the intended path for *temporary* perception changes, true seeing, a hallucination spell wearing off, a potion of invisibility detection, and so on, without permanently editing the token.

---

## GM Tools & Preview Mode

### GM Sees All Groups

By default, GMs always see every token, tile, light, and door at full visibility regardless of perception group, exactly as if Perceived Reality wasn't installed for them. This can be turned off in the module settings.

### Preview Mode

With "GM Sees All Groups" disabled, selecting a token on the canvas previews that token's perspective. Anything outside its perception groups isn't hidden from the GM, it's dimmed and desaturated instead, so the GM can still see, click, and manage it while getting a quick visual read on exactly what that token can and can't perceive. Deselecting the token returns the canvas to normal.

This is built for spot-checking: select the rogue's token to confirm the hidden door reads correctly, select a hallucinating PC to confirm the illusion is in place, all without affecting what players actually see.

---

## Installation

**Method 1: Manifest URL**

In Foundry's module manager, paste the manifest URL:

```
https://github.com/ElemorSeru/perceived-reality/releases/latest/download/module.json
```

**Method 2: Manual**

Download the latest release zip, extract it into your `Data/modules/` directory, and restart Foundry.

---

## Compatibility

| | |
|---|---|
| Foundry VTT | v12 |
| Game Systems | Built and tested with dnd5e, but uses core Foundry APIs (flags, detection modes, status effects) so other systems should work |

The perception-group configuration section is injected into the standard Token, Tile, Ambient Light, and Wall config sheets, including dnd5e's extended Token Config sheet.

---

## Data Storage

All perception-group assignments are stored as **document flags** on the individual tokens, tiles, lights, and walls themselves, the same way Foundry stores any other per-document data. There's no separate world-scoped database to manage, back up, or migrate: everything travels with the scene and the objects it belongs to.

Viewer group assignments on a token are stored as a combination of that token's detection modes and a small flag, both on the token document itself.

---

## Languages

The module ships with translations for:

- English
- (More as time allows)

---

## About

Built and maintained by [Elemor](https://patreon.com/Elemor).

If you find this useful and want to support continued development, the Patreon link above is the best way to do that.

Bug reports and feature requests are welcome via the Issues tab.
