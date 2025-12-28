# Mashacre

![Mashacre Logo](logo.png)

![HTML](https://img.shields.io/badge/HTML-5-orange)
![Canvas](https://img.shields.io/badge/Canvas-2D-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow)
![Build](https://img.shields.io/badge/Build-None-brightgreen)
![Status](https://img.shields.io/badge/Status-Playable-success)

🔥 Fast-paced potato mayhem. Smooth controls, chunky weapons, and a very grumpy Mash King.

## Table of Contents
- About
- Features
- Quick Start
- Controls
- Project Layout
- Credits
- Latest Changes
- Roadmap
- Feedback

## About
Mashacre is a Vampire Survivors–style project that began as an AI-built prototype from a YouTube coding battle. It’s now being hand-polished and expanded. See the original channel: https://www.youtube.com/@ThePromptPotato and the first AI-made version on itch: https://promptpotatogames.itch.io/

## Features
- Chunky potato combat with waves of enemies and boss phases.
- Weapons inspired by kitchen chaos: Grater, Ketchup Beam, Squash Slam, Tots Barrage.
- Lightweight stack: pure HTML/CSS/JS — plays directly from the browser.
- Simple UI with upgrade choices, chest/spatula interactions, and an ending screen.
- No build pipeline; just open and play.

## Quick Start
- Option A: Download ZIP → extract → open [index.html](index.html) in a modern browser.
- Option B: VS Code Live Server → Open Folder → right-click `index.html` → "Open with Live Server".
- Option C: Python
	- `python -m http.server 8000` → open http://localhost:8000
- Option D: Node
	- `npx serve -s .` → open the served URL

## Controls
- W/A/S/D or Arrow Keys — Move your potato
- Mouse — Aim the Ketchup Laser Beam
- Left Click — Select upgrades
- Esc — Pause / Settings (Volume)

## Project Layout
- [index.html](index.html) — entry point wiring scripts/styles
- `css/` — styles (HUD, spatula/chest UI, ending)
- `js/` — game code (core loop, entities, weapons, UI, managers, systems, debug tools)

## Credits
- Original creator & channel: **PromptPotatoGames** — weekly AI-vs-AI builds and updates: https://www.youtube.com/@ThePromptPotato
- Current maintainer: continuing weekly improvements and polish.

## Latest Changes
- Mash King visuals refined: smooth circular body, crown fits better, eyebrows positioned above eyes.
- Removed the Mash King’s cape; cleaner silhouette.
- Removed brown texture spot near the mouth for a cleaner face.
- Ending screen polish: removed odd hat; cleaner celebratory look.

## Roadmap
- Cosmetic/VFX passes that keep performance snappy.
- Boss and weapon balance tweaks.
- UI refinements while keeping the potato charm.

## Feedback
Found a bug or have ideas? Open an issue or drop feedback. Enjoy the starch!