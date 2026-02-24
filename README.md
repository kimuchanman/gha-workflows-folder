# gha-workflows-folder

A Chrome extension that groups workflows whose names contain `/` into collapsible folders in the GitHub Actions workflow sidebar.

## Before / After

| Before | After |
|:--------:|:-------:|
| <img width="270" height="1161" alt="before_flat" src="https://github.com/user-attachments/assets/9a5f058a-93aa-431a-8b39-61b53c19b3b9" /> | <img width="268" height="1060" alt="after_folded" src="https://github.com/user-attachments/assets/39807dfb-40de-4464-bc41-cabf7a321e97" /> |

Of course, you can expand it!

<img width="267" height="1781" alt="after_expanded" src="https://github.com/user-attachments/assets/f636c4ce-b9f6-49c3-a0d8-59ede7c091df" />

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
