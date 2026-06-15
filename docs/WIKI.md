This guide covers how to use every part of Perceived Reality. If something is not covered here, check the Issues tab on GitHub.

---

## Table of Contents

- [Core Concept](#core-concept)
- [Module Settings](#module-settings)
  - [Group Display Names](#group-display-names)
  - [GM Sees All Groups](#gm-sees-all-groups)
- [Assigning Perception Groups to Objects](#assigning-perception-groups-to-objects)
  - [Tokens](#tokens)
  - [Tiles](#tiles)
  - [Lights](#lights)
  - [Walls and Doors](#walls-and-doors)
- [Assigning Viewer Groups to Tokens](#assigning-viewer-groups-to-tokens)
  - [Token HUD Picker](#token-hud-picker)
  - [Status Effects](#status-effects)
- [GM Preview Mode](#gm-preview-mode)
- [Example Use Cases](#example-use-cases)

---

## Core Concept

Perceived Reality works with two halves that need to match up:

1. **What an object is assigned to.** Any token, tile, light, or door can be tagged with one or more of the six perception groups (Group A through Group F) using the "Perceived Reality" section added to its configuration sheet.
2. **What a viewer can perceive.** A token "sees" everything tagged with a group if that token itself belongs to that same group, either permanently (via the Token HUD picker) or temporarily (via a status effect).

If a tagged object shares at least one group with the viewing token, that token perceives it normally. If there's no overlap, the object behaves as though it doesn't exist for that player, hidden, solid, or dark, depending on the object type.

Objects with no groups assigned are completely unaffected by the module and behave exactly as vanilla Foundry would.

---

## Module Settings

Open **Game Settings > Configure Settings > Module Settings** and find "GM Tools: Perceived Reality".

### Group Display Names

Each of the six groups (A through F) has its own text field. By default they're labeled "Perception: Group A" through "Group F" wherever they appear (config sheets, the Token HUD picker, status effect tooltips). Type a custom name into any of these fields to rename that group everywhere it's shown, for example, renaming Group A to "True Sight" or "Thieves' Cant". Leave a field blank to keep the default name.

These overrides are world-scoped, so every GM and player in the world sees the same names.

### GM Sees All Groups

Enabled by default. While this is on, the GM always sees every token, tile, light, and door at full visibility, exactly as if the module were not installed, regardless of any perception groups assigned.

Turn this off to enable [GM Preview Mode](#gm-preview-mode), which lets you check the canvas from a specific token's perspective instead.

This setting takes effect immediately, no reload needed.

---

## Assigning Perception Groups to Objects

Every supported object type gets a new **Perceived Reality** section in its normal configuration sheet, with a checkbox for each of the six groups. Check any combination of groups; the object is visible to a token if that token belongs to **any** of the checked groups.

Leaving every checkbox unchecked means the object is unaffected by the module and is visible to everyone, as normal.

### Tokens

Open a token's configuration sheet and find the Perceived Reality section (near the Vision settings). Check one or more groups, and that token will only be rendered for players whose own token belongs to a matching group. Everyone else's canvas simply doesn't show it, no greyed-out icon, no placeholder.

This is useful for things like an invisible creature only certain PCs can detect, or an illusionary double only its caster can see.

### Tiles

Open a tile's configuration sheet and find the Perceived Reality section. Works the same as tokens, the tile is rendered only for players whose token shares one of its assigned groups.

Good for illusionary terrain, map, hallucinated objects, or set pieces that only exist for part of the party.

### Lights

Open an ambient light's configuration sheet and find the Perceived Reality section. A restricted light's illumination, not just its control icon, is hidden from non-matching players. To them, the room is exactly as dark (or lit by other sources) as it would be if that light didn't exist.

This is useful for a torch only a charmed character can see, or a magical glow that's part of someone's hallucination.

### Walls and Doors

Open a wall's configuration sheet and find the Perceived Reality section below the Door Configuration fields. The hint text above the checkboxes changes depending on the wall's **Door type**:

- **Door**: assigning groups turns this door into a normal, usable door for matching players, and a plain solid wall (no door icon, no opening) for everyone else.
- **Secret Door**: assigning groups reveals this secret door as a normal door to matching players. Everyone else still perceives a secret door, exactly as they would without the module.
- **Not a door** (a plain wall): the section explains that assigning groups has no effect, since there's nothing to reveal or hide on a non-door wall.

Because the underlying wall geometry is updated for each viewer, this affects both what players see **and** what they can walk through or see through, a hidden door that's revealed to the rogue's group is also usable by that group, while remaining a solid wall (or secret door) to everyone else.

---

## Assigning Viewer Groups to Tokens

Tagging an object with a group only does half the job, a token also needs to belong to that same group to perceive the object. There are two ways to do this.

### Token HUD Picker

As a GM, right-click (or left-click, depending on your settings) a token to open its Token HUD. A new eye icon appears alongside the other HUD buttons. Clicking it opens a small panel listing all six perception groups.

Click any group in the panel to toggle that token in or out of it. The eye icon highlights when the token belongs to at least one group. Changes apply immediately, no need to close the HUD or reload.

This is the right tool for **permanent** assignments, for example, giving the party's rogue lasting access to a "hidden door" group for the rest of the campaign.

### Status Effects

Each perception group has a matching status effect available from the token's normal status effect menu (the same row of icons used for conditions like Blinded or Prone). Applying a group's status effect to a token lets it perceive everything assigned to that group for as long as the effect is active. Removing the effect removes that access immediately.

These status effects can also be applied or removed by anything in your system that manipulates Active Effects, spells, items, features, and so on, so a "True Seeing" spell or a "Hallucinatory Terrain" effect can grant or remove perception access automatically as part of its normal Active Effect setup.

This is the right tool for **temporary** assignments, true seeing while a spell is active, a hallucination that goes away when a condition ends, or a potion that wears off.

---

## GM Preview Mode

With [GM Sees All Groups](#gm-sees-all-groups) turned off, select a token on the canvas (left-click to control it, as normal). The canvas now previews what that token can and can't perceive:

- Objects the selected token **can** perceive look completely normal.
- Objects it **can't** perceive aren't hidden from the GM. instead they're dimmed and desaturated, including door icons, token art, tile art, and light icons/illumination.

This lets you visually confirm a setup, select the rogue's token and confirm the hidden door reads as a normal door, select a hallucinating PC and confirm the illusionary wall looks solid to them, without affecting what any player actually sees on their own screen.

Deselecting all tokens (or selecting a token with no perception restrictions relevant to the scene) returns the canvas to showing everything at full visibility, since there's nothing to preview against.

---

## Example Use Cases

**Hidden door for one player**

Set a wall's Door type to Door, and assign it to Group A. Give the rogue's token permanent access to Group A via the Token HUD picker. The rogue's player sees and can open a normal door; everyone else sees a solid wall.

**Temporary hallucination**

Assign a tile (an illusionary pit, wall, or monster) to Group B. Apply Group B's status effect to the affected PC's token for the duration of the hallucination. Remove the effect when the spell ends, and the tile disappears from that player's view along with it.

**A monster only some PCs can see**

Assign a token (the invisible or otherworldly creature) to Group C. Give Group C's status effect to any PC with the relevant detection ability (truesight, a specific class feature, and so on). Only those PCs will ever see the token rendered on their canvas.

**A light only visible under specific conditions**

Assign an ambient light to Group D, granting Group D to a token via the HUD picker or a status effect as needed. Players without Group D won't see the light's icon or its illumination, the area stays as dark (or lit by other sources) as it would be without that light.
