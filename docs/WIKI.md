This guide covers how to use every part of Perceived Reality. If something is not covered here, check the Issues tab on GitHub.

---

## Table of Contents

- [Core Concept](#core-concept)
- [Module Settings](#module-settings)
  - [Group Display Names](#group-display-names)
  - [GM Sees All Groups](#gm-sees-all-groups)
  - [GM Sees True Appearances](#gm-sees-true-appearances)
- [Assigning Perception Groups to Objects](#assigning-perception-groups-to-objects)
  - [Tokens](#tokens)
  - [Tiles](#tiles)
  - [Lights](#lights)
  - [Walls and Doors](#walls-and-doors)
- [Assigning Viewer Groups to Tokens](#assigning-viewer-groups-to-tokens)
  - [Token HUD Picker](#token-hud-picker)
  - [Status Effects](#status-effects)
- [Disguises: Seen As](#disguises-seen-as)
  - [Setting Up a Disguise](#setting-up-a-disguise)
  - [Per-Group Options](#per-group-options)
  - [Overlapping Groups and Self-View](#overlapping-groups-and-self-view)
- [GM Preview Mode](#gm-preview-mode)
- [The Perception Window](#the-perception-window)
  - [Opening the Window](#opening-the-window)
  - [Seen By and Sees](#seen-by-and-sees)
  - [The Selected Section](#the-selected-section)
  - [Picking From the Canvas](#picking-from-the-canvas)
  - [The Scene List](#the-scene-list)
  - [Viewing As](#viewing-as)
  - [Troubleshooting](#troubleshooting)
- [The Moment Builder](#the-moment-builder)
  - [Opening the Builder](#opening-the-builder)
  - [The Toolbar](#the-toolbar)
  - [The Timeline](#the-timeline)
  - [Clip Types](#clip-types)
    - [Transition](#transition)
    - [Narration](#narration)
    - [Sound](#sound)
    - [Effect (FXMaster)](#effect-fxmaster)
    - [Perception](#perception)
    - [Grouping](#grouping)
    - [Atmosphere](#atmosphere)
      - [Sections](#sections)
      - [Aurora](#aurora)
    - [Disguise](#disguise)
  - [Locating Targets on the Canvas](#locating-targets-on-the-canvas)
  - [Saving, Switching, and Deleting Moments](#saving-switching-and-deleting-moments)
  - [Changing Scene With the Builder Open](#changing-scene-with-the-builder-open)
  - [Running a Moment](#running-a-moment)
  - [Triggers: Manual vs. Scene Activation](#triggers-manual-vs-scene-activation)
- [The Moment Catalog](#the-moment-catalog)
- [FXMaster Integration in Depth](#fxmaster-integration-in-depth)
- [Example Use Cases](#example-use-cases)

---

## Core Concept

Perceived Reality works with two halves that need to match up:

1. **What an object is assigned to.** Any token, tile, light, or door can be tagged with one or more of the six perception groups (Group A through Group F) using the "Perceived Reality" section added to its configuration sheet.
2. **What a viewer can perceive.** A token "sees" everything tagged with a group if that token itself belongs to that same group, either permanently (via the Token HUD picker) or temporarily (via a status effect).

If a tagged object shares at least one group with the viewing token, that token perceives it normally. If there's no overlap, the object behaves as though it doesn't exist for that player, hidden, solid, or dark, depending on the object type.

Objects with no groups assigned are completely unaffected by the module and behave exactly as vanilla Foundry would.

The Moment Builder (covered later in this guide) is built entirely on top of this same group system, its moment "clips" are scripted, timed ways of doing what you could otherwise do by hand: toggling a token's viewer groups, tagging an object with a group, or changing what a group's view of the scene looks like.

---

## Module Settings

Open **Game Settings > Configure Settings > Module Settings** and find "GM Tools: Perceived Reality".

### Group Display Names

Each of the six groups (A through F) has its own text field. By default they're labeled "Perception: Group A" through "Group F" wherever they appear (config sheets, the Token HUD picker, status effect tooltips, and the Moment Builder). Type a custom name into any of these fields to rename that group everywhere it's shown, for example, renaming Group A to "True Sight" or "Thieves' Cant". Leave a field blank to keep the default name.

These overrides are world-scoped, so every GM and player in the world sees the same names.

### GM Sees All Groups

Enabled by default. While this is on, the GM always sees every token, tile, light, and door at full visibility, exactly as if the module were not installed, regardless of any perception groups assigned.

Turn this off to enable [GM Preview Mode](#gm-preview-mode), which lets you check the canvas from a specific token's perspective instead.

This setting takes effect immediately, no reload needed.

### GM Sees True Appearances

Enabled by default, and separate from the setting above. While it is on, the GM always sees every token's real artwork, name, and border color, ignoring any [disguises](#disguises-seen-as) regardless of what is selected.

Turn it off to preview disguises from a token's own perspective:

- **With a token selected**, the canvas shows what that token perceives. The selected token always shows as itself, and any token it would perceive as disguised is drawn disguised.
- **With nothing selected**, the GM sees the default disguised view: every token that has a disguise configured is drawn disguised, using its first configured group.

This setting also takes effect immediately.

---

## Assigning Perception Groups to Objects

Every supported object type gets a new **Perceived Reality** section in its normal configuration sheet, with a checkbox for each of the six groups. Check any combination of groups; the object is visible to a token if that token belongs to **any** of the checked groups.

Leaving every checkbox unchecked means the object is unaffected by the module and is visible to everyone, as normal.

### Tokens

Open a token's configuration sheet and find the **Perceived Reality: Who Can See This Token** section (near the Vision settings). Check one or more groups and that token only shows for players whose own token is in a matching group. This sets who can see the token. What the token itself can see is set from the eye icon on its HUD. Everyone else's canvas doesn't show it at all, no grayed-out icon or placeholder.

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

Tagging an object with a group only does half the job, a token also needs to belong to that same group to perceive the object. There are two ways to do this by hand (the Moment Builder's [Perception clip](#perception) is a third, scripted way to do the same thing).

### Token HUD Picker

As a GM, right-click (or left-click, depending on your settings) a token to open its Token HUD. A new eye icon appears alongside the other HUD buttons. Clicking it opens a small panel listing all six perception groups.

Click any group in the panel to toggle that token in or out of it. The eye icon highlights when the token belongs to at least one group. Changes apply immediately, no need to close the HUD or reload.

A group the token only has through an active effect is listed too, with a dashed outline and an *effect* tag. It ends when the effect does. Clicking it makes it a permanent pick. This panel sets what the token can see. Who can see the token is set in the Perceived Reality section of its Vision tab.

This is the right tool for **permanent** assignments, for example, giving the party's rogue lasting access to a "hidden door" group for the rest of the campaign.

### Status Effects

Each perception group has a matching status effect available from the token's normal status effect menu (the same row of icons used for conditions like Blinded or Prone). Applying a group's status effect to a token lets it perceive everything assigned to that group for as long as the effect is active. Removing the effect removes that access immediately.

On systems that use Active Effects, such as dnd5e, these status effects can also be applied or removed by anything in your system that manipulates Active Effects, spells, items, features, and so on, so a "True Seeing" spell or a "Hallucinatory Terrain" effect can grant or remove perception access automatically as part of its normal Active Effect setup.

This is the right tool for **temporary** assignments, true seeing while a spell is active, a hallucination that goes away when a condition ends, or a potion that wears off.

#### Pathfinder 2e

PF2e doesn't allow Active Effects besides the death overlay, so it works differently there:

- **The status menu** icons set the token's groups directly, the same as the eye panel: click to add, right-click to remove, applied to every selected token (GM only). These are permanent picks.
- **Temporary access** comes from any PF2e effect, spell, feat or item with the rule element below. It grants the group while PF2e applies it (while the effect lasts or the item is equipped) and ends when the effect expires or is removed.

```json
{ "key": "RollOption", "domain": "all", "option": "perceived-reality:group-a" }
```

Use `group-b` through `group-f` for the other groups. Toggling a group's status from a macro or another module, for example `actor.toggleStatusEffect("perceived-reality.group-a")`, creates a ready-made effect for that group, and toggling it again removes it.

---

## Disguises: Seen As

Perception groups decide **whether** a token is drawn. Disguises decide **as what**. Rather than removing the token from a player's canvas, a disguise leaves it in place and swaps its appearance for a different one.

This is deliberately the inverse of the perception checklist: in the checklist, sharing a group with a token is what *reveals* it; in a disguise, sharing a group with the disguise is what *fools* you. Anyone outside the group being fooled sees the token exactly as it really is, which means the truth is the default and the lie is the exception.

Nothing mechanical changes. The actor, its stats, its size, and its behavior are untouched; only what each player's canvas draws is different.

### Setting Up a Disguise

Open the token's configuration sheet and find the **Perceived Reality: Seen As** section, below the perception checklist. It lists all six perception groups, each collapsed to a single row showing the group's name and whether a disguise is set ("Disguised" or "Not set"). Click a row to expand it.

Inside an expanded row, use the search field to find an appearance. Typing searches:

- **World Actors**, the actors in the current world.
- **Every compendium** of actors the world has access to, each listed under its own pack name.

Pick a result and two things are stored: that actor's artwork becomes what the group sees, and its name becomes the nameplate that group reads. **Clear** removes the disguise for that group entirely.

The disguise saves as soon as you pick, no separate submit. Rows you have expanded stay expanded when the sheet re-renders.

### Per-Group Options

Once an appearance is set, three more controls appear for that group:

- **Enable / disable toggle** - switches the disguise off while keeping it configured. Useful for a disguise that comes and goes across a session without rebuilding it each time.
- **Hide nameplate on hover / selection** - instead of showing the disguised name, show no nameplate at all for that group. Off by default.
- **Show as disposition** - override the token's border color for that group only, choosing Hostile, Neutral, Friendly, or Secret, with a color swatch showing the result. This is what makes a disguised ally read as an enemy to the group being fooled, or a lurking enemy read as friendly.

Each option is per group, so the same token can look like one thing to Group A and something else entirely to Group B.

### Overlapping Groups and Self-View

Two rules resolve the ambiguous cases:

- **A viewer in more than one disguised group** sees the disguise of the first configured group in A to F order. Only rows that are both filled in and enabled count, so a disabled disguise is skipped rather than winning and showing nothing. Group order is the tiebreak, so put the disguise that should win in an earlier group.
- **Players are not exempt from their own token's disguise.** A disguise applies to every viewer in the group, including the player controlling the disguised token. If that player's own token belongs to the group being fooled, they will see their own token wearing the disguise. In practice, keep the fooled players in a group the disguised token is not itself a member of.
- **The GM's preview is exempt.** With [GM Sees True Appearances](#gm-sees-true-appearances) off, the token you have selected always renders as itself, so the token you are inspecting from is never the one being faked.

Disguises refresh live. Changing a disguise, selecting a different token, or applying and removing a perception status effect all update the canvas immediately for every connected player, with no reload.

---

## GM Preview Mode

With [GM Sees All Groups](#gm-sees-all-groups) turned off, select a token on the canvas (left-click to control it, as normal). The canvas now previews what that token can and can't perceive:

- Objects the selected token **can** perceive look completely normal.
- Objects it **can't** perceive aren't hidden from the GM. instead they're dimmed and desaturated, including door icons, token art, tile art, and light icons/illumination.

This lets you visually confirm a setup, select the rogue's token and confirm the hidden door reads as a normal door, select a hallucinating PC and confirm the illusionary wall looks solid to them, without affecting what any player actually sees on their own screen.

Deselecting all tokens (or selecting a token with no perception restrictions relevant to the scene) returns the canvas to showing everything at full visibility, since there's nothing to preview against.

You can also preview without turning the setting off or selecting anything. The Moment Builder's View as picker does it for any token on the scene while the builder is open, and the [Perception window](#viewing-as) does it for a party token or a whole group.

---

## The Perception Window

The Perception window lists every token, tile, light and door on the scene with its groups, so you can change who sees what from one place. You don't have to switch layers or open config sheets, and it works the same on whichever layer is active. It's GM only. Players don't get the tool or the keybinding.

### Opening the Window

- The eye tool in the Token, Tile, Lighting and Wall controls.
- **Ctrl+Shift+E**, which you can change under Configure Controls. Pressing it again closes the window.
- Right-click a scene in the scene sidebar and choose **Perception**. If you aren't viewing that scene, it switches to it first.

The window always shows the scene on your canvas, and follows you when you change scenes.

### Seen By and Sees

The window has the same two lists the module has always had, one at a time:

| Mode | Shows | Same as |
|---|---|---|
| **Seen by** | The groups that can see each thing | The Perceived Reality checklist in each config sheet |
| **Sees** | The groups each token is in, so what it can see | The eye button on the token HUD |

Click a group's icon on a row to add or remove that group. Sees only lists tokens, since only tokens can be in a group.

In Sees mode, a group a token only has from an active effect shows with a dashed gold outline. Clicking it keeps the group as a permanent pick, the same as in the HUD panel. The effect's own grant still ends with the effect.

Changes save as you click. If that thing's config sheet is open, its checkboxes update to match.

### The Selected Section

What you have selected on the canvas shows at the top, along with anything you've [picked](#picking-from-the-canvas). Selecting works the way it always does in Foundry, so that part is what's selected on the active layer. Walls that aren't doors are left out, since groups do nothing on them.

With more than one thing in the section, an **All** row changes them together. A solid icon means all of them have that group, a dashed one means only some do. Clicking a dashed icon gives the group to all of them, and clicking a solid one takes it from all of them. In Sees mode the All row only changes the tokens.

**Clear** deselects everything, and the **x** on a row deselects just that one.

### Picking From the Canvas

Foundry only lets you select things on the active layer. **Pick** (the pointer next to the filter) gets around that. While it's on, clicking a token, tile, light or door on the canvas puts it in Selected, marked *picked*, whichever layer is active. It follows Foundry's own selection rules:

- A click picks just that thing and deselects everything else, Foundry's own selection included.
- **Shift+click** adds a thing, or removes it if it's already picked.
- A click on empty canvas deselects everything.

While picking:

- Lights get a purple marker, since their icons only show on the Lighting layer.
- Hovering shows what a click would pick and outlines it on the canvas.
- When things overlap, the top one is picked first. Click the same spot again to swap it for the one under it, like a tile under a token.
- The mouse wheel still zooms. Right-click, **Esc** or the Pick button stops picking, and Esc doesn't close the window while you're picking.

Picking doesn't select anything in Foundry or change the active layer. Picks stay in Selected after you stop, until you press Clear, close the window or change scenes.

### The Scene List

Tokens, Tiles, Lights and Doors each get a section you can fold. **Search** narrows them by name, and **Tagged** shows only things that have a group or a disguise. Lights and doors don't have names in Foundry, so they're named after the nearest token, like "Light near Pip". Secret doors say so in the name.

Hovering a row outlines that thing on the canvas. Each row also has:

- **Move to** (crosshairs) - pans the canvas to it and pings it. Clicking the name does the same. The ping only shows on your screen, so players don't see where a hidden token or secret door is.
- **Open config** (gear) - opens its config sheet on the Perceived Reality section.
- **Seen As** (masks, tokens only) - lit when the token has a disguise set up. It opens the config sheet at the Seen As section.

### Viewing As

Viewing as previews the canvas the way someone else sees it, with the same dimming as [GM Preview Mode](#gm-preview-mode). You don't have to turn off GM Sees All Groups or select anything.

| Pick | Previews |
|---|---|
| **Normal view** | Whatever your settings and selection show, as if the window weren't open |
| A party token | What that token sees, including disguises the way it sees them |
| A group | What anyone in that group sees, with no token needed |

A group is handy for checking a setup before anyone is in it. Viewing as a group has no token, so an atmosphere doesn't cut out the roof above anyone. Pick a party token to check that.

Only you see the preview. It ends when the window closes. Switching scenes ends a token preview, since that token isn't on the new scene, but a group preview stays. If the Moment Builder's View as was showing something when you opened the window, closing it puts that back.

### Troubleshooting

**Something selected doesn't show under Selected.** Only the active layer's selection shows. Switch to that layer, find it in the list below, or [pick it](#picking-from-the-canvas) instead.

**Clicking the canvas doesn't select anything.** Pick mode is on. Right-click or press Esc to stop.

**A light or door isn't in the list.** Plain walls aren't listed, only doors. Check the search box and the Tagged filter.

**Viewing as doesn't seem to change anything.** Only things with groups dim. If nothing on the scene has a group the pick can't see, the canvas looks the same.

---

## The Moment Builder

The Moment Builder is a timeline editor for building a **Moment**, a saved, replayable sequence of screen transitions, narration, sound, FXMaster effects, and perception changes. Moments are GM only to build and run, and are filed under a scene or under Any scene (see [the catalog](#the-moment-catalog) below) so you can build out reveals ahead of time and trigger them live at the table.

### Opening the Builder

Any of the following opens the builder, scoped to the currently active scene:

- The keybinding **Ctrl+Shift+M** (configurable under Foundry's Controls settings, GM only).
- Right-clicking a scene in the Scenes sidebar and choosing **Moment Builder**.

Right-clicking a scene also offers a second entry, **Moment Catalog**, covered in its own section below.

### The Toolbar

The window's top bar is split into a left area (identity and preview controls) and a right area (moment navigation and actions):

- **Scene badge** - shows which scene the loaded Moment is filed under, or Any scene. It turns amber with a warning icon when that isn't the scene you're viewing.
- **Missing targets** - appears when steps point at tokens, tiles, lights or doors that aren't on the scene you're viewing. Those steps are skipped if the Moment plays there.
- **Name field** - renames the currently selected Moment.
- **Trigger dropdown** - Manual or On Scene Activation, see [Triggers](#triggers-manual-vs-scene-activation).
- **View as** (eye icon) - GM only preview. Pick a token to see the scene the way that token would: transitions, narration and atmosphere, plus the tiles, lights and tokens on the canvas. "All (GM view)" shows everything and overrides the two see-all settings while it's set. Only your screen is affected, players don't see any of it, and it resets when the builder closes.
- **Moment selector** - lists every Moment in the world, grouped the way the catalog groups them: this scene first, then Any scene, then each other scene by name. Picking one from another group loads that group.
- **Catalog** - opens the [Moment Catalog](#the-moment-catalog).
- **New** - creates a new, empty Moment in the loaded group and selects it.
- **Save** - writes every Moment in the loaded group to the world-level Moment library.
- **Delete** - deletes the currently selected Moment.
- **Run** - saves, then plays the selected Moment on the scene you're viewing. If some of its targets aren't on that scene, it asks before playing.
- **Stop Moment** (stop icon) - ends the running moment. Clips that haven't played yet are canceled and whatever is showing is taken down. It doesn't undo what earlier clips already did, so a perception grant or disguise stays applied.
- **Clear Effects** (broom icon) - resets every transition, narration, atmosphere and effect overlay on the current scene for every connected player, and ends a running moment. Use it if a sequence gets interrupted (the builder closed mid-transition, testing a clip on its own) and something is left showing. Atmosphere is saved on the scene, so a stuck atmosphere stays after a reload until you use this button or play a "none" Atmosphere clip.

A floating zoom control sits over the bottom-right corner of the timeline for adjusting how many seconds are visible at once; it doesn't affect playback, only the editing view.

### The Timeline

Below the toolbar is a palette of **+ Add** buttons, one per clip type (hover any of them for a description of what that clip does). Clicking one adds a new clip of that type to the timeline, snapped to the next free half-second on its row.

The timeline itself has rows for Transitions, Narration, Sound, Effects (only shown if FXMaster is active, or if the Moment already has an Effect clip saved), and a shared State row for Perception, Grouping, Atmosphere, and Disguise clips (shown as small markers rather than draggable bars, since they represent an instant change rather than a duration).

- **Dragging** a clip moves it along the timeline; everything snaps to half-second increments so gaps and overlaps are always exact.
- **Dragging the right edge** of a duration-based clip (Transition, Narration, Sound, Effect) resizes it.
- Clips that **overlap in time within the same row** automatically split into separate visual lanes, so two clips of the same type playing at once are always independently clickable instead of stacking on top of each other.
- **Clicking a clip** selects it and opens its settings in the inspector panel on the right side of the window. The inspector scrolls independently and remembers its scroll position when you tweak a setting, only jumping back to the top when you select a different clip.
- Every clip's inspector/detail screen has a **Delete clip** button to remove it from the timeline.

### Clip Types

#### Transition

A fullscreen curtain effect that plays for the clip's duration, then clears. Twenty-one built-in styles are available from the Style dropdown:

| Style | Style | Style | Style |
|---|---|---|---|
| Rolling Mist | Blackout | Pollen Bloom | Veil Ripple |
| Emberfall | Snowfall | Rainveil | Sandstorm |
| Fireflies | Void Static | Bloodmist | Spore Cloud |
| Starfall | Ghostlight | Shadow Crawl | Golden Haze |
| Petal Drift | Ash Storm | Lightning Veil | Dream Smoke |
| Iridescent Sheen | | | |

Every style is fully customizable after picking it as a starting point:

- **Audience** - Everyone, Perceivers of a chosen group, or Everyone else, letting a transition play only for players in (or out of) a specific group.
- **Primary color / Backdrop color** - the two colors the effect blends between.
- **Particles** - how many particle elements the effect renders (0 for effects like Blackout that don't use particles).
- **Scene blur** - how much the canvas blurs underneath the effect.
- **Scene coverage** - how much of the scene the curtain hides at its peak. At 100 nothing shows through, at 0 only the particles and glow are drawn over the scene.
- **Intensity** - how strong the particles and glow are. It doesn't change how much of the scene is hidden.

**Iridescent Sheen** sweeps bars of shifting color across the screen, with Particles setting how many. It has no Primary color and adds four fields of its own:

- **Comes in from** / **Leaves to** - the edges the sheen enters and leaves by. Leaving by the same edge makes it pull back, the opposite edge makes it pass through.
- **Sweep angle** - turns the whole sweep, so the bars lie on a diagonal instead of square to the screen.
- **Cascade** - how far apart the bars start and finish. Low and they move together, high and they arrive one at a time.

#### Narration

Displays letterboxed text across the middle of the screen for the clip's duration, like an in-fiction caption.

- Leave the **Group** field on "Same text for everyone" for one shared line of text.
- Choosing a group splits the text field into **Perceivers read** and **Everyone else reads**, letting the same narration beat say two different things depending on who's watching, useful for a hallucinating character reading a different description than the rest of the party.

#### Sound

Plays an audio file for the clip's duration.

- **Audio file** - browse for any audio file the same way you would on a Playlist or Sound document.
- **Volume** and **Loop** controls.
- **Audience** - Everyone, Perceivers of a group, or Everyone else, same as Transition clips.

#### Effect (FXMaster)

Only appears in the Add palette when [FXMaster](https://foundryvtt.com/packages/fxmaster) is installed and active in the world. See [FXMaster Integration in Depth](#fxmaster-integration-in-depth) for the full explanation of how this clip type works, gating, and the difference between its modes. In short:

- **Preset** mode plays one of FXMaster's own built-in presets for the entire table, with direction/speed/density/color overrides.
- **Particle effect** and **Filter effect** modes let you pick any individual effect FXMaster currently offers, with that effect's own customization fields generated automatically, and can be restricted to a single perception group's audience.

If FXMaster is later disabled, any Effect clips already saved in a Moment remain visible and editable (and the Effects row stays visible for that Moment), they do nothing when the Moment runs until FXMaster is active again.

#### Perception

A state marker (shown on the timeline as a small dot rather than a bar, since it's instantaneous) that **grants or removes a token's membership in a perception group**, the same effect as the Token HUD picker, but scripted into the Moment's timing.

- **Action** - Grant group or Remove group.
- **Group** - which perception group to grant or remove.
- **Tokens** - a checklist of every token on the scene to apply this to, each with a crosshairs button to [locate it on the canvas](#locating-targets-on-the-canvas).

#### Grouping

Another state marker, the mirror image of Perception: instead of changing what a token can *see*, it changes what group an object *belongs to*, the same checkboxes found on a token/tile/light/door's own configuration sheet, but scripted.

- **Target type** - Tokens, Tiles, Lights, or Doors.
- **Action** - Add to group or Remove from group.
- **Group** - which perception group to add or remove.
- **Targets** - a checklist of matching objects on the scene (for Doors, only walls with a Door type set are listed), each with a crosshairs button to [locate it on the canvas](#locating-targets-on-the-canvas).

#### Atmosphere

A third state marker that applies a persistent color grade to one perception group's view of the entire scene, staying active until a later Atmosphere clip changes or clears it (rather than lasting for a fixed duration).

Pick a preset from the **Preset** dropdown first. It fills in all four sections (Mood, Background, Foreground and Particles, see below) with a starting value for everything, and overwrites whatever was set. Everything it loads can be edited afterward. Once anything differs from the preset, a note says so with a **Reset to preset** button that puts every setting back to that preset's defaults. None shows no sections, since playing it clears the group's atmosphere.

| Preset | Mood | Draws |
|---|---|---|
| None (clear) | Removes any atmosphere currently applied to the chosen group | nothing |
| Fey Glamour | Brighter, saturated, faint purple tint | drifting motes |
| Cold Dread | Desaturated, dim, cold blue tint and vignette | nothing |
| Ashen Rot | Muted, warm-gray tint, heavy vignette | nothing |
| Sickly Bloom | Sickly green-yellow tint | drifting motes |
| Sleeting Storm | Cool blue-gray, wind-driven | Sleet, over the scene |
| Arcane Glimmer | Near neutral, soft violet vignette | Glimmer, on the ground |
| Maelstrom | Sea green, dark edges | Whirlpool, on the ground |
| Floodwater | Pale blue wash | Surge, on the ground |
| Prism Bloom | Saturated, faint violet vignette | Prism sheen behind Blooms, on the ground |
| Northern Lights | Night blue tint and dark vignette | Aurora, over the scene |

**Ends after (s)** clears the atmosphere after that many seconds. At Never it stays until cleared by hand or replaced by another Atmosphere clip.

##### Sections

An atmosphere is one entry in four sections, each in its own panel with a reset icon in its title. The icon puts just that section back to the preset and is grayed out while the section still matches it.

- **Mood** is the color grading: **Saturation**, **Brightness**, **Hue shift**, **Tint** (on or off, then **Tint color** and **Tint strength**), **Vignette color** and **Vignette strength**.
- **Background** fills the scene behind everything else in the atmosphere.
- **Foreground** is its main motion, drawn over the background.
- **Particles** are a second small effect drawn over the foreground.

Foreground and Particles have the same styles, so you can stack an effect with itself. Blooms in both draws more flowers than the density slider alone, and a different color or size on the second one adds variety. Each stacked layer costs at least as much as doubling its density, more if a roof or suppression region shelters it.

Background, Foreground and Particles each have a **Style** dropdown (None included) and the settings for that style. Picking a style starts it from the defaults of the preset that uses it, so Cold Dread can keep its mood with a whirlpool behind it.

| Style | What it draws | Background | Foreground | Particles |
|---|---|---|---|---|
| Prism sheen | A slowly turning spectrum washing over the scene | yes | | |
| Whirlpool | A turning body of water with a clear eye at its center | yes | | |
| Aurora | Curtains of northern lights, see below | yes | | |
| Sleet | Tapered shards falling at three depths, driven along a direction | | yes | yes |
| Surge | Water bursting up at random points and running out | | yes | yes |
| Blooms | Flowers opening out of nothing and fading | | yes | yes |
| Glimmer | Points that stay put and flash as they catch the light | | yes | yes |
| Motes | The original drifting points of light | | yes | yes |
| Verdant | Glowing spores drifting back and forth | | yes | yes |

Two settings sit above the panels because they cover more than one section:

- **Placement** applies to the whole atmosphere. **Over the scene** draws above everything on the map (tokens, roofs and upper levels) and below weather. **On the ground** draws under the tokens at the viewed level's floor. Both follow pan and zoom, and darkness and fog of war treat them like weather. An atmosphere saved with mixed placements shows **As saved (mixed)** until you pick one.
- **Glows in the dark** covers the background and foreground together. Particles have their own switch, so they can glow over a background that doesn't. A glowing section draws above the scene's darkness so it stays bright at night, fog of war still hides it, and it sits above weather like FXMaster's embers and stars. Only works over the scene, and only for Prism sheen, Aurora, Blooms, Glimmer, Motes and Verdant. A new style that can glow starts with it on.

Every style has **Color**, **Opacity** (at 0 the section is switched off) and **Speed**. The rest appear only on the styles they apply to:

| Field | Styles | What it does |
|---|---|---|
| Density | all but Prism sheen | How many are drawn, against the normal count. |
| Size | all but Prism sheen | Shifts the whole range of sizes they are drawn from. |
| Direction | Motes, Sleet, Verdant, Aurora | The bearing, in degrees: 0 is up, 90 is right, 180 is down. |
| Eye, Rotation | Whirlpool | How far the clear center is opened, and which way it turns. |
| Color spread | Prism sheen, Blooms, Aurora | How far round the color wheel it travels from the chosen color. |
| Bands | Aurora | How many curtains hang one behind another. |

Atmospheres saved before sections are converted the first time a GM loads the world and look the same as before. The older Bloom becomes a Prism sheen background with Blooms in front, and a Whirlpool or Aurora saved as added particles stays in the Particles panel marked as an older choice. It can't be picked there again.

##### Aurora

Curtains of northern lights. Each curtain is brightest along a sharp lower edge with a thin violet fringe under it, and fades upward into a tail that shifts color toward the top. Vertical rays brighten and dim on their own, and the curtain folds slowly along its length. The Northern Lights preset draws three of them over the scene with a night blue tint.

- **Color** - the body of the curtain. The bright lower edge is a lighter version of the same color.
- **Density** - how finely the curtain is streaked with rays.
- **Speed** - how quickly the folds travel and the rays pulse.
- **Size** - how tall the curtains hang and how deep their folds run.
- **Direction** - which way the rays stream from the bright edge, which turns the whole display. 0 hangs the curtains in the sky with the bright edge at the bottom, 180 hangs them from above, and 90 or 270 turns them on their side.
- **Color spread** - how far the top and the fringe shift from the body color. At 0 the curtain is one color. The preset's 70 takes a green curtain through blue to violet at the top. The shift always goes the same way round the color wheel, so a red curtain turns toward yellow and green. Keep spread at 0 for an all-red aurora.
- **Bands** - one to six curtains. The nearest is lowest, tallest and brightest, and each one behind is higher, shorter and dimmer. Past three they split the same fine detail, but each band adds its own glow, so six cost more to draw than three.
- **Placement** - both draw the display as seen from above, a ribbon of light with its glow trailing off in the chosen direction. **Over the scene** draws it above everything on the map, **On the ground** under the tokens.

##### Weather and shelter

Atmospheres are treated like weather, so Foundry's two ways of keeping weather out of a building work on them too. Both have been in Foundry since v12.

- A **Scene Region** carrying the **Suppress Weather** behavior.
- A **tile** with **Restricts Weather** ticked, on the tile's Overhead tab. For **On the ground** and Foundry's own weather, a roof only blocks when it is **above the tokens' elevation**, so give it an elevation higher than the tokens standing under it. **Over the scene** also counts a roof level with the token.

**On the ground**, the effect is cut like weather. A roof hides what's under it, and a suppressing region cuts a hole in its shape.

**Over the scene**, the effect draws above roofs, so a roof can't cover it. Instead, while your token is under a restricting tile, that tile's shape is cut out of the effect for you, so from inside the building the sky stays outside. Step out and it covers the roof again. Suppressing regions are cut out for everyone, same as on the ground. A GM with no token selected isn't standing anywhere, so no roof is cut for them.

The curtain layout is random each time the atmosphere is applied, so two scenes with the same settings won't have the same sky.

Because this is applied per perception group, two groups can have two different atmospheres active on the same scene at the same time, each player only ever sees the atmosphere belonging to a group they're actually in.

#### Disguise

A state marker that applies or clears a [disguise](#disguises-seen-as) on one or more tokens partway through a Moment, so an unmasking (or a masking) can be timed against a transition or a line of narration instead of being toggled by hand.

- **Action** - Set or Unset.
- **Group** - which perception group gets fooled. Members of it see the disguise; everyone outside it always sees the token as it really is, regardless of their own perception groups.
- **Tokens** - a checklist of tokens on the scene to apply this to, each with a crosshairs button to [locate it on the canvas](#locating-targets-on-the-canvas).
- **Appearance** (Set only) - the same actor and compendium search used on the token sheet. Its artwork and name become what the chosen group sees.
- **Hide nameplate** and **Show as disposition** (Set only) - identical to the per-group options on the token sheet.

When the action is **Unset**, an extra checkbox appears: **Apply to every token in the scene, not just the ones picked below**. With it ticked the token checklist disappears and the clip clears that group's disguise from every token on the scene, which is the quick way to end an illusion without listing each token that was part of it.

### Locating Targets on the Canvas

The Perception, Grouping, and Disguise clips all pick their targets from a checklist of names. Names are frequently not enough to tell things apart: a scene can hold four tiles called "Rubble", three lights called "Torch", or two tokens with the same creature name.

Every row in those checklists carries a **crosshairs button** to the right of its checkbox. Clicking it:

1. Pans the canvas to that object, centered.
2. Drops one of Foundry's standard pulse pings on it, so the object is marked even if it was already on screen.

The ping is placed at the object's center for tokens and tiles, at the light's own position for lights, and at the midpoint of the wall segment for doors. Clicking the crosshairs never changes the checkbox, so you can inspect as many candidates as you like before committing to one.

The button only appears when the scene currently open on your canvas is the same scene the Moment belongs to. Editing a Moment from the [catalog](#the-moment-catalog) while viewing a different scene hides it, since there would be nothing on screen to pan to.

### Saving, Switching, and Deleting Moments

A single scene (or Any scene) can hold multiple Moments. Use the moment selector dropdown in the toolbar to switch between them, **New** to start another one from scratch, **Save** to persist every Moment currently loaded for that scene group at once, and **Delete** to remove the currently selected Moment.

### Changing Scene With the Builder Open

The builder follows the scene you're viewing. Switch scenes and it loads that scene's Moments, unless you picked a Moment from another scene yourself. If you have unsaved changes it asks to save or discard them first.

A Moment always plays on the scene you're viewing. Its token, tile, light and door steps only find their targets on the scene it was built for. Targets from another scene are kept, shown as a count in each picker, and skipped when it plays somewhere else.

### Running a Moment

Clicking **Run** in the toolbar (or **Run** from the Moment Catalog's kebab menu) saves the current state and immediately plays the Moment. Duration-based clips (Transition, Narration, Sound, Effect) play out client-side according to each clip's start time and audience; state markers (Perception, Grouping, Atmosphere, Disguise) are applied by the GM at their scheduled moment and then broadcast to every client through the normal document-update flow, the same as if you'd made those changes by hand.

Only a GM can run a Moment.

### Triggers: Manual vs. Scene Activation

Every Moment has a Trigger setting in the toolbar:

- **Manual** (default) - only plays when a GM clicks Run.
- **On Scene Activation** - automatically plays a few seconds after the GM activates that scene (switches to it as the live scene), letting an entrance or reveal play itself out the moment the table transitions into that scene, with no extra click needed.

---

## The Moment Catalog

Opened from the **Catalog** button inside the Moment Builder, or by right-clicking a scene in the sidebar and choosing **Moment Catalog**. The Catalog shows every Moment saved anywhere in the world as a grid of icons with the Moment's name below it, similar to an icon-view file browser, grouped under the name of the scene it belongs to.

If a Moment's scene is deleted, the Moment isn't. It moves to the Any scene group at the bottom of the catalog, so nothing scripted is lost when a scene gets cleaned up.

Each tile has a kebab (⋮) menu with three actions:

- **Run** - plays that Moment on the scene you're viewing, whichever scene it is filed under. If some of its targets aren't on that scene, it asks first.
- **Edit** - opens the Moment Builder for that Moment. If the Moment belongs to a scene, that scene is opened for the token/tile/light/wall pickers but only *viewed*, not activated. Any scene Moments use the scene you're viewing.
- **Delete** - deletes the Moment.

---

## FXMaster Integration in Depth

The Moment Builder's Effect clip type is built on top of [FXMaster](https://foundryvtt.com/packages/fxmaster) (the Gambit maintained fork, version 8.x), a separate module that adds weather and screen-filter effects to Foundry. This integration is entirely optional and gated on FXMaster actually being present:

- FXMaster 8.x requires **Foundry v13 or higher**. On Foundry v12, or in any world where FXMaster isn't installed or isn't active, the Effect option doesn't appear when adding a new clip.
- Any Effect clips already saved in a Moment are never deleted just because FXMaster is unavailable, they stay visible and editable in the timeline, and start working again automatically the moment FXMaster is reinstalled or re-enabled.

### Preset Mode

Plays one of FXMaster's own curated, ready-made presets (whatever your installed version of FXMaster ships, storms, fog, and so on) using FXMaster's own scene-wide playback system. Because presets are scene-wide by FXMaster's own design, **this mode always plays for the entire table**, including the GM; it cannot be limited to a single perception group.

Available overrides: **Direction**, **Speed**, **Density**, and an optional **Color override**.

### Particle Effect / Filter Effect Mode

Instead of a curated preset, this mode lets you pick any individual effect straight from FXMaster's own live effect list, whatever particle and filter types your installed FXMaster version currently registers, including ones added by future FXMaster updates, with no changes needed on this module's side. Once an effect is chosen, its entire settings panel (sliders, color pickers, toggles, dropdowns) is generated automatically from FXMaster's own definition for that effect, so it always matches what FXMaster itself would show.

Unlike Preset mode, Particle and Filter effects support the same **Audience** targeting as Transition and Sound clips, Everyone, Perceivers of a group, or Everyone else. This is what makes a genuinely per-player weather effect possible: only the clients belonging to the targeted audience ever render the effect at all, everyone else's canvas is completely unaffected.

### Reliability Notes

- Effects fade in and out using FXMaster's own fade behavior, so they don't pop in or out abruptly.
- If Foundry is closed, reloaded, or crashes while a table-wide (Preset mode) effect is mid-playback, the module keeps a small record of what it started; the next time a GM logs back in, anything left running is automatically stopped, so an effect can never get permanently stuck active on a scene.

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

**A doppelganger at the table**

Give the impostor token a disguise on Group A: pick the ally it is imitating as the Appearance, and leave disposition alone so the border still reads friendly. Grant Group A to every PC who has been fooled. Those players see and hover a trusted ally; anyone without Group A, including a PC who made their Insight check, sees the creature for what it is, on the same canvas, at the same time.

**A scripted room reveal**

Build a Moment: a Transition clip (Rolling Mist) to cover the swap, a Narration clip describing what the party sees as the mist clears, and a Perception clip that grants the whole party Group A right as the mist finishes, revealing a tile and set of tokens tagged to Group A. Set the trigger to On Scene Activation, and the reveal plays itself the moment you switch to that scene.

**A storm only one player is caught in**

With FXMaster active, add an Effect clip in Particle mode using a rain or storm effect, set its Audience to "Perceivers of" the cursed player's group. Pair it with an Atmosphere clip (Cold Dread) on the same group for a full sensory shift that only that one player experiences, while the rest of the table sees the scene as normal.

**An automatically narrated scene intro**

Build a Moment with just a Narration clip setting the scene, and set its trigger to On Scene Activation. Every time that scene becomes active, the narration plays automatically, no manual Run needed.
