# gha-workflows-folder

A Chrome extension that groups workflows whose names contain `/` into collapsible folders in the GitHub Actions workflow sidebar.

## Before / After

| Before | After |
|--------|-------|
| `frontend/build` | **frontend/** (collapsible) |
| `frontend/lint` | ├ `build` |
| `frontend/test` | ├ `lint` |
| `publish/libs` | └ `test` |
| | **publish/** |
| | └ `libs` |

## Features

- Splits workflow names at the first `/` into folders (`frontend/tests/unit` → folder `frontend`, display name `tests/unit`)
- Fetches all workflows in parallel from a GitHub internal endpoint for fast bulk loading
- Collapsible folders with auto-expand for folders containing the active workflow
- SPA navigation support (MutationObserver + Turbo events)
- Full theme support (light / dark / dim) via GitHub Primer CSS variables

## Installation

1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder

## Target Pages

Runs on pages matching `https://github.com/*/*/actions*`.
